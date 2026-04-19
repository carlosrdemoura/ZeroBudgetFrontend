import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '@/lib/api/accounts';
import { transactionsApi } from '@/lib/api/transactions';
import { categoriesApi } from '@/lib/api/categories';
import { useIsLg } from '@/hooks/useMediaQuery';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { AccountTransactionRow } from './AccountTransactionRow';
import { AccountTransactionListMobile } from './AccountTransactionListMobile';
import { AccountTransactionFormModal } from './AccountTransactionFormModal';
import { InlineTransactionRow } from './InlineTransactionRow';
import { ViewOptionsModal, quickFilterRange } from './ViewOptionsModal';
import type { AccountResult, AccountTransactionResult, CreateAccountTransactionRequest, UpdateTransactionRequest } from '@/types';
import type { TransactionFormData } from './InlineTransactionRow';
import type { DateRange, QuickFilter } from './ViewOptionsModal';

interface Props {
  accountId: string;
  month: string; // "YYYY-MM"
}

function monthRange(ym: string): DateRange {
  const [y, m] = ym.split('-').map(Number);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    fromDate: `${y}-${pad(m)}-01`,
    toDate: `${y}-${pad(m)}-${pad(new Date(y, m, 0).getDate())}`,
    label: 'custom',
  };
}

function defaultDateForMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const day =
    today.getFullYear() === y && today.getMonth() + 1 === m ? today.getDate() : 1;
  const lastDay = new Date(y, m, 0).getDate();
  return `${y}-${pad(m)}-${pad(Math.min(day, lastDay))}`;
}

function viewLabel(range: DateRange): string {
  const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const labels: Record<QuickFilter, string> = {
    'this-month': 'This Month',
    'latest-3': 'Latest 3 Months',
    'this-year': 'This Year',
    'last-year': 'Last Year',
    'all-dates': 'All Dates',
    'custom': (() => {
      const from = new Date(range.fromDate + 'T00:00:00');
      const to = new Date(range.toDate + 'T00:00:00');
      const sameMonth =
        from.getFullYear() === to.getFullYear() &&
        from.getMonth() === to.getMonth() &&
        from.getDate() === 1 &&
        to.getDate() === new Date(to.getFullYear(), to.getMonth() + 1, 0).getDate();
      return sameMonth ? fmt(range.fromDate) : `${fmt(range.fromDate)} – ${fmt(range.toDate)}`;
    })(),
  };
  return labels[range.label];
}

function fmtBalance(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

const AddIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" opacity="0.15"/>
    <path d="M12 7v10M7 12h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
  </svg>
);

const ViewIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-base-content/40">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);

export function AccountTransactionList({ accountId, month }: Props) {
  const qc = useQueryClient();
  const isLg = useIsLg();
  const [showInline, setShowInline] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mobileFormMode, setMobileFormMode] = useState<
    { kind: 'create' } | { kind: 'edit'; transaction: AccountTransactionResult } | null
  >(null);
  const [searchRaw, setSearchRaw] = useState('');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>(() => monthRange(month));
  const [showView, setShowView] = useState(false);

  useEffect(() => {
    setDateRange(monthRange(month));
  }, [month]);

  useEffect(() => {
    const id = setTimeout(() => { setSearch(searchRaw); }, 400);
    return () => clearTimeout(id);
  }, [searchRaw]);

  const { data: accounts = [] } = useQuery<AccountResult[]>({
    queryKey: ['accounts'],
    queryFn: accountsApi.getAccounts,
    staleTime: 30_000,
  });
  const account = accounts.find((a) => a.id === accountId);

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

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['accountTransactions', accountId, dateRange.fromDate, dateRange.toDate, search],
    queryFn: ({ pageParam }) =>
      transactionsApi.getAccountTransactions({
        accountId,
        fromDate: dateRange.fromDate,
        toDate: dateRange.toDate,
        search,
        page: pageParam,
        pageSize: 50,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.page + 1 : undefined),
    staleTime: 30_000,
    enabled: !!accountId,
  });

  const sentinelRef = useInfiniteScroll<HTMLDivElement>({
    onLoadMore: fetchNextPage,
    hasMore: !!hasNextPage,
    isFetching: isFetchingNextPage,
  });

  const { data: periodTotals } = useQuery({
    queryKey: ['accountTransactionsTotals', accountId, dateRange.fromDate, dateRange.toDate, search],
    queryFn: () =>
      transactionsApi.getAccountTransactions({
        accountId,
        fromDate: dateRange.fromDate,
        toDate: dateRange.toDate,
        search,
        page: 1,
        pageSize: 10_000,
      }),
    select: (res) => {
      let inflow = 0;
      let outflow = 0;
      for (const t of res.items) {
        if (t.amount > 0) inflow += t.amount;
        else outflow += t.amount;
      }
      return { inflow, outflow };
    },
    staleTime: 30_000,
    enabled: !!accountId,
  });

  const createMutation = useMutation({
    mutationFn: (req: CreateAccountTransactionRequest) =>
      transactionsApi.createAccountTransaction(req),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['accountTransactions', accountId] });
      qc.invalidateQueries({ queryKey: ['accountTransactionsTotals', accountId] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['balances'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => transactionsApi.deleteTransaction(id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['accountTransactions', accountId] });
      qc.invalidateQueries({ queryKey: ['accountTransactionsTotals', accountId] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['balances'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, req }: { id: string; req: UpdateTransactionRequest }) =>
      transactionsApi.updateTransaction(id, req),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['accountTransactions', accountId] });
      qc.invalidateQueries({ queryKey: ['accountTransactionsTotals', accountId] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['balances'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const handleCreateSave = async (data: TransactionFormData) => {
    const req: CreateAccountTransactionRequest = {
      accountId,
      amount: data.amount,
      date: data.date,
      memo: data.memo ?? undefined,
      affectsBudget: data.affectsBudget,
      ...(data.categoryId
        ? { categoryId: data.categoryId }
        : data.categoryName
          ? {
              categoryName: data.categoryName,
              ...(data.categoryGroupId ? { categoryGroupId: data.categoryGroupId } : {}),
            }
          : {}),
    };
    await createMutation.mutateAsync(req);
    setShowInline(false);
  };

  const handleEditSave = async (id: string, data: TransactionFormData) => {
    await updateMutation.mutateAsync({
      id,
      req: {
        amount: data.amount,
        date: data.date,
        categoryId: data.categoryId,
        memo: data.memo,
        affectsBudget: data.affectsBudget,
      },
    });
    setEditingId(null);
  };

  const startEdit = (id: string) => {
    setShowInline(false);
    setEditingId(id);
  };

  const startCreate = () => {
    if (isLg) {
      setEditingId(null);
      setShowInline(true);
    } else {
      setMobileFormMode({ kind: 'create' });
    }
  };

  const handleApplyView = (range: DateRange) => {
    setDateRange(range);
    setShowView(false);
  };

  const transactions = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="flex flex-col min-h-full bg-base-100">

      {/* ── Balance Header ─────────────────────────────────────── */}
      <div className="border-b border-base-200 px-4 sm:px-6 py-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex items-baseline gap-2">
          <span className={`text-xl font-bold tabular-nums ${
            (account?.balance ?? 0) < 0 ? 'text-error' : 'text-success'
          }`}>
            {fmtBalance(account?.balance ?? 0)}
          </span>
          <span className="text-xs text-base-content/45 font-medium">Working Balance</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-semibold tabular-nums text-success">
            +{fmtBalance(periodTotals?.inflow ?? 0)}
          </span>
          <span className="text-[11px] text-base-content/45 font-medium uppercase tracking-wider">Inflow</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-semibold tabular-nums text-error">
            {fmtBalance(periodTotals?.outflow ?? 0)}
          </span>
          <span className="text-[11px] text-base-content/45 font-medium uppercase tracking-wider">Outflow</span>
        </div>
      </div>

      {/* ── Toolbar ───────────────────────────────────────────── */}
      <div className="border-b border-base-200 px-3 sm:px-4 py-2 flex flex-wrap items-center gap-2 bg-base-100">
        <button
          className="btn btn-ghost btn-sm gap-1.5 text-primary font-semibold hover:bg-primary/8 shrink-0"
          onClick={startCreate}
          disabled={showInline}
        >
          <AddIcon />
          Add Transaction
        </button>

        <button
          className="btn btn-ghost btn-sm gap-1 text-base-content/70 hover:text-primary hover:bg-primary/8 shrink-0"
          onClick={() => setShowView(true)}
        >
          {viewLabel(dateRange)}
          <ViewIcon />
        </button>

        <label className="flex items-center gap-2 input input-sm input-bordered grow min-w-[140px] focus-within:input-primary">
          <SearchIcon />
          <input
            type="search"
            className="grow bg-transparent outline-none text-sm min-w-0"
            placeholder={`Search ${account?.name ?? ''}…`}
            value={searchRaw}
            onChange={(e) => setSearchRaw(e.target.value)}
          />
        </label>
      </div>

      {/* ── Table (desktop) / Cards (mobile) ──────────────────── */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="p-6">
          <ErrorAlert error={error} />
        </div>
      ) : (
        <>
        {/* Mobile: card list */}
        <div className="lg:hidden flex-1">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" className="text-base-content/15">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75" />
              </svg>
              <p className="text-base-content/35 text-sm font-medium">No transactions found</p>
              <button
                className="btn btn-ghost btn-sm text-primary"
                onClick={startCreate}
              >
                + Add Transaction
              </button>
            </div>
          ) : (
            <AccountTransactionListMobile
              transactions={transactions}
              categoryToGroup={categoryToGroup}
              onEdit={(t) => setMobileFormMode({ kind: 'edit', transaction: t })}
              onDelete={(id) => deleteMutation.mutateAsync(id).then(() => undefined)}
            />
          )}
        </div>

        {/* Desktop: table */}
        <div className="hidden lg:block flex-1 overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b-2 border-base-200">
                <th className="text-left py-2.5 pl-4 pr-2 text-xs font-semibold uppercase tracking-wider text-base-content/40 whitespace-nowrap w-32">
                  Date
                </th>
                <th className="text-left py-2.5 px-2 text-xs font-semibold uppercase tracking-wider text-base-content/40 w-56">
                  Category
                </th>
                <th className="text-left py-2.5 px-2 text-xs font-semibold uppercase tracking-wider text-base-content/40 w-64">
                  Memo
                </th>
                <th className="text-right py-2.5 px-2 text-xs font-semibold uppercase tracking-wider text-base-content/40 w-28">
                  Outflow
                </th>
                <th className="text-right py-2.5 px-2 text-xs font-semibold uppercase tracking-wider text-base-content/40 w-28">
                  Inflow
                </th>
                <th className="py-2.5 px-3 w-44" />
              </tr>
            </thead>
            <tbody>
              {showInline && (
                <InlineTransactionRow
                  defaultDate={defaultDateForMonth(month)}
                  onSave={handleCreateSave}
                  onCancel={() => setShowInline(false)}
                />
              )}

              {transactions.length === 0 && !showInline ? (
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" className="text-base-content/15">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75" />
                      </svg>
                      <p className="text-base-content/35 text-sm font-medium">No transactions found</p>
                      <button
                        className="btn btn-ghost btn-sm text-primary"
                        onClick={startCreate}
                      >
                        + Add Transaction
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((t) =>
                  editingId === t.id ? (
                    <InlineTransactionRow
                      key={t.id}
                      initial={{
                        date: t.date,
                        memo: t.memo,
                        categoryId: t.categoryId,
                        categoryName: t.categoryName,
                        amount: t.amount,
                        affectsBudget: t.affectsBudget,
                      }}
                      allowCategoryCreate={false}
                      onSave={(data) => handleEditSave(t.id, data)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <AccountTransactionRow
                      key={t.id}
                      transaction={t}
                      groupName={t.categoryId ? categoryToGroup[t.categoryId] : undefined}
                      onDelete={(id) => deleteMutation.mutateAsync(id).then(() => undefined)}
                      onEdit={() => startEdit(t.id)}
                    />
                  ),
                )
              )}
            </tbody>
          </table>
        </div>
        </>
      )}

      {/* ── Infinite scroll sentinel ──────────────────────────── */}
      {hasNextPage && (
        <div ref={sentinelRef} className="border-t border-base-200 flex justify-center items-center py-4">
          {isFetchingNextPage && <LoadingSpinner />}
        </div>
      )}

      {/* ── View Options Modal ────────────────────────────────── */}
      {showView && (
        <ViewOptionsModal
          current={dateRange}
          onApply={handleApplyView}
          onClose={() => setShowView(false)}
        />
      )}

      {/* ── Mobile Transaction Form Modal ─────────────────────── */}
      {mobileFormMode && (
        <AccountTransactionFormModal
          initial={
            mobileFormMode.kind === 'edit'
              ? {
                  date: mobileFormMode.transaction.date,
                  memo: mobileFormMode.transaction.memo,
                  categoryId: mobileFormMode.transaction.categoryId,
                  categoryName: mobileFormMode.transaction.categoryName,
                  amount: mobileFormMode.transaction.amount,
                  affectsBudget: mobileFormMode.transaction.affectsBudget,
                }
              : undefined
          }
          allowCategoryCreate={mobileFormMode.kind === 'create'}
          defaultDate={defaultDateForMonth(month)}
          onSave={
            mobileFormMode.kind === 'create'
              ? handleCreateSave
              : (d) => handleEditSave(mobileFormMode.transaction.id, d)
          }
          onClose={() => setMobileFormMode(null)}
        />
      )}
    </div>
  );
}
