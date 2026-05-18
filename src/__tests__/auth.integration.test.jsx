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
  signInWithGoogle: vi.fn(),
  signInWithApple: vi.fn(),
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
    authMock.signInWithGoogle.mockReset();
    authMock.signInWithApple.mockReset();
    authMock.signInAsDemo.mockReset();
    authMock.isAuthenticated = false;
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
});
