import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '@/lib/api/categories';

const INFLOW_CATEGORY_ID = '00000000-0000-0000-0000-000000000003';

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export interface TransactionFormData {
  date: string;
  amount: number;
  categoryId: string | null;
  categoryName: string | null;
  categoryGroupId: string | null;
  memo: string | null;
  affectsBudget: boolean;
}

export interface TransactionInitialValues {
  date: string;
  memo: string | null;
  categoryId: string | null;
  categoryName: string | null;
  amount: number;
  affectsBudget: boolean;
}

interface Props {
  initial?: TransactionInitialValues;
  allowCategoryCreate?: boolean;
  defaultDate?: string;
  onSave: (data: TransactionFormData) => Promise<void>;
  onCancel: () => void;
}

export function InlineTransactionRow({ initial, allowCategoryCreate = true, defaultDate, onSave, onCancel }: Props) {
  const [date, setDate] = useState(initial?.date ?? defaultDate ?? todayISO());
  const [memo, setMemo] = useState(initial?.memo ?? '');
  const [categoryId, setCategoryId] = useState<string | null>(initial?.categoryId ?? null);
  const [categoryName, setCategoryName] = useState<string | null>(initial?.categoryName ?? null);
  const [categoryGroupId, setCategoryGroupId] = useState<string | null>(null);
  const [categoryInput, setCategoryInput] = useState(initial?.categoryName ?? '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [newCatNameOverride, setNewCatNameOverride] = useState<string | null>(null);
  const [newCatGroupId, setNewCatGroupId] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [outflow, setOutflow] = useState(
    initial && initial.amount < 0 ? Math.abs(initial.amount).toFixed(2) : '',
  );
  const [inflow, setInflow] = useState(
    initial && initial.amount > 0 ? initial.amount.toFixed(2) : '',
  );
  const [affectsBudget, setAffectsBudget] = useState(initial?.affectsBudget ?? true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
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

  const buildData = (): TransactionFormData | null => {
    setError('');
    if (!date) { setError('Date is required.'); return null; }
    const outAmt = parseFloat(outflow);
    const inAmt = parseFloat(inflow);
    const hasOut = !isNaN(outAmt) && outAmt > 0;
    const hasIn = !isNaN(inAmt) && inAmt > 0;
    if (!hasOut && !hasIn) {
      setError('Enter an outflow or inflow amount.');
      return null;
    }
    const amount = hasIn ? inAmt : -outAmt;

    if (hasIn && !categoryId && !categoryName) {
      return { date, amount, categoryId: INFLOW_CATEGORY_ID, categoryName: null, categoryGroupId: null, memo: memo.trim() || null, affectsBudget };
    }
    if (categoryId) {
      return { date, amount, categoryId, categoryName: null, categoryGroupId: null, memo: memo.trim() || null, affectsBudget };
    }
    if (categoryName && allowCategoryCreate) {
      if (!categoryGroupId) {
        setError('Pick which group the new category belongs to.');
        return null;
      }
      return { date, amount, categoryId: null, categoryName, categoryGroupId, memo: memo.trim() || null, affectsBudget };
    }
    setError('Select a category.');
    return null;
  };

  const submit = async () => {
    const data = buildData();
    if (!data) return;
    setBusy(true);
    try {
      await onSave(data);
      onCancel();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { title?: string } } })?.response?.data?.title ??
          'Failed to save.',
      );
    } finally {
      setBusy(false);
    }
  };

  const inputCls = 'w-full bg-transparent text-sm outline-none border-b border-transparent focus:border-primary py-0.5 placeholder:text-base-content/30';
  const numCls = `${inputCls} text-right`;

  return (
    <tr className="border-b border-primary/20" style={{ backgroundColor: 'oklch(96% 0.02 262)' }}>
      {/* DATE */}
      <td className="py-2 pl-4 pr-2 align-top">
        <input
          type="date"
          className={inputCls}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </td>

      {/* CATEGORY */}
      <td className="py-2 px-2 align-top">
        <div className="relative">
          <input
            type="text"
            className={inputCls}
            placeholder="Category"
            value={categoryInput}
            onChange={(e) => handleCategoryInput(e.target.value)}
            onFocus={handleCategoryFocus}
            onBlur={handleCategoryBlur}
          />
          {showDropdown && (
            <div ref={dropdownRef} tabIndex={-1} className="absolute left-0 top-full mt-1 z-50 bg-base-100 border border-base-300 rounded-lg shadow-xl w-80 overflow-hidden">
              {/* Add Category form */}
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

              {/* Grouped categories */}
              <div className="max-h-52 overflow-y-auto">
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
      </td>

      {/* MEMO */}
      <td className="py-2 px-2 align-top">
        <input
          type="text"
          className={inputCls}
          placeholder="Memo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </td>

      {/* OUTFLOW */}
      <td className="py-2 px-2 align-top">
        <input
          type="number"
          min="0.01"
          step="0.01"
          className={`${numCls} disabled:opacity-40`}
          placeholder="outflow"
          value={outflow}
          onChange={(e) => { setOutflow(e.target.value); if (e.target.value) setInflow(''); }}
          disabled={isInflowSelected}
          title={isInflowSelected ? 'Outflow disabled for Ready to Assign' : undefined}
        />
      </td>

      {/* INFLOW */}
      <td className="py-2 px-2 align-top">
        <input
          type="number"
          min="0.01"
          step="0.01"
          className={numCls}
          placeholder="inflow"
          value={inflow}
          onChange={(e) => { setInflow(e.target.value); if (e.target.value) setOutflow(''); }}
        />
      </td>

      {/* ACTIONS */}
      <td className="py-2 pr-4 pl-2 align-top">
        <div className="flex flex-col items-end gap-1.5">
          {error && (
            <span className="text-error text-xs leading-tight text-right max-w-36">{error}</span>
          )}
          <div className="flex items-center gap-2 whitespace-nowrap">
            <input
              type="checkbox"
              className="toggle toggle-xs toggle-primary"
              checked={affectsBudget}
              onChange={(e) => setAffectsBudget(e.target.checked)}
              title="Affects budget"
            />
            <button
              type="button"
              className="btn btn-ghost btn-xs text-base-content/60"
              onClick={onCancel}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary btn-xs"
              onClick={submit}
              disabled={busy}
            >
              {busy && <span className="loading loading-spinner loading-xs" />}
              Save
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}
