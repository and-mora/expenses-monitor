import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePayments, useRecentPayments } from './use-api';
import { apiClient } from '@/lib/api';

// Mock the API client
vi.mock('@/lib/api', () => ({
  apiClient: {
    getPayments: vi.fn(),
    getRecentPayments: vi.fn(),
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
        .mockResolvedValueOnce(mockResponsePage0 as any)
        .mockResolvedValueOnce(mockResponsePage1 as any);

      // Fetch page 0
      const { result: result0, rerender } = renderHook(
        ({ page, size }) => usePayments(page, size),
        {
          wrapper: createWrapper(),
          initialProps: { page: 0, size: 50 },
        }
      );

      await waitFor(() => {
        expect(result0.current.isLoading).toBe(false);
      });

      expect(result0.current.data?.content[0].merchantName).toBe('Page 0');

      // Fetch page 1
      rerender({ page: 1, size: 50 });

      await waitFor(() => {
        expect(result0.current.data?.content[0].merchantName).toBe('Page 1');
      });

      // Should have called API at least twice (once for each page)
      // TanStack Query may make additional calls for refetching
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
});
