import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ApiError,
  parseApiError,
  withRetry,
  withTimeout,
  withDeduplication,
  sleep,
  calculateRetryDelay,
  DEFAULT_RETRY_CONFIG,
  type RetryConfig,
} from './api-error';

describe('ApiError', () => {
  describe('constructor', () => {
    it('should create an ApiError with message', () => {
      const error = new ApiError('Test error');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('ApiError');
    });

    it('should create an ApiError with all parameters', () => {
      const error = new ApiError('Test error', 400, 'VALIDATION_ERROR', { field: 'email' });
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual({ field: 'email' });
    });
  });

  describe('isNetworkError', () => {
    it('should return true for network errors (no status code)', () => {
      const error = new ApiError('Network error');
      expect(error.isNetworkError()).toBe(true);
    });

    it('should return true for status code 0', () => {
      const error = new ApiError('Network error', 0);
      expect(error.isNetworkError()).toBe(true);
    });

    it('should return false for errors with status code', () => {
      const error = new ApiError('Server error', 500);
      expect(error.isNetworkError()).toBe(false);
    });
  });

  describe('isAuthError', () => {
    it('should return true for 401 Unauthorized', () => {
      const error = new ApiError('Unauthorized', 401);
      expect(error.isAuthError()).toBe(true);
    });

    it('should return true for 403 Forbidden', () => {
      const error = new ApiError('Forbidden', 403);
      expect(error.isAuthError()).toBe(true);
    });

    it('should return false for other status codes', () => {
      const error = new ApiError('Bad Request', 400);
      expect(error.isAuthError()).toBe(false);
    });
  });

  describe('isValidationError', () => {
    it('should return true for 400 Bad Request', () => {
      const error = new ApiError('Bad Request', 400);
      expect(error.isValidationError()).toBe(true);
    });

    it('should return true for 422 Unprocessable Entity', () => {
      const error = new ApiError('Validation failed', 422);
      expect(error.isValidationError()).toBe(true);
    });

    it('should return false for other status codes', () => {
      const error = new ApiError('Server error', 500);
      expect(error.isValidationError()).toBe(false);
    });
  });

  describe('isServerError', () => {
    it('should return true for 500 Internal Server Error', () => {
      const error = new ApiError('Server error', 500);
      expect(error.isServerError()).toBe(true);
    });

    it('should return true for 503 Service Unavailable', () => {
      const error = new ApiError('Service unavailable', 503);
      expect(error.isServerError()).toBe(true);
    });

    it('should return false for client errors', () => {
      const error = new ApiError('Bad Request', 400);
      expect(error.isServerError()).toBe(false);
    });

    it('should return false for network errors', () => {
      const error = new ApiError('Network error');
      expect(error.isServerError()).toBe(false);
    });
  });

  describe('shouldRetry', () => {
    it('should return true for network errors', () => {
      const error = new ApiError('Network error');
      expect(error.shouldRetry()).toBe(true);
    });

    it('should return true for 500 errors', () => {
      const error = new ApiError('Server error', 500);
      expect(error.shouldRetry()).toBe(true);
    });

    it('should return true for 502 Bad Gateway', () => {
      const error = new ApiError('Bad Gateway', 502);
      expect(error.shouldRetry()).toBe(true);
    });

    it('should return true for 503 Service Unavailable', () => {
      const error = new ApiError('Service Unavailable', 503);
      expect(error.shouldRetry()).toBe(true);
    });

    it('should return true for 504 Gateway Timeout', () => {
      const error = new ApiError('Gateway Timeout', 504);
      expect(error.shouldRetry()).toBe(true);
    });

    it('should return false for client errors', () => {
      const error = new ApiError('Bad Request', 400);
      expect(error.shouldRetry()).toBe(false);
    });

    it('should return false for authentication errors', () => {
      const error = new ApiError('Unauthorized', 401);
      expect(error.shouldRetry()).toBe(false);
    });
  });

  describe('getUserMessage', () => {
    it('should return custom message for network error', () => {
      const error = new ApiError('Network error');
      const message = error.getUserMessage();
      expect(message).toContain('connection');
    });

    it('should return custom message for auth error', () => {
      const error = new ApiError('Unauthorized', 401);
      const message = error.getUserMessage();
      expect(message).toContain('session');
    });

    it('should return custom message for validation error', () => {
      const error = new ApiError('Validation failed', 400);
      const message = error.getUserMessage();
      expect(message).toContain('Validation failed');
    });

    it('should return custom message for server error', () => {
      const error = new ApiError('Server error', 500);
      const message = error.getUserMessage();
      expect(message).toContain('server');
    });

    it('should return error message for other errors', () => {
      const error = new ApiError('Custom error', 418);
      const message = error.getUserMessage();
      expect(message).toBe('Custom error');
    });

    it('should return generic message when no message provided', () => {
      const error = new ApiError('', 418);
      const message = error.getUserMessage();
      expect(message).toContain('unexpected');
    });
  });
});

describe('parseApiError', () => {
  it('should handle Response object with JSON error', async () => {
    const response = new Response(JSON.stringify({ detail: 'Validation failed' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });

    const error = await parseApiError(response);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toContain('Validation failed');
  });

  it('should handle Response object with message field', async () => {
    const response = new Response(JSON.stringify({ message: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });

    const error = await parseApiError(response);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(500);
    expect(error.message).toContain('Server error');
  });

  it('should handle Response object with text error', async () => {
    const response = new Response('Server error', {
      status: 500,
    });

    const error = await parseApiError(response);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(500);
  });

  it('should handle Response with status text', async () => {
    const response = new Response('', {
      status: 404,
      statusText: 'Not Found',
    });

    const error = await parseApiError(response);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(404);
  });
});

describe('sleep', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should wait for specified time', async () => {
    const promise = sleep(1000);
    vi.advanceTimersByTime(1000);
    await promise;
    expect(true).toBe(true); // If we get here, sleep worked
  });
});

describe('calculateRetryDelay', () => {
  it('should calculate delay with exponential backoff', () => {
    const config = DEFAULT_RETRY_CONFIG;
    
    const delay1 = calculateRetryDelay(1, config);
    expect(delay1).toBe(1000); // 1000 * 2^0
    
    const delay2 = calculateRetryDelay(2, config);
    expect(delay2).toBe(2000); // 1000 * 2^1
    
    const delay3 = calculateRetryDelay(3, config);
    expect(delay3).toBe(4000); // 1000 * 2^2
  });

  it('should respect max delay', () => {
    const config: RetryConfig = {
      maxAttempts: 10,
      delayMs: 1000,
      backoffMultiplier: 2,
      maxDelayMs: 5000,
    };
    
    const delay = calculateRetryDelay(10, config);
    expect(delay).toBeLessThanOrEqual(5000);
  });

  it('should use default config when not provided', () => {
    const delay = calculateRetryDelay(1);
    expect(delay).toBe(DEFAULT_RETRY_CONFIG.delayMs);
  });
});

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should return result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await withRetry(fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable error', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new ApiError('Server error', 500))
      .mockResolvedValueOnce('success');

    const promise = withRetry(fn, undefined, { maxAttempts: 2, delayMs: 100 });
    
    // Advance timers to trigger retry
    await vi.advanceTimersByTimeAsync(100);
    
    const result = await promise;
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should not retry on non-retryable error', async () => {
    const fn = vi.fn().mockRejectedValue(new ApiError('Bad Request', 400));

    await expect(withRetry(fn)).rejects.toThrow('Bad Request');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should throw after max attempts', async () => {
    const fn = vi.fn().mockRejectedValue(new ApiError('Server error', 500));

    // Create promise wrapped in expect immediately to catch rejection
    const promise = expect(
      withRetry(fn, undefined, { maxAttempts: 3, delayMs: 100 })
    ).rejects.toThrow('Server error');
    
    // Advance timers for all retry attempts
    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(200);
    
    await promise;
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should use exponential backoff', async () => {
    const fn = vi.fn().mockRejectedValue(new ApiError('Server error', 500));
    const delayMs = 100;

    // Wrap promise in expect immediately to catch rejection
    const promise = expect(
      withRetry(fn, undefined, { maxAttempts: 3, delayMs })
    ).rejects.toThrow();

    // First retry: 100ms * 1 = 100ms
    await vi.advanceTimersByTimeAsync(100);
    // Second retry: 100ms * 2 = 200ms
    await vi.advanceTimersByTimeAsync(200);

    await promise;
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should respect custom retry function', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new ApiError('Not Found', 404))
      .mockResolvedValueOnce('success');

    const shouldRetry = (error: Error) => 
      error instanceof ApiError && error.statusCode === 404;

    const promise = withRetry(fn, shouldRetry, { maxAttempts: 2, delayMs: 100 });
    
    await vi.advanceTimersByTimeAsync(100);
    
    const result = await promise;
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('withTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should resolve if promise completes before timeout', async () => {
    const promise = Promise.resolve('success');
    const result = await withTimeout(promise, 1000);
    expect(result).toBe('success');
  });

  it('should reject with timeout error if promise takes too long', async () => {
    const promise = new Promise((resolve) => {
      setTimeout(() => resolve('success'), 2000);
    });

    const timeoutPromise = withTimeout(promise, 1000);
    
    vi.advanceTimersByTime(1000);
    
    await expect(timeoutPromise).rejects.toThrow('Request timeout');
  });

  it('should use custom timeout message', async () => {
    const promise = new Promise((resolve) => {
      setTimeout(() => resolve('success'), 2000);
    });

    const timeoutPromise = withTimeout(promise, 1000, 'Custom timeout');
    
    vi.advanceTimersByTime(1000);
    
    await expect(timeoutPromise).rejects.toThrow('Custom timeout');
  });
});

describe('withDeduplication', () => {
  it('should execute function once for concurrent requests', async () => {
    const fn = vi.fn().mockResolvedValue('success');

    // Make concurrent requests with same key
    const promise1 = withDeduplication('test-key', fn);
    const promise2 = withDeduplication('test-key', fn);
    const promise3 = withDeduplication('test-key', fn);

    const results = await Promise.all([promise1, promise2, promise3]);

    expect(results).toEqual(['success', 'success', 'success']);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should execute function separately for different keys', async () => {
    const fn = vi.fn().mockResolvedValue('success');

    const promise1 = withDeduplication('key1', fn);
    const promise2 = withDeduplication('key2', fn);

    const results = await Promise.all([promise1, promise2]);

    expect(results).toEqual(['success', 'success']);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should allow new request after previous completes', async () => {
    const fn = vi.fn().mockResolvedValue('success');

    await withDeduplication('test-key', fn);
    await withDeduplication('test-key', fn);

    expect(fn).toHaveBeenCalledTimes(2);
  });
});
