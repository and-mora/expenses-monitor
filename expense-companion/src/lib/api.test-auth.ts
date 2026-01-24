import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from './api';

describe('API Client Authentication', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends request without Authorization header when no token is set', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ totalInCents: 1000 }),
      headers: new Headers({ 'content-type': 'application/json' }),
      status: 200,
    });

    await apiClient.getBalance();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.not.objectContaining({
          Authorization: expect.anything(),
        }),
      })
    );
  });

  it('sends Authorization header when token provider is set', async () => {
    const mockToken = 'mock-jwt-token';
    apiClient.setTokenProvider(() => mockToken);

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ totalInCents: 1000 }),
      headers: new Headers({ 'content-type': 'application/json' }),
      status: 200,
    });

    await apiClient.getBalance();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockToken}`,
        }),
      })
    );
  });

  it('handles 401 Unauthorized response', async () => {
    apiClient.setTokenProvider(() => 'expired-token');

    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ detail: 'Unauthorized' }),
    });

    await expect(apiClient.getBalance()).rejects.toThrow('Unauthorized');
  });

  it('prefers token provider over manually set token', async () => {
    const providerToken = 'provider-token';
    const manualToken = 'manual-token';

    apiClient.setToken(manualToken);
    apiClient.setTokenProvider(() => providerToken);

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ totalInCents: 1000 }),
      headers: new Headers({ 'content-type': 'application/json' }),
      status: 200,
    });

    await apiClient.getBalance();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${providerToken}`,
        }),
      })
    );
  });

  it('falls back to manual token when provider returns undefined', async () => {
    const manualToken = 'manual-token';

    apiClient.setToken(manualToken);
    apiClient.setTokenProvider(() => undefined);

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ totalInCents: 1000 }),
      headers: new Headers({ 'content-type': 'application/json' }),
      status: 200,
    });

    await apiClient.getBalance();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${manualToken}`,
        }),
      })
    );
  });

  it('handles 403 Forbidden response', async () => {
    apiClient.setTokenProvider(() => 'valid-token-insufficient-permissions');

    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ detail: 'Forbidden - insufficient permissions' }),
    });

    await expect(apiClient.getBalance()).rejects.toThrow('Forbidden - insufficient permissions');
  });
});
