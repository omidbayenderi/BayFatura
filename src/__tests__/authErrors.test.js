import { describe, expect, test } from 'vitest';
import { getSocialAuthErrorMessage } from '../lib/authErrors';

describe('getSocialAuthErrorMessage', () => {
  test('explains disabled Apple provider without leaking raw Firebase text', () => {
    const message = getSocialAuthErrorMessage('Apple', {
      code: 'auth/operation-not-allowed',
      message: 'Firebase: Error (auth/operation-not-allowed).',
    });

    expect(message).toBe('Apple sign-in is not enabled yet. Please use Google or email/password for now.');
  });

  test('maps popup cancellation to a friendly provider message', () => {
    const message = getSocialAuthErrorMessage('Google', {
      code: 'auth/popup-closed-by-user',
      message: 'Firebase: Error (auth/popup-closed-by-user).',
    });

    expect(message).toBe('Google sign-in was cancelled.');
  });
});
