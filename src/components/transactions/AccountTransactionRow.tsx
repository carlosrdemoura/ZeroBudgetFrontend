import type { AccountTransactionResult } from '@/types';

interface Props {
  transaction: AccountTransactionResult;
  groupName?: string;
  onDelete: (id: string) => Promise<void>;
  onEdit: () => void;
}

function fmt(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
}

export function AccountTransactionRow({ transaction, groupName, onDelete, onEdit }: Props) {
  const isOutflow = transaction.amount < 0;

  const handleDelete = async () => {
    if (!confirm('Delete this transaction?')) return;
    await onDelete(transaction.id);
  };

  return (
    <tr
      className="group border-b border-base-200 hover:bg-base-200/50 transition-colors cursor-pointer select-none"
      onDoubleClick={onEdit}
      title="Duplo clique para editar"
    >
      <td className="py-2.5 pl-4 pr-2 text-sm text-base-content/70 font-mono whitespace-nowrap">
        {fmtDate(transaction.date)}
      </td>
      <td className="py-2.5 px-2 text-sm text-base-content/70 truncate max-w-0">
        {transaction.categoryName ? (
          <>
            {groupName && (
              <span className="text-base-content/45">{groupName}: </span>
            )}
            {transaction.categoryName}
          </>
        ) : (
          <span className="text-base-content/25 italic text-xs">—</span>
        )}
      </td>
      <td className="py-2.5 px-2 text-sm text-base-content/80 truncate max-w-0">
        {transaction.memo ?? <span className="text-base-content/25 italic text-xs">—</span>}
      </td>
      <td className="py-2.5 px-2 text-right text-sm font-medium tabular-nums text-error">
        {isOutflow ? fmt(transaction.amount) : ''}
      </td>
      <td className="py-2.5 px-2 text-right text-sm font-medium tabular-nums text-success">
        {!isOutflow ? fmt(transaction.amount) : ''}
      </td>
      <td className="py-2.5 pr-3 pl-1 text-right w-8" onDoubleClick={(e) => e.stopPropagation()}>
        <button
          className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 text-base-content/30 hover:text-error hover:bg-error/10 transition-all"
          onClick={handleDelete}
          title="Delete"
        >
          ✕
        </button>
      </td>
    </tr>
  );
}
