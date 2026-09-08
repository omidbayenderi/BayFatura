import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import NewInvoice from './pages/invoices/NewInvoice';
import Archive from './pages/invoices/Archive';
import { PanelProvider } from './context/PanelContext';
import LoadingPage from './components/LoadingPage';
import CookieConsent from './components/CookieConsent';
import { isNativePlatform } from './lib/platform';

// Lazy-loaded pages (non-critical routes)
const Settings = React.lazy(() => import('./pages/settings/Settings'));
const ProfileSettings = React.lazy(() => import('./pages/settings/ProfileSettings'));
const InvoiceView = React.lazy(() => import('./pages/invoices/InvoiceView'));
const Reports = React.lazy(() => import('./pages/finance/Reports'));
const Expenses = React.lazy(() => import('./pages/finance/Expenses'));
const Recurring = React.lazy(() => import('./pages/Recurring'));
const Success = React.lazy(() => import('./pages/Success'));
const InvoiceEdit = React.lazy(() => import('./pages/invoices/InvoiceEdit'));
const Quotes = React.lazy(() => import('./pages/invoices/Quotes'));
const NewQuote = React.lazy(() => import('./pages/invoices/NewQuote'));
const Auth = React.lazy(() => import('./pages/auth/Auth'));
const Landing = React.lazy(() => import('./pages/auth/Landing'));
const Billing = React.lazy(() => import('./pages/finance/Billing'));
const Team = React.lazy(() => import('./pages/crm/Team'));
const Forecasting = React.lazy(() => import('./pages/finance/Forecasting'));
const Customers = React.lazy(() => import('./pages/crm/Customers'));
const Products = React.lazy(() => import('./pages/crm/Products'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const PublicView = React.lazy(() => import('./pages/PublicView'));
const BankMatcher = React.lazy(() => import('./pages/finance/BankMatcher'));
const Notifications = React.lazy(() => import('./pages/settings/Notifications.jsx'));
const Privacy = React.lazy(() => import('./pages/legal/Privacy'));
const Impressum = React.lazy(() => import('./pages/legal/Impressum'));
const Terms = React.lazy(() => import('./pages/legal/Terms'));
const DeveloperControlCenter = React.lazy(() => import('./pages/DeveloperControlCenter'));
const SuperAdminLogin = React.lazy(() => import('./pages/SuperAdminLogin'));
const AcceptInvite = React.lazy(() => import('./pages/crm/AcceptInvite'));

const LazyRoute = ({ children }) => (
    <Suspense fallback={<LoadingPage />}>
        {children}
    </Suspense>
);

const NativeHomeRedirect = () => {
  const { currentUser, loading } = useAuth();

  if (!isNativePlatform()) {
    return <LazyRoute><Landing /></LazyRoute>;
  }

  if (loading) {
    return <LoadingPage />;
  }

  return <Navigate to={currentUser ? '/dashboard' : '/login'} replace />;
};

function App() {
  const { currentUser } = useAuth();
  return (
    <PanelProvider>
      {/* Global Cookie Consent Banner — shown on all pages */}
      <CookieConsent />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<NativeHomeRedirect />} />
        <Route path="/login" element={<LazyRoute><Auth /></LazyRoute>} />
        <Route path="/success" element={<LazyRoute><Success /></LazyRoute>} />
        <Route path="/p/invoice/:id" element={<LazyRoute><PublicView type="invoice" /></LazyRoute>} />
        <Route path="/p/quote/:id" element={<LazyRoute><PublicView type="quote" /></LazyRoute>} />
        {/* Invitation */}
        <Route path="/accept-invite" element={<LazyRoute><AcceptInvite /></LazyRoute>} />
        {/* Legal Pages */}
        <Route path="/terms" element={<LazyRoute><Terms /></LazyRoute>} />
        <Route path="/privacy" element={<LazyRoute><Privacy /></LazyRoute>} />
        <Route path="/impressum" element={<LazyRoute><Impressum /></LazyRoute>} />
        
        <Route path="/superadmin" element={<LazyRoute><SuperAdminLogin /></LazyRoute>} />
        {/* DCC Portal - ONLY accessible by the Super Admin, others get 404 */}
        {currentUser?.email?.toLowerCase() === 'omidbayenderi@gmail.com' && (
          <Route path="/dcc-portal" element={<LazyRoute><DeveloperControlCenter /></LazyRoute>} />
        )}

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/notifications" element={<LazyRoute><Notifications /></LazyRoute>} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/new" element={<NewInvoice />} />
            <Route path="/quotes" element={<LazyRoute><Quotes /></LazyRoute>} />
            <Route path="/quotes/new" element={<LazyRoute><NewQuote /></LazyRoute>} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/reports" element={<LazyRoute><Reports /></LazyRoute>} />
            <Route path="/expenses" element={<LazyRoute><Expenses /></LazyRoute>} />
            <Route path="/recurring" element={<LazyRoute><Recurring /></LazyRoute>} />
            <Route path="/customers" element={<LazyRoute><Customers /></LazyRoute>} />
            <Route path="/products" element={<LazyRoute><Products /></LazyRoute>} />
            <Route path="/billing" element={<LazyRoute><Billing /></LazyRoute>} />
            <Route path="/team" element={<LazyRoute><Team /></LazyRoute>} />
            <Route path="/forecasting" element={<LazyRoute><Forecasting /></LazyRoute>} />
            <Route path="/bank-matcher" element={<LazyRoute><BankMatcher /></LazyRoute>} />
            <Route path="/settings" element={<LazyRoute><Settings /></LazyRoute>} />
            <Route path="/settings/profile" element={<LazyRoute><ProfileSettings /></LazyRoute>} />
            <Route path="/invoice/:id" element={<LazyRoute><InvoiceView type="invoice" /></LazyRoute>} />
            <Route path="/quote/:id" element={<LazyRoute><InvoiceView type="quote" /></LazyRoute>} />
            <Route path="/invoice/:id/edit" element={<LazyRoute><InvoiceEdit type="invoice" /></LazyRoute>} />
            <Route path="/quote/:id/edit" element={<LazyRoute><InvoiceEdit type="quote" /></LazyRoute>} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<LazyRoute><NotFound /></LazyRoute>} />
      </Routes>
    </PanelProvider>
  );
}

export default App;
