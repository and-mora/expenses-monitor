import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  usePayments,
  useRecentPayments,
  useBalance,
  useCategories,
  useWallets,
  useCreatePayment,
  useDeletePayment,
  useCreateWallet,
  useDeleteWallet,
} from './use-api';
import { apiClient } from '@/lib/api';

// Mock the API client
vi.mock('@/lib/api', () => ({
  apiClient: {
    getPayments: vi.fn(),
    getRecentPayments: vi.fn(),
    getBalance: vi.fn(),
    getCategories: vi.fn(),
    getWallets: vi.fn(),
    createPayment: vi.fn(),
    deletePayment: vi.fn(),
    createWallet: vi.fn(),
    deleteWallet: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('API Hooks - Pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('usePayments', () => {
    it('should fetch payments with default page and size', async () => {
      const mockResponse = {
        content: [
          {
            id: '1',
            merchantName: 'Test',
            amountInCents: -1000,
            category: 'food',
            accountingDate: '2026-01-31',
            description: 'Test',
            wallet: 'Main',
            tags: [],
          },
        ],
        page: 0,
        size: 50,
      };

      vi.mocked(apiClient.getPayments).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => usePayments(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(apiClient.getPayments).toHaveBeenCalledWith(0, 50);
      expect(result.current.data).toEqual(mockResponse);
    });

    it('should fetch payments with custom page and size', async () => {
      const mockResponse = {
        content: [],
        page: 2,
        size: 25,
      };

      vi.mocked(apiClient.getPayments).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => usePayments(2, 25), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(apiClient.getPayments).toHaveBeenCalledWith(2, 25);
      expect(result.current.data?.page).toBe(2);
      expect(result.current.data?.size).toBe(25);
    });

    it('should return paged response structure', async () => {
      const mockPayments = [
        {
          id: '1',
          merchantName: 'Store 1',
          amountInCents: -1000,
          category: 'food',
          accountingDate: '2026-01-31',
          description: '',
          wallet: 'Main',
          tags: [],
        },
        {
          id: '2',
          merchantName: 'Store 2',
          amountInCents: -2000,
          category: 'shopping',
          accountingDate: '2026-01-30',
          description: '',
          wallet: 'Main',
          tags: [],
        },
      ];

      const mockResponse = {
        content: mockPayments,
        page: 1,
        size: 50,
      };

      vi.mocked(apiClient.getPayments).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => usePayments(1, 50), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveProperty('content');
      expect(result.current.data).toHaveProperty('page');
      expect(result.current.data).toHaveProperty('size');
      expect(result.current.data?.content).toHaveLength(2);
    });

    it('should cache results with different page numbers', async () => {
      const mockResponsePage0 = {
        content: [{ id: '1', merchantName: 'Page 0', amountInCents: -1000 }],
        page: 0,
        size: 50,
      };

      const mockResponsePage1 = {
        content: [{ id: '2', merchantName: 'Page 1', amountInCents: -2000 }],
        page: 1,
        size: 50,
      };

      vi.mocked(apiClient.getPayments)
        .mockResolvedValueOnce(mockResponsePage0 as PaginatedResponse<Payment>)
        .mockResolvedValueOnce(mockResponsePage1 as PaginatedResponse<Payment>);

      // Create separate QueryClients to ensure fresh cache for each test
      const queryClient1 = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      const wrapper1 = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient1}>
          {children}
        </QueryClientProvider>
      );

      // Fetch page 0
      const { result: result0, unmount } = renderHook(
        () => usePayments(0, 50),
        {
          wrapper: wrapper1,
        }
      );

      await waitFor(() => {
        expect(result0.current.isLoading).toBe(false);
      });

      expect(result0.current.data?.content[0].merchantName).toBe('Page 0');

      // Unmount and create new instance for page 1
      unmount();

      // Create fresh QueryClient for page 1
      const queryClient2 = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      const wrapper2 = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient2}>
          {children}
        </QueryClientProvider>
      );

      // Fetch page 1 with fresh QueryClient
      const { result: result1 } = renderHook(
        () => usePayments(1, 50),
        {
          wrapper: wrapper2,
        }
      );

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
      });

      expect(result1.current.data?.content[0].merchantName).toBe('Page 1');

      // Should have called API twice (once for each page)
      expect(apiClient.getPayments).toHaveBeenCalledTimes(2);
      expect(apiClient.getPayments).toHaveBeenCalledWith(0, 50);
      expect(apiClient.getPayments).toHaveBeenCalledWith(1, 50);
    });
  });

  describe('useRecentPayments', () => {
    it('should fetch recent payments and extract content', async () => {
      const mockResponse = {
        content: [
          {
            id: '1',
            merchantName: 'Recent',
            amountInCents: -1000,
            category: 'food',
            accountingDate: '2026-01-31',
            description: '',
            wallet: 'Main',
            tags: [],
          },
        ],
        page: 0,
        size: 50,
      };

      vi.mocked(apiClient.getRecentPayments).mockResolvedValue(mockResponse.content);

      const { result } = renderHook(() => useRecentPayments(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(apiClient.getRecentPayments).toHaveBeenCalledWith(50);
      expect(result.current.data).toEqual(mockResponse.content);
      expect(Array.isArray(result.current.data)).toBe(true);
    });

    it('should fetch with custom limit', async () => {
      vi.mocked(apiClient.getRecentPayments).mockResolvedValue([]);

      const { result } = renderHook(() => useRecentPayments(100), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(apiClient.getRecentPayments).toHaveBeenCalledWith(100);
    });
  });

  describe('Query Key Generation', () => {
    it('should use different query keys for different pages', async () => {
      vi.mocked(apiClient.getPayments).mockResolvedValue({
        content: [],
        page: 0,
        size: 50,
      });

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      // Fetch page 0
      renderHook(() => usePayments(0, 50), { wrapper });

      await waitFor(() => {
        const cacheKeys = queryClient.getQueryCache().getAll().map(q => q.queryKey);
        expect(cacheKeys).toContainEqual(['payments', 'paged', 0, 50]);
      });

      // Fetch page 1
      renderHook(() => usePayments(1, 50), { wrapper });

      await waitFor(() => {
        const cacheKeys = queryClient.getQueryCache().getAll().map(q => q.queryKey);
        expect(cacheKeys).toContainEqual(['payments', 'paged', 0, 50]);
        expect(cacheKeys).toContainEqual(['payments', 'paged', 1, 50]);
      });
    });

    it('should use different query keys for recent vs paged', async () => {
      vi.mocked(apiClient.getPayments).mockResolvedValue({
        content: [],
        page: 0,
        size: 50,
      });
      vi.mocked(apiClient.getRecentPayments).mockResolvedValue([]);

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      renderHook(() => useRecentPayments(50), { wrapper });
      renderHook(() => usePayments(0, 50), { wrapper });

      await waitFor(() => {
        const cacheKeys = queryClient.getQueryCache().getAll().map(q => q.queryKey);
        expect(cacheKeys).toContainEqual(['payments', 'recent', 50]);
        expect(cacheKeys).toContainEqual(['payments', 'paged', 0, 50]);
      });
    });
  });

  describe('useBalance', () => {
    it('should fetch balance data', async () => {
      const mockBalance = {
        total: 1000.50,
        income: 5000,
        expenses: -3999.50,
      };

      vi.mocked(apiClient.getBalance).mockResolvedValue(mockBalance);

      const { result } = renderHook(() => useBalance(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(apiClient.getBalance).toHaveBeenCalled();
      expect(result.current.data).toEqual(mockBalance);
    });

    it('should handle balance fetch errors', async () => {
      vi.mocked(apiClient.getBalance).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useBalance(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('useCategories', () => {
    it('should fetch categories list', async () => {
      const mockCategories = ['food', 'transport', 'entertainment'];

      vi.mocked(apiClient.getCategories).mockResolvedValue(mockCategories);

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(apiClient.getCategories).toHaveBeenCalled();
      expect(result.current.data).toEqual(mockCategories);
    });
  });

  describe('useWallets', () => {
    it('should fetch wallets list', async () => {
      const mockWallets = [
        { id: '1', name: 'Main Wallet', balance: 1000 },
        { id: '2', name: 'Savings', balance: 5000 },
      ];

      vi.mocked(apiClient.getWallets).mockResolvedValue(mockWallets);

      const { result } = renderHook(() => useWallets(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(apiClient.getWallets).toHaveBeenCalled();
      expect(result.current.data).toEqual(mockWallets);
    });
  });

  describe('useCreatePayment', () => {
    it('should create a payment and invalidate related queries', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const mockPayment = {
        merchantName: 'Test Merchant',
        amountInCents: -1000,
        category: 'food',
        accountingDate: '2026-01-31',
        description: 'Test payment',
        wallet: 'Main',
        tags: [],
      };

      vi.mocked(apiClient.createPayment).mockResolvedValue({
        id: '123',
        ...mockPayment,
      });

      const { result } = renderHook(() => useCreatePayment(), { wrapper });

      await result.current.mutateAsync(mockPayment);

      expect(apiClient.createPayment).toHaveBeenCalledWith(mockPayment);
    });

    it('should handle create payment errors', async () => {
      vi.mocked(apiClient.createPayment).mockRejectedValue(new Error('Validation error'));

      const { result } = renderHook(() => useCreatePayment(), {
        wrapper: createWrapper(),
      });

      await expect(result.current.mutateAsync({
        merchantName: 'Test',
        amountInCents: -1000,
        category: 'food',
        accountingDate: '2026-01-31',
        description: '',
        wallet: 'Main',
        tags: [],
      })).rejects.toThrow('Validation error');
    });
  });

  describe('useDeletePayment', () => {
    it('should delete a payment and invalidate related queries', async () => {
      vi.mocked(apiClient.deletePayment).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeletePayment(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync('payment-123');

      expect(apiClient.deletePayment).toHaveBeenCalledWith('payment-123');
    });

    it('should handle delete payment errors', async () => {
      vi.mocked(apiClient.deletePayment).mockRejectedValue(new Error('Not found'));

      const { result } = renderHook(() => useDeletePayment(), {
        wrapper: createWrapper(),
      });

      await expect(result.current.mutateAsync('invalid-id')).rejects.toThrow('Not found');
    });
  });

  describe('useCreateWallet', () => {
    it('should create a wallet and invalidate wallets query', async () => {
      const mockWallet = {
        name: 'New Wallet',
      };

      vi.mocked(apiClient.createWallet).mockResolvedValue({
        id: '456',
        ...mockWallet,
        balance: 0,
      });

      const { result } = renderHook(() => useCreateWallet(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync(mockWallet);

      expect(apiClient.createWallet).toHaveBeenCalledWith(mockWallet);
    });
  });

  describe('useDeleteWallet', () => {
    it('should delete a wallet and invalidate wallets query', async () => {
      vi.mocked(apiClient.deleteWallet).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteWallet(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync('wallet-123');

      expect(apiClient.deleteWallet).toHaveBeenCalledWith('wallet-123');
    });
  });
});
