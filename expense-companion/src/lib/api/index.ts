// Main API client that combines all API modules
import { API_BASE_URL, BaseApiClient } from './client';
import { PaymentsApi } from './payments';
import { WalletsApi } from './wallets';

// Combined API client class - uses composition for modularity
class ApiClient {
  private readonly paymentsApi: PaymentsApi;
  private readonly walletsApi: WalletsApi;
  private readonly baseClient: BaseApiClient;

  constructor(baseUrl: string) {
    this.baseClient = new BaseApiClient(baseUrl);
    this.paymentsApi = new PaymentsApi(baseUrl);
    this.walletsApi = new WalletsApi(baseUrl);
  }

  setToken(token: string) {
    this.baseClient.setToken(token);
    this.paymentsApi.setToken(token);
    this.walletsApi.setToken(token);
  }

  setTokenProvider(provider: () => string | undefined) {
    this.baseClient.setTokenProvider(provider);
    this.paymentsApi.setTokenProvider(provider);
    this.walletsApi.setTokenProvider(provider);
  }

  // Health
  healthCheck() {
    return this.baseClient.healthCheck();
  }

  // Payments & Balance
  getBalance(startDate?: string, endDate?: string) {
    return this.paymentsApi.getBalance(startDate, endDate);
  }

  getCategories(type?: 'expense' | 'income') {
    return this.paymentsApi.getCategories(type);
  }

  getRecentPayments(limit = 50) {
    return this.paymentsApi.getRecentPayments(limit);
  }

  getPayments(
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
    return this.paymentsApi.getPayments(page, size, filters);
  }

  createPayment(payment: Parameters<PaymentsApi['createPayment']>[0]) {
    return this.paymentsApi.createPayment(payment);
  }

  deletePayment(id: string) {
    return this.paymentsApi.deletePayment(id);
  }

  updatePayment(id: string, payment: Parameters<PaymentsApi['updatePayment']>[1]) {
    return this.paymentsApi.updatePayment(id, payment);
  }

  // Wallets
  getWallets() {
    return this.walletsApi.getWallets();
  }

  createWallet(wallet: Parameters<WalletsApi['createWallet']>[0]) {
    return this.walletsApi.createWallet(wallet);
  }

  deleteWallet(id: string) {
    return this.walletsApi.deleteWallet(id);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Re-export mock data for tests
export { mockPayments, mockCategories } from './mock-data';
export { mockWallets } from './mock-wallets';
