import React from 'react';
import { Link } from 'react-router-dom';

const Withdrawal = () => {
    const lastUpdated = '02. Juni 2026';

    const sections = [
        {
            title: 'Widerrufsrecht',
            content: `Wenn Sie Verbraucher im Sinne von §13 BGB sind, haben Sie das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.

Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsschlusses.`
        },
        {
            title: 'Ausübung des Widerrufs',
            content: `Um Ihr Widerrufsrecht auszuüben, müssen Sie uns durch eine eindeutige Erklärung per E-Mail über Ihren Entschluss informieren:

BayFatura
E-Mail: support@bayfatura.com
Website: bayfatura.com

Sie können dafür das unten stehende Muster verwenden; vorgeschrieben ist dieses Muster nicht.`
        },
        {
            title: 'Folgen des Widerrufs',
            content: `Wenn Sie diesen Vertrag widerrufen, erstatten wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag, an dem die Mitteilung über Ihren Widerruf bei uns eingegangen ist.

Für die Erstattung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, sofern nicht ausdrücklich etwas anderes vereinbart wurde.`
        },
        {
            title: 'Digitale Dienstleistungen',
            content: `Bei digitalen Dienstleistungen kann das Widerrufsrecht vor Ablauf der Widerrufsfrist erlöschen, wenn Sie ausdrücklich zugestimmt haben, dass wir vor Ablauf der Widerrufsfrist mit der Leistung beginnen, und Sie bestätigt haben, dass Sie bei vollständiger Vertragserfüllung Ihr Widerrufsrecht verlieren.

Wenn Sie den Vertrag widerrufen, nachdem Sie ausdrücklich den Beginn der Leistung während der Widerrufsfrist verlangt haben, kann für bereits erbrachte Leistungen eine zeitanteilige Vergütung geschuldet sein, soweit gesetzlich zulässig.`
        },
        {
            title: 'Muster-Widerrufsformular',
            content: `Wenn Sie den Vertrag widerrufen wollen, können Sie diesen Text verwenden:

An BayFatura, support@bayfatura.com

Hiermit widerrufe ich den von mir abgeschlossenen Vertrag über die Nutzung von BayFatura.

Name:
E-Mail-Adresse des Kontos:
Bestelldatum:
Datum:
Unterschrift, nur bei Mitteilung auf Papier:`
        }
    ];

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)',
            color: '#e2e8f0',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
        }}>
            <header style={{
                padding: '20px 24px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: '16px'
            }}>
                <Link to="/" style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    textDecoration: 'none', color: '#e2e8f0'
                }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: '900', fontSize: '14px'
                    }}>B</div>
                    <span style={{ fontWeight: '700', fontSize: '1rem' }}>BayFatura</span>
                </Link>
                <span style={{ color: '#475569', fontSize: '0.85rem' }}>/ Widerrufsbelehrung</span>
            </header>

            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px', color: '#f1f5f9' }}>
                    Widerrufsbelehrung
                </h1>
                <p style={{ color: '#64748b', marginBottom: '48px', fontSize: '0.9rem' }}>
                    Verbraucherinformationen | Stand: {lastUpdated}
                </p>

                {sections.map(section => (
                    <div key={section.title} style={{
                        marginBottom: '24px',
                        padding: '24px',
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.06)'
                    }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#a5b4fc', marginBottom: '14px' }}>
                            {section.title}
                        </h2>
                        <p style={{ color: '#94a3b8', lineHeight: 1.8, fontSize: '0.88rem', whiteSpace: 'pre-line', margin: 0 }}>
                            {section.content}
                        </p>
                    </div>
                ))}

                <div style={{ display: 'flex', gap: '20px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <Link to="/impressum" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.85rem' }}>Impressum</Link>
                    <Link to="/privacy" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.85rem' }}>Datenschutz</Link>
                    <Link to="/terms" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.85rem' }}>AGB</Link>
                    <Link to="/" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.85rem' }}>Zurück / Back</Link>
                </div>
            </div>
        </div>
    );
};

export default Withdrawal;
