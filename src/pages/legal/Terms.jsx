import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Terms of Service / AGB (Allgemeine Geschäftsbedingungen)
 * Required for commercial SaaS platforms in EU
 */
const Terms = () => {
    const lastUpdated = '02. Juni 2026';

    const sections = [
        {
            title: '§1 Geltungsbereich / Scope',
            content: `Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der Plattform bayfatura.com durch Unternehmer im Sinne von §14 BGB sowie, soweit ausdrücklich angeboten, durch Verbraucher im Sinne von §13 BGB.

Anbieter ist BayFatura, vertreten durch Omid Bayandarimoghaddam. Die vollständigen Anbieterinformationen sind im Impressum abrufbar. Abweichende Bedingungen des Nutzers gelten nur, wenn wir ihnen ausdrücklich schriftlich zustimmen.`
        },
        {
            title: '§2 Leistungsbeschreibung / Services',
            content: `BayFatura bietet eine cloudbasierte Software-as-a-Service-Plattform für:
• Rechnungserstellung und -verwaltung
• Angebots- und Kundenverwaltung
• Ausgabenverfolgung und Finanzreporting
• KI-gestützte Funktionen (Bankauszugsanalyse, Belegscanner)
• E-Mail-Versand von Rechnungen

BayFatura stellt technische Werkzeuge bereit und ersetzt keine Steuer-, Rechts- oder Buchhaltungsberatung. Nutzer bleiben für Inhalt, Pflichtangaben, steuerliche Behandlung und rechtliche Korrektheit ihrer Dokumente verantwortlich.`
        },
        {
            title: '§3 Vertragsschluss / Contract Formation',
            content: `Der kostenfreie Nutzungsvertrag kommt durch Registrierung und Annahme dieser AGB zustande.

Für kostenpflichtige Pakete kommt der Vertrag erst zustande, wenn der Nutzer im Checkout eine zahlungspflichtige Bestellung ausdrücklich bestätigt und der Zahlungsvorgang erfolgreich abgeschlossen wurde. Vor Abgabe der Bestellung werden die wesentlichen Leistungsmerkmale, Laufzeit, Preis, Steuerhinweise und Zahlungsmittel angezeigt.

Nutzer müssen mindestens 18 Jahre alt sein. Geschäftliche Nutzer sichern zu, vertretungsberechtigt zu sein.`
        },
        {
            title: '§4 Preise & Zahlungsbedingungen / Pricing',
            content: `Free-Paket: kostenlos, eingeschränkte Funktionen.
Elite-Paket: 9 EUR/Monat oder 77 EUR/Jahr, automatische Abrechnung über Stripe.

Bei Angeboten an Verbraucher werden Gesamtpreise einschließlich gesetzlicher Umsatzsteuer angezeigt, soweit Umsatzsteuer anfällt. Bei Angeboten ausschließlich an Unternehmer können Nettopreise zuzüglich gesetzlicher Umsatzsteuer ausgewiesen werden.

Zahlungen werden über Stripe verarbeitet. Wir speichern keine vollständigen Kartendaten. Rechnungen und Zahlungsbestätigungen werden elektronisch bereitgestellt oder per E-Mail zugesandt.`
        },
        {
            title: '§5 Kündigung / Cancellation',
            content: `Das Free-Paket kann jederzeit durch Löschung des Kontos beendet werden.
Das Elite-Paket kann zum Ende des laufenden Abrechnungszeitraums über das Nutzerprofil, Stripe Customer Portal oder per E-Mail gekündigt werden.

Bei Kündigung bleibt der Zugang bis zum Ende des bezahlten Zeitraums bestehen. Erstattungen erfolgen nur, wenn gesetzlich vorgeschrieben oder ausdrücklich zugesagt. Gesetzliche Verbraucherrechte bleiben unberührt.`
        },
        {
            title: '§6 Widerrufsrecht für Verbraucher / Right of Withdrawal',
            content: `Verbrauchern steht bei Fernabsatzverträgen grundsätzlich ein gesetzliches Widerrufsrecht zu. Die vollständige Widerrufsbelehrung ist unter /widerruf abrufbar.

Bei digitalen Dienstleistungen kann das Widerrufsrecht vor Ablauf von 14 Tagen erlöschen, wenn der Verbraucher ausdrücklich zustimmt, dass wir vor Ablauf der Widerrufsfrist mit der Leistung beginnen, und bestätigt, dass er bei vollständiger Vertragserfüllung sein Widerrufsrecht verliert.`
        },
        {
            title: '§7 Datenschutz / Data Protection',
            content: `Die Verarbeitung personenbezogener Daten erfolgt gemäß unserer Datenschutzerklärung und den Vorgaben der EU-Datenschutz-Grundverordnung (DSGVO).

Daten werden nicht an Dritte verkauft. Für Hosting, Authentifizierung, Zahlungen, E-Mail-Versand und Analysefunktionen setzen wir Dienstleister ein, die in der Datenschutzerklärung benannt werden.`
        },
        {
            title: '§8 Verfügbarkeit & Haftung / Availability & Liability',
            content: `Wir streben eine hohe Verfügbarkeit an. Wartungsarbeiten, Sicherheitsupdates, Störungen bei Drittanbietern und höhere Gewalt können die Verfügbarkeit vorübergehend einschränken.

Wir haften unbeschränkt bei Vorsatz, grober Fahrlässigkeit, Verletzung von Leben, Körper oder Gesundheit sowie nach zwingenden gesetzlichen Vorschriften. Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten haften wir begrenzt auf den vertragstypischen, vorhersehbaren Schaden. Im Übrigen ist die Haftung ausgeschlossen, soweit gesetzlich zulässig.`
        },
        {
            title: '§9 Geistiges Eigentum / Intellectual Property',
            content: `Alle Rechte an der Plattform, dem Quellcode, Designs und Marken verbleiben beim Anbieter. Nutzern wird ein nicht übertragbares, widerrufliches Nutzungsrecht eingeräumt.

Die durch Nutzer erstellten Inhalte (Rechnungen, Kundendaten) verbleiben Eigentum des Nutzers.`
        },
        {
            title: '§10 Nutzerpflichten / User Obligations',
            content: `Nutzer dürfen die Plattform nicht missbräuchlich verwenden, keine rechtswidrigen Inhalte verarbeiten und keine Sicherheitsmechanismen umgehen. Zugangsdaten sind vertraulich zu behandeln.

Bei Verstößen können wir Funktionen vorübergehend sperren oder den Vertrag kündigen, sofern dies zur Sicherheit, Missbrauchsvermeidung oder Rechtsdurchsetzung erforderlich ist.`
        },
        {
            title: '§11 Anwendbares Recht / Governing Law',
            content: `Es gilt das Recht der Europäischen Union sowie ergänzend portugiesisches Recht, soweit keine zwingenden Verbraucherschutzvorschriften entgegenstehen.

Für Verbraucher gilt zusätzlich der zwingende Verbraucherschutz des Staates, in dem sie ihren gewöhnlichen Aufenthalt haben. Für Streitigkeiten mit Unternehmern ist, soweit zulässig, der Sitz des Anbieters Gerichtsstand.`
        },
        {
            title: '§12 Änderungen / Amendments',
            content: `Wir können diese AGB ändern, wenn sachliche Gründe vorliegen, etwa Gesetzesänderungen, neue Funktionen, Sicherheitsanforderungen oder geänderte Geschäftsprozesse.

Wesentliche Änderungen werden mindestens 30 Tage vor Inkrafttreten in Textform mitgeteilt. Für kostenpflichtige Verträge gelten Änderungen nur, wenn der Nutzer zustimmt oder ein gesetzlich zulässiger Änderungsmechanismus greift. Kündigungsrechte bleiben unberührt.`
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
                    <Link to="/widerruf" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.85rem' }}>Widerruf</Link>
                    <Link to="/" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.85rem' }}>← Zurück / Back</Link>
                </div>
            </div>
        </div>
    );
};

export default Terms;
