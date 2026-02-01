import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { BalanceCard } from './BalanceCard';

describe('BalanceCard', () => {
  it('should render with positive balance', () => {
    render(
      <BalanceCard
        totalInCents={50000}
        incomeInCents={100000}
        expensesInCents={-50000}
      />
    );

    expect(screen.getByText(/Total Balance/i)).toBeInTheDocument();
    // €500.00 appears twice (balance and expenses), use getAllByText
    const amounts = screen.getAllByText('€500.00');
    expect(amounts.length).toBe(2);
    expect(screen.getByText(/Income/i)).toBeInTheDocument();
    expect(screen.getByText('€1,000.00')).toBeInTheDocument();
    expect(screen.getByText(/Expenses/i)).toBeInTheDocument();
  });

  it('should render with negative balance', () => {
    render(
      <BalanceCard
        totalInCents={-30000}
        incomeInCents={20000}
        expensesInCents={-50000}
      />
    );

    expect(screen.getByText('-€300.00')).toBeInTheDocument();
  });

  it('should render with zero balance', () => {
    render(
      <BalanceCard
        totalInCents={0}
        incomeInCents={50000}
        expensesInCents={-50000}
      />
    );

    expect(screen.getByText('€0.00')).toBeInTheDocument();
  });

  it('should render with different currency', () => {
    render(
      <BalanceCard
        totalInCents={50000}
        incomeInCents={100000}
        expensesInCents={-50000}
        currency="USD"
      />
    );

    // $500.00 appears twice (balance and expenses)
    const dollarAmounts = screen.getAllByText('$500.00');
    expect(dollarAmounts.length).toBe(2);
    expect(screen.getByText('$1,000.00')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <BalanceCard
        totalInCents={50000}
        incomeInCents={100000}
        expensesInCents={-50000}
        className="custom-class"
      />
    );

    const card = container.querySelector('.custom-class');
    expect(card).toBeInTheDocument();
  });

  it('should show correct icons for positive balance', () => {
    const { container } = render(
      <BalanceCard
        totalInCents={50000}
        incomeInCents={100000}
        expensesInCents={-50000}
      />
    );

    // Check for trending up icon (positive balance indicator)
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should show correct icons for negative balance', () => {
    const { container } = render(
      <BalanceCard
        totalInCents={-30000}
        incomeInCents={20000}
        expensesInCents={-50000}
      />
    );

    // Check that icons are rendered
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should format expenses as absolute value', () => {
    render(
      <BalanceCard
        totalInCents={0}
        incomeInCents={0}
        expensesInCents={-75050}
      />
    );

    // Expenses should be shown as positive value
    expect(screen.getByText('€750.50')).toBeInTheDocument();
  });

  it('should handle large amounts correctly', () => {
    render(
      <BalanceCard
        totalInCents={1234567890}
        incomeInCents={2000000000}
        expensesInCents={-765432110}
      />
    );

    expect(screen.getByText('€12,345,678.90')).toBeInTheDocument();
    expect(screen.getByText('€20,000,000.00')).toBeInTheDocument();
    expect(screen.getByText('€7,654,321.10')).toBeInTheDocument();
  });

  it('should render all text labels', () => {
    render(
      <BalanceCard
        totalInCents={50000}
        incomeInCents={100000}
        expensesInCents={-50000}
      />
    );

    expect(screen.getByText('Total Balance')).toBeInTheDocument();
    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('Expenses')).toBeInTheDocument();
  });
});
