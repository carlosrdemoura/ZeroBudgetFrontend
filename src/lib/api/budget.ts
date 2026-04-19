import { client } from './client';
import type { CategoryBalance, MonthSummary } from '@/types';

export const budgetApi = {
  getMonthSummary: (month: string) =>
    client.get<{ summary: MonthSummary }>(`/api/budget/${month}`).then((r) => r.data.summary),

  getCategoryBalances: (month: string) =>
    client.get<{ balances: CategoryBalance[] }>(`/api/budget/${month}/balances`).then((r) => r.data.balances),

  assignAmount: (month: string, categoryId: string, amount: number) =>
    client.put(`/api/budget/${month}/assign`, { categoryId, amount }),

  moveMoney: (
    month: string,
    fromCategoryId: string,
    toCategoryId: string,
    amount: number,
  ) => client.post(`/api/budget/${month}/move`, { fromCategoryId, toCategoryId, amount }),
};
