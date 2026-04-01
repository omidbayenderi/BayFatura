import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { InvoiceProvider } from './context/InvoiceContext.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';
import App from './App.jsx';

// Handle legacy path redirect (if needed) or just start
console.log('🚀 BayFatura starting with basename /BayFatura...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Failed to find the root element');
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter basename="/BayFatura">
        <LanguageProvider>
          <AuthProvider>
            <InvoiceProvider>
              <App />
            </InvoiceProvider>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </React.StrictMode>,
  );
}
