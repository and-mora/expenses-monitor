import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type {
  PaymentCreate,
  WalletCreate,
  BankingConnectRequest,
  StagingImportRequest,
  StagingTransactionFilters,
  StagingTransactionUpdate,
} from '@/types/api';

// Query keys
export const queryKeys = {
  balance: ['balance'] as const,
  payments: ['payments'] as const,
  wallets: ['wallets'] as const,
  categories: ['categories'] as const,
  banking: ['banking'] as const,
  staging: ['staging'] as const,
};

// Balance hooks
export function useBalance(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: [...queryKeys.balance, startDate, endDate],
    queryFn: () => apiClient.getBalance(startDate, endDate),
    staleTime: 30000, // 30 seconds
  });
}

// Categories hooks
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => apiClient.getCategories(),
    staleTime: 300000, // 5 minutes - categories rarely change
  });
}

// Payment hooks
export function useRecentPayments(limit = 50) {
  return useQuery({
    queryKey: [...queryKeys.payments, 'recent', limit],
    queryFn: () => apiClient.getRecentPayments(limit),
    staleTime: 10000, // 10 seconds
  });
}

export function usePayments(
  page = 0, 
  size = 50,
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    category?: string;
    wallet?: string;
    search?: string;
  }
) {
  return useQuery({
    queryKey: [...queryKeys.payments, 'paged', page, size, filters],
    queryFn: () => apiClient.getPayments(page, size, filters),
    staleTime: 10000, // 10 seconds
  });
}

export function usePayment(id: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.payments, id],
    queryFn: () => (id ? apiClient.getPayment(id) : Promise.reject(new Error('No ID provided'))),
    enabled: !!id,
    staleTime: 60000, // 1 minute
  });
}

export function useInfinitePayments(
  size = 50,
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    category?: string;
    wallet?: string;
    search?: string;
  }
) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.payments, 'infinite', size, filters],
    queryFn: ({ pageParam = 0 }) => apiClient.getPayments(pageParam, size, filters),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // If we got fewer items than requested, there are no more pages
      if (lastPage.content.length < size) {
        return undefined;
      }
      // Next page number
      return allPages.length;
    },
    staleTime: 10000, // 10 seconds
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payment: PaymentCreate) => apiClient.createPayment(payment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments });
      queryClient.invalidateQueries({ queryKey: queryKeys.balance });
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deletePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments });
      queryClient.invalidateQueries({ queryKey: queryKeys.balance });
    },
  });
}

// Wallet hooks
export function useWallets() {
  return useQuery({
    queryKey: queryKeys.wallets,
    queryFn: () => apiClient.getWallets(),
    staleTime: 60000, // 1 minute
  });
}

export function useCreateWallet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (wallet: WalletCreate) => apiClient.createWallet(wallet),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallets });
    },
  });
}

export function useDeleteWallet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteWallet(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallets });
    },
  });
}

// Banking hooks
export function useBankConnections() {
  return useQuery({
    queryKey: [...queryKeys.banking, 'connections'],
    queryFn: () => apiClient.getBankConnections(),
    staleTime: 10_000,
  });
}

export function useBankConnectionSyncStatus(connectionId: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.banking, 'sync-status', connectionId],
    queryFn: () => (connectionId ? apiClient.getBankConnectionSyncStatus(connectionId) : Promise.reject(new Error('No connection id provided'))),
    enabled: !!connectionId,
    staleTime: 10_000,
  });
}

export function useStagingTransactions(filters: StagingTransactionFilters) {
  return useQuery({
    queryKey: [...queryKeys.staging, 'transactions', filters],
    queryFn: () => apiClient.getStagingTransactions(filters),
    staleTime: 10_000,
  });
}

export function useConnectBankConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: BankingConnectRequest) => apiClient.connectBankConnection(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.banking });
    },
  });
}

export function useSyncBankConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (connectionId: string) => apiClient.syncBankConnection(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.banking });
      queryClient.invalidateQueries({ queryKey: queryKeys.staging });
    },
  });
}

export function useUpdateStagingTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, transaction }: { id: string; transaction: StagingTransactionUpdate }) =>
      apiClient.updateStagingTransaction(id, transaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staging });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments });
    },
  });
}

export function useImportStagingTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: StagingImportRequest) => apiClient.importStagingTransactions(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staging });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments });
      queryClient.invalidateQueries({ queryKey: queryKeys.balance });
    },
  });
}
