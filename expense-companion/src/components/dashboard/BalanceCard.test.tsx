import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import { userEvent } from '@testing-library/user-event';
import { BalanceCard } from './BalanceCard';
import * as useApiHooks from '@/hooks/use-api';

vi.mock('@/hooks/use-api', async () => {
  const actual = await vi.importActual('@/hooks/use-api');
  return {
    ...actual,
    useBalance: vi.fn(),
  };
});

describe('BalanceCard', () => {
  const mockUseBalance = vi.mocked(useApiHooks.useBalance);

  beforeEach(() => {
    mockUseBalance.mockReturnValue({
      data: {
        totalInCents: 50000,
        incomeInCents: 100000,
        expensesInCents: -50000,
      },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useApiHooks.useBalance>);
  });

  it('should render with positive balance', async () => {
    render(<BalanceCard />);

    await waitFor(() => {
      expect(screen.getByText(/Total Balance/i)).toBeInTheDocument();
      const amounts = screen.getAllByText('€500.00');
      expect(amounts.length).toBe(2);
      expect(screen.getByText(/Income/i)).toBeInTheDocument();
      expect(screen.getByText('€1,000.00')).toBeInTheDocument();
      expect(screen.getByText(/Expenses/i)).toBeInTheDocument();
    });
  });

  it('should render with negative balance', async () => {
    mockUseBalance.mockReturnValue({
      data: {
        totalInCents: -30000,
        incomeInCents: 20000,
        expensesInCents: -50000,
      },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useApiHooks.useBalance>);

    render(<BalanceCard />);

    await waitFor(() => {
      expect(screen.getByText('-€300.00')).toBeInTheDocument();
    });
  });

  it('should render with zero balance', async () => {
    mockUseBalance.mockReturnValue({
      data: {
        totalInCents: 0,
        incomeInCents: 50000,
        expensesInCents: -50000,
      },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useApiHooks.useBalance>);

    render(<BalanceCard />);

    await waitFor(() => {
      expect(screen.getByText('€0.00')).toBeInTheDocument();
    });
  });

  it('should render with different currency', async () => {
    render(<BalanceCard currency="USD" />);

    await waitFor(() => {
      const dollarAmounts = screen.getAllByText('$500.00');
      expect(dollarAmounts.length).toBe(2);
      expect(screen.getByText('$1,000.00')).toBeInTheDocument();
    });
  });

  it('should apply custom className', async () => {
    const { container } = render(<BalanceCard className="custom-class" />);

    await waitFor(() => {
      const card = container.querySelector('.custom-class');
      expect(card).toBeInTheDocument();
    });
  });

  it('should show loading skeleton when data is loading', () => {
    mockUseBalance.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof useApiHooks.useBalance>);

    render(<BalanceCard />);

    expect(screen.queryByText(/Total Balance/i)).toBeInTheDocument();
    expect(screen.queryByText('€500.00')).not.toBeInTheDocument();
  });

  it('should have tabs for period selection', async () => {
    render(<BalanceCard />);

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /All/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /3M/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /1Y/i })).toBeInTheDocument();
    });
  });

  it('should switch to 3M period when tab clicked', async () => {
    const user = userEvent.setup();
    mockUseBalance.mockClear();
    
    render(<BalanceCard />);

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /3M/i })).toBeInTheDocument();
    });

    const threeMonthsTab = screen.getByRole('tab', { name: /3M/i });
    await user.click(threeMonthsTab);

    // Verify useBalance was called with date range for 3 months
    await waitFor(() => {
      const lastCall = mockUseBalance.mock.calls[mockUseBalance.mock.calls.length - 1];
      expect(lastCall).toBeDefined();
      expect(lastCall[0]).toBeDefined(); // startDate
      expect(lastCall[1]).toBeDefined(); // endDate
    });
  });

  it('should switch to 1Y period when tab clicked', async () => {
    const user = userEvent.setup();
    mockUseBalance.mockClear();
    
    render(<BalanceCard />);

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /1Y/i })).toBeInTheDocument();
    });

    const oneYearTab = screen.getByRole('tab', { name: /1Y/i });
    await user.click(oneYearTab);

    // Verify useBalance was called with date range for 1 year
    await waitFor(() => {
      const lastCall = mockUseBalance.mock.calls[mockUseBalance.mock.calls.length - 1];
      expect(lastCall).toBeDefined();
      expect(lastCall[0]).toBeDefined(); // startDate
      expect(lastCall[1]).toBeDefined(); // endDate
    });
  });
  
  it('should call useBalance without dates when period is "all"', async () => {
    mockUseBalance.mockClear();
    
    render(<BalanceCard />);

    await waitFor(() => {
      // Initial render with "all" period should not pass dates
      const firstCall = mockUseBalance.mock.calls[0];
      expect(firstCall[0]).toBeUndefined(); // no startDate
      expect(firstCall[1]).toBeUndefined(); // no endDate
    });
  });
    
  it('should handle undefined balance data', async () => {
    mockUseBalance.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useApiHooks.useBalance>);

    const { container } = render(<BalanceCard />);

    await waitFor(() => {
      // Should render with fallback values (0)
      expect(container.querySelector('.text-4xl')).toBeInTheDocument();
    });
  });
  
  it('should switch from all to 1Y to 3M periods', async () => {
    const user = userEvent.setup();
    mockUseBalance.mockClear();
    
    render(<BalanceCard />);

    // Initial "all" period
    await waitFor(() => {
      const allTab = screen.getByRole('tab', { name: /All/i });
      expect(allTab).toHaveAttribute('data-state', 'active');
    });

    // Switch to 1Y
    const oneYearTab = screen.getByRole('tab', { name: /1Y/i });
    await user.click(oneYearTab);

    await waitFor(() => {
      expect(oneYearTab).toHaveAttribute('data-state', 'active');
      const lastCall = mockUseBalance.mock.calls[mockUseBalance.mock.calls.length - 1];
      expect(lastCall[0]).toBeDefined(); // should have startDate
    });

    // Switch to 3M
    const threeMonthsTab = screen.getByRole('tab', { name: /3M/i });
    await user.click(threeMonthsTab);

    await waitFor(() => {
      expect(threeMonthsTab).toHaveAttribute('data-state', 'active');
      const lastCall = mockUseBalance.mock.calls[mockUseBalance.mock.calls.length - 1];
      expect(lastCall[0]).toBeDefined(); // should have startDate
    });
  });
});
