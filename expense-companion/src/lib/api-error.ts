/**
 * API Error Handling Utilities
 * 
 * Provides standardized error handling, retry logic, and user-friendly error messages
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /**
   * Check if error is a network error
   */
  isNetworkError(): boolean {
    return !this.statusCode || this.statusCode === 0;
  }

  /**
   * Check if error is authentication related
   */
  isAuthError(): boolean {
    return this.statusCode === 401 || this.statusCode === 403;
  }

  /**
   * Check if error is a validation error
   */
  isValidationError(): boolean {
    return this.statusCode === 400 || this.statusCode === 422;
  }

  /**
   * Check if error is server error
   */
  isServerError(): boolean {
    return !!this.statusCode && this.statusCode >= 500;
  }

  /**
   * Check if request should be retried
   */
  shouldRetry(): boolean {
    // Retry on network errors and 5xx server errors
    return this.isNetworkError() || this.isServerError();
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    if (this.isNetworkError()) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }

    if (this.isAuthError()) {
      return 'Your session has expired. Please log in again.';
    }

    if (this.isValidationError()) {
      return this.message || 'The data provided is invalid. Please check your input and try again.';
    }

    if (this.isServerError()) {
      return 'The server encountered an error. Please try again later.';
    }

    return this.message || 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Parse error response from API
 */
export async function parseApiError(response: Response): Promise<ApiError> {
  let errorData: any;
  
  try {
    errorData = await response.json();
  } catch {
    errorData = { detail: response.statusText || 'Unknown error' };
  }

  const message = errorData.detail || errorData.message || `HTTP ${response.status}`;
  const code = errorData.code;
  
  return new ApiError(message, response.status, code, errorData);
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 30000,
};

/**
 * Sleep utility for retry delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate retry delay with exponential backoff
 */
export function calculateRetryDelay(
  attemptNumber: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  const delay = config.delayMs * Math.pow(config.backoffMultiplier, attemptNumber - 1);
  return Math.min(delay, config.maxDelayMs);
}

/**
 * Retry wrapper for async functions
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  shouldRetry: (error: Error) => boolean = (e) => e instanceof ApiError && (e as ApiError).shouldRetry(),
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error;

  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if we're on the last attempt
      if (attempt === retryConfig.maxAttempts) {
        break;
      }

      // Don't retry if error shouldn't be retried
      if (!shouldRetry(lastError)) {
        break;
      }

      // Wait before retrying
      const delay = calculateRetryDelay(attempt, retryConfig);
      console.log(`[API] Retrying request (attempt ${attempt + 1}/${retryConfig.maxAttempts}) after ${delay}ms`);
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Timeout wrapper for fetch requests
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 30000,
  timeoutMessage: string = 'Request timeout'
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new ApiError(timeoutMessage, 0, 'TIMEOUT'));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}

/**
 * Request deduplication map
 */
const pendingRequests = new Map<string, Promise<any>>();

/**
 * Deduplicate concurrent identical requests
 */
export async function withDeduplication<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  // Check if there's a pending request for this key
  const pending = pendingRequests.get(key);
  if (pending) {
    console.log(`[API] Deduplicating request: ${key}`);
    return pending;
  }

  // Create new request
  const promise = fn().finally(() => {
    // Clean up after request completes
    pendingRequests.delete(key);
  });

  // Store pending request
  pendingRequests.set(key, promise);

  return promise;
}
