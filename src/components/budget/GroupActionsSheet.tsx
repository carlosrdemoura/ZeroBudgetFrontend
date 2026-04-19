import { useRef, useState } from 'react';
import type { CategoryGroupResult } from '@/types';

interface Props {
  group: CategoryGroupResult;
  onAddCategory: () => void;
  onRename: (name: string) => Promise<void>;
  onDelete: () => void;
  onClose: () => void;
}

type Mode = 'menu' | 'rename';

export function GroupActionsSheet({ group, onAddCategory, onRename, onDelete, onClose }: Props) {
  const [mode, setMode] = useState<Mode>('menu');
  const [nameDraft, setNameDraft] = useState(group.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current && !busy) onClose();
  };

  const submitRename = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) { setError('Name cannot be empty.'); return; }
    setBusy(true); setError('');
    try { await onRename(trimmed); onClose(); }
    catch { setError('Failed to rename.'); }
    finally { setBusy(false); }
  };

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
          <p className="text-xs text-base-content/45 uppercase tracking-wider font-semibold">Group</p>
          <h3 className="font-bold text-lg leading-tight">{group.name}</h3>
        </div>

        {error && (
          <div role="alert" className="alert alert-error text-sm mb-3">
            <span>{error}</span>
          </div>
        )}

        {mode === 'menu' && (
          <div className="flex flex-col gap-1">
            <button className="btn btn-ghost btn-block justify-start" onClick={onAddCategory}>
              <span className="text-lg">+</span> Add category
            </button>
            <button className="btn btn-ghost btn-block justify-start" onClick={() => { setError(''); setMode('rename'); }}>
              <span className="text-lg">✎</span> Rename group
            </button>
            <button className="btn btn-ghost btn-block justify-start text-error" onClick={onDelete}>
              <span className="text-lg">🗑</span> Delete group
            </button>
          </div>
        )}

        {mode === 'rename' && (
          <div className="flex flex-col gap-3">
            <label className="form-control">
              <div className="label pb-1">
                <span className="label-text font-medium">Group name</span>
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
