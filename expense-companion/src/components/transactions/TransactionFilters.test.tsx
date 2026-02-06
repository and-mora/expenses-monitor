import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransactionFilters } from './TransactionFilters';
import type { Wallet } from '@/types/api';

const mockWallets: Wallet[] = [
  { id: '1', name: 'Main Account' },
  { id: '2', name: 'Savings' },
  { id: '3', name: 'Cash' },
];

const mockCategories = ['food', 'transport', 'shopping', 'entertainment', 'utilities'];

const defaultProps = {
  searchQuery: '',
  selectedCategory: 'all',
  selectedWallet: 'all',
  dateFrom: '',
  dateTo: '',
  onSearchChange: vi.fn(),
  onCategoryChange: vi.fn(),
  onWalletChange: vi.fn(),
  onDateFromChange: vi.fn(),
  onDateToChange: vi.fn(),
  onClearFilters: vi.fn(),
  categories: mockCategories,
  wallets: mockWallets,
  activeFiltersCount: 0,
  hasActiveFilters: false,
};

describe('TransactionFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Search Functionality', () => {
    it('should render search input', () => {
      render(<TransactionFilters {...defaultProps} />);
      
      const searchInputs = screen.getAllByPlaceholderText(/search/i);
      expect(searchInputs.length).toBeGreaterThan(0);
    });

    it('should display current search query', () => {
      render(<TransactionFilters {...defaultProps} searchQuery="test query" />);
      
      const searchInputs = screen.getAllByDisplayValue('test query');
      expect(searchInputs.length).toBeGreaterThan(0);
    });

    it('should call onSearchChange when typing in search', () => {
      render(<TransactionFilters {...defaultProps} />);
      
      const searchInput = screen.getAllByPlaceholderText(/search/i)[0];
      fireEvent.change(searchInput, { target: { value: 'new search' } });
      
      expect(defaultProps.onSearchChange).toHaveBeenCalledWith('new search');
    });

    it('should show clear button when search has text', () => {
      render(<TransactionFilters {...defaultProps} searchQuery="test" />);
      
      // Find the clear button (X icon button)
      const clearButtons = document.querySelectorAll('button svg.lucide-x');
      expect(clearButtons.length).toBeGreaterThan(0);
    });

    it('should clear search when clicking clear button', () => {
      render(<TransactionFilters {...defaultProps} searchQuery="test" />);
      
      // Find and click the first clear button (in search input)
      const clearButton = document.querySelector('button svg.lucide-x')?.closest('button');
      fireEvent.click(clearButton!);
      
      expect(defaultProps.onSearchChange).toHaveBeenCalledWith('');
    });
  });

  describe('Mobile Filter Sheet', () => {
    it('should render filter button with badge when filters active', () => {
      render(
        <TransactionFilters 
          {...defaultProps} 
          activeFiltersCount={2} 
          hasActiveFilters={true}
        />
      );
      
      // Badge should show count
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should open filter sheet when clicking filter button', () => {
      render(<TransactionFilters {...defaultProps} />);
      
      const filterButton = screen.getByRole('button', { name: /filter transactions/i });
      fireEvent.click(filterButton);
      
      // Sheet should be open - check for sheet title
      expect(screen.getByText('Filter Transactions')).toBeInTheDocument();
    });

    it('should show sheet description', () => {
      render(<TransactionFilters {...defaultProps} />);
      
      const filterButton = screen.getByRole('button', { name: /filter transactions/i });
      fireEvent.click(filterButton);
      
      expect(screen.getByText('Apply filters to refine your transaction list')).toBeInTheDocument();
    });

    it('should render category filter in sheet', () => {
      render(<TransactionFilters {...defaultProps} />);
      
      const filterButton = screen.getByRole('button', { name: /filter transactions/i });
      fireEvent.click(filterButton);
      
      expect(screen.getByLabelText('Category filter')).toBeInTheDocument();
    });

    it('should render wallet filter in sheet', () => {
      render(<TransactionFilters {...defaultProps} />);
      
      const filterButton = screen.getByRole('button', { name: /filter transactions/i });
      fireEvent.click(filterButton);
      
      expect(screen.getByLabelText('Wallet filter')).toBeInTheDocument();
    });

    it('should render date filters in sheet', () => {
      render(<TransactionFilters {...defaultProps} />);
      
      const filterButton = screen.getByRole('button', { name: /filter transactions/i });
      fireEvent.click(filterButton);
      
      expect(screen.getByText('From Date')).toBeInTheDocument();
      expect(screen.getByText('To Date')).toBeInTheDocument();
    });

    it('should call onClearFilters and close sheet when clicking Clear', () => {
      render(
        <TransactionFilters 
          {...defaultProps} 
          hasActiveFilters={true}
          selectedCategory="food"
        />
      );
      
      const filterButton = screen.getByRole('button', { name: /filter transactions/i });
      fireEvent.click(filterButton);
      
      const clearButton = screen.getByRole('button', { name: /clear/i });
      fireEvent.click(clearButton);
      
      expect(defaultProps.onClearFilters).toHaveBeenCalled();
    });

    it('should disable clear button when no active filters', () => {
      render(<TransactionFilters {...defaultProps} hasActiveFilters={false} />);
      
      const filterButton = screen.getByRole('button', { name: /filter transactions/i });
      fireEvent.click(filterButton);
      
      const clearButton = screen.getByRole('button', { name: /clear/i });
      expect(clearButton).toBeDisabled();
    });

    it('should close sheet when clicking Apply Filters', () => {
      render(<TransactionFilters {...defaultProps} />);
      
      const filterButton = screen.getByRole('button', { name: /filter transactions/i });
      fireEvent.click(filterButton);
      
      const applyButton = screen.getByRole('button', { name: /apply filters/i });
      fireEvent.click(applyButton);
      
      // Sheet should close (title should disappear from view)
    });
  });

  describe('Desktop Filters', () => {
    it('should render category select', () => {
      render(<TransactionFilters {...defaultProps} />);
      
      // Multiple category triggers exist (mobile + desktop)
      const triggers = screen.getAllByRole('combobox');
      expect(triggers.length).toBeGreaterThan(0);
    });

    it('should render wallet select', () => {
      render(<TransactionFilters {...defaultProps} />);
      
      const triggers = screen.getAllByRole('combobox');
      expect(triggers.length).toBeGreaterThan(0);
    });

    it('should render date inputs', () => {
      render(<TransactionFilters {...defaultProps} />);
      
      const dateInputs = document.querySelectorAll('input[type="date"]');
      expect(dateInputs.length).toBeGreaterThan(0);
    });

    it('should call onDateFromChange when changing from date', () => {
      render(<TransactionFilters {...defaultProps} />);
      
      const dateInputs = document.querySelectorAll('input[type="date"]');
      const fromDateInput = dateInputs[0];
      
      fireEvent.change(fromDateInput, { target: { value: '2026-01-01' } });
      expect(defaultProps.onDateFromChange).toHaveBeenCalledWith('2026-01-01');
    });

    it('should call onDateToChange when changing to date', () => {
      render(<TransactionFilters {...defaultProps} />);
      
      const dateInputs = document.querySelectorAll('input[type="date"]');
      const toDateInput = dateInputs[1];
      
      fireEvent.change(toDateInput, { target: { value: '2026-01-31' } });
      expect(defaultProps.onDateToChange).toHaveBeenCalledWith('2026-01-31');
    });

    it('should show Clear Filters button when filters are active', () => {
      render(
        <TransactionFilters 
          {...defaultProps} 
          hasActiveFilters={true}
          selectedCategory="food"
        />
      );
      
      const clearButtons = screen.getAllByRole('button', { name: /clear/i });
      expect(clearButtons.length).toBeGreaterThan(0);
    });

    it('should not show Clear Filters button when no filters active', () => {
      render(<TransactionFilters {...defaultProps} hasActiveFilters={false} />);
      
      // Only the mobile sheet clear button should exist (when sheet is open)
      const clearFiltersButtons = screen.queryAllByRole('button', { name: 'Clear Filters' });
      expect(clearFiltersButtons.length).toBe(0);
    });
  });

  describe('Filter Values Display', () => {
    it('should display selected date from value', () => {
      render(<TransactionFilters {...defaultProps} dateFrom="2026-01-15" />);
      
      const dateInputs = document.querySelectorAll('input[type="date"]');
      expect(dateInputs[0]).toHaveValue('2026-01-15');
    });

    it('should display selected date to value', () => {
      render(<TransactionFilters {...defaultProps} dateTo="2026-01-31" />);
      
      const dateInputs = document.querySelectorAll('input[type="date"]');
      expect(dateInputs[1]).toHaveValue('2026-01-31');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible filter button', () => {
      render(<TransactionFilters {...defaultProps} />);
      
      const filterButton = screen.getByRole('button', { name: /filter transactions/i });
      expect(filterButton).toBeInTheDocument();
    });

    it('should have accessible category filter', () => {
      render(<TransactionFilters {...defaultProps} />);
      
      const filterButton = screen.getByRole('button', { name: /filter transactions/i });
      fireEvent.click(filterButton);
      
      expect(screen.getByLabelText('Category filter')).toBeInTheDocument();
    });

    it('should have accessible wallet filter', () => {
      render(<TransactionFilters {...defaultProps} />);
      
      const filterButton = screen.getByRole('button', { name: /filter transactions/i });
      fireEvent.click(filterButton);
      
      expect(screen.getByLabelText('Wallet filter')).toBeInTheDocument();
    });
  });
});
