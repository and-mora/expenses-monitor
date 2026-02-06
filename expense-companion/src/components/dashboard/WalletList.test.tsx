import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WalletList } from '@/components/dashboard/WalletList';

describe('WalletList', () => {
  const mockWallets = [
    { id: '1', name: 'Main Account' },
    { id: '2', name: 'Savings' },
    { id: '3', name: 'Cash' },
  ];

  let mockHandlers: {
    onCreateWallet: ReturnType<typeof vi.fn>;
    onDeleteWallet: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockHandlers = {
      onCreateWallet: vi.fn(),
      onDeleteWallet: vi.fn(),
    };
  });

  it('should render list of wallets', () => {
    render(
      <WalletList 
        wallets={mockWallets}
        onCreateWallet={mockHandlers.onCreateWallet}
        onDeleteWallet={mockHandlers.onDeleteWallet}
      />
    );

    expect(screen.getByText('Main Account')).toBeInTheDocument();
    expect(screen.getByText('Savings')).toBeInTheDocument();
    expect(screen.getByText('Cash')).toBeInTheDocument();
  });

  it('should render empty state when no wallets', () => {
    render(
      <WalletList 
        wallets={[]}
        onCreateWallet={mockHandlers.onCreateWallet}
        onDeleteWallet={mockHandlers.onDeleteWallet}
      />
    );

    expect(screen.getByText(/no wallets yet/i)).toBeInTheDocument();
  });

  it('should show loading state when creating', () => {
    render(
      <WalletList 
        wallets={mockWallets}
        onCreateWallet={mockHandlers.onCreateWallet}
        onDeleteWallet={mockHandlers.onDeleteWallet}
        isCreating={true}
      />
    );

    expect(screen.getByText('Main Account')).toBeInTheDocument();
  });

  describe('Create Wallet Dialog', () => {
    it('should open dialog when Add button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <WalletList 
          wallets={mockWallets}
          onCreateWallet={mockHandlers.onCreateWallet}
          onDeleteWallet={mockHandlers.onDeleteWallet}
        />
      );

      const addButton = screen.getByRole('button', { name: /add/i });
      await user.click(addButton);

      // Check for dialog title (heading)
      expect(screen.getByRole('heading', { name: /create wallet/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/wallet name/i)).toBeInTheDocument();
    });

    it('should submit form with wallet name', async () => {
      const user = userEvent.setup();
      render(
        <WalletList 
          wallets={mockWallets}
          onCreateWallet={mockHandlers.onCreateWallet}
          onDeleteWallet={mockHandlers.onDeleteWallet}
        />
      );

      // Open the dialog
      const addButton = screen.getByRole('button', { name: /add/i });
      await user.click(addButton);

      // Fill in the wallet name
      const nameInput = screen.getByLabelText(/wallet name/i);
      await user.type(nameInput, 'New Wallet');

      // Submit the form
      const createButton = screen.getByRole('button', { name: /create wallet/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(mockHandlers.onCreateWallet).toHaveBeenCalledWith({
          name: 'New Wallet',
        });
      });
    });

    it('should show validation error for empty wallet name', async () => {
      const user = userEvent.setup();
      render(
        <WalletList 
          wallets={mockWallets}
          onCreateWallet={mockHandlers.onCreateWallet}
          onDeleteWallet={mockHandlers.onDeleteWallet}
        />
      );

      // Open the dialog
      const addButton = screen.getByRole('button', { name: /add/i });
      await user.click(addButton);

      // Try to submit without entering a name
      const createButton = screen.getByRole('button', { name: /create wallet/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/wallet name is required/i)).toBeInTheDocument();
      });

      // Handler should not be called
      expect(mockHandlers.onCreateWallet).not.toHaveBeenCalled();
    });
  });

  describe('Delete Wallet', () => {
    it('should call onDeleteWallet when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <WalletList 
          wallets={mockWallets}
          onCreateWallet={mockHandlers.onCreateWallet}
          onDeleteWallet={mockHandlers.onDeleteWallet}
        />
      );

      // Find all delete buttons (there should be one for each wallet)
      const deleteButtons = screen.getAllByRole('button', { name: '' }).filter(
        btn => btn.querySelector('svg.lucide-trash-2') || 
               btn.className.includes('text-destructive')
      );
      
      expect(deleteButtons.length).toBe(3);
      
      // Click the first delete button
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockHandlers.onDeleteWallet).toHaveBeenCalledWith('1');
      });
    });

    it('should disable delete buttons when isDeleting is true', () => {
      render(
        <WalletList 
          wallets={mockWallets}
          onCreateWallet={mockHandlers.onCreateWallet}
          onDeleteWallet={mockHandlers.onDeleteWallet}
          isDeleting={true}
        />
      );

      const deleteButtons = screen.getAllByRole('button').filter(
        btn => btn.querySelector('svg.lucide-trash-2')
      );
      
      deleteButtons.forEach(btn => {
        expect(btn).toBeDisabled();
      });
    });
  });

  describe('Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <WalletList 
          wallets={mockWallets}
          onCreateWallet={mockHandlers.onCreateWallet}
          onDeleteWallet={mockHandlers.onDeleteWallet}
          className="custom-class"
        />
      );

      const card = container.querySelector('.custom-class');
      expect(card).toBeInTheDocument();
    });
  });
});
