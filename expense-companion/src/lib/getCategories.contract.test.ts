import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PaymentsApi } from './api/payments';

describe('PaymentsApi.getCategories contract', () => {
  let fetchSpy: any;

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
    expect(typeof result[1]).toBe('object');
    expect((result[1] as any).id).toBe('transport');
    expect((result[1] as any).name).toBe('transport');
  });
});
