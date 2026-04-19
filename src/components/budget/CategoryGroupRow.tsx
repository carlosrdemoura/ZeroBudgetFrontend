import { useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { CategoryBalance, CategoryGroupResult, CategoryResult } from '@/types';
import { CategoryRow } from './CategoryRow';
import { AddCategoryRow } from './AddCategoryRow';
import { BudgetCols } from './BudgetTable';

interface Props {
  group: CategoryGroupResult;
  balancesByCategory: Record<string, CategoryBalance>;
  onAssign: (categoryId: string, amount: number) => Promise<void>;
  onAddCategory: (groupId: string, name: string) => Promise<void>;
  onRenameGroup: (groupId: string, name: string) => Promise<void>;
  onRequestDeleteGroup: (group: CategoryGroupResult) => void;
  onRenameCategory: (categoryId: string, name: string) => Promise<void>;
  onRequestDeleteCategory: (category: CategoryResult) => void;
  onOpenMove: (categoryId: string, categoryName: string, available: number) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function GripIcon() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
      <circle cx="2.5" cy="2.5" r="1.5" />
      <circle cx="7.5" cy="2.5" r="1.5" />
      <circle cx="2.5" cy="7" r="1.5" />
      <circle cx="7.5" cy="7" r="1.5" />
      <circle cx="2.5" cy="11.5" r="1.5" />
      <circle cx="7.5" cy="11.5" r="1.5" />
    </svg>
  );
}

export function CategoryGroupRow({ group, balancesByCategory, onAssign, onAddCategory, onRenameGroup, onRequestDeleteGroup, onRenameCategory, onRequestDeleteCategory, onOpenMove }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: group.id,
    data: { type: 'group' },
  });

  const startEditName = () => {
    setNameDraft(group.name);
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.select(), 0);
  };

  const commitEditName = async () => {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== group.name) {
      setBusy(true);
      try { await onRenameGroup(group.id, trimmed); } finally { setBusy(false); }
    }
    setEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEditName();
    if (e.key === 'Escape') setEditingName(false);
  };

  const groupBalances = group.categories
    .map((c) => balancesByCategory[c.id])
    .filter(Boolean) as CategoryBalance[];

  const totalAssigned = groupBalances.reduce((s, b) => s + b.assigned, 0);
  const totalActivity = groupBalances.reduce((s, b) => s + b.activity, 0);
  const totalBalance = groupBalances.reduce((s, b) => s + b.balance, 0);

  return (
    <div
      ref={setNodeRef}
      className={`bg-base-100 rounded-xl border border-base-300 shadow-sm overflow-hidden ${isDragging ? 'opacity-0' : ''}`}
    >
      <table className="w-full table-fixed">
        <BudgetCols />
        <tbody>
      <tr className="group/group bg-base-200/80 border-b border-base-300">
        <td className="py-2 pl-2 pr-3">
          <div className="flex items-center gap-1.5">
            <div
              {...listeners}
              {...attributes}
              className="cursor-grab active:cursor-grabbing opacity-0 group-hover/group:opacity-40 hover:!opacity-70 transition-opacity shrink-0 touch-none text-base-content/60"
            >
              <GripIcon />
            </div>
            {editingName ? (
              <input
                ref={nameInputRef}
                type="text"
                className="input input-bordered input-xs w-40 font-semibold"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={commitEditName}
                onKeyDown={handleNameKeyDown}
                disabled={busy}
              />
            ) : (
              <span
                className="text-sm font-semibold text-base-content/60 cursor-pointer hover:text-primary transition-colors"
                onDoubleClick={startEditName}
                title="Duplo clique para renomear"
              >
                {group.name}
              </span>
            )}
            <button
              onClick={() => setShowAdd(true)}
              disabled={busy}
              className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded opacity-0 group-hover/group:opacity-60 hover:!opacity-100 hover:bg-base-300 transition-opacity text-base-content/70 text-sm leading-none"
              title="Add category"
            >
              +
            </button>
            <button
              onClick={() => onRequestDeleteGroup(group)}
              disabled={busy}
              className="inline-flex items-center justify-center w-5 h-5 rounded opacity-0 group-hover/group:opacity-40 hover:!opacity-100 hover:text-error transition-opacity text-base-content/60"
              title="Deletar grupo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
              </svg>
            </button>
          </div>
        </td>
        <td className="py-2 px-3 text-right text-xs font-medium tabular-nums text-base-content/60">
          {formatCurrency(totalAssigned)}
        </td>
        <td className="py-2 px-3 text-right text-xs font-medium tabular-nums text-base-content/45">
          {formatCurrency(totalActivity)}
        </td>
        <td className="py-2 pl-3 pr-5 text-right text-xs font-semibold tabular-nums text-base-content/60">
          {formatCurrency(totalBalance)}
        </td>
      </tr>

      <SortableContext items={group.categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        {group.categories.map((cat) => (
          <CategoryRow
            key={cat.id}
            category={cat}
            balance={balancesByCategory[cat.id]}
            onAssign={onAssign}
            onRename={onRenameCategory}
            onRequestDelete={onRequestDeleteCategory}
            onOpenMove={onOpenMove}
          />
        ))}
      </SortableContext>

      {showAdd && (
        <AddCategoryRow
          onSave={async (name) => {
            await onAddCategory(group.id, name);
            setShowAdd(false);
          }}
          onCancel={() => setShowAdd(false)}
        />
      )}
        </tbody>
      </table>
    </div>
  );
}
