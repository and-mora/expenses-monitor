import { BaseApiClient, USE_MOCK_DATA } from './client';
import {
  mockBankConnections,
  mockStagingTransactions,
} from './mock-banking';
import type {
  BankingConnectRequest,
  BankingConnectResponse,
  BankingConnectionSummary,
  BankingSyncResponse,
  BankingSyncStatusResponse,
  PaginatedResponse,
  StagingImportRequest,
  StagingImportResponse,
  StagingTransaction,
  StagingTransactionFilters,
  StagingTransactionUpdate,
} from '@/types/api';

const cloneConnection = (connection: BankingConnectionSummary): BankingConnectionSummary => ({
  ...connection,
  accounts: connection.accounts ? connection.accounts.map((account) => ({ ...account })) : undefined,
});

const cloneTransaction = (transaction: StagingTransaction): StagingTransaction => ({
  ...transaction,
});

function applyTransactionFilters(
  transactions: StagingTransaction[],
  filters?: StagingTransactionFilters,
): StagingTransaction[] {
  if (!filters) return transactions;

  return transactions
    .filter((transaction) => !filters.connectionId || transaction.connectionId === filters.connectionId)
    .filter((transaction) => !filters.status || filters.status === 'all' || transaction.status === filters.status)
    .filter((transaction) => !filters.dateFrom || transaction.bookingDate >= filters.dateFrom)
    .filter((transaction) => !filters.dateTo || transaction.bookingDate <= filters.dateTo);
}

export class BankingApi extends BaseApiClient {
  async connectConnection(request: BankingConnectRequest): Promise<BankingConnectResponse> {
    if (USE_MOCK_DATA) {
      const connectionId = `conn-${Date.now()}`;
      const newConnection: BankingConnectionSummary = {
        connectionId,
        provider: request.provider,
        connectionLabel: request.connectionLabel || 'New bank connection',
        accountId: request.accountId || null,
        accountLabel: request.connectionLabel || request.accountId || 'Pending account',
        status: 'pending',
        lastSyncStatus: 'pending',
        lastSyncAt: null,
        lastSyncMessage: 'Waiting for authorization',
        createdCount: 0,
        updatedCount: 0,
        duplicateCount: 0,
        syncedAt: null,
        accounts: request.accountId
          ? [
              {
                accountId: request.accountId,
                accountLabel: request.connectionLabel || request.accountId,
                currency: 'EUR',
                balanceInCents: null,
              },
            ]
          : undefined,
      };

      mockBankConnections.unshift(newConnection);

      return {
        connectionId,
        provider: request.provider,
        authorizationUrl: request.redirectUri || 'https://mock-bank.example/oauth/authorize',
        state: `state-${Date.now()}`,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      };
    }

    return this.fetch<BankingConnectResponse>('/banking/connect', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async completeConnection(code: string, state: string, provider: string): Promise<BankingConnectionSummary> {
    const params = new URLSearchParams({ code, state, provider });

    if (USE_MOCK_DATA) {
      return cloneConnection(mockBankConnections[0]);
    }

    return this.fetch<BankingConnectionSummary>(`/banking/callback?${params.toString()}`);
  }

  async getConnections(): Promise<BankingConnectionSummary[]> {
    if (USE_MOCK_DATA) {
      return mockBankConnections.map(cloneConnection);
    }

    return this.fetch<BankingConnectionSummary[]>('/banking/accounts');
  }

  async syncConnection(connectionId: string): Promise<BankingSyncResponse> {
    if (USE_MOCK_DATA) {
      const connection = mockBankConnections.find((item) => item.connectionId === connectionId);
      if (!connection) {
        throw new Error('Connection not found');
      }

      const now = new Date().toISOString();
      connection.status = 'connected';
      connection.lastSyncAt = now;
      connection.lastSyncStatus = 'success';
      connection.lastSyncMessage = 'Synced successfully';
      connection.createdCount = 1;
      connection.updatedCount = 0;
      connection.duplicateCount = 0;
      connection.syncedAt = now;

      return {
        connectionId,
        provider: connection.provider,
        connectionStatus: connection.status,
        createdCount: 1,
        updatedCount: 0,
        duplicateCount: 0,
        syncedAt: now,
      };
    }

    return this.fetch<BankingSyncResponse>(`/banking/sync/${connectionId}`, {
      method: 'POST',
    });
  }

  async getConnectionSyncStatus(connectionId: string): Promise<BankingSyncStatusResponse> {
    if (USE_MOCK_DATA) {
      const connection = mockBankConnections.find((item) => item.connectionId === connectionId);
      if (!connection) {
        throw new Error('Connection not found');
      }

      return {
        connectionId,
        provider: connection.provider,
        connectionStatus: connection.status,
        lastSyncAt: connection.lastSyncAt,
        lastSyncStatus: connection.lastSyncStatus,
        createdCount: connection.createdCount,
        updatedCount: connection.updatedCount,
        duplicateCount: connection.duplicateCount,
        lastError: connection.lastSyncStatus === 'failed' ? connection.lastSyncMessage ?? 'Unknown sync error' : null,
      };
    }

    return this.fetch<BankingSyncStatusResponse>(`/banking/sync/${connectionId}/status`);
  }

  async getStagingTransactions(
    filters: StagingTransactionFilters = {},
  ): Promise<PaginatedResponse<StagingTransaction>> {
    const page = filters.page ?? 0;
    const size = filters.size ?? 20;

    if (USE_MOCK_DATA) {
      const filtered = applyTransactionFilters([...mockStagingTransactions], filters).sort((left, right) =>
        right.bookingDate.localeCompare(left.bookingDate) || right.updatedAt.localeCompare(left.updatedAt),
      );

      const start = page * size;
      const end = start + size;

      return {
        content: filtered.slice(start, end).map(cloneTransaction),
        page,
        size,
        totalElements: filtered.length,
        totalPages: Math.ceil(filtered.length / size),
      };
    }

    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    if (filters.status && filters.status !== 'all') {
      params.set('status', filters.status);
    }
    if (filters.dateFrom) {
      params.set('dateFrom', filters.dateFrom);
    }
    if (filters.dateTo) {
      params.set('dateTo', filters.dateTo);
    }
    if (filters.connectionId) {
      params.set('connectionId', filters.connectionId);
    }

    return this.fetch<PaginatedResponse<StagingTransaction>>(`/staging/transactions?${params.toString()}`);
  }

  async updateStagingTransaction(id: string, transaction: StagingTransactionUpdate): Promise<StagingTransaction> {
    if (USE_MOCK_DATA) {
      const index = mockStagingTransactions.findIndex((item) => item.id === id);
      if (index === -1) {
        throw new Error('Staging transaction not found');
      }

      const updated: StagingTransaction = {
        ...mockStagingTransactions[index],
        ...transaction,
        updatedAt: new Date().toISOString(),
      };

      mockStagingTransactions[index] = updated;
      return cloneTransaction(updated);
    }

    return this.fetch<StagingTransaction>(`/staging/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transaction),
    });
  }

  async importStagingTransactions(request: StagingImportRequest): Promise<StagingImportResponse> {
    if (USE_MOCK_DATA) {
      const transactionIds = request.transactionIds && request.transactionIds.length > 0
        ? request.transactionIds
        : mockStagingTransactions.filter((transaction) => transaction.status === 'pending').map((transaction) => transaction.id);

      const importedPaymentIds: string[] = [];

      for (const transactionId of transactionIds) {
        const transaction = mockStagingTransactions.find((item) => item.id === transactionId);
        if (!transaction || transaction.status === 'imported') {
          continue;
        }

        const importedPaymentId = `payment-${transaction.id}`;
        transaction.status = 'imported';
        transaction.importedPaymentId = importedPaymentId;
        transaction.updatedAt = new Date().toISOString();
        importedPaymentIds.push(importedPaymentId);
      }

      return {
        importedCount: importedPaymentIds.length,
        skippedCount: Math.max(0, transactionIds.length - importedPaymentIds.length),
        importedPaymentIds,
      };
    }

    return this.fetch<StagingImportResponse>('/staging/import', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}
