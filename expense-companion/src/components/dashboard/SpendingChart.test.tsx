import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { SpendingChart } from './SpendingChart';
import type { Payment } from '@/types/api';

describe('SpendingChart', () => {
  const mockPayments: Payment[] = [
    {
      id: '1',
      merchantName: 'Grocery Store',
      amountInCents: -10000,
      category: 'food',
      accountingDate: '2026-01-30',
      wallet: 'Main Account',
    },
    {
      id: '2',
      merchantName: 'Gas Station',
      amountInCents: -5000,
      category: 'transport',
      accountingDate: '2026-01-29',
      wallet: 'Main Account',
    },
    {
      id: '3',
      merchantName: 'Shopping Mall',
      amountInCents: -8000,
      category: 'shopping',
      accountingDate: '2026-01-28',
      wallet: 'Main Account',
    },
    {
      id: '4',
      merchantName: 'Salary',
      amountInCents: 300000,
      category: 'income',
      accountingDate: '2026-01-27',
      wallet: 'Main Account',
    },
  ];

  it('should render spending chart with title', () => {
    render(<SpendingChart payments={mockPayments} />);

    expect(screen.getByText('Spending by Category')).toBeInTheDocument();
  });

  it('should display category names and amounts', () => {
    render(<SpendingChart payments={mockPayments} />);

    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Transport')).toBeInTheDocument();
    expect(screen.getByText('Shopping')).toBeInTheDocument();
    
    expect(screen.getByText('€100.00')).toBeInTheDocument();
    expect(screen.getByText('€50.00')).toBeInTheDocument();
    expect(screen.getByText('€80.00')).toBeInTheDocument();
  });

  it('should calculate percentages correctly', () => {
    render(<SpendingChart payments={mockPayments} />);

    // Total expenses = 10000 + 5000 + 8000 = 23000
    // Food: 10000/23000 = 43.5%
    // Transport: 5000/23000 = 21.7%
    // Shopping: 8000/23000 = 34.8%
    
    expect(screen.getByText(/43\.5%|21\.7%|34\.8%/)).toBeInTheDocument();
  });

  it('should only show expenses, not income', () => {
    render(<SpendingChart payments={mockPayments} />);

    // Income should not be in the chart
    expect(screen.queryByText(/income/i)).not.toBeInTheDocument();
    expect(screen.queryByText('€3,000.00')).not.toBeInTheDocument();
  });

  it('should display empty state when no expenses', () => {
    const incomeOnly: Payment[] = [
      {
        id: '1',
        merchantName: 'Salary',
        amountInCents: 300000,
        category: 'income',
        accountingDate: '2026-01-27',
        wallet: 'Main Account',
      },
    ];

    render(<SpendingChart payments={incomeOnly} />);

    expect(screen.getByText('No expense data to display')).toBeInTheDocument();
  });

  it('should display empty state when no payments', () => {
    render(<SpendingChart payments={[]} />);

    expect(screen.getByText('No expense data to display')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <SpendingChart payments={mockPayments} className="custom-class" />
    );

    const card = container.querySelector('.custom-class');
    expect(card).toBeInTheDocument();
  });

  it('should aggregate expenses by category', () => {
    const multipleExpensesInSameCategory: Payment[] = [
      {
        id: '1',
        merchantName: 'Store A',
        amountInCents: -5000,
        category: 'food',
        accountingDate: '2026-01-30',
        wallet: 'Main Account',
      },
      {
        id: '2',
        merchantName: 'Store B',
        amountInCents: -3000,
        category: 'food',
        accountingDate: '2026-01-29',
        wallet: 'Main Account',
      },
    ];

    render(<SpendingChart payments={multipleExpensesInSameCategory} />);

    // Should show combined amount: 50 + 30 = 80
    expect(screen.getByText('€80.00')).toBeInTheDocument();
    expect(screen.getByText('100.0%')).toBeInTheDocument();
  });

  it('should limit display to top 5 categories', () => {
    const manyCategories: Payment[] = Array.from({ length: 8 }, (_, i) => ({
      id: `${i}`,
      merchantName: `Store ${i}`,
      amountInCents: -(1000 * (i + 1)),
      category: `category${i}`,
      accountingDate: '2026-01-30',
      wallet: 'Main Account',
    }));

    render(<SpendingChart payments={manyCategories} />);

    // Should show top 5 categories
    expect(screen.getByText('Category7')).toBeInTheDocument(); // Highest amount
    expect(screen.getByText('Category6')).toBeInTheDocument();
    expect(screen.getByText('Category5')).toBeInTheDocument();
    expect(screen.getByText('Category4')).toBeInTheDocument();
    expect(screen.getByText('Category3')).toBeInTheDocument();

    // Lower categories should not be visible in the list (though may be in chart)
    expect(screen.queryByText('Category0')).not.toBeInTheDocument();
  });

  it('should handle categories with case insensitivity', () => {
    const mixedCaseCategories: Payment[] = [
      {
        id: '1',
        merchantName: 'Store',
        amountInCents: -5000,
        category: 'FOOD',
        accountingDate: '2026-01-30',
        wallet: 'Main Account',
      },
      {
        id: '2',
        merchantName: 'Store',
        amountInCents: -3000,
        category: 'food',
        accountingDate: '2026-01-29',
        wallet: 'Main Account',
      },
    ];

    render(<SpendingChart payments={mixedCaseCategories} />);

    // Should capitalize and combine
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('€80.00')).toBeInTheDocument();
  });

  it('should sort categories by amount in descending order', () => {
    render(<SpendingChart payments={mockPayments} />);

    // Food (100) should be first, Shopping (80) second, Transport (50) third
    const categoryElements = screen.getAllByText(/Food|Shopping|Transport/);
    expect(categoryElements[0]).toHaveTextContent('Food');
  });

  it('should render chart container', () => {
    const { container } = render(<SpendingChart payments={mockPayments} />);

    // Check for recharts container
    const chart = container.querySelector('.recharts-wrapper');
    expect(chart).toBeInTheDocument();
  });

  it('should render colored dots for each category', () => {
    const { container } = render(<SpendingChart payments={mockPayments} />);

    // Should have colored dots for visual indication
    const dots = container.querySelectorAll('.rounded-full');
    expect(dots.length).toBeGreaterThan(0);
  });

  it('should handle zero total expenses gracefully', () => {
    const zeroExpenses: Payment[] = [];
    
    render(<SpendingChart payments={zeroExpenses} />);

    expect(screen.getByText('No expense data to display')).toBeInTheDocument();
  });
});
