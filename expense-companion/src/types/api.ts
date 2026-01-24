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

export interface Wallet {
  id: string; // UUID
  name: string; // Unique name
}

export interface WalletCreate {
  name: string; // Just the name, backend generates ID
}

export interface Balance {
  totalInCents: number;
}

export interface ApiError {
  code: string;
  detail: string;
}

// Category from API - simple string array
export type CategoryItem = string;

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
