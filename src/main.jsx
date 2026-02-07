import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { InvoiceProvider } from './context/InvoiceContext.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';
import App from './App.jsx';

console.log('🚀 BayRechnung starting with basename /BayRechnung...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Failed to find the root element');
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter basename="/BayRechnung">
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
