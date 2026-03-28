import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import Banking from './Banking';
import * as useApiHooks from '@/hooks/use-api';

vi.mock('@/hooks/use-api');

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    keycloak: {
      tokenParsed: {
        preferred_username: 'testuser',
        email: 'test@example.com',
      },
    },
    logout: vi.fn(),
    authenticated: true,
    initialized: true,
  }),
}));

const mockConnections = [
  {
    connectionId: 'conn-1',
    provider: 'mock',
    connectionLabel: 'Primary Checking',
    accountLabel: 'Checking Account',
    accountId: 'acc-001',
    status: 'connected',
    lastSyncAt: '2026-03-20T09:15:00Z',
    lastSyncStatus: 'success',
    createdCount: 3,
    updatedCount: 1,
    duplicateCount: 0,
    accounts: [
      {
        accountId: 'acc-001',
        accountLabel: 'Checking Account',
        currency: 'EUR',
      },
    ],
  },
];

const mockStagingResponse = {
  content: [
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
  ],
  page: 0,
  size: 10,
  totalElements: 1,
  totalPages: 1,
};

describe('Banking page', () => {
  const mockConnectMutation = { mutateAsync: vi.fn(), isPending: false };
  const mockSyncMutation = { mutateAsync: vi.fn(), isPending: false };
  const mockUpdateMutation = { mutateAsync: vi.fn(), isPending: false };
  const mockImportMutation = { mutateAsync: vi.fn(), isPending: false };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useApiHooks.useBankConnections).mockReturnValue({
      data: mockConnections,
      isLoading: false,
    } as ReturnType<typeof useApiHooks.useBankConnections>);

    vi.mocked(useApiHooks.useCategories).mockReturnValue({
      data: ['food', 'transport', 'entertainment'],
      isLoading: false,
    } as ReturnType<typeof useApiHooks.useCategories>);

    vi.mocked(useApiHooks.useStagingTransactions).mockReturnValue({
      data: mockStagingResponse,
      isLoading: false,
    } as ReturnType<typeof useApiHooks.useStagingTransactions>);

    vi.mocked(useApiHooks.useConnectBankConnection).mockReturnValue(mockConnectMutation as ReturnType<typeof useApiHooks.useConnectBankConnection>);
    vi.mocked(useApiHooks.useSyncBankConnection).mockReturnValue(mockSyncMutation as ReturnType<typeof useApiHooks.useSyncBankConnection>);
    vi.mocked(useApiHooks.useUpdateStagingTransaction).mockReturnValue(mockUpdateMutation as ReturnType<typeof useApiHooks.useUpdateStagingTransaction>);
    vi.mocked(useApiHooks.useImportStagingTransactions).mockReturnValue(mockImportMutation as ReturnType<typeof useApiHooks.useImportStagingTransactions>);

    mockConnectMutation.mutateAsync.mockResolvedValue({
      connectionId: 'conn-new',
      provider: 'mock',
      authorizationUrl: 'https://mock-bank.example/oauth/authorize',
      state: 'state-1',
      expiresAt: '2026-03-27T12:00:00Z',
    });
    mockSyncMutation.mutateAsync.mockResolvedValue({
      connectionId: 'conn-1',
      provider: 'mock',
      connectionStatus: 'connected',
      createdCount: 1,
      updatedCount: 0,
      duplicateCount: 0,
      syncedAt: '2026-03-27T12:00:00Z',
    });
    mockUpdateMutation.mutateAsync.mockResolvedValue({
      id: 'stg-1',
      status: 'reviewed',
    });
    mockImportMutation.mutateAsync.mockResolvedValue({
      importedCount: 1,
      skippedCount: 0,
      importedPaymentIds: ['payment-stg-1'],
    });
  });

  it('renders connections and staging review data', () => {
    render(<Banking />);

    expect(screen.getByText('Primary Checking')).toBeInTheDocument();
    expect(screen.getByText('Staging review')).toBeInTheDocument();
    expect(screen.getByText('Monthly subscription')).toBeInTheDocument();
  });

  it('opens the connect sheet and creates a connection', async () => {
    const user = userEvent.setup();
    render(<Banking />);

    await user.click(screen.getByRole('button', { name: /connect bank/i }));
    await user.click(screen.getByRole('button', { name: /create connection/i }));

    await waitFor(() => {
      expect(mockConnectMutation.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'mock',
        }),
      );
    });

    expect(screen.getByText('Authorization link ready')).toBeInTheDocument();
  });

  it('syncs a bank connection from the connections card', async () => {
    const user = userEvent.setup();
    render(<Banking />);

    await user.click(screen.getByRole('button', { name: /sync now/i }));

    await waitFor(() => {
      expect(mockSyncMutation.mutateAsync).toHaveBeenCalledWith('conn-1');
    });
  });

  it('renders a fallback label when a connection status is missing', () => {
    vi.mocked(useApiHooks.useBankConnections).mockReturnValue({
      data: [
        {
          ...mockConnections[0],
          status: undefined,
        },
      ],
      isLoading: false,
    } as ReturnType<typeof useApiHooks.useBankConnections>);

    render(<Banking />);

    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(screen.getByText('Primary Checking')).toBeInTheDocument();
  });

  it('imports selected staging transactions', async () => {
    const user = userEvent.setup();
    render(<Banking />);

    await user.click(screen.getAllByLabelText('Select transaction stg-1')[0]);
    await user.click(screen.getByRole('button', { name: /import selected/i }));

    await waitFor(() => {
      expect(mockImportMutation.mutateAsync).toHaveBeenCalledWith({
        transactionIds: ['stg-1'],
        defaultCategoryId: undefined,
      });
    });
  });
});
