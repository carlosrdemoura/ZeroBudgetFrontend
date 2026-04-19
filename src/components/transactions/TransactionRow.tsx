import type { TransactionResult } from '@/types';

interface Props {
  transaction: TransactionResult;
  groupName?: string;
  onDelete: (id: string) => Promise<void>;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function TransactionRow({ transaction, groupName, onDelete }: Props) {
  const handleDelete = async () => {
    if (!confirm('Delete this transaction?')) return;
    await onDelete(transaction.id);
  };

  const isIncome = transaction.type === 'Income';

  return (
    <tr className="group border-b border-base-200/70 hover:bg-base-200/40 transition-colors">
      <td className="py-3 pl-5 pr-3 text-sm text-base-content/65 font-mono whitespace-nowrap">
        {transaction.date}
      </td>
      <td className="py-3 px-3">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
            isIncome
              ? 'bg-success/12 text-success'
              : 'bg-base-300 text-base-content/55'
          }`}
        >
          {isIncome ? '↑ Income' : '↓ Expense'}
        </span>
      </td>
      <td className="py-3 px-3 text-sm text-base-content/80 truncate max-w-0">
        {transaction.categoryName ? (
          <>
            {groupName && (
              <span className="text-base-content/45">{groupName}: </span>
            )}
            {transaction.categoryName}
          </>
        ) : (
          <span className="text-base-content/30 italic text-xs">—</span>
        )}
      </td>
      <td className="py-3 px-3 text-sm text-base-content/55 truncate max-w-0">
        {transaction.memo ?? (
          <span className="text-base-content/25 italic text-xs">—</span>
        )}
      </td>
      <td className={`py-3 px-3 text-right text-sm font-semibold tabular-nums ${
        isIncome ? 'text-success' : 'text-base-content/80'
      }`}>
        {isIncome ? '+' : ''}{formatCurrency(transaction.amount)}
      </td>
      <td className="py-3 px-3 text-right">
        <button
          className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 text-base-content/35 hover:text-error hover:bg-error/10 transition-all"
          onClick={handleDelete}
          title="Delete transaction"
        >
          ✕
        </button>
      </td>
    </tr>
  );
}
