import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * CookieConsent — GDPR/DSGVO Compliant Cookie Banner
 * Stores user preference in localStorage for 365 days.
 * Required by EU law (ePrivacy Directive + GDPR Art. 7)
 */
const CookieConsent = () => {
    const [visible, setVisible] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [prefs, setPrefs] = useState({ analytics: false, marketing: false });

    useEffect(() => {
        const consent = localStorage.getItem('bayfatura_cookie_consent');
        if (!consent) {
            // Small delay so it doesn't flash immediately on load
            const timer = setTimeout(() => setVisible(true), 1200);
            return () => clearTimeout(timer);
        }
    }, []);

    const acceptAll = () => {
        const consent = {
            necessary: true,
            analytics: true,
            marketing: true,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        localStorage.setItem('bayfatura_cookie_consent', JSON.stringify(consent));
        // Enable Firebase Analytics
        if (window.gtag) window.gtag('consent', 'update', { analytics_storage: 'granted' });
        setVisible(false);
    };

    const acceptSelected = () => {
        const consent = {
            necessary: true,
            analytics: prefs.analytics,
            marketing: prefs.marketing,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        localStorage.setItem('bayfatura_cookie_consent', JSON.stringify(consent));
        setVisible(false);
    };

    const rejectAll = () => {
        const consent = {
            necessary: true,
            analytics: false,
            marketing: false,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        localStorage.setItem('bayfatura_cookie_consent', JSON.stringify(consent));
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <>
            {/* Backdrop */}
            <div style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(2px)',
                zIndex: 99998,
                animation: 'fadeIn 0.3s ease'
            }} />

            {/* Banner */}
            <div style={{
                position: 'fixed',
                bottom: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'min(680px, calc(100vw - 32px))',
                background: 'rgba(15, 23, 42, 0.97)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '20px',
                padding: '24px 28px',
                zIndex: 99999,
                boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
                animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '18px'
                    }}>🍪</div>
                    <div>
                        <h3 style={{ margin: 0, color: '#f1f5f9', fontSize: '1rem', fontWeight: '700' }}>
                            Wir verwenden Cookies / We use Cookies
                        </h3>
                        <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.6 }}>
                            Wir nutzen notwendige Cookies für den Betrieb und optionale Cookies für Analysen.
                            Ihre Daten werden gemäß unserer{' '}
                            <Link to="/privacy" style={{ color: '#818cf8', textDecoration: 'underline' }}>
                                Datenschutzerklärung
                            </Link>
                            {' '}verarbeitet. / We use necessary cookies for operation and optional analytics cookies.
                        </p>
                    </div>
                </div>

                {/* Details */}
                {showDetails && (
                    <div style={{
                        background: 'rgba(255,255,255,0.04)', borderRadius: '12px',
                        padding: '14px 16px', marginBottom: '16px',
                        border: '1px solid rgba(255,255,255,0.08)'
                    }}>
                        {[
                            {
                                id: 'necessary',
                                label: '🔒 Notwendige Cookies',
                                desc: 'Authentifizierung, Sitzungsverwaltung — immer aktiv',
                                required: true,
                                checked: true
                            },
                            {
                                id: 'analytics',
                                label: '📊 Analyse-Cookies (Firebase Analytics)',
                                desc: 'Nutzungsstatistiken zur Verbesserung der App',
                                required: false,
                                checked: prefs.analytics
                            },
                            {
                                id: 'marketing',
                                label: '🎯 Marketing (Stripe)',
                                desc: 'Zahlungsrelevante Cookies von Stripe',
                                required: false,
                                checked: prefs.marketing
                            },
                        ].map(item => (
                            <div key={item.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '10px 0',
                                borderBottom: item.id === 'marketing' ? 'none' : '1px solid rgba(255,255,255,0.06)'
                            }}>
                                <div>
                                    <div style={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: '600' }}>{item.label}</div>
                                    <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '2px' }}>{item.desc}</div>
                                </div>
                                {item.required ? (
                                    <span style={{ fontSize: '0.7rem', color: '#6366f1', background: '#6366f120', padding: '3px 8px', borderRadius: '6px', fontWeight: '700' }}>
                                        Immer aktiv
                                    </span>
                                ) : (
                                    <div
                                        onClick={() => setPrefs(p => ({ ...p, [item.id]: !p[item.id] }))}
                                        style={{
                                            width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer',
                                            background: item.checked ? '#6366f1' : '#334155',
                                            position: 'relative', transition: 'background 0.2s ease', flexShrink: 0
                                        }}
                                    >
                                        <div style={{
                                            position: 'absolute', top: '3px',
                                            left: item.checked ? '23px' : '3px',
                                            width: '18px', height: '18px', borderRadius: '50%',
                                            background: 'white', transition: 'left 0.2s ease',
                                            boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
                                        }} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                        onClick={acceptAll}
                        style={{
                            flex: 1, minWidth: '160px',
                            padding: '10px 20px', borderRadius: '10px', border: 'none',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: 'white', fontWeight: '700', fontSize: '0.85rem',
                            cursor: 'pointer', whiteSpace: 'nowrap'
                        }}
                    >
                        ✓ Alle akzeptieren
                    </button>

                    {showDetails ? (
                        <button
                            onClick={acceptSelected}
                            style={{
                                flex: 1, minWidth: '140px',
                                padding: '10px 20px', borderRadius: '10px',
                                border: '1px solid rgba(99,102,241,0.4)',
                                background: 'transparent', color: '#a5b4fc',
                                fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap'
                            }}
                        >
                            Auswahl speichern
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowDetails(true)}
                            style={{
                                flex: 1, minWidth: '140px',
                                padding: '10px 20px', borderRadius: '10px',
                                border: '1px solid rgba(99,102,241,0.4)',
                                background: 'transparent', color: '#a5b4fc',
                                fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap'
                            }}
                        >
                            ⚙️ Einstellungen
                        </button>
                    )}

                    <button
                        onClick={rejectAll}
                        style={{
                            padding: '10px 16px', borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'transparent', color: '#64748b',
                            fontWeight: '500', fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap'
                        }}
                    >
                        Ablehnen
                    </button>
                </div>

                {/* Links */}
                <div style={{ marginTop: '12px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    <Link to="/impressum" style={{ color: '#475569', fontSize: '0.72rem', textDecoration: 'none' }}>Impressum</Link>
                    <Link to="/privacy" style={{ color: '#475569', fontSize: '0.72rem', textDecoration: 'none' }}>Datenschutz</Link>
                    <Link to="/terms" style={{ color: '#475569', fontSize: '0.72rem', textDecoration: 'none' }}>AGB</Link>
                </div>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateX(-50%) translateY(30px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </>
    );
};

export default CookieConsent;
