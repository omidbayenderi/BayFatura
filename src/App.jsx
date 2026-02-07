import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NewInvoice from './pages/NewInvoice';
import Archive from './pages/Archive';
import Settings from './pages/Settings';
import ProfileSettings from './pages/ProfileSettings';
import InvoiceView from './pages/InvoiceView';
import Reports from './pages/Reports';
import Expenses from './pages/Expenses';
import Recurring from './pages/Recurring';
import Success from './pages/Success';
import InvoiceEdit from './pages/InvoiceEdit';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/success" element={<Success />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/new" element={<NewInvoice />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/recurring" element={<Recurring />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/profile" element={<ProfileSettings />} />
          <Route path="/invoice/:id" element={<InvoiceView />} />
          <Route path="/invoice/:id/edit" element={<InvoiceEdit />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
