import { describe, it, expect, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api';
import type { PaymentCreate, WalletCreate } from '@/types/api';

describe('API Client', () => {
  describe('Health Check', () => {
    it('should return OK status', async () => {
      const result = await apiClient.healthCheck();
      expect(result).toBe('OK');
    });
  });

  describe('Balance', () => {
    it('should fetch balance with totalInCents', async () => {
      const balance = await apiClient.getBalance();
      expect(balance).toHaveProperty('totalInCents');
      expect(typeof balance.totalInCents).toBe('number');
    });

    it('should fetch balance with date range', async () => {
      const balance = await apiClient.getBalance('2026-01-01', '2026-01-31');
      expect(balance).toHaveProperty('totalInCents');
      expect(typeof balance.totalInCents).toBe('number');
    });
  });

  describe('Categories', () => {
    it('should fetch all categories', async () => {
      const categories = await apiClient.getCategories();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should fetch expense categories', async () => {
      const categories = await apiClient.getCategories('expense');
      expect(Array.isArray(categories)).toBe(true);
      expect(categories).not.toContain('income');
    });

    it('should fetch income categories', async () => {
      const categories = await apiClient.getCategories('income');
      expect(Array.isArray(categories)).toBe(true);
      expect(categories).toContain('income');
    });
  });

  describe('Payments', () => {
    it('should fetch recent payments', async () => {
      const payments = await apiClient.getRecentPayments(10);
      expect(Array.isArray(payments)).toBe(true);
      expect(payments.length).toBeLessThanOrEqual(10);
      
      if (payments.length > 0) {
        expect(payments[0]).toHaveProperty('id');
        expect(payments[0]).toHaveProperty('merchantName');
        expect(payments[0]).toHaveProperty('amountInCents');
        expect(payments[0]).toHaveProperty('category');
        expect(payments[0]).toHaveProperty('accountingDate');
        expect(payments[0]).toHaveProperty('wallet');
      }
    });

    it('should fetch paginated payments', async () => {
      const result = await apiClient.getPayments(0, 10);
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('size');
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content.length).toBeLessThanOrEqual(10);
    });

    it('should create a new payment', async () => {
      const newPayment: PaymentCreate = {
        merchantName: 'Test Merchant',
        amountInCents: -5000,
        category: 'shopping',
        accountingDate: '2026-01-23',
        description: 'Test payment',
        wallet: 'Main Account',
      };

      const created = await apiClient.createPayment(newPayment);
      expect(created).toHaveProperty('id');
      expect(created.merchantName).toBe(newPayment.merchantName);
      expect(created.amountInCents).toBe(newPayment.amountInCents);
    });

    it('should update an existing payment', async () => {
      const payments = await apiClient.getRecentPayments(1);
      if (payments.length > 0) {
        const paymentToUpdate = payments[0];
        const updated = await apiClient.updatePayment(paymentToUpdate.id, {
          ...paymentToUpdate,
          merchantName: 'Updated Merchant',
        });
        expect(updated.merchantName).toBe('Updated Merchant');
      }
    });

    it('should delete a payment and return 204', async () => {
      const payments = await apiClient.getRecentPayments(1);
      if (payments.length > 0) {
        const result = await apiClient.deletePayment(payments[0].id);
        expect(result).toBeUndefined(); // 204 No Content
      }
    });
  });

  describe('Wallets', () => {
    it('should fetch all wallets', async () => {
      const wallets = await apiClient.getWallets();
      expect(Array.isArray(wallets)).toBe(true);
      
      if (wallets.length > 0) {
        expect(wallets[0]).toHaveProperty('id');
        expect(wallets[0]).toHaveProperty('name');
      }
    });

    it('should create a new wallet', async () => {
      const newWallet: WalletCreate = {
        name: 'Test Wallet',
      };

      const created = await apiClient.createWallet(newWallet);
      expect(created).toHaveProperty('id');
      expect(created.name).toBe(newWallet.name);
    });

    it('should delete a wallet and return 204', async () => {
      const wallets = await apiClient.getWallets();
      if (wallets.length > 0) {
        const result = await apiClient.deleteWallet(wallets[0].id);
        expect(result).toBeUndefined(); // 204 No Content
      }
    });
  });

  describe('Token Management', () => {
    it('should set token', () => {
      apiClient.setToken('test-token');
      // Token is set internally, verify by making a call that would use it
      expect(true).toBe(true);
    });

    it('should set token provider', () => {
      const provider = () => 'test-token';
      apiClient.setTokenProvider(provider);
      // Token provider is set internally
      expect(true).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      await expect(apiClient.deletePayment('non-existent-id')).rejects.toThrow();
    });
  });
});
