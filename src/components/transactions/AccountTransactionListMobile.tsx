import type { AccountTransactionResult } from '@/types';
import { NoBudgetIcon } from '@/components/ui/NoBudgetIcon';

interface Props {
  transactions: AccountTransactionResult[];
  categoryToGroup: Record<string, string>;
  onEdit: (transaction: AccountTransactionResult) => void;
  onDelete: (id: string) => Promise<void>;
}

function fmt(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
}

export function AccountTransactionListMobile({ transactions, categoryToGroup, onEdit, onDelete }: Props) {
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Delete this transaction?')) return;
    await onDelete(id);
  };

  return (
    <ul className="bg-base-100 divide-y divide-base-200">
      {transactions.map((t) => {
        const isOutflow = t.amount < 0;
        const groupName = t.categoryId ? categoryToGroup[t.categoryId] : undefined;
        return (
          <li key={t.id}>
            <button
              className="w-full text-left px-3 py-3 hover:bg-base-200/40 active:bg-base-200/70 transition-colors"
              onClick={() => onEdit(t)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-base-content/50 font-mono mb-0.5">{fmtDate(t.date)}</div>
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
                      isOutflow ? 'text-error' : 'text-success'
                    }`}
                  >
                    {isOutflow ? '−' : '+'}{fmt(t.amount)}
                  </span>
                  <span
                    role="button"
                    aria-label="Delete"
                    className="btn btn-ghost btn-xs text-base-content/40 hover:text-error hover:bg-error/10"
                    onClick={(e) => handleDelete(e, t.id)}
                  >
                    ✕
                  </span>
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
