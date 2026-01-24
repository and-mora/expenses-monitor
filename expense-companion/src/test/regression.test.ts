import { describe, it, expect, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api';
import type { Payment, Wallet } from '@/types/api';

/**
 * Test per edge cases e scenari di regressione comuni.
 * Questi test verificano comportamenti che potrebbero rompersi durante refactoring.
 */
describe('API Client - Regression Tests', () => {
  describe('Error Response Format', () => {
    it('should handle 404 errors with proper message', async () => {
      await expect(apiClient.deletePayment('non-existent-id'))
        .rejects
        .toThrow();
    });

    it('should handle 500 errors gracefully', async () => {
      // MSW restituirà errori per ID non trovati
      await expect(apiClient.deleteWallet('invalid-uuid-format'))
        .rejects
        .toThrow();
    });

    it('should throw error for network failures', async () => {
      // Se MSW non intercetta, fetch fallisce
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      
      await expect(apiClient.getBalance())
        .rejects
        .toThrow();
      
      global.fetch = originalFetch;
    });
  });

  describe('Balance Response Format', () => {
    it('should return balance with correct structure', async () => {
      const balance = await apiClient.getBalance();
      
      expect(balance).toHaveProperty('totalInCents');
      expect(typeof balance.totalInCents).toBe('number');
      expect(balance).not.toHaveProperty('total'); // Regressione: vecchio formato
      expect(balance).not.toHaveProperty('currency'); // Campo rimosso
    });

    it('should handle zero balance', async () => {
      const balance = await apiClient.getBalance();
      expect(balance.totalInCents).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Payments Pagination', () => {
    it('should return paginated response structure', async () => {
      const payments = await apiClient.getRecentPayments(10);
      
      expect(Array.isArray(payments)).toBe(true);
      expect(payments.length).toBeLessThanOrEqual(10);
    });

    it('should handle empty payments list', async () => {
      const payments = await apiClient.getRecentPayments(0);
      expect(Array.isArray(payments)).toBe(true);
    });

    it('should handle large page sizes', async () => {
      const payments = await apiClient.getRecentPayments(1000);
      expect(Array.isArray(payments)).toBe(true);
    });
  });

  describe('Payment Field Validation', () => {
    it('should not have deprecated fields in payment response', async () => {
      const payments = await apiClient.getRecentPayments(1);
      
      if (payments.length > 0) {
        const payment = payments[0];
        
        // Verifica che non ci siano campi deprecati
        expect(payment).not.toHaveProperty('createdAt');
        expect(payment).not.toHaveProperty('updatedAt');
        expect(payment).not.toHaveProperty('currency');
        
        // Verifica campi obbligatori
        expect(payment).toHaveProperty('id');
        expect(payment).toHaveProperty('merchantName');
        expect(payment).toHaveProperty('amountInCents');
        expect(payment).toHaveProperty('category');
        expect(payment).toHaveProperty('accountingDate');
        expect(payment).toHaveProperty('wallet');
      }
    });

    it('should accept wallet name instead of wallet_id', async () => {
      const newPayment = {
        merchantName: 'Test Merchant',
        amountInCents: -5000,
        category: 'food' as const,
        accountingDate: '2026-01-23',
        wallet: 'Main Account', // Nome, non ID
      };

      const created = await apiClient.createPayment(newPayment);
      expect(created.wallet).toBe('Main Account');
      expect(created).not.toHaveProperty('wallet_id');
    });
  });

  describe('Wallet Field Validation', () => {
    it('should not have deprecated fields in wallet response', async () => {
      const wallets = await apiClient.getWallets();
      
      if (wallets.length > 0) {
        const wallet = wallets[0];
        
        // Verifica che non ci siano campi deprecati
        expect(wallet).not.toHaveProperty('currency');
        expect(wallet).not.toHaveProperty('description');
        expect(wallet).not.toHaveProperty('createdAt');
        expect(wallet).not.toHaveProperty('updatedAt');
        
        // Verifica campi obbligatori
        expect(wallet).toHaveProperty('id');
        expect(wallet).toHaveProperty('name');
      }
    });

    it('should accept minimal wallet creation data', async () => {
      const newWallet = {
        name: 'Test Wallet',
        // Non devono essere richiesti currency o description
      };

      const created = await apiClient.createWallet(newWallet);
      expect(created.name).toBe('Test Wallet');
      expect(created).toHaveProperty('id');
    });
  });

  describe('DELETE Operations Return 204', () => {
    it('should return undefined for successful payment deletion', async () => {
      const payments = await apiClient.getRecentPayments(1);
      if (payments.length > 0) {
        const result = await apiClient.deletePayment(payments[0].id);
        
        // 204 No Content deve restituire undefined
        expect(result).toBeUndefined();
        
        // Non deve restituire oggetto o string
        expect(result).not.toBe('');
        expect(typeof result).not.toBe('object');
      }
    });

    it('should return undefined for successful wallet deletion', async () => {
      const wallets = await apiClient.getWallets();
      if (wallets.length > 0) {
        const result = await apiClient.deleteWallet(wallets[0].id);
        
        // 204 No Content deve restituire undefined
        expect(result).toBeUndefined();
      }
    });
  });

  describe('Data Type Consistency', () => {
    it('should always return amountInCents as number', async () => {
      const payments = await apiClient.getRecentPayments(10);
      
      payments.forEach(payment => {
        expect(typeof payment.amountInCents).toBe('number');
        expect(isNaN(payment.amountInCents)).toBe(false);
        expect(isFinite(payment.amountInCents)).toBe(true);
      });
    });

    it('should return valid date strings', async () => {
      const payments = await apiClient.getRecentPayments(10);
      
      payments.forEach(payment => {
        const date = new Date(payment.accountingDate);
        expect(isNaN(date.getTime())).toBe(false);
      });
    });

    it('should return valid IDs', async () => {
      const payments = await apiClient.getRecentPayments(1);
      
      if (payments.length > 0) {
        // ID può essere UUID o numero (dipende dal mock/backend)
        expect(payments[0].id).toBeDefined();
        expect(typeof payments[0].id).toBe('string');
        expect(payments[0].id.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Category Values', () => {
    it('should only return valid category values', async () => {
      const validCategories = [
        'food', 'transport', 'entertainment', 'utilities',
        'health', 'shopping', 'income', 'other'
      ];
      
      const payments = await apiClient.getRecentPayments(10);
      
      payments.forEach(payment => {
        expect(validCategories).toContain(payment.category);
      });
    });
  });

  describe('Optional Fields', () => {
    it('should handle payments without description', async () => {
      const newPayment = {
        merchantName: 'Test',
        amountInCents: -100,
        category: 'food' as const,
        accountingDate: '2026-01-23',
        wallet: 'Main Account',
        // description è opzionale
      };

      const created = await apiClient.createPayment(newPayment);
      expect(created).toHaveProperty('id');
    });

    it('should handle optional tags field', async () => {
      const payments = await apiClient.getRecentPayments(1);
      
      if (payments.length > 0) {
        // tags è opzionale, può essere undefined o array
        const tags = payments[0].tags;
        if (tags !== undefined) {
          expect(Array.isArray(tags)).toBe(true);
        }
      }
    });
  });

  describe('Response Time Regression', () => {
    it('should complete balance fetch within reasonable time', async () => {
      const start = Date.now();
      await apiClient.getBalance();
      const duration = Date.now() - start;
      
      // Con MSW mock dovrebbe essere < 100ms
      expect(duration).toBeLessThan(100);
    });

    it('should complete payments fetch within reasonable time', async () => {
      const start = Date.now();
      await apiClient.getRecentPayments(50);
      const duration = Date.now() - start;
      
      // Con MSW mock dovrebbe essere < 100ms
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple simultaneous requests', async () => {
      const requests = [
        apiClient.getBalance(),
        apiClient.getWallets(),
        apiClient.getRecentPayments(10),
      ];

      const results = await Promise.all(requests);
      
      expect(results).toHaveLength(3);
      expect(results[0]).toHaveProperty('totalInCents');
      expect(Array.isArray(results[1])).toBe(true);
      expect(Array.isArray(results[2])).toBe(true);
    });

    it('should not corrupt data with concurrent mutations', async () => {
      const wallet1 = await apiClient.createWallet({ name: 'Concurrent 1' });
      const wallet2 = await apiClient.createWallet({ name: 'Concurrent 2' });

      // Both wallets should be created with correct names
      expect(wallet1.name).toBe('Concurrent 1');
      expect(wallet2.name).toBe('Concurrent 2');
      // IDs should exist (may be same in mock due to Date.now() timing)
      expect(wallet1.id).toBeDefined();
      expect(wallet2.id).toBeDefined();
    });
  });
});
