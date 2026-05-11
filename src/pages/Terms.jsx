import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Terms of Service / AGB (Allgemeine Geschäftsbedingungen)
 * Required for commercial SaaS platforms in EU
 */
const Terms = () => {
    const lastUpdated = '05. Mai 2026';

    const sections = [
        {
            title: '§1 Geltungsbereich / Scope',
            content: `Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge zwischen BayFatura (nachfolgend "Anbieter") und den Nutzern der Plattform bayfatura.com (nachfolgend "Nutzer").

Die Nutzung der Plattform setzt die Akzeptanz dieser AGB voraus. Abweichende Bedingungen des Nutzers werden nicht anerkannt.`
        },
        {
            title: '§2 Leistungsbeschreibung / Services',
            content: `BayFatura bietet eine cloudbasierte Software-as-a-Service (SaaS) Plattform für:
• Rechnungserstellung und -verwaltung
• Angebots- und Kundenverwaltung
• Ausgabenverfolgung und Finanzreporting
• KI-gestützte Funktionen (Bankauszugsanalyse, Belegscanner)
• E-Mail-Versand von Rechnungen

Der Anbieter übernimmt keine Haftung für steuerliche oder rechtliche Korrektheit der erstellten Dokumente.`
        },
        {
            title: '§3 Vertragsschluss / Contract Formation',
            content: `Der Vertrag kommt durch die Registrierung und Bestätigung der E-Mail-Adresse zustande. Für kostenpflichtige Pakete (Elite/Lifetime) kommt der Vertrag mit der Zahlungsbestätigung zustande.

Nutzer müssen mindestens 18 Jahre alt sein und dürfen die Plattform nur für geschäftliche Zwecke nutzen.`
        },
        {
            title: '§4 Preise & Zahlungsbedingungen / Pricing',
            content: `Free-Paket: Kostenlos, eingeschränkte Funktionen.
Elite-Paket: €9/Monat, automatische monatliche Abrechnung über Stripe.
Lifetime-Paket: Einmalig €299, dauerhafter Zugang.

Alle Preise verstehen sich zzgl. der gesetzlichen Mehrwertsteuer (falls anwendbar).
Zahlungen werden über Stripe Inc. verarbeitet. Rechnungen werden automatisch per E-Mail zugesandt.`
        },
        {
            title: '§5 Kündigung / Cancellation',
            content: `Das Free-Paket kann jederzeit ohne Kündigung eingestellt werden.
Das Elite-Paket kann monatlich zum Ende des Abrechnungszeitraums über das Nutzerprofil oder per E-Mail gekündigt werden.

Bei Kündigung bleibt der Zugang bis zum Ende des bezahlten Zeitraums bestehen. Bereits geleistete Zahlungen werden nicht erstattet.`
        },
        {
            title: '§6 Datenschutz / Data Protection',
            content: `Die Verarbeitung personenbezogener Daten erfolgt gemäß unserer Datenschutzerklärung und den Vorgaben der EU-Datenschutz-Grundverordnung (DSGVO).

Daten werden auf EU-Servern (Frankfurt, Deutschland) gespeichert. Es werden keine Daten an Dritte verkauft.`
        },
        {
            title: '§7 Verfügbarkeit & Haftung / Availability & Liability',
            content: `Wir streben eine Verfügbarkeit von 99,5% p.a. an, übernehmen jedoch keine Garantie. Wartungsarbeiten werden nach Möglichkeit angekündigt.

Die Haftung des Anbieters ist auf Vorsatz und grobe Fahrlässigkeit beschränkt. Eine Haftung für mittelbare Schäden, entgangene Gewinne oder Datenverlust ist ausgeschlossen, sofern gesetzlich zulässig.`
        },
        {
            title: '§8 Geistiges Eigentum / Intellectual Property',
            content: `Alle Rechte an der Plattform, dem Quellcode, Designs und Marken verbleiben beim Anbieter. Nutzern wird ein nicht übertragbares, widerrufliches Nutzungsrecht eingeräumt.

Die durch Nutzer erstellten Inhalte (Rechnungen, Kundendaten) verbleiben Eigentum des Nutzers.`
        },
        {
            title: '§9 Anwendbares Recht / Governing Law',
            content: `Es gilt das Recht der Europäischen Union sowie, subsidiär, portugiesisches Recht.

Für Verbraucher gilt das zwingende Verbraucherschutzrecht des jeweiligen EU-Mitgliedstaats des Nutzers.

Gerichtsstand für Streitigkeiten mit Unternehmern ist [Ihr Gerichtsstand, Portugal].`
        },
        {
            title: '§10 Änderungen / Amendments',
            content: `Wir behalten uns vor, diese AGB anzupassen. Wesentliche Änderungen werden mindestens 30 Tage vor Inkrafttreten per E-Mail mitgeteilt. Widerspricht der Nutzer nicht innerhalb dieser Frist, gelten die neuen AGB als akzeptiert.`
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
                <span style={{ color: '#475569', fontSize: '0.85rem' }}>/ AGB / Terms of Service</span>
            </header>

            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px', color: '#f1f5f9' }}>
                    AGB — Allgemeine Geschäftsbedingungen
                </h1>
                <p style={{ color: '#64748b', marginBottom: '48px', fontSize: '0.9rem' }}>
                    Terms of Service | Stand: {lastUpdated}
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
                    <Link to="/" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.85rem' }}>← Zurück / Back</Link>
                </div>
            </div>
        </div>
    );
};

export default Terms;
