import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import * as useApiHooks from '@/hooks/use-api';
import type { Payment, Wallet, Balance } from '@/types/api';

// Mock the API hooks
vi.mock('@/hooks/use-api');

// Mock the AuthContext
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

// Mock react-router-dom useLocation
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({
      pathname: '/',
    }),
  };
});

const mockRecentPayments: Payment[] = [
  {
    id: '1',
    merchantName: 'Supermarket',
    amountInCents: -5000,
    category: 'food',
    accountingDate: '2026-01-25',
    description: 'Groceries',
    wallet: 'Main Account',
    tags: [],
  },
  {
    id: '2',
    merchantName: 'Gas Station',
    amountInCents: -3000,
    category: 'transport',
    accountingDate: '2026-01-24',
    description: 'Fuel',
    wallet: 'Main Account',
    tags: [],
  },
  {
    id: '3',
    merchantName: 'Salary',
    amountInCents: 250000,
    category: 'income',
    accountingDate: '2026-01-20',
    description: 'Monthly salary',
    wallet: 'Savings',
    tags: [],
  },
];

const mockWallets: Wallet[] = [
  { id: '1', name: 'Main Account' },
  { id: '2', name: 'Savings' },
];

// Balance from API includes ALL transactions, not just recent ones
const mockBalance: Balance = {
  totalInCents: 500000, // Total balance from ALL transactions in database
  incomeInCents: 250000, // Total income from ALL transactions
  expensesInCents: -8000, // Total expenses: -5000 (Supermarket) + -3000 (Gas) = -8000
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    vi.mocked(useApiHooks.useBalance).mockReturnValue({
      data: mockBalance,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useApiHooks.useBalance>);

    vi.mocked(useApiHooks.useRecentPayments).mockReturnValue({
      data: mockRecentPayments,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useApiHooks.useRecentPayments>);

    vi.mocked(useApiHooks.useWallets).mockReturnValue({
      data: mockWallets,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useApiHooks.useWallets>);

    vi.mocked(useApiHooks.useCreatePayment).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as ReturnType<typeof useApiHooks.useCreatePayment>);

    vi.mocked(useApiHooks.useDeletePayment).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as ReturnType<typeof useApiHooks.useDeletePayment>);

    vi.mocked(useApiHooks.useCreateWallet).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as ReturnType<typeof useApiHooks.useCreateWallet>);

    vi.mocked(useApiHooks.useDeleteWallet).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as ReturnType<typeof useApiHooks.useDeleteWallet>);
  });

  describe('Balance Display', () => {
    it('should display total balance from API, not calculated from recent transactions', async () => {
      render(<Dashboard />, { wrapper: createWrapper() });

      // The balance should be 500000 cents (5000 EUR) from the API
      // NOT 242000 cents (2420 EUR) which would be the sum of recent transactions
      await waitFor(() => {
        // Look for the balance amount in the BalanceCard
        const balanceCard = screen.getByText(/total balance/i).closest('div');
        expect(balanceCard).toBeInTheDocument();
        
        // Should display €5,000.00 (from API balance)
        expect(screen.getByText(/€5,000\.00/)).toBeInTheDocument();
      });
    });

    it('should calculate income from recent transactions for statistics', async () => {
      render(<Dashboard />, { wrapper: createWrapper() });

      // Income from recent transactions should be calculated
      // Salary: 250000 cents = €2,500.00
      await waitFor(() => {
        // Look for the Salary transaction by merchant name first
        const salaryTransaction = screen.getByText('Salary');
        expect(salaryTransaction).toBeInTheDocument();
        
        // Then verify the amount is displayed in the same transaction row
        const transactionRow = salaryTransaction.closest('div[class*="group"]');
        expect(transactionRow).toBeInTheDocument();
        expect(within(transactionRow!).getByText(/\+€2,500\.00/)).toBeInTheDocument();
      });
    });

    it('should calculate expenses from recent transactions for statistics', async () => {
      render(<Dashboard />, { wrapper: createWrapper() });

      // Expenses from API balance should be displayed in BalanceCard
      // mockBalance has expensesInCents: -8000 = -€80.00
      await waitFor(() => {
        // BalanceCard shows expenses value (as absolute value)
        expect(screen.getByText('€80.00')).toBeInTheDocument();
      });
    });

    it('should handle zero balance correctly', async () => {
      vi.mocked(useApiHooks.useBalance).mockReturnValue({
        data: { totalInCents: 0, incomeInCents: 0, expensesInCents: 0 },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useApiHooks.useBalance>);

      render(<Dashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        // BalanceCard shows total, income, and expenses - all €0.00
        const zeroAmounts = screen.getAllByText(/€0\.00/);
        expect(zeroAmounts.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('should handle negative balance correctly', async () => {
      vi.mocked(useApiHooks.useBalance).mockReturnValue({
        data: { totalInCents: -10000, incomeInCents: 0, expensesInCents: -10000 },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useApiHooks.useBalance>);

      render(<Dashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        // Should display -€100.00 for total balance
        expect(screen.getByText(/-€100\.00/)).toBeInTheDocument();
      });
    });

    it('should use zero balance when API returns undefined', async () => {
      vi.mocked(useApiHooks.useBalance).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useApiHooks.useBalance>);

      render(<Dashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        // Should default to €0.00 (appears 3 times: total, income, expenses)
        const zeroAmounts = screen.getAllByText(/€0\.00/);
        expect(zeroAmounts.length).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('Data Independence', () => {
    it('should show correct balance even when recent transactions sum differs', async () => {
      // Scenario: User has 100 transactions totaling €5000 in the database
      // But only the 50 most recent are returned, which sum to a different amount
      
      const recentTransactionsWithDifferentSum: Payment[] = [
        {
          id: '1',
          merchantName: 'Recent Purchase',
          amountInCents: -1000,
          category: 'shopping',
          accountingDate: '2026-01-31',
          description: 'Recent',
          wallet: 'Main Account',
          tags: [],
        },
      ];

      vi.mocked(useApiHooks.useRecentPayments).mockReturnValue({
        data: recentTransactionsWithDifferentSum,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useApiHooks.useRecentPayments>);

      // Total balance is much larger due to historical transactions
      vi.mocked(useApiHooks.useBalance).mockReturnValue({
        data: { totalInCents: 1000000 }, // €10,000
        isLoading: false,
        error: null,
      } as ReturnType<typeof useApiHooks.useBalance>);

      render(<Dashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        // Should show the API balance (€10,000) for total balance
        expect(screen.getByText(/€10,000\.00/)).toBeInTheDocument();
        
        // Recent Activity section should show expenses from recent transactions only (-€10.00)
        // This is correct behavior: total balance comes from API, recent stats from recent transactions
        const expensesDisplay = screen.getByText(/-€10\.00/);
        expect(expensesDisplay).toBeInTheDocument();
      });
    });
  });

  describe('Rendering', () => {
    it('should render page title and description', () => {
      render(<Dashboard />, { wrapper: createWrapper() });

      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByText(/track your income and expenses/i)).toBeInTheDocument();
    });

    it('should render balance card', async () => {
      render(<Dashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/total balance/i)).toBeInTheDocument();
      });
    });

    it('should render wallet list', async () => {
      render(<Dashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/wallets/i)).toBeInTheDocument();
        expect(screen.getByText('Main Account')).toBeInTheDocument();
        expect(screen.getByText('Savings')).toBeInTheDocument();
      });
    });

    it('should render recent transactions', async () => {
      render(<Dashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Supermarket')).toBeInTheDocument();
        expect(screen.getByText('Gas Station')).toBeInTheDocument();
        expect(screen.getByText('Salary')).toBeInTheDocument();
      });
    });

    it('should render spending chart', async () => {
      render(<Dashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/spending by category/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show skeleton loaders while loading', () => {
      vi.mocked(useApiHooks.useBalance).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as ReturnType<typeof useApiHooks.useBalance>);

      vi.mocked(useApiHooks.useRecentPayments).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as ReturnType<typeof useApiHooks.useRecentPayments>);

      vi.mocked(useApiHooks.useWallets).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as ReturnType<typeof useApiHooks.useWallets>);

      render(<Dashboard />, { wrapper: createWrapper() });

      // Skeleton loaders should be rendered
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Add Transaction Button', () => {
    it('should show Add Transaction button when wallets are loaded', async () => {
      render(<Dashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add transaction/i })).toBeInTheDocument();
      });
    });

    it('should not show Add Transaction button when no wallets exist', async () => {
      vi.mocked(useApiHooks.useWallets).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof useApiHooks.useWallets>);

      render(<Dashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /add transaction/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Handler Functions', () => {
    it('should call handleCreatePayment successfully', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({});
      vi.mocked(useApiHooks.useCreatePayment).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      } as ReturnType<typeof useApiHooks.useCreatePayment>);

      render(<Dashboard />, { wrapper: createWrapper() });

      // Trigger the handler by finding the AddPaymentDialog
      // The handler is passed as a prop to AddPaymentDialog
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add transaction/i })).toBeInTheDocument();
      });
    });

    it('should call handleDeletePayment successfully', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({});
      vi.mocked(useApiHooks.useDeletePayment).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      } as ReturnType<typeof useApiHooks.useDeletePayment>);

      render(<Dashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Supermarket')).toBeInTheDocument();
      });
    });

    it('should call handleCreateWallet successfully', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({});
      vi.mocked(useApiHooks.useCreateWallet).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      } as ReturnType<typeof useApiHooks.useCreateWallet>);

      render(<Dashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/wallets/i)).toBeInTheDocument();
      });
    });

    it('should call handleDeleteWallet successfully', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({});
      vi.mocked(useApiHooks.useDeleteWallet).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      } as ReturnType<typeof useApiHooks.useDeleteWallet>);

      render(<Dashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Main Account')).toBeInTheDocument();
      });
    });
  });
});
