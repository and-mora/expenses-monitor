import type { 
  Payment, 
  PaymentCreate,
  PaymentUpdate, 
  Wallet, 
  WalletCreate, 
  Balance,
  CategoryItem 
} from '@/types/api';
import { getConfig } from './env';

// Get validated configuration
const config = getConfig();
const API_BASE_URL = config.api.baseUrl;
const USE_MOCK_DATA = config.api.useMockData;

// Mock data for development/demo
const mockCategories: CategoryItem[] = [
  'food',
  'transport',
  'shopping',
  'entertainment',
  'utilities',
  'health',
  'income',
  'other',
];

const mockWallets: Wallet[] = [
  { id: '1', name: 'Main Account' },
  { id: '2', name: 'Savings' },
  { id: '3', name: 'Cash' },
];

const mockPayments: Payment[] = [
  {
    id: '1',
    merchantName: 'Salary - Company Inc',
    amountInCents: 350000,
    category: 'income',
    accountingDate: '2025-01-15',
    description: 'Monthly salary',
    wallet: 'Main Account',
    tags: [
      { key: 'recurring', value: 'monthly' },
      { key: 'source', value: 'employer' },
    ],
  },
  {
    id: '2',
    merchantName: 'Supermarket',
    amountInCents: -8450,
    category: 'food',
    accountingDate: '2025-01-20',
    description: 'Weekly groceries',
    wallet: 'Main Account',
    tags: [
      { key: 'type', value: 'groceries' },
      { key: 'store', value: 'Carrefour' },
      { key: 'priority', value: 'essential' },
      { key: 'payment', value: 'card' },
    ],
  },
  {
    id: '3',
    merchantName: 'Netflix',
    amountInCents: -1299,
    category: 'entertainment',
    accountingDate: '2025-01-18',
    description: 'Monthly subscription',
    wallet: 'Main Account',
    tags: [
      { key: 'recurring', value: 'monthly' },
      { key: 'service', value: 'streaming' },
    ],
  },
  {
    id: '4',
    merchantName: 'Gas Station',
    amountInCents: -5500,
    category: 'transport',
    accountingDate: '2025-01-19',
    description: 'Fuel',
    wallet: 'Main Account',
    tags: [{ key: 'vehicle', value: 'car' }],
  },
  {
    id: '5',
    merchantName: 'Electric Company',
    amountInCents: -12000,
    category: 'utilities',
    accountingDate: '2025-01-10',
    description: 'January electricity bill',
    wallet: 'Main Account',
    tags: [
      { key: 'recurring', value: 'monthly' },
      { key: 'type', value: 'electricity' },
    ],
  },
  {
    id: '6',
    merchantName: 'Freelance Project',
    amountInCents: 75000,
    category: 'income',
    accountingDate: '2025-01-08',
    description: 'Web development project',
    wallet: 'Main Account',
    tags: [
      { key: 'client', value: 'Acme Corp' },
      { key: 'project', value: 'website-redesign' },
      { key: 'invoiced', value: 'yes' },
    ],
  },
  {
    id: '7',
    merchantName: 'Pharmacy',
    amountInCents: -2350,
    category: 'health',
    accountingDate: '2025-01-17',
    description: 'Vitamins and medicine',
    wallet: 'Cash',
  },
  {
    id: '8',
    merchantName: 'Electronics Store',
    amountInCents: -29999,
    category: 'shopping',
    accountingDate: '2025-01-12',
    description: 'New headphones',
    wallet: 'Main Account',
    tags: [
      { key: 'type', value: 'electronics' },
      { key: 'brand', value: 'Sony' },
    ],
  },
];

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private tokenProvider: (() => string | undefined) | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  setTokenProvider(provider: () => string | undefined) {
    this.tokenProvider = provider;
  }

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    // Use token provider first (from Keycloak), fallback to manually set token
    const token = this.tokenProvider?.() || this.token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    // Handle 204 No Content responses (e.g., DELETE operations)
    if (response.status === 204) {
      return undefined as T;
    }

    // Handle 200 OK with empty body (some DELETE operations return 200 instead of 204)
    const contentLength = response.headers.get('content-length');
    if (response.status === 200 && contentLength === '0') {
      return undefined as T;
    }

    return response.json();
  }

  // Health Check
  async healthCheck(): Promise<string> {
    if (USE_MOCK_DATA) return 'OK';
    const response = await fetch(`${this.baseUrl}/health_check`);
    return response.text();
  }

  // Balance
  async getBalance(): Promise<Balance> {
    if (USE_MOCK_DATA) {
      const total = mockPayments.reduce((sum, p) => sum + p.amountInCents, 0);
      return { totalInCents: total };
    }
    return this.fetch<Balance>('/api/balance');
  }

  // Categories
  async getCategories(type?: 'expense' | 'income'): Promise<CategoryItem[]> {
    if (USE_MOCK_DATA) {
      const categories = mockCategories;
      if (type === 'expense') return categories.filter(c => c !== 'income');
      if (type === 'income') return categories.filter(c => c === 'income');
      return categories;
    }
    const url = type 
      ? `/api/payments/categories?type=${type}`
      : '/api/payments/categories';
    return this.fetch<CategoryItem[]>(url);
  }

  // Payments
  async getRecentPayments(limit = 50): Promise<Payment[]> {
    if (USE_MOCK_DATA) {
      return [...mockPayments]
        .sort((a, b) => new Date(b.accountingDate).getTime() - new Date(a.accountingDate).getTime())
        .slice(0, limit);
    }
    const response = await this.fetch<{ content: Payment[], page: number, size: number }>(
      `/api/payments?page=0&size=${limit}`
    );
    return response.content;
  }

  async getPayments(page = 0, size = 50): Promise<{ content: Payment[], page: number, size: number }> {
    if (USE_MOCK_DATA) {
      const sorted = [...mockPayments]
        .sort((a, b) => new Date(b.accountingDate).getTime() - new Date(a.accountingDate).getTime());
      const start = page * size;
      const end = start + size;
      return {
        content: sorted.slice(start, end),
        page,
        size,
      };
    }
    return this.fetch<{ content: Payment[], page: number, size: number }>(
      `/api/payments?page=${page}&size=${size}`
    );
  }

  async createPayment(payment: PaymentCreate): Promise<Payment> {
    console.log('[API] Creating payment with data:', JSON.stringify(payment, null, 2));
    
    if (USE_MOCK_DATA) {
      const newPayment: Payment = {
        ...payment,
        id: String(Date.now()),
      };
      mockPayments.unshift(newPayment); // Add at beginning for recent ordering
      console.log('[API] Mock payment created:', newPayment);
      return newPayment;
    }
    return this.fetch<Payment>('/api/payments', {
      method: 'POST',
      body: JSON.stringify(payment),
    });
  }

  async deletePayment(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      const index = mockPayments.findIndex(p => p.id === id);
      if (index > -1) mockPayments.splice(index, 1);
      return;
    }
    await this.fetch(`/api/payments/${id}`, { method: 'DELETE' });
  }

  async updatePayment(id: string, payment: PaymentUpdate): Promise<Payment> {
    console.log('[API] Updating payment:', id, 'with data:', JSON.stringify(payment, null, 2));
    
    if (USE_MOCK_DATA) {
      const index = mockPayments.findIndex(p => p.id === id);
      if (index > -1) {
        mockPayments[index] = { ...payment, id };
      }
      console.log('[API] Mock payment updated:', mockPayments[index]);
      return mockPayments[index];
    }
    return this.fetch<Payment>(`/api/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payment),
    });
  }

  // Wallets
  async getWallets(): Promise<Wallet[]> {
    if (USE_MOCK_DATA) return mockWallets;
    return this.fetch<Wallet[]>('/api/wallets');
  }

  async createWallet(wallet: WalletCreate): Promise<Wallet> {
    if (USE_MOCK_DATA) {
      const newWallet: Wallet = {
        ...wallet,
        id: String(Date.now()),
      };
      mockWallets.push(newWallet);
      return newWallet;
    }
    return this.fetch<Wallet>('/api/wallets', {
      method: 'POST',
      body: JSON.stringify(wallet),
    });
  }

  async deleteWallet(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      const index = mockWallets.findIndex(w => w.id === id);
      if (index > -1) mockWallets.splice(index, 1);
      return;
    }
    await this.fetch(`/api/wallets/${id}`, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export { mockPayments, mockWallets, mockCategories };
