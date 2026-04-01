import React, { forwardRef } from 'react';
import '../index.css';
import { useLanguage } from '../context/LanguageContext';
import { useInvoice } from '../context/InvoiceContext';
import { getIndustryFields } from '../config/industryFields';

const InvoicePaper = forwardRef(({ data, totals }, ref) => {
    const { tInvoice } = useLanguage();
    const { invoiceCustomization } = useInvoice();
    const { subtotal, tax, total } = totals;
    const currency = data.currency || 'EUR';

    const signatureUrl = data.signatureUrl || (invoiceCustomization?.signatureUrl);
    const industryConfig = getIndustryFields(data.industry || 'general');

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: currency }).format(amount);
    };

    // --- Pagination Logic ---
    const items = data.items || [];
    const ITEMS_FIRST_PAGE = 7;
    const ITEMS_SUBSEQUENT_PAGES = 12;

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
                    <h4>{tInvoice('paymentTermsAndBank')}</h4>
                    <p className="small-text">{data.paymentTerms || 'Bitte überweisen Sie den Gesamtbetrag innerhalb von 14 Tagen auf unser Bankkonto.'}</p>
                    <div className="footer-bank-details">
                        <p><strong>{tInvoice('bankLabel')}</strong> {data.senderBank}</p>
                        <p><strong>{tInvoice('ibanLabel')}</strong> {data.senderIban}</p>
                        <p><strong>{tInvoice('bicLabel')}</strong> {data.senderBic || 'BELADEBEXXX'}</p>
                        <p><strong>{tInvoice('usageLabel')}</strong> {data.invoiceNumber}</p>
                    </div>
                </div>

                <div className="footer-qr-section">
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
                                <img src={qrUrl} alt="GiroCode" onError={(e) => { e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(epcString)}`; }} />
                                <span>GiroCode</span>
                            </div>
                        );
                    })()}
                    {data.paypalMe && (
                        <div className="qr-box">
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(data.paypalMe)}`} alt="PayPal" />
                            <span>PayPal</span>
                        </div>
                    )}
                    {data.stripeLink && (
                        <div className="qr-box">
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(data.stripeLink)}`} alt="Stripe" />
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

    const primaryColor = data.primaryColor || (invoiceCustomization?.primaryColor || '#8B5CF6');
    const accentBg = `${primaryColor}10`; // 10% opacity for light theme look

    return (
        <div
            ref={ref}
            className="invoice-paper-wrapper"
            style={{
                '--invoice-primary': primaryColor,
                '--invoice-accent-bg': invoiceCustomization?.accentColor || '#f1f5f9'
            }}
        >
            {pages.map((pageItems, pageIndex) => (
                <div key={pageIndex} className={`invoice-paper print-page ${pageIndex === 0 ? 'first-page' : 'subsequent-page'}`}>

                    {/* Logo/Header Only on First Page */}
                    {pageIndex === 0 && (
                        <div className="invoice-header-top">
                            <div className="sender-meta-column">
                                {(data.logoDisplayMode === 'logoOnly' || data.logoDisplayMode === 'both') && (data.logo || data.logoUrl) && (
                                    <div className="header-logo">
                                        <img src={data.logo || data.logoUrl} alt="Logo" />
                                    </div>
                                )}
                                {(data.logoDisplayMode === 'nameOnly' || data.logoDisplayMode === 'both' || !data.logoDisplayMode) && (
                                    <p className="bold">{data.senderCompany}</p>
                                )}
                                <p>{data.senderStreet} {data.senderHouseNum}</p>
                                <p>{data.senderZip} {data.senderCity}</p>
                                <p>Tel: {data.senderPhone}</p>
                                <p>Email: {data.senderEmail}</p>
                            </div>
                        </div>
                    )}

                    <div className="invoice-main-title">
                        <h1>{data.title || (data.type === 'quote' ? tInvoice('quoteTitle') : tInvoice('invoiceTitle'))} {pageIndex > 0 && <span style={{ fontSize: '0.5em', fontWeight: '400', verticalAlign: 'middle' }}>({tInvoice('page')} {pageIndex + 1})</span>}</h1>
                    </div>

                    {/* Metadata Section (Recipient & Details) Repeated on Every Page */}
                    <div className="invoice-metadata-section">
                        <div className="metadata-column">
                            <h4 className="metadata-label">{tInvoice('recipientLabel')}</h4>
                            <p className="bold">{data.recipientName}</p>
                            <p>{data.recipientStreet} {data.recipientHouseNum}</p>
                            <p>{data.recipientZip} {data.recipientCity}</p>
                            <p>{data.recipientCountry || 'Deutschland'}</p>
                        </div>
                        <div className="metadata-column">
                            <h4 className="metadata-label">{tInvoice('detailsLabel')}</h4>
                            <table className="mini-meta-table">
                                <tbody>
                                    <tr>
                                        <td>{tInvoice('invoiceNumberLabel')}</td>
                                        <td>{data.invoiceNumber}</td>
                                    </tr>
                                    <tr>
                                        <td>{tInvoice('invoiceDateLabel')}</td>
                                        <td>{data.date ? new Date(data.date).toLocaleDateString(data.language === 'en' ? 'en-US' : 'de-DE', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}</td>
                                    </tr>
                                    {industryConfig.fields.map(field => (
                                        data[field.name] && (
                                            <tr key={field.name}>
                                                <td>{tInvoice(`${field.name}Label`)}:</td>
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
                                    <th>{tInvoice('descriptionLabel')}</th>
                                    <th className="text-center">{tInvoice('quantityLabel')}</th>
                                    <th className="text-right">{tInvoice('priceLabel')}</th>
                                    <th className="text-right">{tInvoice('totalPriceLabel')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageItems.map((item, index) => (
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

                    {/* Summary Section Only on Final Page */}
                    {pageIndex === totalPages - 1 && (
                        <div className="invoice-summary-section">
                            <div className="invoice-signature-block">
                                {signatureUrl ? (
                                    <img src={signatureUrl} alt="Signature" className="signature-image" />
                                ) : (
                                    <div className="signature-placeholder"></div>
                                )}
                                <div className="signature-line"></div>
                                <p className="signature-label">{tInvoice('signatureLabel')}</p>
                            </div>

                            <div className="invoice-totals-clean">
                                <div className="totals-row-clean">
                                    <span>{tInvoice('subtotalLabel')}</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="totals-row-clean">
                                    <span>{tInvoice('taxLabel')} {data.taxRate || 19}%:</span>
                                    <span>{formatCurrency(tax)}</span>
                                </div>
                                <div className="totals-row-clean grand-total-clean">
                                    <span>{tInvoice('grossTotalLabel')}</span>
                                    <span>{formatCurrency(total)}</span>
                                </div>
                            </div>
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
