import React, { useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useInvoice } from '../context/InvoiceContext';
import InvoicePaper from '../components/InvoicePaper';
import { Printer, ArrowLeft, Trash2, ArrowRightCircle, Edit, MessageCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const InvoiceView = ({ type = 'invoice' }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { invoices, quotes, deleteInvoice, deleteQuote, saveInvoice, companyProfile } = useInvoice();
    const { t } = useLanguage();

    const list = type === 'quote' ? quotes : invoices;
    const invoice = list.find(inv => inv.id === Number(id) || inv.id === id);
    const invoiceRef = useRef();

    const [searchParams] = useSearchParams();
    const shouldAutoPrint = searchParams.get('autoprint') === 'true';

    useEffect(() => {
        if (shouldAutoPrint && invoice) {
            // Small delay to ensure rendering is complete
            const timer = setTimeout(() => {
                window.print();
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [shouldAutoPrint, invoice]);

    if (!invoice) {
        return (
            <div className="page-container">
                <div className="empty-state">
                    <h2>{type === 'quote' ? t('quoteNotFound') : t('invoiceNotFound')}</h2>
                    <button className="primary-btn" onClick={() => navigate(type === 'quote' ? '/quotes' : '/archive')}>
                        {type === 'quote' ? t('backToQuotes') : t('backToArchive')}
                    </button>
                </div>
            </div>
        );
    }

    const handlePrint = () => {
        window.print();
    };

    const handleDelete = () => {
        if (window.confirm(t('delete') + '?')) {
            const deleteFunc = type === 'quote' ? deleteQuote : deleteInvoice;
            const deleted = deleteFunc(invoice.id);
            if (deleted) {
                navigate(type === 'quote' ? '/quotes' : '/archive');
            }
        }
    };

    const handleConvert = () => {
        // Destructure to separate ID and type from rest of data
        const { id, type: oldType, ...rest } = invoice;

        // Create new invoice object
        const newInvoiceData = {
            ...rest,
            status: 'draft',
            type: 'invoice',
            footerNote: '',
            // Generate a new Invoice Number
            invoiceNumber: new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 1000)).padStart(4, '0'),
            date: new Date().toISOString().split('T')[0], // Reset date to today
            createdAt: new Date().toISOString()
        };

        // Save as new invoice
        const savedInvoice = saveInvoice(newInvoiceData);

        // Navigate to edit the new invoice
        setTimeout(() => {
            navigate(`/invoice/${savedInvoice.id}/edit`);
        }, 300);
    };

    const sender = invoice.senderSnapshot || {};

    const paperData = {
        type: type, // Force type from prop to ensure correct title (Quote vs Invoice)
        logo: companyProfile.logo || sender.logo, // Use current logo
        senderCompany: companyProfile.companyName || sender.companyName,
        senderStreet: companyProfile.street || sender.street,
        senderHouseNum: companyProfile.houseNum || sender.houseNum,
        senderZip: companyProfile.zip || sender.zip,
        senderCity: companyProfile.city || sender.city,
        senderPhone: companyProfile.phone || sender.phone,
        senderEmail: companyProfile.email || sender.email,
        senderTaxId: companyProfile.taxId || sender.taxId,
        senderVatId: companyProfile.vatId || sender.vatId,

        // Bank details - ALWAYS use current settings for dynamic GiroCode
        senderBank: companyProfile.bankName || sender.bankName,
        senderIban: companyProfile.iban || sender.iban,
        senderBic: companyProfile.bic || sender.bic,

        industry: companyProfile.industry || sender.industry || 'general',
        logoDisplayMode: companyProfile.logoDisplayMode || 'both',

        // Footer with current bank info
        footerPayment: `Bank: ${companyProfile.bankName || sender.bankName}\nIBAN: ${companyProfile.iban || sender.iban}\n${companyProfile.paymentTerms || sender.paymentTerms || ''}`,
        footerNote: invoice.footerNote,

        recipientName: invoice.recipientName,
        recipientStreet: invoice.recipientStreet,
        recipientHouseNum: invoice.recipientHouseNum,
        recipientZip: invoice.recipientZip,
        recipientCity: invoice.recipientCity,

        invoiceNumber: invoice.invoiceNumber,
        date: invoice.date,
        currency: invoice.currency || 'EUR',

        // Industry Specific Data from nesting
        ...(invoice.industryData || {}),
        // Backward compatibility for old flattened invoices
        vehicle: invoice.vehicle,
        plate: invoice.plate,
        km: invoice.km,

        items: invoice.items || [],

        paypalMe: sender.paypalMe,
        stripeLink: sender.stripeLink
    };

    const paperTotals = {
        subtotal: invoice.subtotal || 0,
        tax: invoice.tax || 0,
        total: invoice.total || 0
    };

    return (
        <div className="page-container">
            <header className="page-header no-print">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button className="icon-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft />
                    </button>
                    <div>
                        <h1>{type === 'quote' ? (t('quoteDetails') || 'Angebot Details') : (t('invoiceDetails') || 'Rechnung Details')}</h1>
                        <p>{invoice.invoiceNumber} - {invoice.recipientName}</p>
                    </div>
                </div>
                <div className="actions" style={{ display: 'flex', gap: '12px' }}>
                    <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                            `${t('hello') || 'Merhaba'} ${invoice.recipientName},\n\n` +
                            `${t('invoiceReadyMsg') || 'Faturanız hazırdır.'} ` +
                            `${t('invoiceNumber')}: ${invoice.invoiceNumber}\n` +
                            `${t('total')}: ${new Intl.NumberFormat('de-DE', { style: 'currency', currency: invoice.currency || 'EUR' }).format(invoice.total || 0)}\n\n` +
                            `${window.location.href}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="primary-btn"
                        style={{ backgroundColor: '#25D366', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
                    >
                        <MessageCircle size={20} />
                        WhatsApp
                    </a>
                    {type === 'quote' && (
                        <button className="primary-btn" onClick={handleConvert} style={{ backgroundColor: '#10b981' }}>
                            <ArrowRightCircle size={20} />
                            {t('convertToInvoice') || 'In Rechnung umwandeln'}
                        </button>
                    )}
                    <button className="secondary-btn" onClick={() => navigate(`/${type}/${invoice.id}/edit`)}>
                        <Edit size={20} />
                        {t('edit')}
                    </button>
                    <button className="secondary-btn delete-hover" onClick={handleDelete} style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                        <Trash2 size={20} />
                        {t('delete')}
                    </button>
                    <button className="primary-btn" onClick={handlePrint}>
                        <Printer size={20} />
                        {t('printPdf')}
                    </button>
                </div>
            </header>

            {(sender.paypalMe || sender.stripeLink) && (
                <div className="payment-actions no-print" style={{
                    marginTop: '24px',
                    padding: '24px',
                    background: '#ffffff',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    maxWidth: '800px',
                    margin: '24px auto 24px auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <h3 style={{ margin: 0, color: '#1e293b' }}>{t('payOnline')}</h3>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {sender.paypalMe && (
                            <a
                                href={sender.paypalMe}
                                target="_blank"
                                rel="noreferrer"
                                className="primary-btn"
                                style={{ backgroundColor: '#003087', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
                            >
                                <img src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg" alt="PayPal" style={{ height: '20px' }} />
                                {t('payWithPaypal')}
                            </a>
                        )}
                        {sender.stripeLink && (
                            <a
                                href={sender.stripeLink}
                                target="_blank"
                                rel="noreferrer"
                                className="primary-btn"
                                style={{ backgroundColor: '#635bff', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
                            >
                                {t('payWithStripe')}
                            </a>
                        )}
                    </div>
                </div>
            )}

            <div className="view-layout">
                <InvoicePaper ref={invoiceRef} data={paperData} totals={paperTotals} />
            </div>
        </div>
    );
};

export default InvoiceView;
