import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PaymentsApi } from './api/payments';
import type { CategoryItem } from '@/types/api';
import type { SpyInstance } from 'vitest';

describe('PaymentsApi.getCategories contract', () => {
  let fetchSpy: SpyInstance;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('normalizes mixed string/object responses to objects with id and name', async () => {
    const mixedResponse = [
      'food',
      { id: 'transport', name: 'transport', icon: 'truck' },
    ];

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => mixedResponse,
    });

    const api = new PaymentsApi('http://localhost');
    const result = await api.getCategories();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    // Strings are returned as-is; objects are normalized to { id, name, icon }
    expect(typeof result[0]).toBe('string');
    expect(result[0]).toBe('food');
    const item = result[1] as CategoryItem;
    expect(typeof item).toBe('object');
    if (typeof item !== 'string') {
      expect(item.id).toBe('transport');
      expect(item.name).toBe('transport');
    }
  });
});
