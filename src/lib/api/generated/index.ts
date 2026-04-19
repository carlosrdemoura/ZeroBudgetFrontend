/** Generate by swagger-axios-codegen */
// @ts-nocheck
/* eslint-disable */

/** Generate by swagger-axios-codegen */
// @ts-nocheck
/* eslint-disable */
import axiosStatic from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface IRequestOptions extends AxiosRequestConfig {
  /**
   * show loading status
   */
  loading?: boolean;
  /**
   * display error message
   */
  showError?: boolean;
  /**
   * indicates whether Authorization credentials are required for the request
   * @default true
   */
  withAuthorization?: boolean;
}

export interface IRequestPromise<T = any> extends Promise<IRequestResponse<T>> {}

export interface IRequestResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: any;
  request?: any;
}

export interface IRequestInstance {
  (config: any): IRequestPromise;
  (url: string, config?: any): IRequestPromise;
  request<T = any>(config: any): IRequestPromise<T>;
}

export interface IRequestConfig {
  method?: any;
  headers?: any;
  url?: any;
  data?: any;
  params?: any;
}

// Add options interface
export interface ServiceOptions {
  axios?: IRequestInstance;
  /** only in axios interceptor config*/
  loading: boolean;
  showError: boolean;
}

// Add default options
export const serviceOptions: ServiceOptions = {};

// Instance selector
export function axios(configs: IRequestConfig, resolve: (p: any) => void, reject: (p: any) => void): Promise<any> {
  if (serviceOptions.axios) {
    return serviceOptions.axios
      .request(configs)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  } else {
    throw new Error('please inject yourself instance like axios  ');
  }
}

export function getConfigs(method: string, contentType: string, url: string, options: any): IRequestConfig {
  const configs: IRequestConfig = {
    loading: serviceOptions.loading,
    showError: serviceOptions.showError,
    ...options,
    method,
    url
  };
  configs.headers = {
    ...options.headers,
    'Content-Type': contentType
  };
  return configs;
}

export const basePath = '';

export interface IList<T> extends Array<T> {}
export interface List<T> extends Array<T> {}
export interface IDictionary<TValue> {
  [key: string]: TValue;
}
export interface Dictionary<TValue> extends IDictionary<TValue> {}

export interface IListResult<T> {
  items?: T[];
}

export class ListResultDto<T> implements IListResult<T> {
  items?: T[];
}

export interface IPagedResult<T> extends IListResult<T> {
  totalCount?: number;
  items?: T[];
}

export class PagedResultDto<T = any> implements IPagedResult<T> {
  totalCount?: number;
  items?: T[];
}

// customer definition
// empty

/** AccountDTO */
export interface AccountDTO {
  /**  */
  id?: string;

  /**  */
  name?: string;

  /**  */
  balance?: number;
}

/** AssignAmountRequest */
export interface AssignAmountRequest {
  /**  */
  categoryId?: string;

  /**  */
  amount?: number;
}

/** CategoryBalanceDTO */
export interface CategoryBalanceDTO {
  /**  */
  categoryId?: string;

  /**  */
  categoryName?: string;

  /**  */
  groupId?: string;

  /**  */
  groupName?: string;

  /**  */
  previousBalance?: number;

  /**  */
  assigned?: number;

  /**  */
  activity?: number;

  /**  */
  balance?: number;
}

/** CategoryDTO */
export interface CategoryDTO {
  /**  */
  id?: string;

  /**  */
  groupId?: string;

  /**  */
  name?: string;

  /**  */
  sortOrder?: number;
}

/** CategoryGroupDTO */
export interface CategoryGroupDTO {
  /**  */
  id?: string;

  /**  */
  name?: string;

  /**  */
  sortOrder?: number;

  /**  */
  categories?: CategoryDTO[];
}

/** CategorySortItemRequest */
export interface CategorySortItemRequest {
  /**  */
  categoryId?: string;

  /**  */
  sortOrder?: number;
}

/** CreateAccountCommandOutput */
export interface CreateAccountCommandOutput {
  /**  */
  account?: AccountDTO;
}

/** CreateAccountRequest */
export interface CreateAccountRequest {
  /**  */
  name?: string;

  /**  */
  initialBalance?: number;
}

/** CreateCategoryCommandOutput */
export interface CreateCategoryCommandOutput {
  /**  */
  category?: CategoryDTO;
}

/** CreateCategoryGroupCommandOutput */
export interface CreateCategoryGroupCommandOutput {
  /**  */
  categoryGroup?: CategoryGroupDTO;
}

/** CreateCategoryGroupRequest */
export interface CreateCategoryGroupRequest {
  /**  */
  name?: string;
}

/** CreateCategoryRequest */
export interface CreateCategoryRequest {
  /**  */
  name?: string;
}

/** CreateTransactionCommandOutput */
export interface CreateTransactionCommandOutput {
  /**  */
  transaction?: TransactionDTO;
}

/** CreateTransactionRequest */
export interface CreateTransactionRequest {
  /**  */
  accountId?: string;

  /**  */
  amount?: number;

  /**  */
  date?: Date;

  /**  */
  categoryId?: string;

  /**  */
  categoryName?: string;

  /**  */
  categoryGroupId?: string;

  /**  */
  memo?: string;

  /**  */
  affectsBudget?: boolean;
}

/** DeleteCategoryGroupRequest */
export interface DeleteCategoryGroupRequest {
  /**  */
  targetCategoryId?: string;
}

/** DeleteCategoryRequest */
export interface DeleteCategoryRequest {
  /**  */
  targetCategoryId?: string;
}

/** GetAccountsQueryOutput */
export interface GetAccountsQueryOutput {
  /**  */
  accounts?: AccountDTO[];
}

/** GetAccountsSummaryQueryOutput */
export interface GetAccountsSummaryQueryOutput {
  /**  */
  totalBalance?: number;

  /**  */
  totalAssigned?: number;

  /**  */
  readyToAssign?: number;
}

/** GetCategoryBalancesQueryOutput */
export interface GetCategoryBalancesQueryOutput {
  /**  */
  balances?: CategoryBalanceDTO[];
}

/** GetCategoryGroupsQueryOutput */
export interface GetCategoryGroupsQueryOutput {
  /**  */
  categoryGroups?: CategoryGroupDTO[];
}

/** GetMonthSummaryQueryOutput */
export interface GetMonthSummaryQueryOutput {
  /**  */
  summary?: MonthSummaryDTO;
}

/** GetTransactionsQueryOutput */
export interface GetTransactionsQueryOutput {
  /**  */
  transactions?: TransactionDTOPagedResult;
}

/** GroupSortItemRequest */
export interface GroupSortItemRequest {
  /**  */
  groupId?: string;

  /**  */
  sortOrder?: number;
}

/** LoginCommandInput */
export interface LoginCommandInput {
  /**  */
  email?: string;

  /**  */
  password?: string;
}

/** LoginCommandOutput */
export interface LoginCommandOutput {
  /**  */
  token?: string;

  /**  */
  expiresAt?: Date;

  /**  */
  email?: string;
}

/** MonthSummaryDTO */
export interface MonthSummaryDTO {
  /**  */
  month?: string;

  /**  */
  totalIncome?: number;

  /**  */
  totalAssigned?: number;

  /**  */
  availableToAssign?: number;

  /**  */
  rollover?: number;
}

/** MoveCategoryRequest */
export interface MoveCategoryRequest {
  /**  */
  targetGroupId?: string;
}

/** MoveMoneyRequest */
export interface MoveMoneyRequest {
  /**  */
  fromCategoryId?: string;

  /**  */
  toCategoryId?: string;

  /**  */
  amount?: number;
}

/** ProblemDetails */
export interface ProblemDetails {
  /**  */
  type?: string;

  /**  */
  title?: string;

  /**  */
  status?: number;

  /**  */
  detail?: string;

  /**  */
  instance?: string;
}

/** TransactionDTO */
export interface TransactionDTO {
  /**  */
  id?: string;

  /**  */
  accountId?: string;

  /**  */
  categoryId?: string;

  /**  */
  categoryName?: string;

  /**  */
  amount?: number;

  /**  */
  date?: Date;

  /**  */
  memo?: string;

  /**  */
  affectsBudget?: boolean;

  /**  */
  createdAt?: Date;
}

/** TransactionDTOPagedResult */
export interface TransactionDTOPagedResult {
  /**  */
  items?: TransactionDTO[];

  /**  */
  totalCount?: number;

  /**  */
  page?: number;

  /**  */
  pageSize?: number;

  /**  */
  totalPages?: number;

  /**  */
  hasNextPage?: boolean;

  /**  */
  hasPreviousPage?: boolean;
}

/** UpdateAccountCommandOutput */
export interface UpdateAccountCommandOutput {
  /**  */
  account?: AccountDTO;
}

/** UpdateAccountRequest */
export interface UpdateAccountRequest {
  /**  */
  name?: string;

  /**  */
  currentBalance?: number;
}

/** UpdateCategoryGroupRequest */
export interface UpdateCategoryGroupRequest {
  /**  */
  name?: string;
}

/** UpdateCategoryRequest */
export interface UpdateCategoryRequest {
  /**  */
  name?: string;
}

/** UpdateTransactionCommandOutput */
export interface UpdateTransactionCommandOutput {
  /**  */
  transaction?: TransactionDTO;
}

/** UpdateTransactionRequest */
export interface UpdateTransactionRequest {
  /**  */
  amount?: number;

  /**  */
  date?: Date;

  /**  */
  categoryId?: string;

  /**  */
  memo?: string;

  /**  */
  affectsBudget?: boolean;
}
export type ProblemDetailsWithAdditionalProperties = ProblemDetails & { [additionalProperties: string]: any | null };
