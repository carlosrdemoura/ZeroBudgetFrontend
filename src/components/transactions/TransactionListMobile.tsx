import type { TransactionResult } from '@/types';
import { NoBudgetIcon } from '@/components/ui/NoBudgetIcon';

interface Props {
  transactions: TransactionResult[];
  categoryToGroup: Record<string, string>;
  onDelete: (id: string) => Promise<void>;
}

function fmt(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
}

export function TransactionListMobile({ transactions, categoryToGroup, onDelete }: Props) {
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    await onDelete(id);
  };

  return (
    <ul className="bg-base-100 rounded-xl border border-base-300 shadow-sm divide-y divide-base-200 overflow-hidden">
      {transactions.map((t) => {
        const isIncome = t.type === 'Income';
        const groupName = t.categoryId ? categoryToGroup[t.categoryId] : undefined;
        return (
          <li key={t.id} className="px-3 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      isIncome ? 'bg-success/12 text-success' : 'bg-base-300 text-base-content/55'
                    }`}
                  >
                    {isIncome ? '↑ Income' : '↓ Expense'}
                  </span>
                  <span className="text-[11px] text-base-content/50 font-mono">{fmtDate(t.date)}</span>
                </div>
                <div className="text-sm text-base-content/85 truncate">
                  {t.categoryName ? (
                    <>
                      {groupName && (
                        <span className="text-base-content/45">{groupName}: </span>
                      )}
                      {t.categoryName}
                    </>
                  ) : (
                    <span className="text-base-content/30 italic">No category</span>
                  )}
                  {!t.affectsBudget && (
                    <NoBudgetIcon className="inline-block align-middle ml-1.5 text-base-content/40" />
                  )}
                </div>
                {t.memo && (
                  <div className="text-xs text-base-content/55 mt-0.5 truncate">{t.memo}</div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span
                  className={`text-base font-semibold tabular-nums whitespace-nowrap ${
                    isIncome ? 'text-success' : 'text-base-content/85'
                  }`}
                >
                  {isIncome ? '+' : ''}{fmt(t.amount)}
                </span>
                <button
                  className="btn btn-ghost btn-xs text-base-content/40 hover:text-error hover:bg-error/10"
                  onClick={() => handleDelete(t.id)}
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
