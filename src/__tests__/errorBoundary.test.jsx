import { describe, test, expect, vi } from 'vitest';
import React from 'react';

vi.mock('../lib/logger', () => ({
  logger: { error: vi.fn() },
}));

describe('ErrorBoundary', () => {
  test('exports a class component', async () => {
    const mod = await import('../components/ErrorBoundary');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });

  test('getDerivedStateFromError returns hasError state', async () => {
    const mod = await import('../components/ErrorBoundary');
    const state = mod.default.getDerivedStateFromError(new Error('test'));
    expect(state.hasError).toBe(true);
    expect(state.error).toBeDefined();
    expect(state.error.message).toBe('test');
  });
});
