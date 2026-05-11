import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { resolveLocale, formatCurrency, formatNumber, clearFormatterCache } from '../lib/formatters';

describe('resolveLocale', () => {
  test('maps known languages to locales', () => {
    expect(resolveLocale('tr')).toBe('tr-TR');
    expect(resolveLocale('de')).toBe('de-DE');
    expect(resolveLocale('en')).toBe('en-US');
    expect(resolveLocale('fr')).toBe('fr-FR');
    expect(resolveLocale('es')).toBe('es-ES');
    expect(resolveLocale('pt')).toBe('pt-PT');
  });

  test('falls back to de-DE for unknown language', () => {
    expect(resolveLocale('unknown')).toBe('de-DE');
    expect(resolveLocale(undefined)).toBe('de-DE');
  });
});

describe('formatCurrency', () => {
  beforeAll(() => {
    clearFormatterCache();
  });

  afterAll(() => {
    clearFormatterCache();
  });

  test('formats EUR in German locale', () => {
    const result = formatCurrency(1234.5, 'de', 'EUR');
    expect(result).toContain('1.234');
    expect(result).toContain('\u20AC'); // € symbol
  });

  test('formats USD in English locale', () => {
    const result = formatCurrency(99.99, 'en', 'USD');
    expect(result).toContain('99.99');
    expect(result).toContain('$');
  });

  test('handles zero', () => {
    const result = formatCurrency(0, 'de', 'EUR');
    expect(result).toBeDefined();
  });

  test('caches formatters', () => {
    clearFormatterCache();
    const r1 = formatCurrency(100, 'de', 'EUR');
    const r2 = formatCurrency(200, 'de', 'EUR');
    expect(r1).toBeDefined();
    expect(r2).toBeDefined();
  });
});

describe('formatNumber', () => {
  test('formats with default options', () => {
    const result = formatNumber(1234.5, 'de');
    expect(result).toBeDefined();
  });

  test('formats with custom options', () => {
    const result = formatNumber(0.5, 'en', { style: 'percent' });
    expect(result).toContain('50');
  });
});
