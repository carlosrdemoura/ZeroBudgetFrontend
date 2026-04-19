import { useRef, useState } from 'react';
import type { CategoryBalance, CategoryResult } from '@/types';

interface Props {
  category: CategoryResult;
  balance: CategoryBalance | undefined;
  groupName: string;
  onSetAssigned: (amount: number) => Promise<void>;
  onMoveMoney: () => void;
  onRename: (name: string) => Promise<void>;
  onRequestDelete: () => void;
  onClose: () => void;
}

type Mode = 'menu' | 'assign' | 'rename';

function fmt(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function CategoryActionsSheet({
  category, balance, groupName,
  onSetAssigned, onMoveMoney, onRename, onRequestDelete, onClose,
}: Props) {
  const [mode, setMode] = useState<Mode>('menu');
  const [assignDraft, setAssignDraft] = useState((balance?.assigned ?? 0).toFixed(2));
  const [nameDraft, setNameDraft] = useState(category.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current && !busy) onClose();
  };

  const submitAssign = async () => {
    const amt = parseFloat(assignDraft);
    if (isNaN(amt)) { setError('Enter a valid number.'); return; }
    setBusy(true); setError('');
    try { await onSetAssigned(amt); onClose(); }
    catch { setError('Failed to update.'); }
    finally { setBusy(false); }
  };

  const submitRename = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) { setError('Name cannot be empty.'); return; }
    setBusy(true); setError('');
    try { await onRename(trimmed); onClose(); }
    catch { setError('Failed to rename.'); }
    finally { setBusy(false); }
  };

  const assigned = balance?.assigned ?? 0;
  const activity = balance?.activity ?? 0;
  const available = balance?.balance ?? 0;
  const availColor = available > 0 ? 'text-success' : available < 0 ? 'text-error' : 'text-base-content/40';

  return (
    <div ref={backdropRef} className="modal modal-open modal-bottom sm:modal-middle" onClick={handleBackdrop}>
      <div className="modal-box w-full sm:max-w-md">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
          onClick={onClose}
          type="button"
          disabled={busy}
        >
          ✕
        </button>

        <div className="mb-4">
          <p className="text-xs text-base-content/45 uppercase tracking-wider font-semibold">{groupName}</p>
          <h3 className="font-bold text-lg leading-tight">{category.name}</h3>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <div className="bg-base-200/60 rounded-lg p-2">
            <div className="text-[10px] uppercase tracking-wider text-base-content/45 font-semibold">Assigned</div>
            <div className="text-sm font-semibold tabular-nums">{fmt(assigned)}</div>
          </div>
          <div className="bg-base-200/60 rounded-lg p-2">
            <div className="text-[10px] uppercase tracking-wider text-base-content/45 font-semibold">Activity</div>
            <div className="text-sm font-semibold tabular-nums text-base-content/70">{fmt(activity)}</div>
          </div>
          <div className="bg-base-200/60 rounded-lg p-2">
            <div className="text-[10px] uppercase tracking-wider text-base-content/45 font-semibold">Available</div>
            <div className={`text-sm font-bold tabular-nums ${availColor}`}>{fmt(available)}</div>
          </div>
        </div>

        {error && (
          <div role="alert" className="alert alert-error text-sm mb-3">
            <span>{error}</span>
          </div>
        )}

        {mode === 'menu' && (
          <div className="flex flex-col gap-1">
            <button className="btn btn-ghost btn-block justify-start" onClick={() => { setError(''); setMode('assign'); }}>
              <span className="text-lg">⊞</span> Set assigned amount
            </button>
            <button className="btn btn-ghost btn-block justify-start" onClick={onMoveMoney}>
              <span className="text-lg">↔</span> Move money
            </button>
            <button className="btn btn-ghost btn-block justify-start" onClick={() => { setError(''); setMode('rename'); }}>
              <span className="text-lg">✎</span> Rename category
            </button>
            <button className="btn btn-ghost btn-block justify-start text-error" onClick={onRequestDelete}>
              <span className="text-lg">🗑</span> Delete category
            </button>
          </div>
        )}

        {mode === 'assign' && (
          <div className="flex flex-col gap-3">
            <label className="form-control">
              <div className="label pb-1">
                <span className="label-text font-medium">Assigned amount</span>
              </div>
              <input
                type="number"
                step="0.01"
                className="input input-bordered text-right tabular-nums"
                value={assignDraft}
                onChange={(e) => setAssignDraft(e.target.value)}
                autoFocus
                onFocus={(e) => e.target.select()}
              />
            </label>
            <div className="flex gap-2 justify-end">
              <button className="btn btn-ghost" onClick={() => setMode('menu')} disabled={busy}>Back</button>
              <button className="btn btn-primary" onClick={submitAssign} disabled={busy}>
                {busy && <span className="loading loading-spinner loading-sm" />}
                Save
              </button>
            </div>
          </div>
        )}

        {mode === 'rename' && (
          <div className="flex flex-col gap-3">
            <label className="form-control">
              <div className="label pb-1">
                <span className="label-text font-medium">Category name</span>
              </div>
              <input
                type="text"
                className="input input-bordered"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                autoFocus
              />
            </label>
            <div className="flex gap-2 justify-end">
              <button className="btn btn-ghost" onClick={() => setMode('menu')} disabled={busy}>Back</button>
              <button className="btn btn-primary" onClick={submitRename} disabled={busy}>
                {busy && <span className="loading loading-spinner loading-sm" />}
                Save
              </button>
            </div>
          </div>
        )}

      </div>
      <label className="modal-backdrop" onClick={() => !busy && onClose()} />
    </div>
  );
}
