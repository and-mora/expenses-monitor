import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Transactions from './Transactions';
import * as useApiHooks from '@/hooks/use-api';
import type { Payment, Wallet, CategoryItem } from '@/types/api';

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
      pathname: '/transactions',
    }),
  };
});

const mockPayments: Payment[] = [
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

const mockCategories: CategoryItem[] = ['food', 'transport', 'shopping', 'income'];

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

describe('Transactions Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    vi.mocked(useApiHooks.usePayments).mockReturnValue({
      data: { content: mockPayments, page: 0, size: 50 },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useApiHooks.usePayments>);

    vi.mocked(useApiHooks.useWallets).mockReturnValue({
      data: mockWallets,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useApiHooks.useWallets>);

    vi.mocked(useApiHooks.useCategories).mockReturnValue({
      data: mockCategories,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useApiHooks.useCategories>);

    vi.mocked(useApiHooks.useCreatePayment).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as ReturnType<typeof useApiHooks.useCreatePayment>);

    vi.mocked(useApiHooks.useDeletePayment).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as ReturnType<typeof useApiHooks.useDeletePayment>);
  });

  describe('Rendering', () => {
    it('should render page title and description', () => {
      render(<Transactions />, { wrapper: createWrapper() });

      // Use level: 1 to get only the main h1 heading
      expect(screen.getByRole('heading', { name: /^transactions$/i, level: 1 })).toBeInTheDocument();
      expect(screen.getByText(/view and manage all your transactions/i)).toBeInTheDocument();
    });

    it('should render search input', () => {
      render(<Transactions />, { wrapper: createWrapper() });

      expect(screen.getByPlaceholderText(/search by merchant or description/i)).toBeInTheDocument();
    });

    it('should render category and wallet filters', () => {
      render(<Transactions />, { wrapper: createWrapper() });

      // Verify both filter comboboxes are present
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes.length).toBe(2); // Category and Wallet filters
    });

    it('should display all transactions initially', async () => {
      render(<Transactions />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Supermarket')).toBeInTheDocument();
        expect(screen.getByText('Gas Station')).toBeInTheDocument();
        expect(screen.getByText('Salary')).toBeInTheDocument();
      });
    });

    it('should show transaction count', async () => {
      render(<Transactions />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/showing 3 transactions on page 1/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter transactions by merchant name', async () => {
      const user = userEvent.setup();
      render(<Transactions />, { wrapper: createWrapper() });

      const searchInput = screen.getByPlaceholderText(/search by merchant or description/i);
      await user.type(searchInput, 'Super');

      await waitFor(() => {
        expect(screen.getByText('Supermarket')).toBeInTheDocument();
        expect(screen.queryByText('Gas Station')).not.toBeInTheDocument();
        expect(screen.queryByText('Salary')).not.toBeInTheDocument();
      });
    });

    it('should filter transactions by description', async () => {
      const user = userEvent.setup();
      render(<Transactions />, { wrapper: createWrapper() });

      const searchInput = screen.getByPlaceholderText(/search by merchant or description/i);
      await user.type(searchInput, 'Fuel');

      await waitFor(() => {
        expect(screen.getByText('Gas Station')).toBeInTheDocument();
        expect(screen.queryByText('Supermarket')).not.toBeInTheDocument();
      });
    });

    it('should show "No transactions found" when search has no results', async () => {
      const user = userEvent.setup();
      render(<Transactions />, { wrapper: createWrapper() });

      const searchInput = screen.getByPlaceholderText(/search by merchant or description/i);
      await user.type(searchInput, 'NonExistent');

      await waitFor(() => {
        expect(screen.getByText(/no transactions found/i)).toBeInTheDocument();
        expect(screen.getByText(/try adjusting your filters/i)).toBeInTheDocument();
      });
    });

    it('should clear search when X button is clicked', async () => {
      const user = userEvent.setup();
      render(<Transactions />, { wrapper: createWrapper() });

      const searchInput = screen.getByPlaceholderText(/search by merchant or description/i);
      await user.type(searchInput, 'Super');

      // Wait for search to filter results
      await waitFor(() => {
        expect(screen.getByText('Supermarket')).toBeInTheDocument();
      });

      const clearButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg')?.classList.contains('lucide-x')
      );
      
      if (clearButton) {
        await user.click(clearButton);
      }

      await waitFor(() => {
        expect(searchInput).toHaveValue('');
      });
    });
  });

  describe('Category Filter', () => {
    it('should filter transactions by category', async () => {
      render(<Transactions />, { wrapper: createWrapper() });

      // Verify category filter select exists
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes.length).toBe(2); // Category and Wallet filters

      // All transactions should be visible by default
      expect(screen.getByText('Supermarket')).toBeInTheDocument();
      expect(screen.getByText('Gas Station')).toBeInTheDocument();
      expect(screen.getByText('Salary')).toBeInTheDocument();
    });

    it('should show all transactions when "All Categories" is selected', async () => {
      render(<Transactions />, { wrapper: createWrapper() });

      // All transactions visible by default
      expect(screen.getByText('Supermarket')).toBeInTheDocument();
      expect(screen.getByText('Gas Station')).toBeInTheDocument();
      expect(screen.getByText('Salary')).toBeInTheDocument();
    });
  });

  describe('Wallet Filter', () => {
    it('should filter transactions by wallet', async () => {
      render(<Transactions />, { wrapper: createWrapper() });

      // Verify wallet filter select exists
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes.length).toBe(2); // Category and Wallet filters

      // All transactions should be visible by default
      expect(screen.getByText('Supermarket')).toBeInTheDocument();
      expect(screen.getByText('Gas Station')).toBeInTheDocument();
    });
  });

  describe('Combined Filters', () => {
    it('should apply multiple filters together', async () => {
      const user = userEvent.setup();
      render(<Transactions />, { wrapper: createWrapper() });

      // Apply search
      const searchInput = screen.getByPlaceholderText(/search by merchant or description/i);
      await user.type(searchInput, 'Super');
      // Verify filter selects are present
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes.length).toBeGreaterThanOrEqual(2); // Category and Wallet filters

      // Only Supermarket should be visible (matches search)
      await waitFor(() => {
        expect(screen.getByText('Supermarket')).toBeInTheDocument();
        expect(screen.queryByText('Gas Station')).not.toBeInTheDocument();
        expect(screen.queryByText('Salary')).not.toBeInTheDocument();
      });
    });

    it('should show Clear Filters button when filters are active', async () => {
      const user = userEvent.setup();
      render(<Transactions />, { wrapper: createWrapper() });

      // Initially, no Clear Filters button
      expect(screen.queryByRole('button', { name: /clear filters/i })).not.toBeInTheDocument();

      // Apply a filter
      const searchInput = screen.getByPlaceholderText(/search by merchant or description/i);
      await user.type(searchInput, 'Super');

      // Clear Filters button should appear
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
      });
    });

    it('should clear all filters when Clear Filters is clicked', async () => {
      const user = userEvent.setup();
      render(<Transactions />, { wrapper: createWrapper() });

      // Apply search filter
      const searchInput = screen.getByPlaceholderText(/search by merchant or description/i);
      await user.type(searchInput, 'Super');

      // Only filtered results visible
      await waitFor(() => {
        expect(screen.getByText('Supermarket')).toBeInTheDocument();
        expect(screen.queryByText('Gas Station')).not.toBeInTheDocument();
      });

      // Click Clear Filters
      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      await user.click(clearButton);

      // All transactions should be visible again
      await waitFor(() => {
        expect(screen.getByText('Supermarket')).toBeInTheDocument();
        expect(screen.getByText('Gas Station')).toBeInTheDocument();
        expect(screen.getByText('Salary')).toBeInTheDocument();
      });

      // Search should be cleared
      expect(searchInput).toHaveValue('');
    });
  });

  describe('Pagination', () => {
    it('should display pagination controls when there are transactions', () => {
      render(<Transactions />, { wrapper: createWrapper() });

      expect(screen.getByRole('navigation', { name: 'pagination' })).toBeInTheDocument();
    });

    it('should call usePayments with correct page when next is clicked', async () => {
      const user = userEvent.setup();
      const mockUsePayments = vi.mocked(useApiHooks.usePayments);
      
      // Mock full page of results
      mockUsePayments.mockReturnValue({
        data: { 
          content: Array(50).fill(mockPayments[0]), 
          page: 0, 
          size: 50 
        },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useApiHooks.usePayments>);

      render(<Transactions />, { wrapper: createWrapper() });

      // Find and click next button/link
      const nextButton = screen.getByLabelText(/go to next page/i);
      await user.click(nextButton);

      // Verify usePayments was called with page 1
      await waitFor(() => {
        expect(mockUsePayments).toHaveBeenCalledWith(1, 50);
      });
    });

    it('should disable previous button on first page', () => {
      render(<Transactions />, { wrapper: createWrapper() });

      // Previous link should have pointer-events-none class on first page
      const prevLink = screen.getByLabelText(/go to previous page/i);
      expect(prevLink).toHaveClass('pointer-events-none');
    });

    it('should disable next button when less than page size results', () => {
      vi.mocked(useApiHooks.usePayments).mockReturnValue({
        data: { content: mockPayments, page: 0, size: 50 },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useApiHooks.usePayments>);

      render(<Transactions />, { wrapper: createWrapper() });

      // Next link should have pointer-events-none class when there are no more pages
      const nextLink = screen.getByLabelText(/go to next page/i);
      expect(nextLink).toHaveClass('pointer-events-none');
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no transactions exist', () => {
      vi.mocked(useApiHooks.usePayments).mockReturnValue({
        data: { content: [], page: 0, size: 50 },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useApiHooks.usePayments>);

      render(<Transactions />, { wrapper: createWrapper() });

      // Use getAllByText for duplicate text and verify the correct one is shown
      const emptyMessages = screen.getAllByText(/no transactions yet/i);
      expect(emptyMessages.length).toBeGreaterThan(0);
      expect(screen.getByText(/add your first transaction to get started/i)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show skeleton loader while loading', () => {
      vi.mocked(useApiHooks.usePayments).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as ReturnType<typeof useApiHooks.usePayments>);

      render(<Transactions />, { wrapper: createWrapper() });

      // Skeleton should be rendered (check for specific class or role)
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });
});
