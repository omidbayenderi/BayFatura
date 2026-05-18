import { describe, test, expect } from 'vitest';

describe('Platform Detection', () => {
  test('getPlatform returns web in non-native environment', async () => {
    const { getPlatform } = await import('../lib/platform');
    const result = getPlatform();
    expect(['web', 'server']).toContain(result);
  });

  test('isNativePlatform returns false in non-native environment', async () => {
    const { isNativePlatform } = await import('../lib/platform');
    expect(isNativePlatform()).toBe(false);
  });

  test('resetPlatformCache clears cached value', async () => {
    const { resetPlatformCache, isNativePlatform } = await import('../lib/platform');
    isNativePlatform();
    resetPlatformCache();
    const { isNativePlatform: freshCheck } = await import('../lib/platform');
    expect(freshCheck()).toBe(false);
  });
});
