// @vitest-environment jsdom
import React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';
import ProtectedRoute from '../components/ProtectedRoute';

const authState = vi.hoisted(() => ({
  currentUser: null,
  loading: false,
}));

const firebaseMock = vi.hoisted(() => ({
  auth: { currentUser: null },
  isFirebaseConfigured: vi.fn(() => true),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => authState,
}));

vi.mock('../lib/firebase', () => firebaseMock);

const renderProtectedRoute = (initialPath = '/dashboard') => render(
  <MemoryRouter initialEntries={[initialPath]}>
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<div>Dashboard content</div>} />
      </Route>
      <Route path="/login" element={<div>Login page</div>} />
    </Routes>
  </MemoryRouter>
);

describe('ProtectedRoute integration', () => {
  test('renders protected content for authenticated users', () => {
    authState.currentUser = { uid: 'user-a', email: 'user@example.com' };
    authState.loading = false;
    firebaseMock.auth.currentUser = null;

    renderProtectedRoute();

    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
  });

  test('redirects unauthenticated users to login', () => {
    authState.currentUser = null;
    authState.loading = false;
    firebaseMock.auth.currentUser = null;

    renderProtectedRoute();

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  test('shows loading page while auth is resolving', () => {
    authState.currentUser = null;
    authState.loading = true;
    firebaseMock.auth.currentUser = null;

    renderProtectedRoute();

    expect(screen.getByText('Lädt...')).toBeInTheDocument();
  });

  test('waits when Firebase has a session but app user is still syncing', () => {
    authState.currentUser = null;
    authState.loading = false;
    firebaseMock.auth.currentUser = { uid: 'pending-user' };

    renderProtectedRoute();

    expect(screen.getByText('Lädt...')).toBeInTheDocument();
  });
});
