import { client } from './client';
import type {
  AccountTransactionResult,
  AccountTransactionsParams,
  CreateAccountTransactionRequest,
  CreateTransactionRequest,
  PagedResult,
  TransactionResult,
  UpdateTransactionRequest,
} from '@/types';

export const transactionsApi = {
  getTransactions: (month: string, page = 1, pageSize = 50) =>
    client
      .get<PagedResult<TransactionResult>>(
        `/api/transactions?month=${month}&page=${page}&pageSize=${pageSize}`,
      )
      .then((r) => r.data),

  createTransaction: (req: CreateTransactionRequest) =>
    client.post<TransactionResult>('/api/transactions', req).then((r) => r.data),

  updateTransaction: (id: string, req: UpdateTransactionRequest) =>
    client.put<TransactionResult>(`/api/transactions/${id}`, req).then((r) => r.data),

  deleteTransaction: (id: string) => client.delete(`/api/transactions/${id}`),

  getAccountTransactions: (params: AccountTransactionsParams) => {
    const { accountId, fromDate, toDate, search = '', page = 1, pageSize = 50 } = params;
    const qs = new URLSearchParams({
      accountId,
      fromDate,
      toDate,
      ...(search ? { search } : {}),
      page: String(page),
      pageSize: String(pageSize),
    });
    return client
      .get<{ transactions: PagedResult<AccountTransactionResult> }>(
        `/api/transactions?${qs.toString()}`,
      )
      .then((r) => r.data.transactions);
  },

  createAccountTransaction: (req: CreateAccountTransactionRequest) =>
    client
      .post<{ transaction: AccountTransactionResult }>('/api/transactions', req)
      .then((r) => r.data.transaction),
};
