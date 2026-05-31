// @vitest-environment jsdom
import React from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';
import App from '../App';

const authMock = vi.hoisted(() => ({
  currentUser: null,
  loading: false,
}));

const nativeMock = vi.hoisted(() => ({
  isNative: false,
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => authMock,
}));

vi.mock('../context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key) => key,
  }),
}));

vi.mock('../lib/platform', () => ({
  isNativePlatform: () => nativeMock.isNative,
}));

vi.mock('../components/CookieConsent', () => ({
  default: () => null,
}));

vi.mock('../pages/auth/Landing', () => ({
  default: () => <div>Landing page</div>,
}));

vi.mock('../pages/auth/Auth', () => ({
  default: () => <div>Login page</div>,
}));

vi.mock('../pages/Dashboard', () => ({
  default: () => <div>Dashboard page</div>,
}));

vi.mock('../pages/invoices/NewInvoice', () => ({
  default: () => <div>New invoice page</div>,
}));

vi.mock('../pages/invoices/Archive', () => ({
  default: () => <div>Archive page</div>,
}));

vi.mock('../components/Layout', () => ({
  default: () => <div>App layout</div>,
}));

vi.mock('../components/ProtectedRoute', async () => {
  const { Outlet } = await vi.importActual('react-router-dom');
  return {
    default: () => <Outlet />,
  };
});

vi.mock('../components/LoadingPage', () => ({
  default: () => <div>Loading page</div>,
}));

describe('App root routing', () => {
  beforeEach(() => {
    authMock.currentUser = null;
    authMock.loading = false;
    nativeMock.isNative = false;
  });

  test('keeps landing page as the web root route', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText('Landing page')).toBeInTheDocument();
  });

  test('sends logged-out native users from root to login', async () => {
    nativeMock.isNative = true;

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText('Login page')).toBeInTheDocument();
  });

  test('sends logged-in native users from root to dashboard', async () => {
    nativeMock.isNative = true;
    authMock.currentUser = { uid: 'user-1', email: 'user@example.com' };

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('App layout')).toBeInTheDocument();
    });
  });
});
