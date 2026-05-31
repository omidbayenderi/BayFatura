import { describe, expect, test } from 'vitest';
import { getSocialAuthErrorMessage, isExpectedSocialAuthSetupError } from '../lib/authErrors';

describe('getSocialAuthErrorMessage', () => {
  test('explains disabled Microsoft provider without leaking raw Firebase text', () => {
    const message = getSocialAuthErrorMessage('Microsoft', {
      code: 'auth/operation-not-allowed',
      message: 'Firebase: Error (auth/operation-not-allowed).',
    });

    expect(message).toBe('Microsoft sign-in is not enabled yet. Please use Google or email/password for now.');
  });

  test('maps popup cancellation to a friendly provider message', () => {
    const message = getSocialAuthErrorMessage('Google', {
      code: 'auth/popup-closed-by-user',
      message: 'Firebase: Error (auth/popup-closed-by-user).',
    });

    expect(message).toBe('Google sign-in was cancelled.');
  });

  test('explains unauthorized local domains clearly', () => {
    const message = getSocialAuthErrorMessage('Google', {
      code: 'auth/unauthorized-domain',
      message: 'Firebase: Error (auth/unauthorized-domain).',
    });

    expect(message).toBe('Google sign-in is not allowed from this address yet. Use localhost for local testing or add this domain in Firebase Authentication authorized domains.');
  });

  test('marks disabled providers as expected setup errors', () => {
    expect(isExpectedSocialAuthSetupError({ code: 'auth/operation-not-allowed' })).toBe(true);
    expect(isExpectedSocialAuthSetupError({ code: 'auth/unauthorized-domain' })).toBe(true);
    expect(isExpectedSocialAuthSetupError({ code: 'auth/network-request-failed' })).toBe(false);
  });
});
