import React from 'react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidMount() {
        // Clear the reload flag when the app loads successfully
        sessionStorage.removeItem('chunk_load_reload');
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
        
        // Auto-reload for ChunkLoadError / MIME type errors (common in Vite after new deploys)
        const errorMessage = error?.message?.toLowerCase() || '';
        if (
            errorMessage.includes('failed to fetch dynamically imported module') ||
            errorMessage.includes('importing a module script failed') ||
            errorMessage.includes('text/html') ||
            errorMessage.includes('mime type')
        ) {
            const hasReloaded = sessionStorage.getItem('chunk_load_reload');
            if (!hasReloaded) {
                sessionStorage.setItem('chunk_load_reload', 'true');
                window.location.reload();
            }
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', fontFamily: 'Inter, sans-serif' }}>
                    <h1>Bir hata oluştu</h1>
                    <pre style={{ color: 'red', whiteSpace: 'pre-wrap' }}>
                        {this.state.error?.message || 'Bilinmeyen hata'}
                    </pre>
                    <button onClick={() => window.location.reload()}>
                        Sayfayı Yenile
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
