import { http, HttpResponse } from 'msw';
import type {
  Payment,
  Wallet,
  Balance,
  CategoryItem,
  BankingConnectionSummary,
  BankingConnectResponse,
  StagingTransaction,
} from '@/types/api';

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

const mockBankConnections: BankingConnectionSummary[] = [
  {
    connectionId: 'conn-1',
    provider: 'mock',
    connectionLabel: 'Primary Checking',
    accountId: 'acc-001',
    accountLabel: 'Checking Account',
    status: 'connected',
    lastSyncAt: '2026-03-20T09:15:00Z',
    lastSyncStatus: 'success',
    lastSyncMessage: 'Synced successfully',
    createdCount: 3,
    updatedCount: 1,
    duplicateCount: 0,
    syncedAt: '2026-03-20T09:15:00Z',
  },
  {
    connectionId: 'conn-2',
    provider: 'mock',
    connectionLabel: 'Shared Savings',
    accountId: 'acc-002',
    accountLabel: 'Savings Account',
    status: 'syncing',
    lastSyncAt: '2026-03-26T13:30:00Z',
    lastSyncStatus: 'running',
    lastSyncMessage: 'Synchronizing transaction history',
    createdCount: 0,
    updatedCount: 0,
    duplicateCount: 0,
    syncedAt: '2026-03-26T13:30:00Z',
  },
];

const mockStagingTransactions: StagingTransaction[] = [
  {
    id: 'stg-1',
    connectionId: 'conn-1',
    provider: 'mock',
    bankTransactionId: 'bank-tx-1001',
    amountInCents: -1299,
    currency: 'EUR',
    bookingDate: '2026-03-25',
    valueDate: '2026-03-25',
    creditorName: 'Streaming Service',
    debtorName: 'Test User',
    remittanceInfo: 'Monthly subscription',
    suggestedCategory: 'entertainment',
    suggestedMerchant: 'Streaming Service',
    status: 'pending',
    createdAt: '2026-03-25T10:00:00Z',
    updatedAt: '2026-03-25T10:00:00Z',
  },
  {
    id: 'stg-2',
    connectionId: 'conn-1',
    provider: 'mock',
    bankTransactionId: 'bank-tx-1002',
    amountInCents: -8450,
    currency: 'EUR',
    bookingDate: '2026-03-24',
    valueDate: '2026-03-24',
    creditorName: 'Supermarket',
    debtorName: 'Test User',
    remittanceInfo: 'Weekly groceries',
    suggestedCategory: 'food',
    suggestedMerchant: 'Supermarket',
    status: 'reviewed',
    createdAt: '2026-03-24T09:00:00Z',
    updatedAt: '2026-03-24T12:00:00Z',
  },
  {
    id: 'stg-3',
    connectionId: 'conn-2',
    provider: 'mock',
    bankTransactionId: 'bank-tx-2001',
    amountInCents: 250000,
    currency: 'EUR',
    bookingDate: '2026-03-21',
    valueDate: '2026-03-21',
    creditorName: 'Acme Corp',
    debtorName: 'Test User',
    remittanceInfo: 'Salary',
    suggestedCategory: 'income',
    suggestedMerchant: 'Acme Corp',
    status: 'pending',
    createdAt: '2026-03-21T08:00:00Z',
    updatedAt: '2026-03-21T08:00:00Z',
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

  // Get single payment
  http.get(`${API_BASE_URL}/api/payments/:id`, ({ params }) => {
    const { id } = params;
    
    // Look for the payment in mock payments
    const payment = mockPayments.find(p => p.id === id);
    
    if (payment) {
      return HttpResponse.json(payment);
    }
    
    // If testing and using a special ID, return a mock object
    if (id === 'abc-123') {
      return HttpResponse.json({
        id: 'abc-123',
        merchantName: 'Test Payment',
        amountInCents: -1000,
        category: 'food',
        accountingDate: '2026-01-31',
        description: 'Test description',
        wallet: 'Main Account',
        tags: []
      });
    }

    return new HttpResponse(null, { status: 404 });
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

  // Update payment
  http.put(`${API_BASE_URL}/api/payments/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = await request.json() as Partial<Payment>;
    const index = mockPayments.findIndex(p => p.id === id);
    if (index === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    const updatedPayment = { ...mockPayments[index], ...body, id: id as string };
    mockPayments[index] = updatedPayment;
    return HttpResponse.json(updatedPayment, { status: 200 });
  }),

  // Banking connections
  http.post(`${API_BASE_URL}/banking/connect`, async ({ request }) => {
    const body = await request.json() as { provider: string; accountId?: string; connectionLabel?: string; redirectUri?: string };
    const connectionId = `conn-${Date.now()}`;
    mockBankConnections.unshift({
      connectionId,
      provider: body.provider,
      connectionLabel: body.connectionLabel || 'New bank connection',
      accountId: body.accountId || null,
      accountLabel: body.connectionLabel || body.accountId || 'Pending account',
      status: 'pending',
      lastSyncStatus: 'pending',
      lastSyncAt: null,
      lastSyncMessage: 'Waiting for authorization',
      createdCount: 0,
      updatedCount: 0,
      duplicateCount: 0,
      syncedAt: null,
    });

    const response: BankingConnectResponse = {
      connectionId,
      provider: body.provider,
      authorizationUrl: body.redirectUri || 'https://mock-bank.example/oauth/authorize',
      state: 'mock-state',
      expiresAt: '2026-04-01T00:00:00Z',
    };
    return HttpResponse.json(response, { status: 200 });
  }),

  http.get(`${API_BASE_URL}/banking/accounts`, () => HttpResponse.json(mockBankConnections)),

  http.post(`${API_BASE_URL}/banking/sync/:connectionId`, ({ params }) => {
    const connectionId = String(params.connectionId);
    const connection = mockBankConnections.find((item) => item.connectionId === connectionId);
    if (!connection) {
      return new HttpResponse(null, { status: 404 });
    }

    connection.status = 'connected';
    connection.lastSyncAt = '2026-03-27T12:00:00Z';
    connection.lastSyncStatus = 'success';
    connection.lastSyncMessage = 'Synced successfully';
    connection.createdCount = 1;
    connection.updatedCount = 0;
    connection.duplicateCount = 0;
    connection.syncedAt = '2026-03-27T12:00:00Z';

    return HttpResponse.json({
      connectionId,
      provider: connection.provider,
      connectionStatus: connection.status,
      createdCount: 1,
      updatedCount: 0,
      duplicateCount: 0,
      syncedAt: '2026-03-27T12:00:00Z',
    });
  }),

  http.get(`${API_BASE_URL}/banking/sync/:connectionId/status`, ({ params }) => {
    const connectionId = String(params.connectionId);
    const connection = mockBankConnections.find((item) => item.connectionId === connectionId);
    if (!connection) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json({
      connectionId,
      provider: connection.provider,
      connectionStatus: connection.status,
      lastSyncAt: connection.lastSyncAt,
      lastSyncStatus: connection.lastSyncStatus,
      createdCount: connection.createdCount,
      updatedCount: connection.updatedCount,
      duplicateCount: connection.duplicateCount,
      lastError: connection.lastSyncStatus === 'failed' ? connection.lastSyncMessage : null,
    });
  }),

  http.get(`${API_BASE_URL}/staging/transactions`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '20', 10);
    const status = url.searchParams.get('status');
    const connectionId = url.searchParams.get('connectionId');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');

    let filtered = [...mockStagingTransactions];
    if (status && status !== 'all') {
      filtered = filtered.filter((transaction) => transaction.status === status);
    }
    if (connectionId) {
      filtered = filtered.filter((transaction) => transaction.connectionId === connectionId);
    }
    if (dateFrom) {
      filtered = filtered.filter((transaction) => transaction.bookingDate >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((transaction) => transaction.bookingDate <= dateTo);
    }

    filtered.sort((left, right) => right.bookingDate.localeCompare(left.bookingDate));

    const start = page * size;
    const end = start + size;

    return HttpResponse.json({
      content: filtered.slice(start, end),
      page,
      size,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / size),
    });
  }),

  http.put(`${API_BASE_URL}/staging/transactions/:id`, async ({ params, request }) => {
    const id = String(params.id);
    const body = await request.json() as Partial<StagingTransaction>;
    const index = mockStagingTransactions.findIndex((transaction) => transaction.id === id);
    if (index === -1) {
      return new HttpResponse(null, { status: 404 });
    }

    const updated = {
      ...mockStagingTransactions[index],
      ...body,
      updatedAt: '2026-03-27T12:15:00Z',
    };
    mockStagingTransactions[index] = updated;
    return HttpResponse.json(updated);
  }),

  http.post(`${API_BASE_URL}/staging/import`, async ({ request }) => {
    const body = await request.json() as { transactionIds?: string[]; defaultCategoryId?: string };
    const transactionIds = body.transactionIds?.length ? body.transactionIds : mockStagingTransactions.filter((transaction) => transaction.status === 'pending').map((transaction) => transaction.id);
    const importedPaymentIds: string[] = [];

    for (const transactionId of transactionIds) {
      const transaction = mockStagingTransactions.find((item) => item.id === transactionId);
      if (!transaction || transaction.status === 'imported') {
        continue;
      }
      transaction.status = 'imported';
      transaction.importedPaymentId = `payment-${transaction.id}`;
      transaction.updatedAt = '2026-03-27T12:30:00Z';
      importedPaymentIds.push(transaction.importedPaymentId);
    }

    return HttpResponse.json({
      importedCount: importedPaymentIds.length,
      skippedCount: Math.max(0, transactionIds.length - importedPaymentIds.length),
      importedPaymentIds,
    });
  }),
];
