import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { AddPaymentDialog } from './AddPaymentDialog';
import type { Wallet } from '@/types/api';

describe('AddPaymentDialog', () => {
  const mockWallets: Wallet[] = [
    { id: '1', name: 'Main Account' },
    { id: '2', name: 'Savings' },
  ];

  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the dialog trigger button', () => {
    render(
      <AddPaymentDialog 
        wallets={mockWallets} 
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByRole('button', { name: /add transaction/i })).toBeInTheDocument();
  });

  it('should open dialog when trigger button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AddPaymentDialog 
        wallets={mockWallets} 
        onSubmit={mockOnSubmit}
      />
    );

    await user.click(screen.getByRole('button', { name: /add transaction/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Category Combobox', () => {
    it('should display existing expense categories in combobox', async () => {
      const user = userEvent.setup();
      render(
        <AddPaymentDialog 
          wallets={mockWallets} 
          onSubmit={mockOnSubmit}
        />
      );

      // Open dialog
      await user.click(screen.getByRole('button', { name: /add transaction/i }));

      // Wait for dialog and categories to load
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click on category combobox
      const categoryButton = screen.getByRole('combobox', { name: /category/i });
      await user.click(categoryButton);

      // Check that expense categories are shown (excluding 'income')
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'food' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'transport' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'shopping' })).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: 'income' })).not.toBeInTheDocument();
      });
    });

    it('should allow searching for existing categories', async () => {
      const user = userEvent.setup();
      render(
        <AddPaymentDialog 
          wallets={mockWallets} 
          onSubmit={mockOnSubmit}
        />
      );

      // Open dialog
      await user.click(screen.getByRole('button', { name: /add transaction/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click on category combobox
      const categoryButton = screen.getByRole('combobox', { name: /category/i });
      await user.click(categoryButton);

      // Type in search box
      const searchInput = screen.getByPlaceholderText(/cerca o crea categoria/i);
      await user.type(searchInput, 'food');

      // Should filter and show only 'food'
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'food' })).toBeInTheDocument();
      });
    });

    it('should allow selecting an existing category from the list', async () => {
      const user = userEvent.setup();
      render(
        <AddPaymentDialog 
          wallets={mockWallets} 
          onSubmit={mockOnSubmit}
        />
      );

      // Open dialog
      await user.click(screen.getByRole('button', { name: /add transaction/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click on category combobox
      const categoryButton = screen.getByRole('combobox', { name: /category/i });
      await user.click(categoryButton);

      // Select 'food' category
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'food' })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('option', { name: 'food' }));

      // Verify the category is selected (button should show 'food')
      await waitFor(() => {
        expect(categoryButton).toHaveTextContent('food');
      });
    });

    it('should allow creating a new category when search has no results', async () => {
      const user = userEvent.setup();
      render(
        <AddPaymentDialog 
          wallets={mockWallets} 
          onSubmit={mockOnSubmit}
        />
      );

      // Open dialog
      await user.click(screen.getByRole('button', { name: /add transaction/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click on category combobox
      const categoryButton = screen.getByRole('combobox', { name: /category/i });
      await user.click(categoryButton);

      // Type a new category name that doesn't exist
      const searchInput = screen.getByPlaceholderText(/cerca o crea categoria/i);
      await user.type(searchInput, 'newcategory');

      // Should show "Nessuna categoria trovata" and create button
      await waitFor(() => {
        expect(screen.getByText(/nessuna categoria trovata/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /crea "newcategory"/i })).toBeInTheDocument();
      });

      // Click create button
      await user.click(screen.getByRole('button', { name: /crea "newcategory"/i }));

      // Verify the new category is set (button should show 'newcategory')
      await waitFor(() => {
        expect(categoryButton).toHaveTextContent('newcategory');
      });
    });

    it('should convert new category to lowercase', async () => {
      const user = userEvent.setup();
      render(
        <AddPaymentDialog 
          wallets={mockWallets} 
          onSubmit={mockOnSubmit}
        />
      );

      // Open dialog
      await user.click(screen.getByRole('button', { name: /add transaction/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click on category combobox
      const categoryButton = screen.getByRole('combobox', { name: /category/i });
      await user.click(categoryButton);

      // Type a new category with uppercase
      const searchInput = screen.getByPlaceholderText(/cerca o crea categoria/i);
      await user.type(searchInput, 'MyNewCategory');

      // Click create button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /crea "MyNewCategory"/i })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: /crea "MyNewCategory"/i }));

      // Verify it was converted to lowercase
      await waitFor(() => {
        expect(categoryButton).toHaveTextContent('mynewcategory');
      });
    });

    it('should show income category when income mode is selected', async () => {
      const user = userEvent.setup();
      render(
        <AddPaymentDialog 
          wallets={mockWallets} 
          onSubmit={mockOnSubmit}
        />
      );

      // Open dialog
      await user.click(screen.getByRole('button', { name: /add transaction/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click on Income button
      const incomeButton = screen.getByRole('button', { name: /income/i });
      await user.click(incomeButton);

      // Click on category combobox
      const categoryButton = screen.getByRole('combobox', { name: /category/i });
      
      // Category should be auto-set to 'income'
      await waitFor(() => {
        expect(categoryButton).toHaveTextContent('income');
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with custom category', async () => {
      const user = userEvent.setup();
      render(
        <AddPaymentDialog 
          wallets={mockWallets} 
          onSubmit={mockOnSubmit}
        />
      );

      // Open dialog
      await user.click(screen.getByRole('button', { name: /add transaction/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill in required fields
      await user.type(screen.getByLabelText(/merchant \/ payee/i), 'Test Merchant');
      await user.type(screen.getByPlaceholderText('0.00'), '50.00');

      // Create custom category
      const categoryButton = screen.getByRole('combobox', { name: /category/i });
      await user.click(categoryButton);

      const searchInput = screen.getByPlaceholderText(/cerca o crea categoria/i);
      await user.type(searchInput, 'customcategory');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /crea "customcategory"/i })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: /crea "customcategory"/i }));

      // Submit form - using type attribute to differentiate from trigger button
      const form = screen.getByRole('dialog').querySelector('form');
      const submitButton = within(form!).getByRole('button', { name: /add transaction/i });
      await user.click(submitButton);

      // Verify onSubmit was called with custom category
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            merchantName: 'Test Merchant',
            amountInCents: -5000, // 50.00 * 100 * -1 (expense)
            category: 'customcategory',
            wallet: 'Main Account',
          })
        );
      });
    });

    it('should submit form with existing category', async () => {
      const user = userEvent.setup();
      render(
        <AddPaymentDialog 
          wallets={mockWallets} 
          onSubmit={mockOnSubmit}
        />
      );

      // Open dialog
      await user.click(screen.getByRole('button', { name: /add transaction/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill in required fields
      await user.type(screen.getByLabelText(/merchant \/ payee/i), 'Test Merchant');
      await user.type(screen.getByPlaceholderText('0.00'), '25.50');

      // Select existing category
      const categoryButton = screen.getByRole('combobox', { name: /category/i });
      await user.click(categoryButton);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'food' })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('option', { name: 'food' }));

      // Submit form - using within to find button inside the form
      const form = screen.getByRole('dialog').querySelector('form');
      const submitButton = within(form!).getByRole('button', { name: /add transaction/i });
      await user.click(submitButton);

      // Verify onSubmit was called with existing category
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            merchantName: 'Test Merchant',
            amountInCents: -2550, // 25.50 * 100 * -1 (expense)
            category: 'food',
            wallet: 'Main Account',
          })
        );
      });
    });

    it('should validate category is required', async () => {
      const user = userEvent.setup();
      render(
        <AddPaymentDialog 
          wallets={mockWallets} 
          onSubmit={mockOnSubmit}
        />
      );

      // Open dialog
      await user.click(screen.getByRole('button', { name: /add transaction/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill in required fields except category
      await user.type(screen.getByLabelText(/merchant \/ payee/i), 'Test Merchant');
      await user.type(screen.getByPlaceholderText('0.00'), '10.00');

      // Clear the category (it might have a default value)
      const categoryButton = screen.getByRole('combobox', { name: /category/i });
      
      // Try to submit without category - the form should not submit
      const form = screen.getByRole('dialog').querySelector('form');
      const submitButton = within(form!).getByRole('button', { name: /add transaction/i });
      await user.click(submitButton);

      // OnSubmit should not be called
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Form Reset', () => {
    it('should reset category search state when form is submitted', async () => {
      const user = userEvent.setup();
      render(
        <AddPaymentDialog 
          wallets={mockWallets} 
          onSubmit={mockOnSubmit}
        />
      );

      // Open dialog and fill form
      await user.click(screen.getByRole('button', { name: /add transaction/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/merchant \/ payee/i), 'Test Merchant');
      await user.type(screen.getByPlaceholderText('0.00'), '10.00');

      // Select category
      const categoryButton = screen.getByRole('combobox', { name: /category/i });
      await user.click(categoryButton);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'food' })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('option', { name: 'food' }));

      // Submit
      const form = screen.getByRole('dialog').querySelector('form');
      const submitButton = within(form!).getByRole('button', { name: /add transaction/i });
      await user.click(submitButton);

      // Wait for dialog to close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Reopen dialog - form should be reset
      await user.click(screen.getByRole('button', { name: /add transaction/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Category should be empty (showing placeholder)
      const resetCategoryButton = screen.getByRole('combobox', { name: /category/i });
      expect(resetCategoryButton).toHaveTextContent(/seleziona o inserisci categoria/i);
    });
  });

  describe('Add & Add Another Feature', () => {
    it('should keep dialog open and preserve tags, category, and wallet when using "Add & Add Another"', async () => {
      const user = userEvent.setup();
      render(
        <AddPaymentDialog 
          wallets={mockWallets} 
          onSubmit={mockOnSubmit}
        />
      );

      // Open dialog
      await user.click(screen.getByRole('button', { name: /add transaction/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill in all fields
      await user.type(screen.getByLabelText(/merchant \/ payee/i), 'Restaurant Lunch');
      await user.type(screen.getByPlaceholderText('0.00'), '25.50');

      // Select category
      const categoryButton = screen.getByRole('combobox', { name: /category/i });
      await user.click(categoryButton);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'food' })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('option', { name: 'food' }));

      // Add description
      await user.type(screen.getByPlaceholderText(/aggiungi una nota/i), 'First expense');

      // Click "Add & Add Another" button
      const addAnotherButton = screen.getByRole('button', { name: /add & add another/i });
      await user.click(addAnotherButton);

      // Verify submission happened
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            merchantName: 'Restaurant Lunch',
            amountInCents: -2550,
            category: 'food',
          })
        );
      });

      // Dialog should still be open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Category should be preserved
      await waitFor(() => {
        expect(categoryButton).toHaveTextContent('food');
      });

      // Merchant and amount should be cleared
      expect(screen.getByLabelText(/merchant \/ payee/i)).toHaveValue('');
      expect(screen.getByPlaceholderText('0.00')).toHaveValue(null);

      // Description should be cleared
      expect(screen.getByPlaceholderText(/aggiungi una nota/i)).toHaveValue('');

      // Wallet should be preserved (Main Account is default)
      const walletSelect = screen.getByRole('combobox', { name: /wallet/i });
      expect(walletSelect).toHaveTextContent('Main Account');
    });

    it('should allow adding multiple expenses in sequence with same tags', async () => {
      const user = userEvent.setup();
      render(
        <AddPaymentDialog 
          wallets={mockWallets} 
          onSubmit={mockOnSubmit}
        />
      );

      // Open dialog
      await user.click(screen.getByRole('button', { name: /add transaction/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill first expense
      await user.type(screen.getByLabelText(/merchant \/ payee/i), 'Restaurant');
      await user.type(screen.getByPlaceholderText('0.00'), '45.50');

      const categoryButton = screen.getByRole('combobox', { name: /category/i });
      await user.click(categoryButton);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'food' })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('option', { name: 'food' }));

      // Click "Add & Add Another"
      await user.click(screen.getByRole('button', { name: /add & add another/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });

      // Dialog still open, add second expense
      await user.type(screen.getByLabelText(/merchant \/ payee/i), 'Taxi');
      await user.type(screen.getByPlaceholderText('0.00'), '12.00');

      // Category should still be 'food'
      expect(categoryButton).toHaveTextContent('food');

      // Click "Add & Add Another" again
      await user.click(screen.getByRole('button', { name: /add & add another/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(2);
      });

      // Dialog still open for third expense
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should close dialog with normal "Add Transaction" button', async () => {
      const user = userEvent.setup();
      render(
        <AddPaymentDialog 
          wallets={mockWallets} 
          onSubmit={mockOnSubmit}
        />
      );

      // Open dialog
      await user.click(screen.getByRole('button', { name: /add transaction/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill form
      await user.type(screen.getByLabelText(/merchant \/ payee/i), 'Store');
      await user.type(screen.getByPlaceholderText('0.00'), '20.00');

      const categoryButton = screen.getByRole('combobox', { name: /category/i });
      await user.click(categoryButton);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'food' })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('option', { name: 'food' }));

      // Click regular "Add Transaction" button (there are two, one inside form)
      const form = screen.getByRole('dialog').querySelector('form');
      const submitButton = within(form!).getByRole('button', { name: /^add transaction$/i });
      await user.click(submitButton);

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });
});
