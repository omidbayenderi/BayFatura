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
