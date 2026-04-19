import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '@/lib/api/accounts';
import { transactionsApi } from '@/lib/api/transactions';
import type { AccountResult } from '@/types';

interface Props {
  account: AccountResult;
  month: string;
  onClose: () => void;
  onDeleted: () => void;
}

function fmtForInput(n: number) {
  return n.toFixed(2).replace('.', ',');
}

function parseAmount(s: string): number {
  const trimmed = s.trim();
  const normalized = trimmed.includes(',')
    ? trimmed.replace(/\./g, '').replace(',', '.')
    : trimmed;
  return parseFloat(normalized);
}

export function EditAccountModal({ account, month, onClose, onDeleted }: Props) {
  const qc = useQueryClient();
  const [name, setName] = useState(account.name);
  const [balance, setBalance] = useState(fmtForInput(account.balance));
  const [saveError, setSaveError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Check if account has any transactions
  const { data: txCheck } = useQuery({
    queryKey: ['accountTransactionsExist', account.id],
    queryFn: () =>
      transactionsApi.getAccountTransactions({
        accountId: account.id,
        fromDate: '2000-01-01',
        toDate: '2099-12-31',
        page: 1,
        pageSize: 1,
      }),
    staleTime: 0,
  });
  const hasTransactions = (txCheck?.totalCount ?? 0) > 0;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const parsed = parseAmount(balance);
      await accountsApi.updateAccount(account.id, {
        name: name.trim(),
        currentBalance: isNaN(parsed) ? account.balance : parsed,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['accountTransactions', account.id] });
      qc.invalidateQueries({ queryKey: ['accountTransactionsExist', account.id] });
      qc.invalidateQueries({ queryKey: ['summary', month] });
      qc.invalidateQueries({ queryKey: ['balances', month] });
      onClose();
    },
    onError: (err: unknown) => {
      setSaveError(
        (err as { response?: { data?: { title?: string } } })?.response?.data?.title ??
          'Could not save changes.',
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => accountsApi.deleteAccount(account.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      onDeleted();
    },
    onError: (err: unknown) => {
      setDeleteError(
        (err as { response?: { data?: { title?: string } } })?.response?.data?.title ??
          'Could not delete account.',
      );
      setConfirmingDelete(false);
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    if (!name.trim()) { setSaveError('Account name is required.'); return; }
    saveMutation.mutate();
  };

  const handleDeleteClick = () => {
    if (!confirmingDelete) { setConfirmingDelete(true); return; }
    setDeleteError('');
    deleteMutation.mutate();
  };

  const busy = saveMutation.isPending || deleteMutation.isPending;

  return (
    <div className="modal modal-open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box w-full sm:max-w-lg p-8 rounded-2xl">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 text-base-content/40"
          onClick={onClose}
          type="button"
        >
          ✕
        </button>

        <h3 className="font-bold text-lg mb-6">Edit Account</h3>

        <form onSubmit={handleSave} className="flex flex-col gap-5">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-base-content/70" htmlFor="edit-name">
              Account name
            </label>
            <input
              id="edit-name"
              type="text"
              className="input input-bordered w-full focus:input-primary"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          {/* Balance */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-base-content/70" htmlFor="edit-balance">
              Working balance
            </label>
            <p className="text-xs text-base-content/45 -mt-0.5">
              Changing this value creates an adjustment transaction.
            </p>
            <label className="input input-bordered flex items-center gap-2 focus-within:input-primary">
              <input
                id="edit-balance"
                type="text"
                inputMode="decimal"
                className="grow bg-transparent"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                onFocus={(e) => e.target.select()}
              />
            </label>
          </div>

          {saveError && <p className="text-sm text-error -mt-2">{saveError}</p>}

          {/* Actions row */}
          <div className="flex items-center justify-between pt-2 border-t border-base-200 mt-1">
            {/* Delete */}
            <div>
              {confirmingDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-error font-medium">Are you sure?</span>
                  <button
                    type="button"
                    className="btn btn-error btn-xs"
                    onClick={handleDeleteClick}
                    disabled={busy}
                  >
                    {deleteMutation.isPending && <span className="loading loading-spinner loading-xs" />}
                    Yes, delete
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() => setConfirmingDelete(false)}
                    disabled={busy}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className={hasTransactions ? 'tooltip tooltip-right' : ''} data-tip={hasTransactions ? 'This account has transactions and cannot be deleted.' : undefined}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-error/70 hover:text-error hover:bg-error/10 gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={handleDeleteClick}
                    disabled={hasTransactions || busy}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                    Delete account
                  </button>
                </div>
              )}
              {deleteError && <p className="text-xs text-error mt-1">{deleteError}</p>}
            </div>

            {/* Save / Cancel */}
            <div className="flex gap-2">
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {saveMutation.isPending && <span className="loading loading-spinner loading-sm" />}
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
      <label className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
