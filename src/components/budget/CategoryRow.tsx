import { useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CategoryBalance, CategoryResult } from '@/types';

interface Props {
  category: CategoryResult;
  balance: CategoryBalance | undefined;
  onAssign: (categoryId: string, amount: number) => Promise<void>;
  onRename: (categoryId: string, name: string) => Promise<void>;
  onRequestDelete: (category: CategoryResult) => void;
  onOpenMove: (categoryId: string, categoryName: string, available: number) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function BalancePill({ amount, onClick }: { amount: number; onClick: () => void }) {
  const style =
    amount > 0
      ? 'bg-success/12 text-success hover:bg-success/20'
      : amount < 0
        ? 'bg-error/12 text-error hover:bg-error/20'
        : 'bg-base-300 text-base-content/35 hover:bg-base-300/80';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center px-2.5 py-0.5 -mr-2.5 rounded-full text-xs font-semibold tabular-nums transition-colors cursor-pointer ${style}`}
      title="Move money"
    >
      {formatCurrency(amount)}
    </button>
  );
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

export function CategoryRow({ category, balance, onAssign, onRename, onRequestDelete, onOpenMove }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
    data: { type: 'category', groupId: category.groupId },
  });

  const assigned = balance?.assigned ?? 0;
  const activity = balance?.activity ?? 0;
  const bal = balance?.balance ?? 0;

  const spent = Math.max(-activity, 0);
  const spentPct = assigned > 0 ? Math.min((spent / assigned) * 100, 100) : 0;
  const paceTitle = `Spent ${formatCurrency(spent)} of ${formatCurrency(assigned)}`;

  const startEdit = () => {
    setDraft(assigned.toFixed(2));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitEdit = async () => {
    const amount = parseFloat(draft);
    if (!isNaN(amount) && amount !== assigned) {
      setBusy(true);
      try {
        await onAssign(category.id, amount);
      } finally {
        setBusy(false);
      }
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setEditing(false);
  };

  const startEditName = () => {
    setNameDraft(category.name);
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.select(), 0);
  };

  const commitEditName = async () => {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== category.name) {
      setBusy(true);
      try { await onRename(category.id, trimmed); } finally { setBusy(false); }
    }
    setEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEditName();
    if (e.key === 'Escape') setEditingName(false);
  };

  const handleDelete = () => {
    onRequestDelete(category);
  };

  return (
    <>
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group hover:bg-base-200/60 transition-colors ${isDragging ? 'opacity-0' : ''}`}
    >
      <td className="py-2 pl-2 pr-3 text-sm text-base-content/85">
        <div className="flex items-center gap-2">
          <div
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-40 hover:!opacity-70 transition-opacity shrink-0 touch-none text-base-content/60"
          >
            <GripIcon />
          </div>
          {editingName ? (
            <input
              ref={nameInputRef}
              type="text"
              className="input input-bordered input-xs w-40"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitEditName}
              onKeyDown={handleNameKeyDown}
              disabled={busy}
            />
          ) : (
            <span
              className="cursor-pointer hover:text-primary transition-colors"
              onDoubleClick={startEditName}
              title="Duplo clique para renomear"
            >
              {category.name}
            </span>
          )}
          <button
            onClick={handleDelete}
            disabled={busy}
            className="opacity-0 group-hover:opacity-30 hover:!opacity-100 hover:text-error transition-opacity shrink-0 ml-auto"
            title="Deletar categoria"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
            </svg>
          </button>
        </div>
      </td>

      <td
        className="py-2 px-3 text-right"
        onClick={startEdit}
        style={{ cursor: 'pointer', minWidth: 120 }}
        title="Click to edit"
      >
        {editing ? (
          <input
            ref={inputRef}
            type="number"
            className="input input-bordered input-xs text-right w-28 tabular-nums"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            disabled={busy}
            step="0.01"
          />
        ) : (
          <span className="inline-flex items-center justify-end gap-1.5">
            <svg
              className="opacity-0 group-hover:opacity-30 transition-opacity shrink-0"
              xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span className="text-sm tabular-nums">{formatCurrency(assigned)}</span>
          </span>
        )}
      </td>

      <td className="py-2 px-3 text-right text-sm tabular-nums text-base-content/55">
        {formatCurrency(activity)}
      </td>

      <td className="py-2 pl-3 pr-5 text-right">
        <BalancePill amount={bal} onClick={() => onOpenMove(category.id, category.name, bal)} />
      </td>
    </tr>
    <tr aria-hidden="true" className={`border-b border-base-200/70 ${isDragging ? 'opacity-0' : ''}`}>
      <td className="pl-2 pr-3 pt-0 pb-1.5">
        <div className="relative h-1" title={paceTitle}>
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div
              className={`absolute inset-0 ${assigned > 0 ? 'bg-success' : 'bg-base-300/60'}`}
            />
            {assigned > 0 && spentPct > 0 && (
              <div
                className="absolute top-0 left-0 h-full"
                style={{
                  width: `${spentPct}%`,
                  backgroundImage:
                    'repeating-linear-gradient(135deg, rgba(255,255,255,0.6) 0 2px, transparent 2px 5px)',
                }}
              />
            )}
          </div>
        </div>
      </td>
      <td className="pb-1.5" />
      <td className="pb-1.5" />
      <td className="pb-1.5" />
    </tr>
    </>
  );
}
