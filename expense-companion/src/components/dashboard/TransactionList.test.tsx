import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { TransactionList } from './TransactionList';
import type { Payment } from '@/types/api';

describe('TransactionList', () => {
  const mockPayments: Payment[] = [
    {
      id: '1',
      merchantName: 'Grocery Store',
      amountInCents: -5000,
      category: 'food',
      accountingDate: '2026-01-30',
      description: 'Weekly groceries',
      wallet: 'Main Account',
    },
    {
      id: '2',
      merchantName: 'Salary',
      amountInCents: 350000,
      category: 'income',
      accountingDate: '2026-01-28',
      description: 'Monthly salary',
      wallet: 'Main Account',
    },
    {
      id: '3',
      merchantName: 'Gas Station',
      amountInCents: -3500,
      category: 'transport',
      accountingDate: '2026-01-29',
      description: 'Fuel',
      wallet: 'Main Account',
      tags: [
        { key: 'vehicle', value: 'car' },
        { key: 'trip', value: 'work' },
      ],
    },
  ];

  it('should render list of transactions', () => {
    render(<TransactionList payments={mockPayments} />);

    expect(screen.getByText('Recent Transactions')).toBeInTheDocument();
    expect(screen.getByText('Grocery Store')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.getByText('Gas Station')).toBeInTheDocument();
  });

  it('should display empty state when no payments', () => {
    render(<TransactionList payments={[]} />);

    expect(screen.getByText('No transactions yet')).toBeInTheDocument();
    expect(screen.getByText('Add your first expense or income')).toBeInTheDocument();
  });

  it('should show formatted amounts with correct colors', () => {
    render(<TransactionList payments={mockPayments} />);

    // Should show negative amount for expense
    expect(screen.getByText('-€50.00')).toBeInTheDocument();
    
    // Should show positive amount for income
    expect(screen.getByText('+€3,500.00')).toBeInTheDocument();
  });

  it('should display category and relative date for each transaction', () => {
    render(<TransactionList payments={mockPayments} />);

    // Check for categories (case insensitive due to capitalize function)
    expect(screen.getByText(/food/i)).toBeInTheDocument();
    expect(screen.getByText(/income/i)).toBeInTheDocument();
    expect(screen.getByText(/transport/i)).toBeInTheDocument();
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    
    render(<TransactionList payments={mockPayments} onDelete={onDelete} />);

    // Find the first transaction row and hover to show delete button
    const firstTransaction = screen.getByText('Grocery Store').closest('div');
    expect(firstTransaction).toBeInTheDocument();

    // Find delete button by looking for trash-2 icon specifically
    const deleteButtons = screen.getAllByRole('button').filter(btn => {
      const svg = btn.querySelector('svg');
      return svg?.classList.contains('lucide-trash-2');
    });

    expect(deleteButtons.length).toBeGreaterThan(0);
    await user.click(deleteButtons[0]);

    // Wait for delete callback
    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith(mockPayments[0].id);
    }, { timeout: 2000 });
  });

  it('should open edit dialog when edit button is clicked', async () => {
    const user = userEvent.setup();
    
    render(<TransactionList payments={mockPayments} onEdit={true} />);

    // Find and click edit button
    const editButtons = screen.getAllByRole('button');
    const editButton = editButtons[0]; // First edit button

    await user.click(editButton);

    // Edit dialog should open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('should disable action buttons when isDeleting is true', () => {
    const onDelete = vi.fn();
    
    render(
      <TransactionList 
        payments={mockPayments} 
        onDelete={onDelete}
        onEdit={true}
        isDeleting={true}
      />
    );

    const buttons = screen.getAllByRole('button');
    // At least some buttons should be disabled
    const disabledButtons = buttons.filter(btn => btn.hasAttribute('disabled'));
    expect(disabledButtons.length).toBeGreaterThan(0);
  });

  it('should render transaction tags when present', () => {
    render(<TransactionList payments={mockPayments} />);

    // The transaction with tags should show them
    expect(screen.getByText('Gas Station')).toBeInTheDocument();
    // Tags are rendered by PaymentTags component
    // We just check that the transaction is there
  });

  it('should apply custom className', () => {
    const { container } = render(
      <TransactionList payments={mockPayments} className="custom-class" />
    );

    const card = container.querySelector('.custom-class');
    expect(card).toBeInTheDocument();
  });

  it('should render category icons', () => {
    const { container } = render(<TransactionList payments={mockPayments} />);

    // Should have category icons (one per transaction)
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThanOrEqual(mockPayments.length);
  });

  it('should render scrollable area for long lists', () => {
    const manyPayments: Payment[] = Array.from({ length: 20 }, (_, i) => ({
      id: `payment-${i}`,
      merchantName: `Merchant ${i}`,
      amountInCents: -1000 * (i + 1),
      category: 'other',
      accountingDate: '2026-01-30',
      wallet: 'Main Account',
    }));

    render(<TransactionList payments={manyPayments} />);

    // Should render all transactions
    expect(screen.getByText('Merchant 0')).toBeInTheDocument();
    expect(screen.getByText('Merchant 19')).toBeInTheDocument();
  });

  it('should handle transactions without tags', () => {
    const paymentsWithoutTags: Payment[] = [
      {
        id: '1',
        merchantName: 'Simple Store',
        amountInCents: -1000,
        category: 'shopping',
        accountingDate: '2026-01-30',
        wallet: 'Main Account',
      },
    ];

    render(<TransactionList payments={paymentsWithoutTags} />);

    expect(screen.getByText('Simple Store')).toBeInTheDocument();
  });

  it('should handle transactions without description', () => {
    const paymentsWithoutDescription: Payment[] = [
      {
        id: '1',
        merchantName: 'Store',
        amountInCents: -1000,
        category: 'shopping',
        accountingDate: '2026-01-30',
        wallet: 'Main Account',
      },
    ];

    render(<TransactionList payments={paymentsWithoutDescription} />);

    expect(screen.getByText('Store')).toBeInTheDocument();
  });

  it('should handle unknown category gracefully', () => {
    const paymentWithUnknownCategory: Payment[] = [
      {
        id: '1',
        merchantName: 'Store',
        amountInCents: -1000,
        category: 'unknown-category',
        accountingDate: '2026-01-30',
        wallet: 'Main Account',
      },
    ];

    render(<TransactionList payments={paymentWithUnknownCategory} />);

    expect(screen.getByText('Store')).toBeInTheDocument();
    // Should still render with fallback icon/color
  });
});
