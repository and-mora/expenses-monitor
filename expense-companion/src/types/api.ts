// Types based on OpenAPI specification for Expenses Monitor API

export interface Tag {
  key: string;
  value: string;
}

export interface Payment {
  id: string; // UUID
  merchantName: string;
  amountInCents: number; // Positive = income, Negative = expense
  categoryId: string;
  category: string; // human-friendly name for display
  categoryIcon?: string | null;
  accountingDate: string; // ISO date (YYYY-MM-DD)
  description?: string;
  wallet: string; // Wallet name (not ID!)
  tags?: Tag[];
}

export interface PaymentCreate {
  merchantName: string;
  amountInCents: number;
  categoryId: string;
  accountingDate: string;
  description?: string;
  wallet: string; // Wallet name (not ID!)
  tags?: Tag[];
}

export interface PaymentUpdate {
  merchantName: string;
  amountInCents: number;
  categoryId: string;
  accountingDate: string;
  description?: string;
  wallet: string; // Wallet name (not ID!)
  tags?: Tag[];
}

export interface Wallet {
  id: string; // UUID
  name: string; // Unique name
}

export interface WalletCreate {
  name: string; // Just the name, backend generates ID
}

export interface Balance {
  totalInCents: number;
  incomeInCents: number;
  expensesInCents: number;
}

export interface ApiError {
  code: string;
  detail: string;
}

// Category from API - simple string array
// Category from API can be a simple string (legacy) or an object with optional icon
export type CategoryItem =
  | string
  | { id: string; name: string; icon?: string | null };

// Category type based on common expense categories
export type Category = 
  | 'food'
  | 'transport'
  | 'shopping'
  | 'entertainment'
  | 'utilities'
  | 'health'
  | 'income'
  | 'other';

// Helper types for UI
export interface PaymentWithWallet extends Payment {
  walletName?: string;
}

export interface PaymentWithIcon extends Payment {
  categoryIcon?: string | null;
}

export interface PaymentCreateWithIcon extends PaymentCreate {
  categoryIcon?: string | null;
}

export interface PaymentUpdateWithIcon extends PaymentUpdate {
  categoryIcon?: string | null;
}

export interface CategorySummary {
  category: string;
  totalInCents: number;
  count: number;
  percentage: number;
}

export interface MonthlyStats {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements?: number;
  totalPages?: number;
}

export interface BankingConnectRequest {
  provider: string;
  accountId?: string;
  connectionLabel?: string;
  redirectUri?: string;
}

export interface BankingConnectResponse {
  connectionId: string;
  provider: string;
  authorizationUrl: string;
  state: string;
  expiresAt: string;
}

export interface BankingAccountSummary {
  accountId: string;
  accountLabel: string;
  iban?: string | null;
  currency: string;
  balanceInCents?: number | null;
}

export type BankingConnectionStatus = 'pending' | 'connected' | 'syncing' | 'error' | 'disconnected';
export type BankingSyncStatus = 'pending' | 'running' | 'success' | 'failed';

export interface BankingConnectionSummary {
  connectionId: string;
  provider: string;
  connectionLabel?: string | null;
  accountId?: string | null;
  accountLabel?: string | null;
  status?: BankingConnectionStatus | null;
  lastSyncAt?: string | null;
  lastSyncStatus?: BankingSyncStatus | null;
  lastSyncMessage?: string | null;
  createdCount?: number | null;
  updatedCount?: number | null;
  duplicateCount?: number | null;
  syncedAt?: string | null;
  accounts?: BankingAccountSummary[];
}

export interface BankingSyncResponse {
  connectionId: string;
  provider: string;
  connectionStatus: BankingConnectionStatus;
  createdCount: number;
  updatedCount: number;
  duplicateCount: number;
  syncedAt: string;
}

export interface BankingSyncStatusResponse {
  connectionId: string;
  provider: string;
  connectionStatus: BankingConnectionStatus;
  lastSyncAt?: string | null;
  lastSyncStatus?: BankingSyncStatus | null;
  createdCount?: number | null;
  updatedCount?: number | null;
  duplicateCount?: number | null;
  lastError?: string | null;
}

export type StagingTransactionStatus = 'pending' | 'reviewed' | 'imported' | 'rejected';

export interface StagingTransaction {
  id: string;
  connectionId: string;
  provider: string;
  bankTransactionId: string;
  amountInCents: number;
  currency: string;
  bookingDate: string;
  valueDate?: string | null;
  creditorName?: string | null;
  debtorName?: string | null;
  remittanceInfo?: string | null;
  suggestedCategory?: string | null;
  suggestedMerchant?: string | null;
  status: StagingTransactionStatus;
  importedPaymentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StagingTransactionUpdate {
  suggestedCategory?: string;
  suggestedMerchant?: string;
  status?: StagingTransactionStatus;
}

export interface StagingTransactionFilters {
  page?: number;
  size?: number;
  status?: StagingTransactionStatus | 'all';
  dateFrom?: string;
  dateTo?: string;
  connectionId?: string;
}

export interface StagingImportRequest {
  transactionIds?: string[];
  defaultCategoryId?: string;
}

export interface StagingImportResponse {
  importedCount: number;
  skippedCount: number;
  importedPaymentIds: string[];
}
