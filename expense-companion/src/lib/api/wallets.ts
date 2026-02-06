import type { Wallet, WalletCreate } from '@/types/api';
import { BaseApiClient, USE_MOCK_DATA } from './client';
import { mockWallets } from './mock-wallets';

export class WalletsApi extends BaseApiClient {
  async getWallets(): Promise<Wallet[]> {
    if (USE_MOCK_DATA) return mockWallets;
    return this.fetch<Wallet[]>('/api/wallets');
  }

  async createWallet(wallet: WalletCreate): Promise<Wallet> {
    if (USE_MOCK_DATA) {
      const newWallet: Wallet = {
        ...wallet,
        id: String(Date.now()),
      };
      mockWallets.push(newWallet);
      return newWallet;
    }
    return this.fetch<Wallet>('/api/wallets', {
      method: 'POST',
      body: JSON.stringify(wallet),
    });
  }

  async deleteWallet(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      const index = mockWallets.findIndex(w => w.id === id);
      if (index > -1) mockWallets.splice(index, 1);
      return;
    }
    await this.fetch(`/api/wallets/${id}`, { method: 'DELETE' });
  }
}
