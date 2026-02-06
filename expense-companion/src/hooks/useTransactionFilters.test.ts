import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { createElement, type ReactNode } from 'react';
import { useTransactionFilters } from './useTransactionFilters';

// Mock window.scrollTo
const mockScrollTo = vi.fn();
Object.defineProperty(globalThis, 'scrollTo', { value: mockScrollTo, writable: true });

// Wrapper with MemoryRouter for hooks that use useSearchParams
const createWrapper = (initialEntries: string[] = ['/']) => {
  return ({ children }: { children: ReactNode }) => 
    createElement(MemoryRouter, { initialEntries }, children);
};

describe('useTransactionFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useTransactionFilters(), {
        wrapper: createWrapper(),
      });

      expect(result.current.searchQuery).toBe('');
      expect(result.current.selectedCategory).toBe('all');
      expect(result.current.selectedWallet).toBe('all');
      expect(result.current.dateFrom).toBe('');
      expect(result.current.dateTo).toBe('');
      expect(result.current.currentPage).toBe(0);
    });

    it('should have no active filters initially', () => {
      const { result } = renderHook(() => useTransactionFilters(), {
        wrapper: createWrapper(),
      });

      expect(result.current.hasActiveFilters).toBe(false);
      expect(result.current.activeFiltersCount).toBe(0);
      expect(result.current.filters).toBeUndefined();
    });

    it('should initialize from URL parameters', () => {
      const { result } = renderHook(() => useTransactionFilters(), {
        wrapper: createWrapper(['/transactions?search=coffee&category=food&wallet=Savings&page=2']),
      });

      expect(result.current.searchQuery).toBe('coffee');
      expect(result.current.selectedCategory).toBe('food');
      expect(result.current.selectedWallet).toBe('Savings');
      expect(result.current.currentPage).toBe(2);
    });
  });

  describe('Search Query', () => {
    it('should update search query', () => {
      const { result } = renderHook(() => useTransactionFilters(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setSearchQuery('test search');
      });

      expect(result.current.searchQuery).toBe('test search');
    });

    it('should reset page when search query changes', () => {
      const { result } = renderHook(() => useTransactionFilters(), {
        wrapper: createWrapper(['/transactions?page=5']),
      });
      expect(result.current.currentPage).toBe(5);

      act(() => {
        result.current.setSearchQuery('new search');
      });
      expect(result.current.currentPage).toBe(0);
    });

    it('should include search in filters when set', () => {
      const { result } = renderHook(() => useTransactionFilters(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setSearchQuery('coffee');
      });

      expect(result.current.filters?.search).toBe('coffee');
      expect(result.current.hasActiveFilters).toBe(true);
    });
  });

  describe('Category Filter', () => {
    it('should update selected category', () => {
      const { result } = renderHook(() => useTransactionFilters(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setSelectedCategory('food');
      });

      expect(result.current.selectedCategory).toBe('food');
    });

    it('should reset page when category changes', () => {
      const { result } = renderHook(() => useTransactionFilters(), {
        wrapper: createWrapper(['/transactions?page=3']),
      });

      act(() => {
        result.current.setSelectedCategory('transport');
      });

      expect(result.current.currentPage).toBe(0);
    });

    it('should include category in filters when not "all"', () => {
      const { result } = renderHook(() => useTransactionFilters(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setSelectedCategory('shopping');
      });

      expect(result.current.filters?.category).toBe('shopping');
      expect(result.current.activeFiltersCount).toBe(1);
    });

    it('should not include category in filters when "all"', () => {
      const { result } = renderHook(() => useTransactionFilters(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setSelectedCategory('all');
      });

      expect(result.current.filters?.category).toBeUndefined();
    });
  });

  describe('Wallet Filter', () => {
    it('should update selected wallet', () => {
      const { result } = renderHook(() => useTransactionFilters(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setSelectedWallet('Savings');
      });

      expect(result.current.selectedWallet).toBe('Savings');
    });

    it('should reset page when wallet changes', () => {
      const { result } = renderHook(() => useTransactionFilters(), {
        wrapper: createWrapper(['/transactions?page=2']),
      });

      act(() => {
        result.current.setSelectedWallet('Cash');
      });

      expect(result.current.currentPage).toBe(0);
    });

    it('should include wallet in filters when not "all"', () => {
      const { result } = renderHook(() => useTransactionFilters(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setSelectedWallet('Main Account');
      });

      expect(result.current.filters?.wallet).toBe('Main Account');
      expect(result.current.activeFiltersCount).toBe(1);
    });
  });

  describe('Date Filters', () => {
    it('should update dateFrom', () => {
      const { result } = renderHook(() => useTransactionFilters(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setDateFrom('2026-01-01');
      });

      expect(result.current.dateFrom).toBe('2026-01-01');
    });

    it('should update dateTo', () => {
      const { result } = renderHook(() => useTransactionFilters(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setDateTo('2026-01-31');
      });

      expect(result.current.dateTo).toBe('2026-01-31');
    });

    it('should reset page when dateFrom changes', () => {
      const { result } = renderHook(() => useTransactionFilters(), {
        wrapper: createWrapper(['/transactions?page=4']),
      });

      act(() => {
        result.current.setDateFrom('2026-02-01');
      });

      expect(result.current.currentPage).toBe(0);
    });

    it('should reset page when dateTo changes', () => {
      const { result } = renderHook(() => useTransactionFilters(), {
        wrapper: createWrapper(['/transactions?page=4']),
      });

      act(() => {
        result.current.setDateTo('2026-02-28');
      });

      expect(result.current.currentPage).toBe(0);
    });

    it('should include dates in filters when set', () => {
      const { result } = renderHook(() => useTransactionFilters(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setDateFrom('2026-01-01');
      });
      act(() => {
        result.current.setDateTo('2026-01-31');
      });

      expect(result.current.filters?.dateFrom).toBe('2026-01-01');
      expect(result.current.filters?.dateTo).toBe('2026-01-31');
      expect(result.current.activeFiltersCount).toBe(2);
    });
  });

  describe('Clear Filters', () => {
    it('should clear all filters', () => {
      // Initialize with filters already set in URL
      const { result } = renderHook(() => useTransactionFilters(), {
        wrapper: createWrapper(['/transactions?search=test&category=food&wallet=Cash&dateFrom=2026-01-01&dateTo=2026-01-31&page=5']),
      });

      // Verify filters are set
      expect(result.current.hasActiveFilters).toBe(true);

      // Clear all
      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.searchQuery).toBe('');
      expect(result.current.selectedCategory).toBe('all');
      expect(result.current.selectedWallet).toBe('all');
      expect(result.current.dateFrom).toBe('');
      expect(result.current.dateTo).toBe('');
      expect(result.current.currentPage).toBe(0);
      expect(result.current.hasActiveFilters).toBe(false);
    });
  });

  describe('Page Change', () => {
    it('should update current page', () => {
      const { result } = renderHook(() => useTransactionFilters(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setCurrentPage(3);
      });

      expect(result.current.currentPage).toBe(3);
    });

    it('should scroll to top when page changes via handlePageChange', () => {
      const { result } = renderHook(() => useTransactionFilters(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.handlePageChange(2);
      });

      expect(result.current.currentPage).toBe(2);
      expect(mockScrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });
  });

  describe('Active Filters Count', () => {
    it('should count only non-search filters', () => {
      // Initialize with filters in URL - search is not counted
      const { result } = renderHook(() => useTransactionFilters(), {
        wrapper: createWrapper(['/transactions?search=test&category=food&wallet=Cash&dateFrom=2026-01-01&dateTo=2026-01-31']),
      });

      expect(result.current.activeFiltersCount).toBe(4);
    });

    it('should not count "all" category', () => {
      const { result } = renderHook(() => useTransactionFilters(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setSelectedCategory('all');
      });

      expect(result.current.activeFiltersCount).toBe(0);
    });
  });

  describe('Filters Object', () => {
    it('should return undefined when no filters set', () => {
      const { result } = renderHook(() => useTransactionFilters(), {
        wrapper: createWrapper(),
      });

      expect(result.current.filters).toBeUndefined();
    });

    it('should build correct filters object with all filters', () => {
      // Initialize with all filters in URL
      const { result } = renderHook(() => useTransactionFilters(), {
        wrapper: createWrapper(['/transactions?search=coffee&category=food&wallet=Main%20Account&dateFrom=2026-01-01&dateTo=2026-12-31']),
      });

      expect(result.current.filters).toEqual({
        search: 'coffee',
        category: 'food',
        wallet: 'Main Account',
        dateFrom: '2026-01-01',
        dateTo: '2026-12-31',
      });
    });

    it('should only include set filters in object', () => {
      const { result } = renderHook(() => useTransactionFilters(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setSelectedCategory('transport');
      });

      expect(result.current.filters).toEqual({
        category: 'transport',
      });
      expect(result.current.filters?.search).toBeUndefined();
      expect(result.current.filters?.wallet).toBeUndefined();
    });
  });

  describe('Has Active Filters', () => {
    it('should be true when search is set', () => {
      const { result } = renderHook(() => useTransactionFilters(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setSearchQuery('test');
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('should be true when category is not all', () => {
      const { result } = renderHook(() => useTransactionFilters(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setSelectedCategory('food');
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('should be true when wallet is not all', () => {
      const { result } = renderHook(() => useTransactionFilters(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setSelectedWallet('Savings');
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('should be true when dateFrom is set', () => {
      const { result } = renderHook(() => useTransactionFilters(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setDateFrom('2026-01-01');
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('should be true when dateTo is set', () => {
      const { result } = renderHook(() => useTransactionFilters(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setDateTo('2026-12-31');
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('should be false when all filters at default', () => {
      const { result } = renderHook(() => useTransactionFilters(), {
        wrapper: createWrapper(),
      });

      expect(result.current.hasActiveFilters).toBe(false);
    });
  });
});
