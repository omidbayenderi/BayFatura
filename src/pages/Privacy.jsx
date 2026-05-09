import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Privacy Policy / Datenschutzerklärung
 * EU GDPR (DSGVO) + ePrivacy compliant
 * Covers: Firebase, Stripe, Resend, Firebase Analytics
 */
const Privacy = () => {
    const lastUpdated = '05. Mai 2026';

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)',
            color: '#e2e8f0',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
        }}>
            {/* Header */}
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
                <span style={{ color: '#475569', fontSize: '0.85rem' }}>/ Datenschutzerklärung</span>
            </header>

            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px', color: '#f1f5f9' }}>
                    Datenschutzerklärung
                </h1>
                <p style={{ color: '#64748b', marginBottom: '48px', fontSize: '0.9rem' }}>
                    Privacy Policy · Política de Privacidade | Stand: {lastUpdated}
                </p>

                {[
                    {
                        title: '1. Verantwortlicher / Responsible Controller',
                        content: `Die datenschutzrechtlich verantwortliche Stelle für diese Website ist:

BayFatura
E-Mail: support@bayfatura.com
Website: bayfatura.com

Für datenschutzrechtliche Anfragen kontaktieren Sie uns bitte unter: privacy@bayfatura.com`
                    },
                    {
                        title: '2. Welche Daten wir erheben / Data We Collect',
                        content: `Wir erheben und verarbeiten folgende personenbezogene Daten:

• Kontodaten: E-Mail-Adresse, Name (bei Registrierung)
• Unternehmensdaten: Firmenname, Adresse, Steuernummer, IBAN/BIC
• Nutzungsdaten: Login-Zeitpunkte, verwendete Funktionen (via Firebase Analytics, nur mit Einwilligung)
• Zahlungsdaten: Werden direkt von Stripe verarbeitet — wir speichern keine Kartendaten
• Fatura-/Rechnungsdaten: Von Ihnen erstellte Rechnungen, Kunden, Produkte

Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) und Art. 6 Abs. 1 lit. a DSGVO (Einwilligung für Analytics).`
                    },
                    {
                        title: '3. Drittanbieter / Third-Party Services',
                        content: `Wir nutzen folgende Drittanbieter:

🔥 Google Firebase (Alphabet Inc.)
— Datenspeicherung, Authentifizierung, Cloud Functions
— Server: europe-west3 (Frankfurt, Deutschland)
— Datenschutz: https://firebase.google.com/support/privacy
— AV-Vertrag: Über Firebase Console abgeschlossen

💳 Stripe Inc.
— Zahlungsabwicklung und Abonnementverwaltung
— Datenschutz: https://stripe.com/de/privacy
— PCI-DSS Level 1 zertifiziert

📧 Resend (Resend Inc.)
— E-Mail-Versand (Rechnungsbenachrichtigungen)
— Datenschutz: https://resend.com/privacy

📊 Firebase Analytics (nur mit Einwilligung)
— Anonymisierte Nutzungsstatistiken
— Daten werden nicht mit Google Ads verknüpft`
                    },
                    {
                        title: '4. Cookies',
                        content: `Wir verwenden Cookies und ähnliche Technologien:

Notwendige Cookies (immer aktiv):
• Session-Management (Firebase Authentication)
• Sicherheits-Token

Optionale Cookies (nur mit Einwilligung):
• Firebase Analytics: Nutzungsstatistiken
• Stripe: Zahlungsoptimierung

Sie können Ihre Cookie-Einstellungen jederzeit über den Cookie-Banner anpassen.`
                    },
                    {
                        title: '5. Ihre Rechte / Your Rights (GDPR Art. 15-22)',
                        content: `Sie haben folgende Rechte bezüglich Ihrer Daten:

• Auskunftsrecht (Art. 15 DSGVO): Auskunft über gespeicherte Daten
• Berichtigungsrecht (Art. 16 DSGVO): Korrektur unrichtiger Daten
• Löschungsrecht (Art. 17 DSGVO): "Recht auf Vergessenwerden"
• Einschränkungsrecht (Art. 18 DSGVO): Einschränkung der Verarbeitung
• Datenportabilität (Art. 20 DSGVO): Export Ihrer Daten
• Widerspruchsrecht (Art. 21 DSGVO)
• Beschwerderecht bei der Aufsichtsbehörde

Zur Ausübung Ihrer Rechte: privacy@bayfatura.com

Für Portugal: CNPD (Comissão Nacional de Proteção de Dados) — www.cnpd.pt`
                    },
                    {
                        title: '6. Datenlöschung / Data Retention',
                        content: `• Kontodaten: Werden 30 Tage nach Kontoschließung gelöscht
• Rechnungsdaten: Aufbewahrung gemäß gesetzlicher Pflicht (PT: 10 Jahre, DE: 10 Jahre gem. §257 HGB)
• Analytics-Daten: 14 Monate (Firebase-Standard)
• Log-Daten: 30 Tage`
                    },
                    {
                        title: '7. Datensicherheit / Data Security',
                        content: `• Alle Daten werden verschlüsselt übertragen (TLS 1.3)
• Datenspeicherung auf EU-Servern (Frankfurt, Deutschland)
• Firestore Security Rules schützen Mandantentrennung
• Firebase Authentication für sichere Anmeldung
• Regelmäßige Sicherheitsüberprüfungen`
                    },
                    {
                        title: '8. Änderungen / Updates',
                        content: `Wir behalten uns vor, diese Datenschutzerklärung anzupassen. Bei wesentlichen Änderungen werden registrierte Nutzer per E-Mail informiert. Stand dieser Version: ${lastUpdated}`
                    }
                ].map(section => (
                    <div key={section.title} style={{
                        marginBottom: '36px',
                        padding: '24px',
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.06)'
                    }}>
                        <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#a5b4fc', marginBottom: '16px' }}>
                            {section.title}
                        </h2>
                        <p style={{ color: '#94a3b8', lineHeight: 1.8, fontSize: '0.88rem', whiteSpace: 'pre-line', margin: 0 }}>
                            {section.content}
                        </p>
                    </div>
                ))}

                {/* Footer links */}
                <div style={{ display: 'flex', gap: '20px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <Link to="/impressum" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.85rem' }}>Impressum</Link>
                    <Link to="/terms" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.85rem' }}>AGB / Terms</Link>
                    <Link to="/" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.85rem' }}>← Zurück / Back</Link>
                </div>
            </div>
        </div>
    );
};

export default Privacy;
