import { render, screen, fireEvent } from '@/test/utils';
import { describe, it, expect } from 'vitest';
import { TransactionFilters } from './TransactionFilters';
import type { Wallet, CategoryItem } from '@/types/api';

const mockWallets: Wallet[] = [
  { id: '1', name: 'Main Account' },
];

describe('TransactionFilters shape handling', () => {
  it('renders correctly when categories are objects (CategoryItem[])', () => {
    const categories: CategoryItem[] = [
      { id: 'food', name: 'food' },
      { id: 'transport', name: 'transport' },
    ];

    render(
      <TransactionFilters
        searchQuery=""
        selectedCategory="all"
        selectedWallet="all"
        dateFrom=""
        dateTo=""
        onSearchChange={() => {}}
        onCategoryChange={() => {}}
        onWalletChange={() => {}}
        onDateFromChange={() => {}}
        onDateToChange={() => {}}
        onClearFilters={() => {}}
        categories={categories}
        wallets={mockWallets}
        activeFiltersCount={0}
        hasActiveFilters={false}
      />
    );

    // Open mobile sheet to render category select (ensures mapping runs)
    const filterButton = screen.getByRole('button', { name: /filter transactions/i });
    fireEvent.click(filterButton);

    // Open category select inside sheet
    const categoryTrigger = screen.getByLabelText('Category filter');
    fireEvent.click(categoryTrigger);

    // The display names should be present (capitalized by component)
    expect(screen.getByRole('option', { name: /Food/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Transport/i })).toBeInTheDocument();
  });
});
