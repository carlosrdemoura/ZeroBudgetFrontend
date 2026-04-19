import { client } from './client';
import type { CategoryGroupResult, CategoryResult } from '@/types';

export const categoriesApi = {
  getGroups: () =>
    client.get<{ categoryGroups: CategoryGroupResult[] }>('/api/category-groups').then((r) => r.data.categoryGroups),

  createGroup: (name: string) =>
    client.post<CategoryGroupResult>('/api/category-groups', { name }).then((r) => r.data),

  updateGroup: (groupId: string, name: string) =>
    client.put(`/api/category-groups/${groupId}`, { name }),

  deleteGroup: (groupId: string, targetCategoryId: string) =>
    client.delete(`/api/category-groups/${groupId}`, { data: { targetCategoryId } }),

  createCategory: (groupId: string, name: string) =>
    client
      .post<CategoryResult>(`/api/category-groups/${groupId}/categories`, { name })
      .then((r) => r.data),

  updateCategory: (groupId: string, categoryId: string, name: string) =>
    client.put(`/api/category-groups/${groupId}/categories/${categoryId}`, { name }),

  deleteCategory: (groupId: string, categoryId: string, targetCategoryId: string) =>
    client.delete(`/api/category-groups/${groupId}/categories/${categoryId}`, {
      data: { targetCategoryId },
    }),

  reorderGroups: (items: { groupId: string; sortOrder: number }[]) =>
    client.patch('/api/category-groups/reorder', items),

  reorderCategories: (groupId: string, items: { categoryId: string; sortOrder: number }[]) =>
    client.patch(`/api/category-groups/${groupId}/categories/reorder`, items),

  moveCategory: (groupId: string, categoryId: string, targetGroupId: string) =>
    client.patch(`/api/category-groups/${groupId}/categories/${categoryId}/move`, { targetGroupId }),
};
