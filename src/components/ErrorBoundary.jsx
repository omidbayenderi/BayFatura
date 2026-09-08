import React from 'react';
import { logger } from '../lib/logger';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        logger.error('ErrorBoundary', 'Uncaught error', error);

        const message = String(error?.message || error || '');
        const isChunkLoadError = message.includes('Importing a module script failed')
            || message.includes('Failed to fetch dynamically imported module')
            || message.includes('error loading dynamically imported module');

        if (isChunkLoadError && !sessionStorage.getItem('bayfatura_chunk_reload_attempted')) {
            sessionStorage.setItem('bayfatura_chunk_reload_attempted', 'true');
            const clearCaches = 'caches' in window
                ? caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key))))
                : Promise.resolve();

            clearCaches.finally(() => {
                window.location.reload();
            });
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    minHeight: '300px', padding: '40px', textAlign: 'center'
                }}>
                    <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
                    <h2 style={{ marginBottom: '8px' }}>Ein Fehler ist aufgetreten</h2>
                    <p style={{ color: '#64748b', marginBottom: '24px', maxWidth: '400px' }}>
                        Etwas ist schiefgelaufen. Bitte versuche es erneut.
                    </p>
                    <button className="primary-btn" onClick={() => {
                        this.setState({ hasError: false, error: null });
                        window.location.reload();
                    }}>
                        <RefreshCcw size={16} /> Sayfayı Yenile
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
