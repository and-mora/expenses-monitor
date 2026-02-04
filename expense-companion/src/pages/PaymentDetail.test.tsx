import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PaymentDetail from './PaymentDetail';
import * as useApiHooks from '@/hooks/use-api';
import type { Payment } from '@/types/api';

// Mock the API hooks
vi.mock('@/hooks/use-api', async () => {
  const actual = await vi.importActual('@/hooks/use-api');
  return {
    ...actual,
    useDeletePayment: vi.fn(),
  };
});

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

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockPayment: Payment = {
  id: 'abc-123-def-456',
  merchantName: 'Supermarket',
  amountInCents: -5000,
  category: 'food',
  accountingDate: '2026-01-25',
  description: 'Weekly groceries',
  wallet: 'Main Account',
  tags: [
    { key: 'type', value: 'groceries' },
    { key: 'priority', value: 'essential' },
  ],
};

const mockPaymentIncome: Payment = {
  id: 'xyz-789',
  merchantName: 'Company Inc',
  amountInCents: 350000,
  category: 'income',
  accountingDate: '2026-01-15',
  description: 'Monthly salary',
  wallet: 'Savings',
  tags: [],
};

const createWrapper = (initialEntries: string[], state?: unknown) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries.map(path => ({ pathname: path, state }))}>
        <Routes>
          <Route path="/transactions/:id" element={children} />
          <Route path="/transactions" element={<div>Transactions Page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('PaymentDetail Page', () => {
  const mockDeletePayment = {
    mutateAsync: vi.fn(),
    isPending: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useApiHooks.useDeletePayment).mockReturnValue(mockDeletePayment as unknown as ReturnType<typeof useApiHooks.useDeletePayment>);
  });

  it('displays payment details when passed via navigation state', async () => {
    render(<PaymentDetail />, {
      wrapper: createWrapper([`/transactions/${mockPayment.id}`], { payment: mockPayment }),
    });

    // Verify merchant name is displayed
    expect(screen.getByText('Supermarket')).toBeInTheDocument();

    // Verify amount is displayed (formatted as €-50.00 or similar)
    expect(screen.getByText(/€\s*-?50[.,]00/)).toBeInTheDocument();

    // Verify category badge
    expect(screen.getByText('Food')).toBeInTheDocument();

    // Verify wallet
    expect(screen.getByText('Main Account')).toBeInTheDocument();

    // Verify description
    expect(screen.getByText('Weekly groceries')).toBeInTheDocument();

    // Verify tags are displayed (in 'full' variant format: "key: value")
    expect(screen.getByText('type: groceries')).toBeInTheDocument();
    expect(screen.getByText('priority: essential')).toBeInTheDocument();

    // Verify transaction ID
    expect(screen.getByText('abc-123-def-456')).toBeInTheDocument();
  });

  it('displays income payment with positive styling', async () => {
    render(<PaymentDetail />, {
      wrapper: createWrapper([`/transactions/${mockPaymentIncome.id}`], { payment: mockPaymentIncome }),
    });

    // Verify merchant name
    expect(screen.getByText('Company Inc')).toBeInTheDocument();

    // Verify amount with income styling
    const amountElement = screen.getByText(/€\s*\+?3[.,]500[.,]00/);
    expect(amountElement).toBeInTheDocument();
    expect(amountElement).toHaveClass('text-income');
  });

  it('renders back button and navigates on click', async () => {
    const user = userEvent.setup();
    
    render(<PaymentDetail />, {
      wrapper: createWrapper([`/transactions/${mockPayment.id}`], { payment: mockPayment }),
    });

    const backButton = screen.getByRole('button', { name: /back/i });
    expect(backButton).toBeInTheDocument();
    
    await user.click(backButton);
    
    // Should navigate to transactions page
    await waitFor(() => {
      expect(screen.getByText('Transactions Page')).toBeInTheDocument();
    });
  });

  it('renders edit and delete action buttons', () => {
    render(<PaymentDetail />, {
      wrapper: createWrapper([`/transactions/${mockPayment.id}`], { payment: mockPayment }),
    });

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('calls delete mutation when delete button is clicked', async () => {
    const user = userEvent.setup();
    mockDeletePayment.mutateAsync.mockResolvedValueOnce(undefined);

    render(<PaymentDetail />, {
      wrapper: createWrapper([`/transactions/${mockPayment.id}`], { payment: mockPayment }),
    });

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockDeletePayment.mutateAsync).toHaveBeenCalledWith(mockPayment.id);
    });
  });

  it('opens edit dialog when edit button is clicked', async () => {
    const user = userEvent.setup();

    render(<PaymentDetail />, {
      wrapper: createWrapper([`/transactions/${mockPayment.id}`], { payment: mockPayment }),
    });

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    // The edit dialog should open - look for the sheet content
    await waitFor(() => {
      expect(screen.getByText('Edit Transaction')).toBeInTheDocument();
    });
  });

  it('displays loading skeleton when payment is not available', async () => {
    // Create a wrapper without payment in state
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[{ pathname: '/transactions/unknown-id' }]}>
          <Routes>
            <Route path="/transactions/:id" element={<PaymentDetail />} />
            <Route path="/transactions" element={<div>Transactions Page</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Should show loading state briefly and then redirect
    await waitFor(() => {
      expect(screen.getByText('Transactions Page')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('does not render description section when description is empty', () => {
    const paymentWithoutDescription: Payment = {
      ...mockPayment,
      description: '',
    };

    render(<PaymentDetail />, {
      wrapper: createWrapper([`/transactions/${paymentWithoutDescription.id}`], { payment: paymentWithoutDescription }),
    });

    // Description label should not appear
    expect(screen.queryByText('Description')).not.toBeInTheDocument();
  });

  it('does not render tags section when no tags exist', () => {
    const paymentWithoutTags: Payment = {
      ...mockPayment,
      tags: [],
    };

    render(<PaymentDetail />, {
      wrapper: createWrapper([`/transactions/${paymentWithoutTags.id}`], { payment: paymentWithoutTags }),
    });

    // Tags label should not appear
    expect(screen.queryByText('Tags')).not.toBeInTheDocument();
  });
});
