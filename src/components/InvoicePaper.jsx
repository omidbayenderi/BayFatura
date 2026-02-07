import React, { forwardRef } from 'react';
import '../index.css';
import { useLanguage } from '../context/LanguageContext';
import { getIndustryFields } from '../config/industryFields';

const InvoicePaper = forwardRef(({ data, totals }, ref) => {
    const { tInvoice } = useLanguage();
    const { subtotal, tax, total } = totals;
    const currency = data.currency || 'EUR';

    // Get industry config for dynamic field labels
    const industryConfig = getIndustryFields(data.industry || 'general');

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: currency }).format(amount);
    };

    return (
        <div ref={ref} className="invoice-paper-wrapper">
            <div className="invoice-paper">
                {/* Top Header: Sender Meta Consolidated Right */}
                <div className="invoice-header-top">
                    <div className="sender-meta-column">
                        {/* Logo: Show if mode is 'logoOnly' or 'both' AND logo exists */}
                        {(data.logoDisplayMode === 'logoOnly' || data.logoDisplayMode === 'both') && (data.logo || data.logoUrl) && (
                            <div className="header-logo">
                                <img src={data.logo || data.logoUrl} alt="Logo" />
                            </div>
                        )}

                        {/* Company Name: Show if mode is 'nameOnly' or 'both' */}
                        {(data.logoDisplayMode === 'nameOnly' || data.logoDisplayMode === 'both' || !data.logoDisplayMode) && (
                            <p className="bold">{data.senderCompany}</p>
                        )}

                        {/* 3. Address Lines */}
                        <p>{data.senderStreet} {data.senderHouseNum}</p>
                        <p>{data.senderZip} {data.senderCity}</p>

                        <p>Tel: {data.senderPhone}</p>
                        <p>Email: {data.senderEmail}</p>
                    </div>
                </div>

                {/* Main Title */}
                <div className="invoice-main-title">
                    <h1>RECHNUNG</h1>
                </div>

                <div className="invoice-metadata-section">
                    <div className="metadata-column">
                        <h4 className="metadata-label">Rechnungsempfänger:</h4>
                        <p className="bold">{data.recipientName}</p>
                        <p>{data.recipientStreet} {data.recipientHouseNum}</p>
                        <p>{data.recipientZip} {data.recipientCity}</p>
                        <p>{data.recipientCountry || 'Deutschland'}</p>
                    </div>
                    <div className="metadata-column">
                        <h4 className="metadata-label">Rechnungsdetails:</h4>
                        <table className="mini-meta-table">
                            <tbody>
                                <tr>
                                    <td>Rechnungsnummer:</td>
                                    <td>{data.invoiceNumber}</td>
                                </tr>
                                <tr>
                                    <td>Rechnungsdatum:</td>
                                    <td>{data.date ? new Date(data.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}</td>
                                </tr>
                                {/* Dynamic Industry Fields */}
                                {industryConfig.fields.map(field => (
                                    data[field.name] && (
                                        <tr key={field.name}>
                                            <td>{field.label}:</td>
                                            <td>{data[field.name]}{field.name === 'km' || field.name === 'hoursWorked' || field.name === 'consultingHours' || field.name === 'workDuration' || field.name === 'courseDuration' ? (field.name === 'km' ? ' km' : ' Std.') : ''}</td>
                                        </tr>
                                    )
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="invoice-table-container">
                    <table className="invoice-items-table-clean">
                        <thead>
                            <tr>
                                <th>Beschreibung</th>
                                <th className="text-center">Menge</th>
                                <th className="text-right">Einzelpreis</th>
                                <th className="text-right">Gesamtpreis</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.items.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.description}</td>
                                    <td className="text-center">{item.quantity}</td>
                                    <td className="text-right">{formatCurrency(item.price)}</td>
                                    <td className="text-right">{formatCurrency(item.quantity * item.price)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="invoice-totals-clean">
                    <div className="totals-row-clean">
                        <span>Zwischensumme (Netto):</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="totals-row-clean">
                        <span>Umsatzsteuer {data.taxRate || 19}% (MwSt):</span>
                        <span>{formatCurrency(tax)}</span>
                    </div>
                    <div className="totals-row-clean grand-total-clean">
                        <span>Gesamtbetrag (Brutto):</span>
                        <span>{formatCurrency(total)}</span>
                    </div>
                </div>

                <div className="invoice-bottom-footer-block">
                    <div className="footer-content-left">
                        <h4>Zahlungsbedingungen & Bankverbindung</h4>
                        <p className="small-text">{data.paymentTerms || 'Bitte überweisen Sie den Gesamtbetrag innerhalb von 14 Tagen auf unser Bankkonto.'}</p>
                        <div className="footer-bank-details">
                            <p><strong>Bank:</strong> {data.senderBank}</p>
                            <p><strong>IBAN:</strong> {data.senderIban}</p>
                            <p><strong>BIC:</strong> {data.senderBic || 'BELADEBEXXX'}</p>
                            <p><strong>Verwendungszweck:</strong> Rechnungsnummer {data.invoiceNumber}</p>
                        </div>
                    </div>

                    {/* QR Codes Section Integrated into Footer Block */}
                    <div className="footer-qr-section">
                        {data.senderIban && (() => {
                            // EPC QR Code (GiroCode) Standard - European Payments Council
                            // The key is to use proper line feed character (\n) encoded as %0A
                            const cleanIban = (data.senderIban || '').replace(/\s+/g, '').toUpperCase();
                            const cleanBic = (data.senderBic || '').replace(/\s+/g, '').toUpperCase();
                            // Amount: "EUR123.45" - Use dot as separator
                            const amountValue = total > 0 ? `EUR${total.toFixed(2)}` : '';

                            // Reference: "Verwendungszweck"
                            // CRITICAL: Remove all newlines from text fields to prevent breaking the 12-line format
                            const sanitize = (str) => (str || '').replace(/[\r\n]+/g, ' ').trim();

                            const reference = sanitize(`Rechnung ${data.invoiceNumber || ''}`).substring(0, 140);
                            const beneficiary = sanitize(data.senderCompany).substring(0, 70);

                            // Build EPC QR string with Line Feed (LF) separators
                            // Each field must be separated by a single LF (\n = %0A)
                            const epcLines = [
                                'BCD',           // 00 Service Tag
                                '002',           // 01 Version
                                '1',             // 02 Character set (1=UTF-8)
                                'SCT',           // 03 Identification code
                                cleanBic,        // 04 BIC (Optional but structure required)
                                beneficiary,     // 05 Beneficiary name
                                cleanIban,       // 06 IBAN
                                amountValue,     // 07 Amount (EURxx.xx)
                                '',              // 08 Purpose code
                                '',              // 09 Structured reference
                                reference,       // 10 Unstructured reference (Verwendungszweck)
                                ''               // 11 Beneficiary to Originator info
                            ];

                            // Join with actual newline
                            const epcString = epcLines.join('\n');

                            // Use quickchart.io as a reliable QR provider (supports higher volume/better encoding than google charts deprecated api)
                            const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(epcString)}&size=300&ecLevel=M`;

                            return (
                                <div className="qr-box">
                                    <img
                                        src={qrUrl}
                                        alt="GiroCode"
                                        onError={(e) => {
                                            // Fallback to goqr.me API
                                            e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(epcString)}`;
                                        }}
                                    />
                                    <span>GiroCode</span>
                                </div>
                            );
                        })()}
                        {data.paypalMe && (
                            <div className="qr-box">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(data.paypalMe)}`}
                                    alt="PayPal"
                                />
                                <span>PayPal</span>
                            </div>
                        )}
                        {data.stripeLink && (
                            <div className="qr-box">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(data.stripeLink)}`}
                                    alt="Stripe"
                                />
                                <span>Stripe</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default InvoicePaper;
