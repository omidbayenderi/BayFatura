import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
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
import Quotes from './pages/Quotes';
import NewQuote from './pages/NewQuote';
import { PanelProvider } from './context/PanelContext';

function App() {
  return (
    <PanelProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/success" element={<Success />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/new" element={<NewInvoice />} />
            <Route path="/quotes" element={<Quotes />} />
            <Route path="/quotes/new" element={<NewQuote />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/recurring" element={<Recurring />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/profile" element={<ProfileSettings />} />
            <Route path="/invoice/:id" element={<InvoiceView type="invoice" />} />
            <Route path="/quote/:id" element={<InvoiceView type="quote" />} />
            <Route path="/invoice/:id/edit" element={<InvoiceEdit type="invoice" />} />
            <Route path="/quote/:id/edit" element={<InvoiceEdit type="quote" />} />
          </Route>
        </Route>
      </Routes>
    </PanelProvider>
  );
}

export default App;
