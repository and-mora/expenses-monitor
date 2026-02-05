import type { Payment, PaymentCreate, PaymentUpdate, Balance, CategoryItem } from '@/types/api';
import { BaseApiClient, USE_MOCK_DATA } from './client';
import { mockPayments, mockCategories } from './mock-data';

export class PaymentsApi extends BaseApiClient {
  // Balance
  async getBalance(startDate?: string, endDate?: string): Promise<Balance> {
    if (USE_MOCK_DATA) {
      const total = mockPayments.reduce((sum, p) => sum + p.amountInCents, 0);
      const income = mockPayments
        .filter(p => p.amountInCents > 0)
        .reduce((sum, p) => sum + p.amountInCents, 0);
      const expenses = mockPayments
        .filter(p => p.amountInCents < 0)
        .reduce((sum, p) => sum + p.amountInCents, 0);
      return { totalInCents: total, incomeInCents: income, expensesInCents: expenses };
    }
    
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    
    return this.fetch<Balance>(`/api/balance${query}`);
  }

  // Categories
  async getCategories(type?: 'expense' | 'income'): Promise<CategoryItem[]> {
    if (USE_MOCK_DATA) {
      const categories = mockCategories;
      if (type === 'expense') return categories.filter(c => c !== 'income');
      if (type === 'income') return categories.filter(c => c === 'income');
      return categories;
    }
    const url = type 
      ? `/api/payments/categories?type=${type}`
      : '/api/payments/categories';
    return this.fetch<CategoryItem[]>(url);
  }

  // Payments
  async getRecentPayments(limit = 50): Promise<Payment[]> {
    if (USE_MOCK_DATA) {
      return [...mockPayments]
        .sort((a, b) => new Date(b.accountingDate).getTime() - new Date(a.accountingDate).getTime())
        .slice(0, limit);
    }
    const response = await this.fetch<{ content: Payment[], page: number, size: number }>(
      `/api/payments?page=0&size=${limit}`
    );
    return response.content;
  }

  async getPayments(
    page = 0, 
    size = 50, 
    filters?: {
      dateFrom?: string;
      dateTo?: string;
      category?: string;
      wallet?: string;
      search?: string;
    }
  ): Promise<{ content: Payment[], page: number, size: number }> {
    if (USE_MOCK_DATA) {
      let filtered = [...mockPayments];
      
      // Apply filters to mock data
      if (filters?.category) {
        filtered = filtered.filter(p => p.category === filters.category);
      }
      if (filters?.wallet) {
        filtered = filtered.filter(p => p.wallet === filters.wallet);
      }
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(p => 
          p.merchantName.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower)
        );
      }
      if (filters?.dateFrom) {
        filtered = filtered.filter(p => p.accountingDate >= filters.dateFrom!);
      }
      if (filters?.dateTo) {
        filtered = filtered.filter(p => p.accountingDate <= filters.dateTo!);
      }
      
      const sorted = filtered.sort((a, b) => 
        new Date(b.accountingDate).getTime() - new Date(a.accountingDate).getTime()
      );
      const start = page * size;
      const end = start + size;
      return {
        content: sorted.slice(start, end),
        page,
        size,
      };
    }
    
    // Build query parameters
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    
    if (filters?.dateFrom) {
      params.append('dateFrom', filters.dateFrom);
    }
    if (filters?.dateTo) {
      params.append('dateTo', filters.dateTo);
    }
    if (filters?.category) {
      params.append('category', filters.category);
    }
    if (filters?.wallet) {
      params.append('wallet', filters.wallet);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    
    return this.fetch<{ content: Payment[], page: number, size: number }>(
      `/api/payments?${params.toString()}`
    );
  }

  async createPayment(payment: PaymentCreate): Promise<Payment> {
    console.log('[API] Creating payment with data:', JSON.stringify(payment, null, 2));
    
    if (USE_MOCK_DATA) {
      const newPayment: Payment = {
        ...payment,
        id: String(Date.now()),
      };
      mockPayments.unshift(newPayment); // Add at beginning for recent ordering
      console.log('[API] Mock payment created:', newPayment);
      return newPayment;
    }
    return this.fetch<Payment>('/api/payments', {
      method: 'POST',
      body: JSON.stringify(payment),
    });
  }

  async deletePayment(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      const index = mockPayments.findIndex(p => p.id === id);
      if (index > -1) mockPayments.splice(index, 1);
      return;
    }
    await this.fetch(`/api/payments/${id}`, { method: 'DELETE' });
  }

  async updatePayment(id: string, payment: PaymentUpdate): Promise<Payment> {
    console.log('[API] Updating payment:', id, 'with data:', JSON.stringify(payment, null, 2));
    
    if (USE_MOCK_DATA) {
      const index = mockPayments.findIndex(p => p.id === id);
      if (index > -1) {
        mockPayments[index] = { ...payment, id };
      }
      console.log('[API] Mock payment updated:', mockPayments[index]);
      return mockPayments[index];
    }
    return this.fetch<Payment>(`/api/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payment),
    });
  }
}
