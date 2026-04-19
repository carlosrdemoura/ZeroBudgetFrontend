import { client } from './client';
import type { AccountResult } from '@/types';

export const accountsApi = {
  getAccounts: () =>
    client
      .get<{ accounts: AccountResult[] }>('/api/accounts')
      .then((r) => r.data.accounts),

  createAccount: (name: string, initialBalance: number) =>
    client
      .post<{ account: AccountResult }>('/api/accounts', { name, initialBalance })
      .then((r) => r.data.account),

  updateAccount: (id: string, patch: { name?: string; currentBalance?: number }) =>
    client
      .put<{ account: AccountResult }>(`/api/accounts/${id}`, patch)
      .then((r) => r.data.account),

  deleteAccount: (id: string) => client.delete(`/api/accounts/${id}`),
};
