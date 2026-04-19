import { useRef, useState } from 'react';
import type { CategoryGroupResult } from '@/types';

interface Props {
  fromCategoryId: string;
  fromCategoryName: string;
  initialAmount: number;
  groups: CategoryGroupResult[];
  onMove: (fromCategoryId: string, toCategoryId: string, amount: number) => Promise<void>;
  onClose: () => void;
}

export function MoveMoneyModal({ fromCategoryId, fromCategoryName, initialAmount, groups, onMove, onClose }: Props) {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState(initialAmount > 0 ? initialAmount.toFixed(2) : '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  const destinations = groups.flatMap((g) =>
    g.categories
      .filter((c) => c.id !== fromCategoryId)
      .map((c) => ({ ...c, groupName: g.name })),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const amt = parseFloat(amount);
    if (!to || isNaN(amt) || amt <= 0) {
      setError('Fill in all fields with a positive amount.');
      return;
    }
    setBusy(true);
    try {
      await onMove(fromCategoryId, to, amt);
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { title?: string } } })?.response?.data?.title ??
        'Failed to move money.';
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

        <h3 className="font-bold text-lg mb-1">Move</h3>
        <p className="text-sm text-base-content/60 mb-4">From <span className="font-medium text-base-content/80">{fromCategoryName}</span></p>

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
              <span className="label-text font-medium">Amount</span>
            </div>
            <label className="input input-bordered flex items-center gap-2">
              <input
                type="number"
                className="grow"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onFocus={(e) => e.target.select()}
                autoFocus
                required
              />
            </label>
          </label>

          <label className="form-control">
            <div className="label pb-1">
              <span className="label-text font-medium">To</span>
            </div>
            <select
              className="select select-bordered w-full"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
            >
              <option value="">Select category…</option>
              {destinations.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.groupName} › {c.name}
                </option>
              ))}
            </select>
          </label>

          <div className="modal-action mt-2">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy && <span className="loading loading-spinner loading-sm" />}
              OK
            </button>
          </div>
        </form>
      </div>
      <label className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
