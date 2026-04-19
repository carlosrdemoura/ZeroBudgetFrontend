// ── Auth ──────────────────────────────────────────────────────────────────────
export interface LoginResult {
  token: string;
  expiresAt: string;
  userId: string;
  email: string;
}

// ── Categories ────────────────────────────────────────────────────────────────
export interface CategoryResult {
  id: string;
  groupId: string;
  name: string;
  sortOrder: number;
}

export interface CategoryGroupResult {
  id: string;
  name: string;
  sortOrder: number;
  categories: CategoryResult[];
}

// ── Budget ────────────────────────────────────────────────────────────────────
export interface MonthSummary {
  month: string;
  totalIncome: number;
  totalAssigned: number;
  availableToAssign: number;
  rollover: number;
}

export interface CategoryBalance {
  categoryId: string;
  categoryName: string;
  groupId: string;
  groupName: string;
  previousBalance: number;
  assigned: number;
  activity: number;
  balance: number;
}

// ── Transactions ──────────────────────────────────────────────────────────────
export type TransactionType = 'Income' | 'Expense';

export interface TransactionResult {
  id: string;
  categoryId: string | null;
  categoryName: string | null;
  amount: number;
  date: string;
  memo: string | null;
  type: TransactionType;
  affectsBudget: boolean;
  createdAt: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CreateTransactionRequest {
  type: TransactionType;
  amount: number;
  date: string;
  categoryId: string | null;
  memo: string | null;
  affectsBudget: boolean;
}

export interface UpdateTransactionRequest {
  amount: number;
  date: string;
  categoryId: string | null;
  memo: string | null;
  affectsBudget: boolean;
}

// ── Accounts ──────────────────────────────────────────────────────────────────
export interface AccountResult {
  id: string;
  name: string;
  balance: number;
}

export interface AccountTransactionResult {
  id: string;
  accountId: string;
  categoryId: string | null;
  categoryName: string | null;
  amount: number;
  date: string;
  memo: string | null;
  affectsBudget: boolean;
  createdAt: string;
}

export interface AccountTransactionsParams {
  accountId: string;
  fromDate: string;
  toDate: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateAccountTransactionRequest {
  accountId: string;
  amount: number;
  date: string;
  categoryId?: string;
  categoryName?: string;
  categoryGroupId?: string;
  memo?: string;
  affectsBudget: boolean;
}
