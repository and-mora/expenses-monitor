// Types based on OpenAPI specification for Expenses Monitor API

export interface Tag {
  key: string;
  value: string;
}

export interface Payment {
  id: string; // UUID
  merchantName: string;
  amountInCents: number; // Positive = income, Negative = expense
  category: string;
  accountingDate: string; // ISO date (YYYY-MM-DD)
  description?: string;
  wallet: string; // Wallet name (not ID!)
  tags?: Tag[];
}

export interface PaymentCreate {
  merchantName: string;
  amountInCents: number;
  category: string;
  accountingDate: string;
  description?: string;
  wallet: string; // Wallet name (not ID!)
  tags?: Tag[];
}

export interface PaymentUpdate {
  merchantName: string;
  amountInCents: number;
  category: string;
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
export type CategoryItem = string | { name: string; icon?: string | null };

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
