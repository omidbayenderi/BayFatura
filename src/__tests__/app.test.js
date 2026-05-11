// Basic smoke test for BayFatura
import { describe, test, expect } from 'vitest';

describe('BayFatura App', () => {
  test('environment variables are set', () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });

  test('source directory exists', () => {
    const fs = require('fs');
    const srcPath = require('path').join(process.cwd(), 'src');
    expect(fs.existsSync(srcPath)).toBe(true);
  });
});
