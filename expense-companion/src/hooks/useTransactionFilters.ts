import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

// URL parameter keys
const PARAM_SEARCH = 'search';
const PARAM_CATEGORY = 'category';
const PARAM_WALLET = 'wallet';
const PARAM_DATE_FROM = 'dateFrom';
const PARAM_DATE_TO = 'dateTo';
const PARAM_PAGE = 'page';

export interface TransactionFiltersState {
  searchQuery: string;
  selectedCategory: string;
  selectedWallet: string;
  dateFrom: string;
  dateTo: string;
  currentPage: number;
}

export interface TransactionFiltersActions {
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedWallet: (wallet: string) => void;
  setDateFrom: (date: string) => void;
  setDateTo: (date: string) => void;
  setCurrentPage: (page: number) => void;
  clearFilters: () => void;
  handlePageChange: (newPage: number) => void;
}

export interface TransactionFiltersComputed {
  filters: {
    category?: string;
    wallet?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  } | undefined;
  activeFiltersCount: number;
  hasActiveFilters: boolean;
}

export type UseTransactionFiltersReturn = TransactionFiltersState & 
  TransactionFiltersActions & 
  TransactionFiltersComputed;

export function useTransactionFilters(): UseTransactionFiltersReturn {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read state from URL parameters
  const searchQuery = searchParams.get(PARAM_SEARCH) || '';
  const selectedCategory = searchParams.get(PARAM_CATEGORY) || 'all';
  const selectedWallet = searchParams.get(PARAM_WALLET) || 'all';
  const dateFrom = searchParams.get(PARAM_DATE_FROM) || '';
  const dateTo = searchParams.get(PARAM_DATE_TO) || '';
  const currentPage = parseInt(searchParams.get(PARAM_PAGE) || '0', 10);

  // Helper to update a single parameter (keeps other params)
  const updateParam = useCallback((key: string, value: string, resetPage = true) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value && value !== 'all' && value !== '0') {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      if (resetPage && key !== PARAM_PAGE) {
        next.delete(PARAM_PAGE);
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // Build filters object for API
  const filters = useMemo(() => {
    const apiFilters: {
      category?: string;
      wallet?: string;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {};
    
    if (selectedCategory !== 'all') {
      apiFilters.category = selectedCategory;
    }
    if (selectedWallet !== 'all') {
      apiFilters.wallet = selectedWallet;
    }
    if (searchQuery) {
      apiFilters.search = searchQuery;
    }
    if (dateFrom) {
      apiFilters.dateFrom = dateFrom;
    }
    if (dateTo) {
      apiFilters.dateTo = dateTo;
    }
    
    return Object.keys(apiFilters).length > 0 ? apiFilters : undefined;
  }, [searchQuery, selectedCategory, selectedWallet, dateFrom, dateTo]);

  // Count active filters (excluding search)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (selectedWallet !== 'all') count++;
    if (dateFrom) count++;
    if (dateTo) count++;
    return count;
  }, [selectedCategory, selectedWallet, dateFrom, dateTo]);

  const hasActiveFilters = !!(searchQuery || selectedCategory !== 'all' || selectedWallet !== 'all' || dateFrom || dateTo);

  const clearFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const handlePageChange = useCallback((newPage: number) => {
    updateParam(PARAM_PAGE, String(newPage), false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [updateParam]);

  // Wrapped setters that reset page
  const setSearchQueryWithReset = useCallback((query: string) => {
    updateParam(PARAM_SEARCH, query);
  }, [updateParam]);

  const setCategoryWithReset = useCallback((category: string) => {
    updateParam(PARAM_CATEGORY, category);
  }, [updateParam]);

  const setWalletWithReset = useCallback((wallet: string) => {
    updateParam(PARAM_WALLET, wallet);
  }, [updateParam]);

  const setDateFromWithReset = useCallback((date: string) => {
    updateParam(PARAM_DATE_FROM, date);
  }, [updateParam]);

  const setDateToWithReset = useCallback((date: string) => {
    updateParam(PARAM_DATE_TO, date);
  }, [updateParam]);

  const setCurrentPage = useCallback((page: number) => {
    updateParam(PARAM_PAGE, String(page), false);
  }, [updateParam]);

  return {
    // State
    searchQuery,
    selectedCategory,
    selectedWallet,
    dateFrom,
    dateTo,
    currentPage,
    // Actions
    setSearchQuery: setSearchQueryWithReset,
    setSelectedCategory: setCategoryWithReset,
    setSelectedWallet: setWalletWithReset,
    setDateFrom: setDateFromWithReset,
    setDateTo: setDateToWithReset,
    setCurrentPage,
    clearFilters,
    handlePageChange,
    // Computed
    filters,
    activeFiltersCount,
    hasActiveFilters,
  };
}
