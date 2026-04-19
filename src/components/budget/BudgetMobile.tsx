import { useState } from 'react';
import type { CategoryBalance, CategoryGroupResult, CategoryResult } from '@/types';
import { CategoryActionsSheet } from './CategoryActionsSheet';
import { GroupActionsSheet } from './GroupActionsSheet';

interface Props {
  groups: CategoryGroupResult[];
  balancesByCategory: Record<string, CategoryBalance>;
  onAssign: (categoryId: string, amount: number) => Promise<void>;
  onAddGroup: (name: string) => Promise<void>;
  onAddCategory: (groupId: string, name: string) => Promise<void>;
  onRenameGroup: (groupId: string, name: string) => Promise<void>;
  onRequestDeleteGroup: (group: CategoryGroupResult) => void;
  onRenameCategory: (categoryId: string, name: string) => Promise<void>;
  onRequestDeleteCategory: (category: CategoryResult) => void;
  onOpenMove: (categoryId: string, categoryName: string, available: number) => void;
}

function fmt(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function KebabIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  );
}

function balancePillStyle(amount: number): string {
  if (amount > 0) return 'bg-success/12 text-success';
  if (amount < 0) return 'bg-error/12 text-error';
  return 'bg-base-300 text-base-content/40';
}

interface GroupSectionProps {
  group: CategoryGroupResult;
  balancesByCategory: Record<string, CategoryBalance>;
  showAddCategory: boolean;
  onTapCategory: (cat: CategoryResult) => void;
  onOpenMenu: () => void;
  onAddCategory: (name: string) => Promise<void>;
  onCancelAddCategory: () => void;
}

function GroupSection({
  group, balancesByCategory, showAddCategory,
  onTapCategory, onOpenMenu, onAddCategory, onCancelAddCategory,
}: GroupSectionProps) {
  const groupBalances = group.categories
    .map((c) => balancesByCategory[c.id])
    .filter(Boolean) as CategoryBalance[];
  const totalBalance = groupBalances.reduce((s, b) => s + b.balance, 0);

  return (
    <section className="bg-base-100 rounded-xl border border-base-300 shadow-sm overflow-hidden">
      <header className="flex items-center justify-between gap-2 bg-base-200/80 px-3 py-2.5 border-b border-base-300">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-base-content/70 truncate">{group.name}</h3>
        </div>
        <span className="text-xs font-semibold tabular-nums text-base-content/55 shrink-0">
          {fmt(totalBalance)}
        </span>
        <button
          className="btn btn-ghost btn-xs btn-circle text-base-content/55"
          onClick={onOpenMenu}
          aria-label="Group actions"
        >
          <KebabIcon />
        </button>
      </header>

      <ul className="divide-y divide-base-200">
        {group.categories.length === 0 && !showAddCategory && (
          <li className="px-3 py-3 text-xs text-base-content/40 italic text-center">
            No categories yet
          </li>
        )}
        {group.categories.map((cat) => {
          const balance = balancesByCategory[cat.id];
          const assigned = balance?.assigned ?? 0;
          const activity = balance?.activity ?? 0;
          const available = balance?.balance ?? 0;
          return (
            <li key={cat.id}>
              <button
                className="w-full text-left flex items-center justify-between gap-3 px-3 py-3 hover:bg-base-200/40 active:bg-base-200/70 transition-colors"
                onClick={() => onTapCategory(cat)}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-base-content/85 truncate">{cat.name}</div>
                  <div className="text-[11px] text-base-content/45 mt-0.5 tabular-nums">
                    Assigned {fmt(assigned)} · Activity {fmt(activity)}
                  </div>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold tabular-nums ${balancePillStyle(available)}`}
                >
                  {fmt(available)}
                </span>
              </button>
            </li>
          );
        })}
        {showAddCategory && (
          <li className="px-3 py-2">
            <InlineAddInput
              placeholder="New category name…"
              onSave={onAddCategory}
              onCancel={onCancelAddCategory}
            />
          </li>
        )}
      </ul>
    </section>
  );
}

function InlineAddInput({
  placeholder, onSave, onCancel,
}: {
  placeholder: string;
  onSave: (name: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try { await onSave(trimmed); }
    finally { setBusy(false); }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        autoFocus
        type="text"
        className="input input-bordered input-sm flex-1"
        placeholder={placeholder}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') onCancel();
        }}
        disabled={busy}
      />
      <button className="btn btn-primary btn-sm" onClick={submit} disabled={busy || !name.trim()}>
        Add
      </button>
      <button className="btn btn-ghost btn-sm" onClick={onCancel} disabled={busy}>
        Cancel
      </button>
    </div>
  );
}

export function BudgetMobile({
  groups, balancesByCategory,
  onAssign, onAddGroup, onAddCategory,
  onRenameGroup, onRequestDeleteGroup,
  onRenameCategory, onRequestDeleteCategory,
  onOpenMove,
}: Props) {
  const [actionCategory, setActionCategory] = useState<{ category: CategoryResult; groupName: string } | null>(null);
  const [actionGroup, setActionGroup] = useState<CategoryGroupResult | null>(null);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [addCategoryFor, setAddCategoryFor] = useState<string | null>(null);

  return (
    <div className="p-3 sm:p-4 space-y-3">
      {groups.map((g) => (
        <GroupSection
          key={g.id}
          group={g}
          balancesByCategory={balancesByCategory}
          showAddCategory={addCategoryFor === g.id}
          onTapCategory={(cat) => setActionCategory({ category: cat, groupName: g.name })}
          onOpenMenu={() => setActionGroup(g)}
          onAddCategory={async (name) => {
            await onAddCategory(g.id, name);
            setAddCategoryFor(null);
          }}
          onCancelAddCategory={() => setAddCategoryFor(null)}
        />
      ))}

      {showAddGroup ? (
        <div className="bg-base-100 rounded-xl border border-base-300 shadow-sm p-3">
          <InlineAddInput
            placeholder="New group name…"
            onSave={async (name) => {
              await onAddGroup(name);
              setShowAddGroup(false);
            }}
            onCancel={() => setShowAddGroup(false)}
          />
        </div>
      ) : (
        <button
          className="btn btn-ghost btn-sm w-full text-base-content/60"
          onClick={() => setShowAddGroup(true)}
        >
          + Add Group
        </button>
      )}

      {actionCategory && (
        <CategoryActionsSheet
          key={actionCategory.category.id}
          category={actionCategory.category}
          balance={balancesByCategory[actionCategory.category.id]}
          groupName={actionCategory.groupName}
          onSetAssigned={(amount) => onAssign(actionCategory.category.id, amount)}
          onMoveMoney={() => {
            const cat = actionCategory.category;
            const bal = balancesByCategory[cat.id]?.balance ?? 0;
            setActionCategory(null);
            onOpenMove(cat.id, cat.name, bal);
          }}
          onRename={(name) => onRenameCategory(actionCategory.category.id, name)}
          onRequestDelete={() => {
            const cat = actionCategory.category;
            setActionCategory(null);
            onRequestDeleteCategory(cat);
          }}
          onClose={() => setActionCategory(null)}
        />
      )}

      {actionGroup && (
        <GroupActionsSheet
          key={actionGroup.id}
          group={actionGroup}
          onAddCategory={() => {
            setAddCategoryFor(actionGroup.id);
            setActionGroup(null);
          }}
          onRename={(name) => onRenameGroup(actionGroup.id, name)}
          onDelete={() => {
            const g = actionGroup;
            setActionGroup(null);
            onRequestDeleteGroup(g);
          }}
          onClose={() => setActionGroup(null)}
        />
      )}
    </div>
  );
}
