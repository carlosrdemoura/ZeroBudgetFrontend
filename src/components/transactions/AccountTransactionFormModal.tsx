import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '@/lib/api/categories';
import { INFLOW_CATEGORY_ID } from '@/lib/constants';
import type { TransactionFormData, TransactionInitialValues } from './InlineTransactionRow';

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface Props {
  initial?: TransactionInitialValues;
  allowCategoryCreate?: boolean;
  defaultDate?: string;
  onSave: (data: TransactionFormData) => Promise<void>;
  onClose: () => void;
}

export function AccountTransactionFormModal({
  initial, allowCategoryCreate = true, defaultDate, onSave, onClose,
}: Props) {
  const [date, setDate] = useState(initial?.date ?? defaultDate ?? todayISO());
  const [outflow, setOutflow] = useState(
    initial && initial.amount < 0 ? Math.abs(initial.amount).toFixed(2) : '',
  );
  const [inflow, setInflow] = useState(
    initial && initial.amount > 0 ? initial.amount.toFixed(2) : '',
  );
  const [categoryId, setCategoryId] = useState<string | null>(initial?.categoryId ?? null);
  const [categoryName, setCategoryName] = useState<string | null>(initial?.categoryName ?? null);
  const [categoryGroupId, setCategoryGroupId] = useState<string | null>(null);
  const [categoryInput, setCategoryInput] = useState(initial?.categoryName ?? '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [newCatNameOverride, setNewCatNameOverride] = useState<string | null>(null);
  const [newCatGroupId, setNewCatGroupId] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [memo, setMemo] = useState(initial?.memo ?? '');
  const [affectsBudget, setAffectsBudget] = useState(initial?.affectsBudget ?? true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: categoriesApi.getGroups,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!newCatGroupId && groups.length > 0) setNewCatGroupId(groups[0].id);
  }, [groups, newCatGroupId]);

  const allCategories = useMemo(
    () =>
      groups.flatMap((g) =>
        g.categories.map((c) => ({ id: c.id, name: c.name, groupName: g.name })),
      ),
    [groups],
  );

  const filteredGroups = useMemo(() => {
    const q = categoryInput.trim().toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        categories: g.categories.filter(
          (c) => q === '' || c.name.toLowerCase().includes(q) || g.name.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.categories.length > 0);
  }, [groups, categoryInput]);

  const isInflowSelected = categoryId === INFLOW_CATEGORY_ID;

  const showInflowOption = useMemo(() => {
    const q = categoryInput.trim().toLowerCase();
    if (q === '') return true;
    return 'inflow: ready to assign'.includes(q) || 'inflow'.includes(q) || 'ready to assign'.includes(q);
  }, [categoryInput]);

  const exactMatch = allCategories.some(
    (c) => c.name.toLowerCase() === categoryInput.trim().toLowerCase(),
  );
  const showCreateOption = allowCategoryCreate && categoryInput.trim() !== '' && !exactMatch;

  const handleCategoryInput = (val: string) => {
    setCategoryInput(val);
    setCategoryId(null);
    setCategoryName(null);
    setCategoryGroupId(null);
    setNewCatNameOverride(null);
    setShowDropdown(true);
  };

  const handleCategorySelect = (id: string, name: string) => {
    setCategoryId(id);
    setCategoryName(name);
    setCategoryGroupId(null);
    setCategoryInput(name);
    setShowDropdown(false);
    if (id === INFLOW_CATEGORY_ID) setOutflow('');
  };

  const newCatName = newCatNameOverride ?? categoryInput.trim();

  const handleSaveNewCategory = () => {
    const name = newCatName.trim();
    if (!name || !newCatGroupId) return;
    setCategoryId(null);
    setCategoryName(name);
    setCategoryGroupId(newCatGroupId);
    setCategoryInput(name);
    setNewCatNameOverride(null);
    setShowDropdown(false);
  };

  const handleCancelNewCategory = () => {
    setNewCatNameOverride(null);
    setShowDropdown(false);
  };

  const handleCategoryBlur = () => {
    blurTimer.current = setTimeout(() => {
      if (typeof document !== 'undefined' && dropdownRef.current?.contains(document.activeElement)) {
        return;
      }
      setShowDropdown(false);
      if (!categoryId && !categoryGroupId) {
        setCategoryName(null);
        if (!categoryInput.trim()) setCategoryId(null);
      }
    }, 150);
  };

  const handleCategoryFocus = () => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    setShowDropdown(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const outAmt = parseFloat(outflow);
    const inAmt = parseFloat(inflow);
    const hasOut = !isNaN(outAmt) && outAmt > 0;
    const hasIn = !isNaN(inAmt) && inAmt > 0;
    if (!hasOut && !hasIn) {
      setError('Enter an outflow or inflow amount.');
      return;
    }
    const amount = hasIn ? inAmt : -outAmt;

    let resolvedCategoryId: string | null = null;
    let resolvedCategoryName: string | null = null;
    let resolvedCategoryGroupId: string | null = null;

    if (categoryId) {
      resolvedCategoryId = categoryId;
    } else if (categoryName && allowCategoryCreate) {
      if (!categoryGroupId) {
        setError('Pick which group the new category belongs to.');
        return;
      }
      resolvedCategoryName = categoryName;
      resolvedCategoryGroupId = categoryGroupId;
    } else if (hasIn) {
      resolvedCategoryId = INFLOW_CATEGORY_ID;
    } else {
      setError('Select a category.');
      return;
    }

    setBusy(true);
    try {
      await onSave({
        date,
        amount,
        categoryId: resolvedCategoryId,
        categoryName: resolvedCategoryName,
        categoryGroupId: resolvedCategoryGroupId,
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
    if (e.target === backdropRef.current && !busy) onClose();
  };

  return (
    <div ref={backdropRef} className="modal modal-open modal-bottom sm:modal-middle" onClick={handleBackdrop}>
      <div className="modal-box w-full sm:max-w-lg max-h-[90dvh] p-0 flex flex-col">
        <div className="px-5 pt-5 pb-3 relative shrink-0">
          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
            onClick={onClose}
            type="button"
            disabled={busy}
          >
            ✕
          </button>
          <h3 className="font-bold text-lg">{initial ? 'Edit Transaction' : 'Add Transaction'}</h3>
        </div>

        <div className="px-5 pb-3 overflow-y-auto grow">
          {error && (
            <div role="alert" className="alert alert-error text-sm mb-3">
              <span>{error}</span>
            </div>
          )}

          <form id="account-transaction-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
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

            <div className="form-control">
              <div className="label pb-1">
                <span className="label-text font-medium">Category</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder={allowCategoryCreate ? 'Search or create…' : 'Search categories…'}
                  value={categoryInput}
                  onChange={(e) => handleCategoryInput(e.target.value)}
                  onFocus={handleCategoryFocus}
                  onBlur={handleCategoryBlur}
                  autoComplete="off"
                />
                {showDropdown && (
                  <div ref={dropdownRef} tabIndex={-1} className="absolute left-0 right-0 top-full mt-1 z-50 bg-base-100 border border-base-300 rounded-lg shadow-xl overflow-hidden">
                    {showCreateOption && (
                      <div className="p-3 border-b border-base-200 bg-base-200/30">
                        <div className="text-sm font-bold mb-2">Add Category</div>
                        <label className="form-control mb-2">
                          <div className="label py-0.5">
                            <span className="label-text text-xs font-medium">Category Name</span>
                          </div>
                          <input
                            type="text"
                            className="input input-sm input-bordered w-full"
                            value={newCatName}
                            onChange={(e) => setNewCatNameOverride(e.target.value)}
                          />
                        </label>
                        <label className="form-control mb-2">
                          <div className="label py-0.5">
                            <span className="label-text text-xs font-medium">In Category Group</span>
                          </div>
                          <select
                            className="select select-sm select-bordered w-full"
                            value={newCatGroupId}
                            onChange={(e) => setNewCatGroupId(e.target.value)}
                          >
                            {groups.map((g) => (
                              <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                          </select>
                        </label>
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onMouseDown={(e) => { e.preventDefault(); handleCancelNewCategory(); }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-xs"
                            onMouseDown={(e) => { e.preventDefault(); handleSaveNewCategory(); }}
                            disabled={!newCatName.trim() || !newCatGroupId}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="max-h-60 overflow-y-auto">
                      {showInflowOption && (
                        <div>
                          <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-base-content/40 bg-base-200/60">
                            Inflow
                          </div>
                          <button
                            type="button"
                            className="w-full text-left px-4 py-2 text-sm hover:bg-primary/8 hover:text-primary transition-colors"
                            onMouseDown={(e) => { e.preventDefault(); handleCategorySelect(INFLOW_CATEGORY_ID, 'Inflow: Ready to Assign'); }}
                          >
                            Ready to Assign
                          </button>
                        </div>
                      )}
                      {filteredGroups.map((g) => (
                        <div key={g.id}>
                          <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-base-content/40 bg-base-200/60">
                            {g.name}
                          </div>
                          {g.categories.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              className="w-full text-left px-4 py-2 text-sm hover:bg-primary/8 hover:text-primary transition-colors"
                              onMouseDown={(e) => { e.preventDefault(); handleCategorySelect(c.id, c.name); }}
                            >
                              {c.name}
                            </button>
                          ))}
                        </div>
                      ))}
                      {filteredGroups.length === 0 && !showInflowOption && !showCreateOption && (
                        <div className="px-3 py-3 text-sm text-base-content/40 text-center">No categories found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="form-control">
                <div className="label pb-1">
                  <span className="label-text font-medium text-error">Outflow</span>
                </div>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="input input-bordered w-full text-right tabular-nums disabled:opacity-40"
                  placeholder="0.00"
                  value={outflow}
                  onChange={(e) => { setOutflow(e.target.value); if (e.target.value) setInflow(''); }}
                  disabled={isInflowSelected}
                  title={isInflowSelected ? 'Outflow disabled for Ready to Assign' : undefined}
                />
              </label>
              <label className="form-control">
                <div className="label pb-1">
                  <span className="label-text font-medium text-success">Inflow</span>
                </div>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="input input-bordered w-full text-right tabular-nums"
                  placeholder="0.00"
                  value={inflow}
                  onChange={(e) => { setInflow(e.target.value); if (e.target.value) setOutflow(''); }}
                />
              </label>
            </div>

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

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={affectsBudget}
                onChange={(e) => setAffectsBudget(e.target.checked)}
              />
              <span className="text-sm font-medium">Affects budget</span>
            </label>
          </form>
        </div>

        <div className="px-5 py-3 border-t border-base-200 bg-base-200/40 flex items-center justify-between gap-2 shrink-0">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="submit"
            form="account-transaction-form"
            className="btn btn-primary btn-sm"
            disabled={busy}
          >
            {busy && <span className="loading loading-spinner loading-sm" />}
            Save
          </button>
        </div>
      </div>
      <label className="modal-backdrop" onClick={() => !busy && onClose()} />
    </div>
  );
}
