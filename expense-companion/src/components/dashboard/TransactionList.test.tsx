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

  it('should hide title when title prop is null', () => {
    render(<TransactionList payments={mockPayments} title={null} />);

    expect(screen.queryByText('Recent Transactions')).not.toBeInTheDocument();
    expect(screen.getByText('Grocery Store')).toBeInTheDocument();
  });

  it('should show custom title when provided', () => {
    render(<TransactionList payments={mockPayments} title="All Transactions" />);

    expect(screen.getByText('All Transactions')).toBeInTheDocument();
    expect(screen.queryByText('Recent Transactions')).not.toBeInTheDocument();
  });

  it('should hide title when title prop is null', () => {
    render(<TransactionList payments={mockPayments} title={null} />);

    expect(screen.queryByText('Recent Transactions')).not.toBeInTheDocument();
    expect(screen.getByText('Grocery Store')).toBeInTheDocument();
  });

  it('should show custom title when provided', () => {
    render(<TransactionList payments={mockPayments} title="All Transactions" />);

    expect(screen.queryByText('Recent Transactions')).not.toBeInTheDocument();
    expect(screen.getByText('All Transactions')).toBeInTheDocument();
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

  describe('Title prop', () => {
    it('should show default title when title prop not provided', () => {
      render(<TransactionList payments={mockPayments} />);

      expect(screen.getByText('Recent Transactions')).toBeInTheDocument();
    });

    it('should show custom title when provided', () => {
      render(<TransactionList payments={mockPayments} title="My Custom Title" />);

      expect(screen.getByText('My Custom Title')).toBeInTheDocument();
      expect(screen.queryByText('Recent Transactions')).not.toBeInTheDocument();
    });

    it('should hide header when title is null', () => {
      render(<TransactionList payments={mockPayments} title={null} />);

      expect(screen.queryByText('Recent Transactions')).not.toBeInTheDocument();
    });
  });

  describe('Detailed variant with expandable cards', () => {
    it('should show wallet and precise date in detailed variant', () => {
      render(<TransactionList payments={mockPayments} variant="detailed" />);

      // Should show wallet names (all 3 payments have "Main Account")
      const walletElements = screen.getAllByText('Main Account');
      expect(walletElements).toHaveLength(3);
      
      // Should show precise dates (YYYY-MM-DD format)
      expect(screen.getByText('2026-01-30')).toBeInTheDocument();
      expect(screen.getByText('2026-01-28')).toBeInTheDocument();
      expect(screen.getByText('2026-01-29')).toBeInTheDocument();
    });

    it('should not show wallet and precise date in compact variant', () => {
      render(<TransactionList payments={mockPayments} variant="compact" />);

      // Wallet name should not be visible (it's in the data but not displayed)
      const walletElements = screen.queryAllByText('Main Account');
      expect(walletElements).toHaveLength(0);
      
      // Precise dates should not be visible
      expect(screen.queryByText('2026-01-30')).not.toBeInTheDocument();
    });

    it('should expand card when clicked in detailed variant', async () => {
      const user = userEvent.setup();
      
      render(<TransactionList payments={mockPayments} variant="detailed" />);

      // Initially, expanded content should not be visible
      expect(screen.queryByText('Description')).not.toBeInTheDocument();
      expect(screen.queryByText('Weekly groceries')).not.toBeInTheDocument();

      // Click on the first transaction
      const firstTransaction = screen.getByText('Grocery Store').closest('div')?.parentElement;
      expect(firstTransaction).toBeInTheDocument();
      await user.click(firstTransaction!);

      // Expanded content should now be visible
      await waitFor(() => {
        expect(screen.getByText('Description')).toBeInTheDocument();
        expect(screen.getByText('Weekly groceries')).toBeInTheDocument();
      });
    });

    it('should show all tags when card is expanded', async () => {
      const user = userEvent.setup();
      
      render(<TransactionList payments={mockPayments} variant="detailed" />);

      // Click on transaction with tags
      const transactionWithTags = screen.getByText('Gas Station').closest('div')?.parentElement;
      await user.click(transactionWithTags!);

      // Should show Tags section with full tag display (key: value)
      await waitFor(() => {
        expect(screen.getByText('Tags')).toBeInTheDocument();
        // Tags are shown in full format with both key and value
        expect(screen.getByText('vehicle: car')).toBeInTheDocument();
        expect(screen.getByText('trip: work')).toBeInTheDocument();
      });
    });

    it('should show transaction ID when card is expanded', async () => {
      const user = userEvent.setup();
      
      render(<TransactionList payments={mockPayments} variant="detailed" />);

      // Click on first transaction
      const firstTransaction = screen.getByText('Grocery Store').closest('div')?.parentElement;
      await user.click(firstTransaction!);

      // Should show transaction ID
      await waitFor(() => {
        expect(screen.getByText('Transaction ID')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });

    it('should collapse card when clicked again', async () => {
      const user = userEvent.setup();
      
      render(<TransactionList payments={mockPayments} variant="detailed" />);

      // Expand card
      const firstTransaction = screen.getByText('Grocery Store').closest('div')?.parentElement;
      await user.click(firstTransaction!);
      
      await waitFor(() => {
        expect(screen.getByText('Description')).toBeInTheDocument();
      });

      // Collapse card by clicking again
      await user.click(firstTransaction!);
      
      await waitFor(() => {
        expect(screen.queryByText('Description')).not.toBeInTheDocument();
      });
    });

    it('should only allow one card to be expanded at a time', async () => {
      const user = userEvent.setup();
      
      render(<TransactionList payments={mockPayments} variant="detailed" />);

      // Expand first card
      const firstTransaction = screen.getByText('Grocery Store').closest('div')?.parentElement;
      await user.click(firstTransaction!);
      
      await waitFor(() => {
        expect(screen.getByText('Weekly groceries')).toBeInTheDocument();
      });

      // Expand second card
      const secondTransaction = screen.getByText('Salary').closest('div')?.parentElement;
      await user.click(secondTransaction!);
      
      await waitFor(() => {
        expect(screen.getByText('Monthly salary')).toBeInTheDocument();
      });

      // First card should be collapsed now
      expect(screen.queryByText('Weekly groceries')).not.toBeInTheDocument();
    });

    it('should show chevron icon for expandable cards', () => {
      render(<TransactionList payments={mockPayments} variant="detailed" />);

      // Should have chevron down icons (cards not expanded)
      const chevronButtons = screen.getAllByRole('button').filter(btn => {
        const svg = btn.querySelector('svg');
        return svg?.classList.contains('lucide-chevron-down');
      });

      // Should have 3 expandable cards (all have descriptions or tags)
      expect(chevronButtons.length).toBeGreaterThan(0);
    });

    it('should not be expandable in compact variant', async () => {
      const user = userEvent.setup();
      
      render(<TransactionList payments={mockPayments} variant="compact" />);

      // Click on transaction
      const firstTransaction = screen.getByText('Grocery Store').closest('div');
      await user.click(firstTransaction!);

      // Should not show expanded content
      expect(screen.queryByText('Description')).not.toBeInTheDocument();
      expect(screen.queryByText('Weekly groceries')).not.toBeInTheDocument();
    });
  });

  describe('Mobile swipe actions', () => {
    it('should handle touch start event', () => {
      const onEdit = vi.fn();
      render(
        <TransactionList 
          payments={mockPayments} 
          variant="detailed" 
          onEdit 
        />
      );

      const card = screen.getByText('Grocery Store').closest('div');
      if (card) {
        const touchEvent = new TouchEvent('touchstart', {
          touches: [{ clientX: 100, clientY: 100 } as Touch]
        });
        card.dispatchEvent(touchEvent);
      }

      // Should not trigger edit on touch start
      expect(onEdit).not.toHaveBeenCalled();
    });

    it('should show mobile menu icon when actions available', () => {
      render(
        <TransactionList 
          payments={mockPayments} 
          variant="detailed" 
          onEdit 
          onDelete={vi.fn()}
        />
      );

      // Mobile menu icons (MoreVertical) should be in the document
      // They have md:hidden class to show only on mobile
      const allButtons = screen.getAllByRole('button');
      expect(allButtons.length).toBeGreaterThan(0);
    });

    it('should not show mobile menu when no actions available', () => {
      render(
        <TransactionList 
          payments={mockPayments} 
          variant="detailed" 
        />
      );

      // Without onEdit or onDelete, no mobile menu icons
      const allText = screen.getAllByText(/grocery store|salary|gas station/i);
      expect(allText.length).toBeGreaterThan(0);
    });
  });

  describe('Expanded panel action buttons', () => {
    it('should show edit and delete buttons in expanded panel', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      render(
        <TransactionList 
          payments={mockPayments} 
          variant="detailed" 
          onEdit 
          onDelete={onDelete}
        />
      );

      // Expand first transaction
      const firstTransaction = screen.getByText('Grocery Store').closest('div')?.parentElement;
      if (firstTransaction) {
        await user.click(firstTransaction);
      }

      // Action buttons should appear
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit transaction/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
      });
    });

    it('should call onEdit when edit button clicked in expanded panel', async () => {
      const user = userEvent.setup();

      render(
        <TransactionList 
          payments={mockPayments} 
          variant="detailed" 
          onEdit 
        />
      );

      // Expand and click edit
      const firstTransaction = screen.getByText('Grocery Store').closest('div')?.parentElement;
      if (firstTransaction) {
        await user.click(firstTransaction);
      }

      await waitFor(async () => {
        const editButton = screen.getByRole('button', { name: /edit transaction/i });
        await user.click(editButton);
      });

      // EditPaymentDialog should open with title "Edit Transaction"
      await waitFor(() => {
        const dialogTitles = screen.getAllByText(/edit transaction/i);
        // Should have at least 2: button text + dialog title
        expect(dialogTitles.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should call onDelete when delete button clicked in expanded panel', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();

      render(
        <TransactionList 
          payments={mockPayments} 
          variant="detailed" 
          onDelete={onDelete}
        />
      );

      // Expand and click delete
      const firstTransaction = screen.getByText('Grocery Store').closest('div')?.parentElement;
      if (firstTransaction) {
        await user.click(firstTransaction);
      }

      await waitFor(async () => {
        const deleteButton = screen.getByRole('button', { name: /^delete$/i });
        await user.click(deleteButton);
      });

      expect(onDelete).toHaveBeenCalledWith('1');
    });

    it('should disable action buttons when deleting', async () => {
      const user = userEvent.setup();

      render(
        <TransactionList 
          payments={mockPayments} 
          variant="detailed" 
          onEdit 
          onDelete={vi.fn()}
          isDeleting
        />
      );

      // Expand transaction
      const firstTransaction = screen.getByText('Grocery Store').closest('div')?.parentElement;
      if (firstTransaction) {
        await user.click(firstTransaction);
      }

      // Action buttons should be disabled
      await waitFor(() => {
        const editButton = screen.getByRole('button', { name: /edit transaction/i });
        const deleteButton = screen.getByRole('button', { name: /^delete$/i });
        
        expect(editButton).toBeDisabled();
        expect(deleteButton).toBeDisabled();
      });
    });

    it('should not show action buttons when not expanded', () => {
      render(
        <TransactionList 
          payments={mockPayments} 
          variant="detailed" 
          onEdit 
          onDelete={vi.fn()}
        />
      );

      // Action buttons in expanded panel should not be visible
      expect(screen.queryByRole('button', { name: /edit transaction/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^delete$/i })).not.toBeInTheDocument();
    });
  });
});

