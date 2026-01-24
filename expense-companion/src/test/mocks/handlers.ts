import { http, HttpResponse } from 'msw';
import type { Payment, Wallet, Balance, CategoryItem } from '@/types/api';

const API_BASE_URL = 'http://localhost:8080';

// Mock data
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
  },
  {
    id: '2',
    merchantName: 'Supermarket',
    amountInCents: -8450,
    category: 'food',
    accountingDate: '2025-01-20',
    description: 'Weekly groceries',
    wallet: 'Main Account',
  },
  {
    id: '3',
    merchantName: 'Netflix',
    amountInCents: -1299,
    category: 'entertainment',
    accountingDate: '2025-01-18',
    description: 'Monthly subscription',
    wallet: 'Main Account',
  },
];

const mockBalance: Balance = {
  totalInCents: 340251,
};

// Request handlers
export const handlers = [
  // Health check
  http.get(`${API_BASE_URL}/health_check`, () => {
    return new HttpResponse('OK', { status: 200 });
  }),

  // Balance
  http.get(`${API_BASE_URL}/api/balance`, () => {
    return HttpResponse.json(mockBalance);
  }),

  // Categories
  http.get(`${API_BASE_URL}/api/payments/categories`, ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    
    let filteredCategories = mockCategories;
    if (type === 'expense') {
      filteredCategories = mockCategories.filter(c => c !== 'income');
    } else if (type === 'income') {
      filteredCategories = mockCategories.filter(c => c === 'income');
    }
    
    return HttpResponse.json(filteredCategories);
  }),

  // Get payments (paginated)
  http.get(`${API_BASE_URL}/api/payments`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0');
    const size = parseInt(url.searchParams.get('size') || '50');

    const start = page * size;
    const end = start + size;
    const content = mockPayments.slice(start, end);

    return HttpResponse.json({
      content,
      page,
      size,
      totalElements: mockPayments.length,
      totalPages: Math.ceil(mockPayments.length / size),
    });
  }),

  // Create payment
  http.post(`${API_BASE_URL}/api/payments`, async ({ request }) => {
    const body = await request.json() as Payment;
    const newPayment: Payment = {
      ...body,
      id: String(Date.now()),
    };
    mockPayments.push(newPayment);
    return HttpResponse.json(newPayment, { status: 201 });
  }),

  // Delete payment
  http.delete(`${API_BASE_URL}/api/payments/:id`, ({ params }) => {
    const { id } = params;
    const index = mockPayments.findIndex(p => p.id === id);
    if (index === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    mockPayments.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // Get wallets
  http.get(`${API_BASE_URL}/api/wallets`, () => {
    return HttpResponse.json(mockWallets);
  }),

  // Create wallet
  http.post(`${API_BASE_URL}/api/wallets`, async ({ request }) => {
    const body = await request.json() as Wallet;
    const newWallet: Wallet = {
      ...body,
      id: String(Date.now()),
    };
    mockWallets.push(newWallet);
    return HttpResponse.json(newWallet, { status: 201 });
  }),

  // Delete wallet
  http.delete(`${API_BASE_URL}/api/wallets/:id`, ({ params }) => {
    const { id } = params;
    const index = mockWallets.findIndex(w => w.id === id);
    if (index === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    mockWallets.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
