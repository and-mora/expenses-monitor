import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { PaymentCreate, WalletCreate } from '@/types/api';

// Query keys
export const queryKeys = {
  balance: ['balance'] as const,
  payments: ['payments'] as const,
  wallets: ['wallets'] as const,
  categories: ['categories'] as const,
};

// Balance hooks
export function useBalance() {
  return useQuery({
    queryKey: queryKeys.balance,
    queryFn: () => apiClient.getBalance(),
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

export function usePayments(page = 0, size = 50) {
  return useQuery({
    queryKey: [...queryKeys.payments, 'paged', page, size],
    queryFn: () => apiClient.getPayments(page, size),
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
