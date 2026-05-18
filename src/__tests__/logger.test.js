import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/nativeCrashlytics', () => ({
  recordError: vi.fn(),
  logMessage: vi.fn(),
  setUserId: vi.fn(),
}));

describe('Logger', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test('logger.debug does not throw', async () => {
    const { logger } = await import('../lib/logger');
    expect(() => logger.debug('Test', 'message')).not.toThrow();
  });

  test('logger.info does not throw', async () => {
    const { logger } = await import('../lib/logger');
    expect(() => logger.info('Test', 'message')).not.toThrow();
  });

  test('logger.warn does not throw', async () => {
    const { logger } = await import('../lib/logger');
    expect(() => logger.warn('Test', 'message')).not.toThrow();
  });

  test('logger.error does not throw with Error object', async () => {
    const { logger } = await import('../lib/logger');
    expect(() => logger.error('Test', 'error message', new Error('test error'))).not.toThrow();
  });

  test('logger.error handles string errors', async () => {
    const { logger } = await import('../lib/logger');
    expect(() => logger.error('Test', 'error message', 'string error')).not.toThrow();
  });

  test('logger.error handles null error', async () => {
    const { logger } = await import('../lib/logger');
    expect(() => logger.error('Test', 'error message', null)).not.toThrow();
  });

  test('userFacingError returns formatted message', async () => {
    const { userFacingError } = await import('../lib/logger');
    expect(userFacingError('Error', 'Retry')).toBe('Error Retry');
    expect(userFacingError('Error')).toBe('Error');
  });
});
