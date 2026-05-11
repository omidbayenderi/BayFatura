import React, { forwardRef } from 'react';
import '../index.css';
import { useLanguage } from '../context/LanguageContext';
import { useInvoice } from '../context/InvoiceContext';
import { useAuth } from '../context/AuthContext';
import { getIndustryFields } from '../config/industryFields';
import { generateATCUD, generatePTQRData, calculateIVABreakdown } from '../lib/portugalCompliance';

const corsBypass = (url) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    // Use the highly reliable, CDN-backed images.weserv.nl CORS proxy to bypass CORS
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
    }
    return url;
};

// Handle image load errors gracefully
const handleImageError = (e, fallbackText = 'Logo') => {
    console.warn(`${fallbackText} load failed:`, e.target.src);
    e.target.style.display = 'none';
    // Show a placeholder
    const parent = e.target.parentElement;
    if (parent && !parent.querySelector('.image-fallback')) {
        const fallback = document.createElement('div');
        fallback.className = 'image-fallback';
        fallback.style.cssText = 'padding: 10px; background: #f1f5f9; border: 1px dashed #ccc; border-radius: 4px; text-align: center; color: #64748b; font-size: 0.8rem;';
        fallback.textContent = fallbackText;
        parent.appendChild(fallback);
    }
};

const InvoicePaper = forwardRef(({ data, totals }, ref) => {
    const { tInvoice, invoiceLanguage: globalInvoiceLanguage } = useLanguage();
    const docLang = data.language || globalInvoiceLanguage;
    const T = (key) => tInvoice(key, docLang);

    const { invoiceCustomization } = useInvoice();
    const { isPro } = useAuth();
    const { subtotal, tax, total } = totals;
    const currency = data.currency || 'EUR';

    const signatureUrl = data.signatureUrl || (invoiceCustomization?.signatureUrl);
    const stampUrl = data.stampUrl || (invoiceCustomization?.stampUrl);
    const industryConfig = getIndustryFields(data.industry || 'general');

    // Portugal compliance
    const isPortugal = data.senderCountry === 'PT' || data.country === 'PT';
    const atcud = isPortugal && data.atValidationCode
        ? generateATCUD(data.atValidationCode, data.invoiceNumber)
        : null;
    const ptQrEnabled = isPortugal && (data.ptQrEnabled === 'true' || data.ptQrEnabled === true);
    const ptQrData = ptQrEnabled ? generatePTQRData({
        sellerNif: data.senderTaxId,
        buyerNif: data.recipientTaxId,
        buyerCountry: data.recipientCountry || 'PT',
        docType: data.ptDocType || 'FT',
        docDate: data.date,
        invoiceNumber: data.invoiceNumber,
        atcud,
        subtotal,
        tax,
        total,
        taxRate: parseFloat(data.taxRate || 23),
        atValidationCode: data.atValidationCode,
    }) : null;

    // Multi-rate IVA breakdown (when items have different tax rates)
    const ivaBreakdown = calculateIVABreakdown(data.items, parseFloat(data.taxRate || 23));
    const hasMultipleRates = ivaBreakdown.length > 1;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat(docLang === 'tr' ? 'tr-TR' : docLang === 'en' ? 'en-US' : 'de-DE', { style: 'currency', currency: currency }).format(amount);
    };

    // --- Pagination Logic ---
    const items = data.items || [];
    const ITEMS_FIRST_PAGE = 5; // Reduced from 7 to allow more room for logo/signature
    const ITEMS_SUBSEQUENT_PAGES = 10; // Slightly reduced for safety

    const pages = [];
    if (items.length <= ITEMS_FIRST_PAGE) {
        pages.push(items);
    } else {
        pages.push(items.slice(0, ITEMS_FIRST_PAGE));
        let remaining = items.slice(ITEMS_FIRST_PAGE);
        while (remaining.length > 0) {
            pages.push(remaining.slice(0, ITEMS_SUBSEQUENT_PAGES));
            remaining = remaining.slice(ITEMS_SUBSEQUENT_PAGES);
        }
    }
    if (pages.length === 0) pages.push([]); // Ensure at least one page

    const totalPages = pages.length;

    const renderFooter = (pageIndex) => (
        <>
            <div className="invoice-bottom-footer-block">
                <div className="footer-content-left">
                    <h4>{T('paymentTermsAndBank')}</h4>
                    {/* Always show payment terms - use a dash if empty so the section is always visible */}
                    <p className="small-text" style={{ whiteSpace: 'pre-line' }}>
                        {data.paymentTerms || '—'}
                    </p>
                    <div className="footer-bank-details">
                        <p><strong>{T('bankLabel')}</strong> {data.senderBank}</p>
                        <p><strong>{T('ibanLabel')}</strong> {data.senderIban}</p>
                        {data.senderBic && <p><strong>{T('bicLabel')}</strong> {data.senderBic}</p>}
                        <p><strong>{T('usageLabel')}</strong> {data.invoiceNumber}</p>
                        {data.senderTaxId && <p><strong>St-Nr:</strong> {data.senderTaxId}</p>}
                        {data.senderVatId && <p><strong>USt-IdNr:</strong> {data.senderVatId}</p>}
                    </div>
                </div>

                <div className="footer-qr-section">
                    {/* PT QR Code — Mandatory for Portuguese invoices (Portaria 195/2020) */}
                    {ptQrData && (
                        <div className="qr-box" style={{ borderLeft: '2px solid #15803d' }}>
                            <img
                                src={`https://quickchart.io/qr?text=${encodeURIComponent(ptQrData)}&size=200&ecLevel=M`}
                                alt="QR AT"
                                crossOrigin="anonymous"
                                onError={(e) => { e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(ptQrData)}`; }}
                            />
                            <span style={{ color: '#15803d', fontWeight: '700' }}>QR AT 🇵🇹</span>
                        </div>
                    )}
                    {data.senderIban && (() => {
                        const cleanIban = (data.senderIban || '').replace(/\s+/g, '').toUpperCase();
                        const cleanBic = (data.senderBic || '').replace(/\s+/g, '').toUpperCase();
                        const amountValue = total > 0 ? `EUR${total.toFixed(2)}` : '';
                        const sanitize = (str) => (str || '').replace(/[\r\n]+/g, ' ').trim();
                        const reference = sanitize(`Rechnung ${data.invoiceNumber || ''}`).substring(0, 140);
                        const beneficiary = sanitize(data.senderCompany).substring(0, 70);

                        const epcLines = [
                            'BCD', '002', '1', 'SCT', cleanBic, beneficiary, cleanIban, amountValue, '', '', reference, ''
                        ];
                        const epcString = epcLines.join('\n');
                        const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(epcString)}&size=300&ecLevel=M`;

                        return (
                            <div className="qr-box">
                                <img 
                                    src={qrUrl} 
                                    alt="GiroCode" 
                                    crossOrigin="anonymous"
                                    onError={(e) => { e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(epcString)}`; }} 
                                />
                                <span>GiroCode</span>
                            </div>
                        );
                    })()}
                    {data.paypalMe && (
                        <div className="qr-box">
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(data.paypalMe)}`} alt="PayPal" crossOrigin="anonymous" />
                            <span>PayPal</span>
                        </div>
                    )}
                    {data.stripeLink && (
                        <div className="qr-box">
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(data.stripeLink)}`} alt="Stripe" crossOrigin="anonymous" />
                            <span>Stripe</span>
                        </div>
                    )}
                </div>
            </div>
            <div className="print-footer-xy">
                {pageIndex + 1} / {totalPages}
            </div>
        </>
    );

    // Migration/Normalization: If color is the old default purple, force it to the new grey
    let primaryColor = data.primaryColor || (invoiceCustomization?.primaryColor || '#374151');
    if (primaryColor.toUpperCase() === '#8B5CF6') primaryColor = '#374151';
    
    let accentColor = data.accentColor || (invoiceCustomization?.accentColor || '#f1f5f9');
    if (accentColor.toUpperCase() === '#6366F1') accentColor = '#f1f5f9';

    return (
        <div
            ref={ref}
            className="invoice-paper-wrapper"
            style={{
                '--invoice-primary': primaryColor,
                '--invoice-accent-bg': accentColor
            }}
        >
            {pages.map((pageItems, pageIndex) => (
                <div key={pageIndex} className={`invoice-paper print-page ${pageIndex === 0 ? 'first-page' : 'subsequent-page'}`}>

                    {/* Logo/Header Only on First Page */}
                    {pageIndex === 0 && (
                        <div className="invoice-header-top">
                            <div className="sender-meta-empty"></div>
                            <div className="sender-meta-column">
                                {(data.logoDisplayMode === 'logoOnly' || data.logoDisplayMode === 'both') && (data.logo || data.logoUrl) && (
                                    <div className="header-logo" style={{ marginBottom: '10px' }}>
                                        <img 
                                            src={corsBypass(data.logo || data.logoUrl)} 
                                            alt="Logo" 
                                            crossOrigin="anonymous" 
                                            style={{ maxWidth: '140px', maxHeight: '60px', width: 'auto', height: 'auto', objectFit: 'contain' }}
                                            onError={(e) => handleImageError(e, 'Logo')}
                                        />
                                    </div>
                                )}
                                {(data.logoDisplayMode === 'nameOnly' || data.logoDisplayMode === 'both' || !data.logoDisplayMode) && (
                                    <p className="bold" style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{data.senderCompany}</p>
                                )}
                                <p>{data.senderStreet} {data.senderHouseNum}</p>
                                <p>{data.senderZip} {data.senderCity}</p>
                                <p>Tel: {data.senderPhone}</p>
                                <p>Email: {data.senderEmail}</p>
                            </div>
                        </div>
                    )}

                    {/* Metadata Section (Recipient & Details) Repeated on Every Page */}
                    <div className="invoice-metadata-section">
                        <div className="metadata-column">
                            <div className="invoice-main-title" style={{ marginBottom: '20px' }}>
                                <h1>{data.title || (data.type === 'quote' ? T('quoteTitle') : T('invoiceTitle'))} {pageIndex > 0 && <span style={{ fontSize: '0.5em', fontWeight: '400', verticalAlign: 'middle' }}>({T('page')} {pageIndex + 1})</span>}</h1>
                            </div>
                            <h4 className="metadata-label">{T('recipientLabel')}</h4>
                            <p className="bold">{data.recipientName}</p>
                            <p>{data.recipientStreet} {data.recipientHouseNum}</p>
                            <p>{data.recipientZip} {data.recipientCity}</p>
                            {data.recipientCountry && <p>{data.recipientCountry}</p>}
                        </div>
                        <div className="metadata-column">
                            <h4 className="metadata-label">{T('detailsLabel')}</h4>
                            <table className="mini-meta-table">
                                <tbody>
                                    <tr>
                                        <td>{T('invoiceDateLabel')}:</td>
                                        <td>{data.date ? new Date(data.date).toLocaleDateString(docLang === 'tr' ? 'tr-TR' : docLang === 'en' ? 'en-US' : 'de-DE', { day: '2-digit', month: 'numeric', year: 'numeric' }) : ''}</td>
                                    </tr>
                                    <tr>
                                        <td>{T('invoiceNumberLabel')}:</td>
                                        <td>{data.invoiceNumber}</td>
                                    </tr>
                                    {/* ATCUD — Mandatory for Portuguese invoices */}
                                    {atcud && (
                                        <tr>
                                            <td style={{ fontWeight: '700', color: '#15803d' }}>ATCUD:</td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.5px' }}>{atcud}</td>
                                        </tr>
                                    )}
                                    {/* Leistungsdatum — §14 UStG */}
                                    {data.leistungsdatum && (
                                        <tr>
                                            <td>Leistungsdatum:</td>
                                            <td>{new Date(data.leistungsdatum).toLocaleDateString(docLang === 'de' ? 'de-DE' : docLang === 'en' ? 'en-US' : 'pt-PT', { day: '2-digit', month: 'numeric', year: 'numeric' })}</td>
                                        </tr>
                                    )}
                                    {/* Recipient VAT ID (for Reverse Charge) */}
                                    {data.recipientVatId && (
                                        <tr>
                                            <td style={{ fontSize: '0.75rem' }}>USt-IdNr. Empf.:</td>
                                            <td style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{data.recipientVatId}</td>
                                        </tr>
                                    )}
                                    {industryConfig.fields.map(field => (
                                        data[field.name] && (
                                            <tr key={field.name}>
                                                <td>{T(`${field.name}Label`)}:</td>
                                                <td>{data[field.name]}{field.name === 'km' || field.name === 'hoursWorked' || field.name === 'consultingHours' || field.name === 'workDuration' || field.name === 'courseDuration' ? (field.name === 'km' ? ' km' : ' Std.') : ''}</td>
                                            </tr>
                                        )
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Highly prominent Automotive block removed - Now integrated in metadata above */}
                    {/* Automotive details are now part of the metadata table above */}

                    <div className="invoice-table-container">
                        <table className="invoice-items-table-clean">
                            <thead>
                                <tr>
                                    <th>{T('descriptionLabel')}</th>
                                    <th className="text-center">{T('quantityLabel')}</th>
                                    <th className="text-right">{T('priceLabel')}</th>
                                    {hasMultipleRates && <th className="text-center" style={{ fontSize: '0.75rem' }}>{isPortugal ? 'IVA' : 'MwSt'}</th>}
                                    <th className="text-right">{T('totalPriceLabel')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageItems.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.description}</td>
                                        <td className="text-center">{item.quantity}</td>
                                        <td className="text-right">{formatCurrency(item.price)}</td>
                                        {hasMultipleRates && <td className="text-center" style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.taxRate ?? data.taxRate ?? 23}%</td>}
                                        <td className="text-right">{formatCurrency(item.quantity * item.price)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Section Only on Final Page */}
                    {pageIndex === totalPages - 1 && (
                        <div className="invoice-summary-section">
                            <div className="invoice-signature-block">
                                {signatureUrl || stampUrl ? (
                                    <div className="signature-container-relative" style={{ position: 'relative', height: '80px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        {stampUrl && (
                                            <img src={corsBypass(stampUrl)} alt="Stamp" className="stamp-image" crossOrigin="anonymous" style={{ 
                                                position: 'absolute', 
                                                height: '90px', 
                                                width: 'auto', 
                                                opacity: 0.85,
                                                zIndex: 1,
                                                transform: 'rotate(-5deg)' // Slight rotation for realism
                                            }} onError={(e) => handleImageError(e, 'Stamp')} />
                                        )}
                                        {signatureUrl && (
                                            <img src={corsBypass(signatureUrl)} alt="Signature" className="signature-image" crossOrigin="anonymous" style={{ 
                                                position: 'relative', 
                                                height: '60px', 
                                                width: 'auto', 
                                                zIndex: 2 
                                            }} onError={(e) => handleImageError(e, 'Signature')} />
                                        )}
                                    </div>
                                ) : (
                                    <div className="signature-placeholder"></div>
                                )}
                                <div className="signature-line"></div>
                                <p className="signature-label">{T('signatureLabel')}</p>
                            </div>

                            <div className="invoice-totals-clean">
                                <div className="totals-row-clean">
                                    <span>{T('subtotalLabel')}</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>

                                {/* Multi-rate IVA breakdown */}
                                {hasMultipleRates ? ivaBreakdown.map(b => (
                                    <div className="totals-row-clean" key={b.rate}>
                                        <span>{isPortugal ? 'IVA' : 'MwSt'} {b.rate}% (base: {formatCurrency(b.base)}):</span>
                                        <span>{formatCurrency(b.tax)}</span>
                                    </div>
                                )) : (
                                    <div className="totals-row-clean">
                                        <span>{T('taxLabel')} {data.taxRate || (isPortugal ? 23 : 19)}%:</span>
                                        <span>{formatCurrency(tax)}</span>
                                    </div>
                                )}

                                <div className="totals-row-clean grand-total-clean">
                                    <span>{T('grossTotalLabel')}</span>
                                    <span>{formatCurrency(total)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Free Tier Watermark */}
                    {pageIndex === totalPages - 1 && !isPro && (
                        <div style={{ marginTop: '30px', textAlign: 'center', opacity: 0.6 }}>
                            <p style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', margin: 0 }}>
                                {T('freeWatermark') || 'Erstellt mit BayFatura | Digitalisierung für Profis'}
                            </p>
                        </div>
                    )}

                    {/* §19 UStG Pflichthinweis */}
                    {pageIndex === totalPages - 1 && (data.kleinunternehmer === true || data.kleinunternehmer === 'true') && (
                        <div style={{ marginTop: '16px', padding: '10px 14px', background: '#eff6ff', borderLeft: '3px solid #3b82f6', borderRadius: '4px' }}>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: '#1e40af', fontWeight: '600' }}>
                                {data.kleinunternehmerText || 'Gemäß §19 UStG wird keine Umsatzsteuer berechnet.'}
                            </p>
                        </div>
                    )}

                    {/* Reverse Charge §13b UStG Pflichthinweis */}
                    {pageIndex === totalPages - 1 && data.reverseCharge && (
                        <div style={{ marginTop: '16px', padding: '10px 14px', background: '#faf5ff', borderLeft: '3px solid #8b5cf6', borderRadius: '4px' }}>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: '#6d28d9', fontWeight: '600' }}>
                                Steuerschuldnerschaft des Leistungsempfängers gemäß §13b UStG (Reverse Charge)
                                {data.recipientVatId && ` — USt-IdNr. des Empfängers: ${data.recipientVatId}`}
                            </p>
                        </div>
                    )}

                    {pageIndex === totalPages - 1 && data.footerNote && !['Vielen Dank für den Auftrag!', 'Gerne erwarten wir Ihre Auftragserteilung.'].includes(data.footerNote.trim()) && !data.footerNote.includes('Hinweis:\\nVielen Dank für den Auftrag') && (
                        <div className="invoice-note-section" style={{ marginTop: '20px', padding: '10px 0', borderTop: '1px solid #eee' }}>
                            <p className="small-text" style={{ fontStyle: 'italic' }}>{data.footerNote}</p>
                        </div>
                    )}

                    {/* Add Footer to every page */}
                    {renderFooter(pageIndex)}
                </div>
            ))}
        </div>
    );
});

export default InvoicePaper;
