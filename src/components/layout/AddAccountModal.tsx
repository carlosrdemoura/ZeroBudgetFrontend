import { useRef, useState } from 'react';

interface Props {
  onAdd: (name: string, initialBalance: number) => Promise<void>;
  onClose: () => void;
}

export function AddAccountModal({ onAdd, onClose }: Props) {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Please give your account a name.');
      return;
    }
    const initialBalance = parseFloat(balance) || 0;
    setBusy(true);
    try {
      await onAdd(name.trim(), initialBalance);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { title?: string } } })?.response?.data?.title ??
        'Could not create account. Please try again.';
      setError(msg);
      setBusy(false);
    }
  };

  return (
    <div
      ref={backdropRef}
      className="modal modal-open"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="modal-box w-full sm:max-w-lg p-8 rounded-2xl">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 text-base-content/40"
          onClick={onClose}
          type="button"
        >
          ✕
        </button>

        <form onSubmit={handleSubmit} className="flex flex-col gap-7">
          {/* Name */}
          <div className="flex flex-col gap-2">
            <label className="text-base font-semibold text-base-content/80" htmlFor="account-name">
              Give it a nickname
            </label>
            <input
              id="account-name"
              type="text"
              className="input input-bordered w-full text-base focus:input-primary"
              placeholder="e.g. Nubank, Itaú, Carteira…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          {/* Balance */}
          <div className="flex flex-col gap-2">
            <label className="text-base font-semibold text-base-content/80" htmlFor="account-balance">
              What is your current account balance?
            </label>
            <p className="text-sm text-base-content/50 -mt-1">
              Enter the balance shown in your bank today.
            </p>
            <label className="input input-bordered flex items-center gap-2 focus-within:input-primary">
              <input
                id="account-balance"
                type="number"
                className="grow bg-transparent text-base"
                placeholder="0.00"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
              />
            </label>
          </div>

          {error && (
            <p className="text-sm text-error -mt-3">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary px-6" disabled={busy}>
              {busy && <span className="loading loading-spinner loading-sm" />}
              Add Account
            </button>
          </div>
        </form>
      </div>
      <label className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
