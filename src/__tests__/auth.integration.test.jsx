// @vitest-environment jsdom
import React from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';
import Auth from '../pages/auth/Auth';

const authMock = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  resetPassword: vi.fn(),
  signInWithGoogle: vi.fn(),
  signInWithMicrosoft: vi.fn(),
  signInAsDemo: vi.fn(),
  isAuthenticated: false,
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => authMock,
}));

vi.mock('../context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key) => ({
      welcomeBack: 'Welcome back',
      getStarted: 'Get started',
      enterDetails: 'Enter your details',
      createAccountMsg: 'Create your account',
      fullName: 'Full name',
      companyNameLabel: 'Company name',
      emailAddress: 'Email address',
      passwordLabel: 'Password',
      loginBtn: 'Login',
      registerBtn: 'Register',
      processing: 'Processing',
      invalidEmailPass: 'Invalid email or password',
      orContinueWith: 'Or continue with',
      noAccount: 'No account?',
      haveAccount: 'Have an account?',
      signUp: 'Sign up',
      loginLink: 'Log in',
      or: 'or',
      demoLogin: 'Demo login',
      loginFailed: 'Login failed',
      forgotPassword: 'Forgot password?',
      resetPasswordEmailRequired: 'Enter your email address first, then request the reset link.',
      resetPasswordEmailSent: 'Password reset link sent. Please check your inbox.',
      resetPasswordSocialOnly: 'This email is registered with Google or Microsoft. Please sign in with that method; there is no password to reset yet.',
      resetPasswordFailed: 'Password reset could not be started. Please try again.',
    }[key] || key),
  }),
}));

const renderAuth = (initialPath = '/login') => render(
  <MemoryRouter initialEntries={[initialPath]}>
    <Routes>
      <Route path="/login" element={<Auth />} />
      <Route path="/dashboard" element={<div>Dashboard page</div>} />
      <Route path="/team" element={<div>Team page</div>} />
    </Routes>
  </MemoryRouter>
);

describe('Auth page integration', () => {
  beforeEach(() => {
    authMock.login.mockReset();
    authMock.register.mockReset();
    authMock.resetPassword.mockReset();
    authMock.signInWithGoogle.mockReset();
    authMock.signInWithMicrosoft.mockReset();
    authMock.signInAsDemo.mockReset();
    authMock.isAuthenticated = false;
    window.sessionStorage.clear();
  });

  test('logs in with email and password then follows redirect query', async () => {
    authMock.login.mockResolvedValue({ success: true });

    renderAuth('/login?redirect=/team');

    fireEvent.change(screen.getByPlaceholderText('mail@fatura.com'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(authMock.login).toHaveBeenCalledWith('user@example.com', 'secret123');
      expect(screen.getByText('Team page')).toBeInTheDocument();
    });
  });

  test('shows login error when auth rejects', async () => {
    authMock.login.mockRejectedValue(new Error('Invalid credentials'));

    renderAuth();

    fireEvent.change(screen.getByPlaceholderText('mail@fatura.com'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'bad-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  });

  test('requires an email before requesting a password reset link', async () => {
    renderAuth();

    fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }));

    expect(await screen.findByText('Enter your email address first, then request the reset link.')).toBeInTheDocument();
    expect(authMock.resetPassword).not.toHaveBeenCalled();
  });

  test('sends a password reset link for the entered email', async () => {
    authMock.resetPassword.mockResolvedValue({ success: true });

    renderAuth();

    fireEvent.change(screen.getByPlaceholderText('mail@fatura.com'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }));

    await waitFor(() => {
      expect(authMock.resetPassword).toHaveBeenCalledWith('user@example.com');
      expect(screen.getByText('Password reset link sent. Please check your inbox.')).toBeInTheDocument();
    });
  });

  test('shows a provider-specific message when reset is not available for social-only accounts', async () => {
    authMock.resetPassword.mockResolvedValue({ success: false, messageKey: 'resetPasswordSocialOnly' });

    renderAuth();

    fireEvent.change(screen.getByPlaceholderText('mail@fatura.com'), {
      target: { value: 'google-user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }));

    expect(await screen.findByText('This email is registered with Google or Microsoft. Please sign in with that method; there is no password to reset yet.')).toBeInTheDocument();
  });

  test('starts Microsoft social login from the login page', async () => {
    authMock.signInWithMicrosoft.mockResolvedValue({ success: true, redirecting: true });

    renderAuth('/login?redirect=/team');

    fireEvent.click(screen.getByRole('button', { name: 'Microsoft' }));

    await waitFor(() => {
      expect(authMock.signInWithMicrosoft).toHaveBeenCalled();
      expect(window.sessionStorage.getItem('bayfatura.auth.redirectTarget')).toBe('/team');
      expect(screen.getByText('Processing')).toBeInTheDocument();
    });
  });

  test('registers a new account after toggling to signup mode', async () => {
    authMock.register.mockResolvedValue({ success: true });

    renderAuth();

    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));
    fireEvent.change(screen.getByPlaceholderText('John Doe'), {
      target: { value: 'Ada Lovelace' },
    });
    fireEvent.change(screen.getByPlaceholderText('BayFatura GmbH'), {
      target: { value: 'Ada GmbH' },
    });
    fireEvent.change(screen.getByPlaceholderText('mail@fatura.com'), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(authMock.register).toHaveBeenCalledWith({
        email: 'ada@example.com',
        password: 'secret123',
        name: 'Ada Lovelace',
        companyName: 'Ada GmbH',
      });
      expect(screen.getByText('Dashboard page')).toBeInTheDocument();
    });
  });

  test('stores safe redirect target before starting Google redirect login', async () => {
    authMock.signInWithGoogle.mockResolvedValue({ success: true, redirecting: true });

    renderAuth('/login?redirect=/team');

    fireEvent.click(screen.getByRole('button', { name: 'Google' }));

    await waitFor(() => {
      expect(authMock.signInWithGoogle).toHaveBeenCalled();
      expect(window.sessionStorage.getItem('bayfatura.auth.redirectTarget')).toBe('/team');
      expect(screen.getByText('Processing')).toBeInTheDocument();
    });
  });

  test('waits for auth state after Google popup success before navigating', async () => {
    authMock.signInWithGoogle.mockResolvedValue({ success: true });

    renderAuth('/login?redirect=/team');

    fireEvent.click(screen.getByRole('button', { name: 'Google' }));

    await waitFor(() => {
      expect(authMock.signInWithGoogle).toHaveBeenCalled();
      expect(screen.getByText('Processing')).toBeInTheDocument();
    });

    expect(screen.queryByText('Team page')).not.toBeInTheDocument();
  });

  test('consumes stored redirect error after returning to login page', async () => {
    window.sessionStorage.setItem('bayfatura.auth.redirectError', 'Google sign-in is not authorized for this domain.');

    renderAuth();

    expect(await screen.findByText('Google sign-in is not authorized for this domain.')).toBeInTheDocument();
    expect(window.sessionStorage.getItem('bayfatura.auth.redirectError')).toBeNull();
  });

  test('authenticated redirect return follows stored target', async () => {
    authMock.isAuthenticated = true;
    window.sessionStorage.setItem('bayfatura.auth.redirectTarget', '/team');

    renderAuth('/login');

    await waitFor(() => {
      expect(screen.getByText('Team page')).toBeInTheDocument();
      expect(window.sessionStorage.getItem('bayfatura.auth.redirectTarget')).toBeNull();
    });
  });
});
