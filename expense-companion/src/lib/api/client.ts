import { getConfig } from '../env';

// Get validated configuration
const config = getConfig();
export const API_BASE_URL = config.api.baseUrl;
export const USE_MOCK_DATA = config.api.useMockData;

export class BaseApiClient {
  protected baseUrl: string;
  private token: string | null = null;
  private tokenProvider: (() => string | undefined) | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  setTokenProvider(provider: () => string | undefined) {
    this.tokenProvider = provider;
  }

  protected async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    // Use token provider first (from Keycloak), fallback to manually set token
    const token = this.tokenProvider?.() || this.token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    // Handle 204 No Content responses (e.g., DELETE operations)
    if (response.status === 204) {
      return undefined as T;
    }

    // Handle 200 OK with empty body (some DELETE operations return 200 instead of 204)
    const contentLength = response.headers.get('content-length');
    if (response.status === 200 && contentLength === '0') {
      return undefined as T;
    }

    return response.json();
  }

  // Health Check
  async healthCheck(): Promise<string> {
    if (USE_MOCK_DATA) return 'OK';
    const response = await fetch(`${this.baseUrl}/health_check`);
    return response.text();
  }
}
