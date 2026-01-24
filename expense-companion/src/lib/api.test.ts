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

  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      await expect(apiClient.deletePayment('non-existent-id')).rejects.toThrow();
    });
  });
});
