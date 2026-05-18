import { describe, test, expect, vi, beforeEach } from 'vitest';

function mockLocalStorage() {
  const store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
  };
}

beforeEach(() => {
  const storage = mockLocalStorage();
  vi.stubGlobal('localStorage', storage);
  vi.resetModules();
});

describe('exchangeRate', () => {
  test('fetchRates returns fallback rates when API fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    const { convertAmount } = await import('../lib/exchangeRate');
    const result = await convertAmount(100, 'USD', 'EUR');
    expect(result).toBeCloseTo(92.59, 0);
  });

  test('convertAmount returns same amount for same currency', async () => {
    const { convertAmount } = await import('../lib/exchangeRate');
    const result = await convertAmount(100, 'EUR', 'EUR');
    expect(result).toBe(100);
  });

  test('convertAmount handles zero amount', async () => {
    const { convertAmount } = await import('../lib/exchangeRate');
    const result = await convertAmount(0, 'USD', 'EUR');
    expect(result).toBe(0);
  });

  test('formatCurrency formats correctly', async () => {
    const { formatCurrency } = await import('../lib/exchangeRate');
    const result = formatCurrency(1234.5, 'EUR', 'de-DE');
    expect(result).toContain('1.234');
  });

  test('getSupportedCurrencies returns fallback on error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    const { getSupportedCurrencies } = await import('../lib/exchangeRate');
    const result = await getSupportedCurrencies();
    expect(result.EUR).toBeDefined();
    expect(result.USD).toBeDefined();
  });

  test('getRate returns 1 for same currency', async () => {
    const { getRate } = await import('../lib/exchangeRate');
    const result = await getRate('EUR', 'EUR');
    expect(result).toBe(1);
  });

  test('caching works between calls', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Should use cache'));
    vi.stubGlobal('fetch', fetchMock);

    const mod1 = await import('../lib/exchangeRate');
    localStorage.setItem('bayfatura_exchange_rates', JSON.stringify({
      data: { EUR: 1, USD: 1.08, TRY: 35.5 },
      timestamp: Date.now()
    }));

    const result = await mod1.convertAmount(100, 'USD', 'TRY');
    expect(result).toBeGreaterThan(3000);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
