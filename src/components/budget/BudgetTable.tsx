import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { budgetApi } from '@/lib/api/budget';
import { categoriesApi } from '@/lib/api/categories';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { CategoryGroupRow } from './CategoryGroupRow';
import { MoveMoneyModal } from './MoveMoneyModal';
import { DeleteCategoryGroupModal } from './DeleteCategoryGroupModal';
import { DeleteCategoryModal } from './DeleteCategoryModal';
import { AddGroupRow } from './AddGroupRow';
import { BudgetMobile } from './BudgetMobile';
import type { CategoryBalance, CategoryGroupResult, CategoryResult, MonthSummary } from '@/types';

interface Props {
  month: string;
}

export function BudgetCols() {
  return (
    <colgroup>
      <col />
      <col style={{ width: '7rem' }} />
      <col style={{ width: '7rem' }} />
      <col style={{ width: '8rem' }} />
    </colgroup>
  );
}

export function BudgetTable({ month }: Props) {
  const qc = useQueryClient();
  const [moveSource, setMoveSource] = useState<{ id: string; name: string; available: number } | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<CategoryGroupResult | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoryResult | null>(null);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [localGroups, setLocalGroupsState] = useState<CategoryGroupResult[]>([]);
  const localGroupsRef = useRef<CategoryGroupResult[]>([]);
  const [activeItem, setActiveItem] = useState<{ id: string; type: 'group' | 'category' } | null>(null);

  const setLocalGroups = (updater: CategoryGroupResult[] | ((p: CategoryGroupResult[]) => CategoryGroupResult[])) => {
    setLocalGroupsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      localGroupsRef.current = next;
      return next;
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const { data: groups, isLoading: loadingGroups } = useQuery({
    queryKey: ['groups'],
    queryFn: categoriesApi.getGroups,
    staleTime: 60_000,
  });

  const { data: balances, isLoading: loadingBalances, error } = useQuery({
    queryKey: ['balances', month],
    queryFn: () => budgetApi.getCategoryBalances(month),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (groups) setLocalGroups(groups);
  }, [groups]); // eslint-disable-line react-hooks/exhaustive-deps

  const assignMutation = useMutation({
    mutationFn: ({ categoryId, amount }: { categoryId: string; amount: number }) =>
      budgetApi.assignAmount(month, categoryId, amount),
    onMutate: async ({ categoryId, amount }) => {
      await qc.cancelQueries({ queryKey: ['balances', month] });
      await qc.cancelQueries({ queryKey: ['summary', month] });
      const prevBalances = qc.getQueryData<CategoryBalance[]>(['balances', month]);
      const prevSummary = qc.getQueryData<MonthSummary>(['summary', month]);
      const prevAssigned = prevBalances?.find((b) => b.categoryId === categoryId)?.assigned ?? 0;
      const delta = amount - prevAssigned;
      qc.setQueryData<CategoryBalance[]>(['balances', month], (old) =>
        old?.map((b) =>
          b.categoryId === categoryId
            ? { ...b, assigned: amount, balance: b.previousBalance + amount + b.activity }
            : b,
        ),
      );
      qc.setQueryData<MonthSummary>(['summary', month], (old) =>
        old
          ? { ...old, totalAssigned: old.totalAssigned + delta, availableToAssign: old.availableToAssign - delta }
          : old,
      );
      return { prevBalances, prevSummary };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevBalances) qc.setQueryData(['balances', month], ctx.prevBalances);
      if (ctx?.prevSummary) qc.setQueryData(['summary', month], ctx.prevSummary);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['balances', month] });
      qc.invalidateQueries({ queryKey: ['summary', month] });
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({
      fromCategoryId,
      toCategoryId,
      amount,
    }: {
      fromCategoryId: string;
      toCategoryId: string;
      amount: number;
    }) => budgetApi.moveMoney(month, fromCategoryId, toCategoryId, amount),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['balances', month] });
      qc.invalidateQueries({ queryKey: ['summary', month] });
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: (name: string) => categoriesApi.createGroup(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  });

  const createCategoryMutation = useMutation({
    mutationFn: ({ groupId, name }: { groupId: string; name: string }) =>
      categoriesApi.createCategory(groupId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  });

  const updateGroupMutation = useMutation({
    mutationFn: ({ groupId, name }: { groupId: string; name: string }) =>
      categoriesApi.updateGroup(groupId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  });

  const deleteGroupMutation = useMutation({
    mutationFn: ({ groupId, targetCategoryId }: { groupId: string; targetCategoryId: string }) =>
      categoriesApi.deleteGroup(groupId, targetCategoryId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      qc.invalidateQueries({ queryKey: ['balances', month] });
      qc.invalidateQueries({ queryKey: ['summary', month] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['accountTransactions'] });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ groupId, categoryId, name }: { groupId: string; categoryId: string; name: string }) =>
      categoriesApi.updateCategory(groupId, categoryId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: ({ groupId, categoryId, targetCategoryId }: { groupId: string; categoryId: string; targetCategoryId: string }) =>
      categoriesApi.deleteCategory(groupId, categoryId, targetCategoryId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      qc.invalidateQueries({ queryKey: ['balances', month] });
      qc.invalidateQueries({ queryKey: ['summary', month] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['accountTransactions'] });
    },
  });

  const reorderGroupsMutation = useMutation({
    mutationFn: (items: { groupId: string; sortOrder: number }[]) =>
      categoriesApi.reorderGroups(items),
    onError: () => { if (groups) setLocalGroups(groups); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  });

  const reorderCategoriesMutation = useMutation({
    mutationFn: ({ groupId, items }: { groupId: string; items: { categoryId: string; sortOrder: number }[] }) =>
      categoriesApi.reorderCategories(groupId, items),
    onError: () => { if (groups) setLocalGroups(groups); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  });

  const moveCategoryMutation = useMutation({
    mutationFn: ({ groupId, categoryId, targetGroupId }: { groupId: string; categoryId: string; targetGroupId: string }) =>
      categoriesApi.moveCategory(groupId, categoryId, targetGroupId),
    onError: () => { if (groups) setLocalGroups(groups); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  });

  if (loadingGroups || loadingBalances) return <LoadingSpinner />;
  if (error) return <ErrorAlert error={error} />;
  if (!groups || !balances) return null;

  const balancesByCategory = balances.reduce<Record<string, CategoryBalance>>((acc, b) => {
    acc[b.categoryId] = b;
    return acc;
  }, {});

  const handleAssign = async (categoryId: string, amount: number) => {
    await assignMutation.mutateAsync({ categoryId, amount });
  };

  const handleMove = async (from: string, to: string, amount: number) => {
    await moveMutation.mutateAsync({ fromCategoryId: from, toCategoryId: to, amount });
  };

  const handleAddGroup = async (name: string) => {
    await createGroupMutation.mutateAsync(name);
    setShowAddGroup(false);
  };

  const handleAddCategory = async (groupId: string, name: string) => {
    await createCategoryMutation.mutateAsync({ groupId, name });
  };

  const handleRenameGroup = async (groupId: string, name: string) => {
    await updateGroupMutation.mutateAsync({ groupId, name });
  };

  const handleRenameCategory = async (categoryId: string, name: string) => {
    const group = localGroupsRef.current.find((g) => g.categories.some((c) => c.id === categoryId));
    if (!group) return;
    await updateCategoryMutation.mutateAsync({ groupId: group.id, categoryId, name });
  };

  const handleConfirmDeleteCategory = async (categoryId: string, targetCategoryId: string) => {
    const group = localGroupsRef.current.find((g) => g.categories.some((c) => c.id === categoryId));
    if (!group) return;
    await deleteCategoryMutation.mutateAsync({ groupId: group.id, categoryId, targetCategoryId });
  };

  function onDragStart({ active }: DragStartEvent) {
    setActiveItem({ id: active.id as string, type: active.data.current?.type });
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over || active.data.current?.type !== 'category') return;

    const overType = over.data.current?.type;
    let overGroupId: string | undefined;

    if (overType === 'group') {
      overGroupId = over.id as string;
    } else if (overType === 'category') {
      overGroupId = over.data.current?.groupId;
    }
    if (!overGroupId) return;

    const activeCatId = active.id as string;
    const capturedOverGroupId = overGroupId;

    setLocalGroups((prev) => {
      const activeGroupId = prev.find((g) => g.categories.some((c) => c.id === activeCatId))?.id;
      if (!activeGroupId || capturedOverGroupId === activeGroupId) return prev;

      const activeCat = prev.find((g) => g.id === activeGroupId)?.categories.find((c) => c.id === activeCatId);
      if (!activeCat) return prev;

      return prev.map((g) => {
        if (g.id === activeGroupId) return { ...g, categories: g.categories.filter((c) => c.id !== activeCatId) };
        if (g.id === capturedOverGroupId) return { ...g, categories: [...g.categories, { ...activeCat, groupId: capturedOverGroupId }] };
        return g;
      });
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveItem(null);

    if (!over) {
      if (groups) setLocalGroups(groups);
      return;
    }

    const current = localGroupsRef.current;
    const type = active.data.current?.type;

    if (type === 'group') {
      let overGroupId = over.id as string;
      if (over.data.current?.type === 'category') {
        overGroupId = over.data.current?.groupId;
      }
      const oldIdx = current.findIndex((g) => g.id === active.id);
      const newIdx = current.findIndex((g) => g.id === overGroupId);
      if (oldIdx === newIdx || newIdx === -1) return;

      const newOrder = arrayMove(current, oldIdx, newIdx);
      setLocalGroups(newOrder);
      reorderGroupsMutation.mutate(newOrder.map((g, i) => ({ groupId: g.id, sortOrder: i + 1 })));

    } else if (type === 'category') {
      const activeCatId = active.id as string;
      const originalGroupId = active.data.current?.groupId as string;
      const currentGroup = current.find((g) => g.categories.some((c) => c.id === activeCatId));
      if (!currentGroup) return;

      if (currentGroup.id !== originalGroupId) {
        moveCategoryMutation.mutate({
          groupId: originalGroupId,
          categoryId: activeCatId,
          targetGroupId: currentGroup.id,
        });
      } else {
        const overCatId = over.id as string;
        const cats = currentGroup.categories;
        const oldIdx = cats.findIndex((c) => c.id === activeCatId);
        const newIdx = cats.findIndex((c) => c.id === overCatId);
        if (oldIdx === newIdx || newIdx === -1) return;

        const newCats = arrayMove(cats, oldIdx, newIdx);
        setLocalGroups(current.map((g) =>
          g.id === currentGroup.id ? { ...g, categories: newCats } : g,
        ));
        reorderCategoriesMutation.mutate({
          groupId: currentGroup.id,
          items: newCats.map((c, i) => ({ categoryId: c.id, sortOrder: i + 1 })),
        });
      }
    }
  }

  const activeGroup = activeItem?.type === 'group'
    ? localGroupsRef.current.find((g) => g.id === activeItem.id)
    : null;
  const activeCat = activeItem?.type === 'category'
    ? localGroupsRef.current.flatMap((g) => g.categories).find((c) => c.id === activeItem.id)
    : null;

  return (
    <div className="p-0 lg:p-6">
      {/* Mobile (< lg): card layout, no dnd-kit */}
      <div className="lg:hidden">
        <BudgetMobile
          groups={localGroups}
          balancesByCategory={balancesByCategory}
          onAssign={handleAssign}
          onAddGroup={handleAddGroup}
          onAddCategory={handleAddCategory}
          onRenameGroup={handleRenameGroup}
          onRequestDeleteGroup={(g) => setDeletingGroup(g)}
          onRenameCategory={handleRenameCategory}
          onRequestDeleteCategory={(c) => setDeletingCategory(c)}
          onOpenMove={(id, name, available) => setMoveSource({ id, name, available })}
        />
      </div>

      {/* Desktop (>= lg): table layout with dnd-kit */}
      <div className="hidden lg:block">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="overflow-x-auto">
          <div className="space-y-3 min-w-[480px]">
            {/* Column header card */}
            <div className="bg-base-100 rounded-xl border border-base-300 shadow-sm overflow-hidden">
              <table className="w-full table-fixed">
                <BudgetCols />
                <thead>
                  <tr>
                    <th className="text-left py-3 pl-4 pr-3 text-xs font-semibold uppercase tracking-wider text-base-content/50">
                      <div className="flex items-center gap-2">
                        Category
                        <button
                          onClick={() => setShowAddGroup(true)}
                          className="inline-flex items-center justify-center w-5 h-5 rounded hover:bg-base-200 transition-colors opacity-60 hover:opacity-100 text-base-content/70 text-sm leading-none font-normal normal-case tracking-normal"
                          title="Add group"
                        >
                          +
                        </button>
                      </div>
                    </th>
                    <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wider text-base-content/50 whitespace-nowrap">
                      Assigned
                    </th>
                    <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wider text-base-content/50 whitespace-nowrap">
                      Activity
                    </th>
                    <th className="text-right py-3 pl-3 pr-5 text-xs font-semibold uppercase tracking-wider text-base-content/50 whitespace-nowrap">
                      Available
                    </th>
                  </tr>
                </thead>
              </table>
            </div>

            {/* One card per group */}
            <SortableContext items={localGroups.map((g) => g.id)} strategy={verticalListSortingStrategy}>
              {localGroups.map((g) => (
                <CategoryGroupRow
                  key={g.id}
                  group={g}
                  balancesByCategory={balancesByCategory}
                  onAssign={handleAssign}
                  onAddCategory={handleAddCategory}
                  onRenameGroup={handleRenameGroup}
                  onRequestDeleteGroup={(g) => setDeletingGroup(g)}
                  onRenameCategory={handleRenameCategory}
                  onRequestDeleteCategory={(c) => setDeletingCategory(c)}
                  onOpenMove={(id, name, available) => setMoveSource({ id, name, available })}
                />
              ))}
            </SortableContext>

            {showAddGroup && (
              <div className="bg-base-100 rounded-xl border border-base-300 shadow-sm overflow-hidden">
                <table className="w-full table-fixed">
                  <BudgetCols />
                  <tbody>
                    <AddGroupRow
                      onSave={handleAddGroup}
                      onCancel={() => setShowAddGroup(false)}
                    />
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeGroup && (
            <div className="bg-base-200 px-4 py-2 rounded-lg shadow-xl text-xs font-semibold text-base-content/60 border border-base-300 opacity-90 pointer-events-none">
              {activeGroup.name}
            </div>
          )}
          {activeCat && (
            <div className="bg-base-100 px-4 py-2 rounded-lg shadow-xl text-sm text-base-content/85 border border-base-300 opacity-90 pointer-events-none">
              {activeCat.name}
            </div>
          )}
        </DragOverlay>
      </DndContext>
      </div>

      {moveSource && (
        <MoveMoneyModal
          key={moveSource.id}
          fromCategoryId={moveSource.id}
          fromCategoryName={moveSource.name}
          initialAmount={moveSource.available}
          groups={localGroups}
          onMove={handleMove}
          onClose={() => setMoveSource(null)}
        />
      )}

      {deletingGroup && (
        <DeleteCategoryGroupModal
          key={deletingGroup.id}
          group={deletingGroup}
          groups={localGroups}
          onConfirm={async (groupId, targetCategoryId) => {
            await deleteGroupMutation.mutateAsync({ groupId, targetCategoryId });
          }}
          onClose={() => setDeletingGroup(null)}
        />
      )}

      {deletingCategory && (
        <DeleteCategoryModal
          key={deletingCategory.id}
          category={deletingCategory}
          groups={localGroups}
          onConfirm={handleConfirmDeleteCategory}
          onClose={() => setDeletingCategory(null)}
        />
      )}
    </div>
  );
}
