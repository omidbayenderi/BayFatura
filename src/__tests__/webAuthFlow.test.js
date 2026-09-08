import { describe, expect, test } from 'vitest';
import { shouldUseRedirectForWebAuth } from '../lib/webAuthFlow';

describe('shouldUseRedirectForWebAuth', () => {
  test('keeps popup for Safari on macOS', () => {
    expect(shouldUseRedirectForWebAuth('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15')).toBe(false);
  });

  test('keeps popup for Chrome on macOS', () => {
    expect(shouldUseRedirectForWebAuth('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36')).toBe(false);
  });

  test('uses redirect for iOS WebKit browsers', () => {
    expect(shouldUseRedirectForWebAuth('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1')).toBe(true);
  });
});
