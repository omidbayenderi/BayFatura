import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { InvoiceProvider } from './context/InvoiceContext.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CustomerProvider } from './context/CustomerContext.jsx';
import { ProductProvider } from './context/ProductContext.jsx';
import { registerServiceWorker } from './utils/serviceWorker.js';
import { initSentry } from './utils/sentry.js';
import './index.css';
import App from './App.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';

// Global error handlers
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

try {
    initSentry();
} catch (e) {
    console.warn('Sentry init failed:', e);
}

try {
    registerServiceWorker();
} catch (e) {
    console.warn('Service worker registration failed:', e);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
    console.error('Failed to find the root element');
    document.body.innerHTML = '<div style="padding:20px;color:red;">Root element bulunamadı!</div>';
} else {
    ReactDOM.createRoot(rootElement).render(
        <ErrorBoundary>
            <BrowserRouter basename="/">
                <LanguageProvider>
                    <AuthProvider>
                        <InvoiceProvider>
                            <CustomerProvider>
                                <ProductProvider>
                                    <App />
                                </ProductProvider>
                            </CustomerProvider>
                        </InvoiceProvider>
                    </AuthProvider>
                </LanguageProvider>
            </BrowserRouter>
        </ErrorBoundary>
    );
}
