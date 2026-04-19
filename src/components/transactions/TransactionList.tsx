import { useMemo, useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { transactionsApi } from '@/lib/api/transactions';
import { categoriesApi } from '@/lib/api/categories';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { TransactionRow } from './TransactionRow';
import { TransactionListMobile } from './TransactionListMobile';
import { AddTransactionModal } from './AddTransactionModal';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import type { CreateTransactionRequest, PagedResult, TransactionResult } from '@/types';

type TxPages = InfiniteData<PagedResult<TransactionResult>>;

interface Props {
  month: string;
}

function currentDayInMonth(month: string): string {
  const today = new Date();
  const [y, m] = month.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const day = today.getFullYear() === y && today.getMonth() + 1 === m ? today.getDate() : 1;
  return `${month}-${String(Math.min(day, lastDay)).padStart(2, '0')}`;
}

export function TransactionList({ month }: Props) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['transactions', month],
    queryFn: ({ pageParam }) => transactionsApi.getTransactions(month, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.page + 1 : undefined),
    staleTime: 30_000,
  });

  const { data: groups } = useQuery({
    queryKey: ['groups'],
    queryFn: categoriesApi.getGroups,
    staleTime: 60_000,
  });

  const categoryToGroup = useMemo(() => {
    const map: Record<string, string> = {};
    groups?.forEach((g) => g.categories.forEach((c) => { map[c.id] = g.name; }));
    return map;
  }, [groups]);

  const createMutation = useMutation({
    mutationFn: (req: CreateTransactionRequest) => transactionsApi.createTransaction(req),
    onMutate: async (req) => {
      await qc.cancelQueries({ queryKey: ['transactions', month] });
      const optimistic: TransactionResult = {
        id: `optimistic-${Date.now()}`,
        categoryId: req.categoryId,
        categoryName: null,
        amount: req.amount,
        date: req.date,
        memo: req.memo,
        type: req.type,
        affectsBudget: req.affectsBudget,
        createdAt: new Date().toISOString(),
      };
      qc.setQueryData<TxPages>(['transactions', month], (old) => {
        if (!old || old.pages.length === 0) return old;
        const [first, ...rest] = old.pages;
        return {
          ...old,
          pages: [{ ...first, items: [optimistic, ...first.items] }, ...rest],
        };
      });
      return { optimistic };
    },
    onError: (_err, _req, ctx) => {
      qc.setQueryData<TxPages>(['transactions', month], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((p) => ({
            ...p,
            items: p.items.filter((t) => t.id !== ctx?.optimistic.id),
          })),
        };
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['transactions', month] });
      qc.invalidateQueries({ queryKey: ['summary', month] });
      qc.invalidateQueries({ queryKey: ['balances', month] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => transactionsApi.deleteTransaction(id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['transactions', month] });
      qc.invalidateQueries({ queryKey: ['summary', month] });
      qc.invalidateQueries({ queryKey: ['balances', month] });
    },
  });

  const sentinelRef = useInfiniteScroll<HTMLDivElement>({
    onLoadMore: fetchNextPage,
    hasMore: !!hasNextPage,
    isFetching: isFetchingNextPage,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert error={error} />;

  const transactions = data?.pages.flatMap((p) => p.items) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-base-content/50 font-medium">
          {totalCount} transactions
        </span>
        <button className="btn btn-primary btn-sm gap-2" onClick={() => setShowAdd(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5v14"/>
          </svg>
          Add Transaction
        </button>
      </div>

      {/* Table or empty state */}
      {transactions.length === 0 ? (
        <div className="bg-base-100 rounded-xl border border-base-300 shadow-sm flex flex-col items-center justify-center py-20 gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" className="text-base-content/20">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75" />
          </svg>
          <p className="text-base-content/40 font-medium text-sm">No transactions this month</p>
        </div>
      ) : (
        <>
        {/* Mobile (< lg): card list */}
        <div className="lg:hidden">
          <TransactionListMobile
            transactions={transactions}
            categoryToGroup={categoryToGroup}
            onDelete={(id) => deleteMutation.mutateAsync(id).then(() => undefined)}
          />
        </div>

        {/* Desktop (>= lg): table */}
        <div className="hidden lg:block bg-base-100 rounded-xl border border-base-300 shadow-sm">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-base-300">
                <th className="text-left py-3 pl-5 pr-3 text-xs font-semibold uppercase tracking-wider text-base-content/50 whitespace-nowrap">Date</th>
                <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-base-content/50">Type</th>
                <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-base-content/50 w-56">Category</th>
                <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-base-content/50 w-64">Memo</th>
                <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wider text-base-content/50 whitespace-nowrap min-w-28">Amount</th>
                <th className="py-3 px-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  groupName={t.categoryId ? categoryToGroup[t.categoryId] : undefined}
                  onDelete={(id) => deleteMutation.mutateAsync(id).then(() => undefined)}
                />
              ))}
            </tbody>
          </table>
          </div>
        </div>
        </>
      )}

      {/* Infinite scroll sentinel */}
      {hasNextPage && (
        <div ref={sentinelRef} className="flex justify-center items-center py-6">
          {isFetchingNextPage && <LoadingSpinner />}
        </div>
      )}

      {showAdd && (
        <AddTransactionModal
          onAdd={(req) => createMutation.mutateAsync(req).then(() => undefined)}
          onClose={() => setShowAdd(false)}
          defaultDate={currentDayInMonth(month)}
        />
      )}
    </div>
  );
}
