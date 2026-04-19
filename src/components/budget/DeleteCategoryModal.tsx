import { useMemo, useRef, useState } from 'react';
import type { CategoryGroupResult, CategoryResult } from '@/types';

const INFLOW_CATEGORY_ID = '00000000-0000-0000-0000-000000000001';

interface Props {
  category: CategoryResult;
  groups: CategoryGroupResult[];
  onConfirm: (categoryId: string, targetCategoryId: string) => Promise<void>;
  onClose: () => void;
}

export function DeleteCategoryModal({ category, groups, onConfirm, onClose }: Props) {
  const [targetCategoryId, setTargetCategoryId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  const destinations = useMemo(
    () =>
      groups.flatMap((g) =>
        g.categories
          .filter((c) => c.id !== category.id && c.id !== INFLOW_CATEGORY_ID)
          .map((c) => ({ id: c.id, name: c.name, groupName: g.name })),
      ),
    [groups, category.id],
  );

  const noDestinations = destinations.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!targetCategoryId) {
      setError('Select a target category.');
      return;
    }
    setBusy(true);
    try {
      await onConfirm(category.id, targetCategoryId);
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { title?: string } } })?.response?.data?.title ??
        'Failed to delete category.';
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  return (
    <div
      ref={backdropRef}
      className="modal modal-open modal-bottom sm:modal-middle"
      onClick={handleBackdrop}
    >
      <div className="modal-box w-full sm:max-w-md">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
          onClick={onClose}
          type="button"
        >
          ✕
        </button>

        <h3 className="font-bold text-lg mb-1">Delete &ldquo;{category.name}&rdquo;?</h3>
        <p className="text-sm text-base-content/60 mb-4">
          This category will be removed and its transactions will be moved to the category you select below.
        </p>

        {error && (
          <div role="alert" className="alert alert-error text-sm mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="form-control">
            <div className="label pb-1">
              <span className="label-text font-medium">Move transactions to</span>
            </div>
            <select
              className="select select-bordered w-full"
              value={targetCategoryId}
              onChange={(e) => setTargetCategoryId(e.target.value)}
              disabled={noDestinations}
              required
            >
              <option value="">Select category…</option>
              {destinations.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.groupName} › {c.name}
                </option>
              ))}
            </select>
            {noDestinations && (
              <div className="label pt-2">
                <span className="label-text-alt text-warning">
                  You need at least one other category before deleting this one.
                </span>
              </div>
            )}
          </label>

          <div className="modal-action mt-2">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-error" disabled={busy || noDestinations}>
              {busy && <span className="loading loading-spinner loading-sm" />}
              Delete
            </button>
          </div>
        </form>
      </div>
      <label className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
