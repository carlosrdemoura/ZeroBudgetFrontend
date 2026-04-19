import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '@/lib/api/categories';
import type { CreateTransactionRequest, TransactionType } from '@/types';

interface Props {
  onAdd: (req: CreateTransactionRequest) => Promise<void>;
  onClose: () => void;
  defaultDate: string;
}

export function AddTransactionModal({ onAdd, onClose, defaultDate }: Props) {
  const [type, setType] = useState<TransactionType>('Expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [categoryId, setCategoryId] = useState('');
  const [memo, setMemo] = useState('');
  const [affectsBudget, setAffectsBudget] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  const { data: groups } = useQuery({
    queryKey: ['groups'],
    queryFn: categoriesApi.getGroups,
    staleTime: 60_000,
  });

  const allCategories = groups?.flatMap((g) =>
    g.categories.map((c) => ({ ...c, groupName: g.name })),
  ) ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const rawAmt = parseFloat(amount);
    if (isNaN(rawAmt) || rawAmt === 0) {
      setError('Enter a non-zero amount.');
      return;
    }
    if (type === 'Expense' && !categoryId) {
      setError('Select a category for expenses.');
      return;
    }

    const signedAmount = type === 'Expense' ? -Math.abs(rawAmt) : Math.abs(rawAmt);

    setBusy(true);
    try {
      await onAdd({
        type,
        amount: signedAmount,
        date,
        categoryId: type === 'Expense' ? categoryId : null,
        memo: memo.trim() || null,
        affectsBudget,
      });
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { title?: string } } })?.response?.data?.title ??
        'Failed to save transaction.';
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
      <div className="modal-box w-full sm:max-w-2xl max-h-[90dvh] p-0 flex flex-col">
        <div className="px-6 pt-6 pb-4 relative shrink-0">
          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
          <h3 className="font-bold text-lg mb-1">Add Transaction</h3>
          <p className="text-sm text-base-content/60">Record a new income or expense.</p>
        </div>

        <div className="px-6 pb-4 overflow-y-auto grow">
          {error && (
            <div role="alert" className="alert alert-error text-sm mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form id="add-transaction-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-control">
            <div className="label pb-1">
              <span className="label-text font-medium">Type</span>
            </div>
            <div className="join w-full">
              {(['Expense', 'Income'] as TransactionType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`btn join-item flex-1 btn-sm ${
                    type === t ? 'btn-primary' : 'btn-ghost border border-base-300'
                  }`}
                  onClick={() => setType(t)}
                >
                  {t === 'Expense' ? '↓ Expense' : '↑ Income'}
                </button>
              ))}
            </div>
          </div>

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
                required
                autoFocus
              />
            </label>
          </label>

          <label className="form-control">
            <div className="label pb-1">
              <span className="label-text font-medium">Date</span>
            </div>
            <input
              type="date"
              className="input input-bordered w-full"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>

          {type === 'Expense' && (
            <label className="form-control">
              <div className="label pb-1">
                <span className="label-text font-medium">Category</span>
              </div>
              <select
                className="select select-bordered w-full"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                <option value="">Select category…</option>
                {allCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.groupName} › {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="form-control">
            <div className="label pb-1">
              <span className="label-text font-medium">Memo</span>
            </div>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="What was this for?"
              maxLength={500}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </label>

          <div className="pt-1">
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={affectsBudget}
              onChange={(e) => setAffectsBudget(e.target.checked)}
              title="Affects budget"
            />
          </div>

          </form>
        </div>

        <div className="px-6 py-4 border-t border-base-200 bg-base-200/40 flex items-center justify-between gap-2 shrink-0">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="add-transaction-form"
            className="btn btn-primary btn-sm"
            disabled={busy}
          >
            {busy && <span className="loading loading-spinner loading-sm" />}
            Save
          </button>
        </div>
      </div>
      <label className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
