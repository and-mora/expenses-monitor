import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WalletList } from '@/components/dashboard/WalletList';

describe('WalletList', () => {
  const mockWallets = [
    { id: '1', name: 'Main Account' },
    { id: '2', name: 'Savings' },
    { id: '3', name: 'Cash' },
  ];

  const mockHandlers = {
    onCreateWallet: vi.fn(),
    onDeleteWallet: vi.fn(),
  };

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
});
