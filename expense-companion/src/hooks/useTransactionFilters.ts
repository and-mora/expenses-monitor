import { useCallback, useMemo, useState } from 'react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWallet, setSelectedWallet] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(0);

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
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedWallet('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(0);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Wrapped setters that reset page
  const setSearchQueryWithReset = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(0);
  }, []);

  const setCategoryWithReset = useCallback((category: string) => {
    setSelectedCategory(category);
    setCurrentPage(0);
  }, []);

  const setWalletWithReset = useCallback((wallet: string) => {
    setSelectedWallet(wallet);
    setCurrentPage(0);
  }, []);

  const setDateFromWithReset = useCallback((date: string) => {
    setDateFrom(date);
    setCurrentPage(0);
  }, []);

  const setDateToWithReset = useCallback((date: string) => {
    setDateTo(date);
    setCurrentPage(0);
  }, []);

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
