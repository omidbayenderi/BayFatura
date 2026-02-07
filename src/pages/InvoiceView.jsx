import React, { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInvoice } from '../context/InvoiceContext';
import InvoicePaper from '../components/InvoicePaper';
import { Printer, ArrowLeft, Trash2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const InvoiceView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { invoices, deleteInvoice, companyProfile } = useInvoice();
    const { t } = useLanguage();

    const invoice = invoices.find(inv => inv.id === Number(id) || inv.id === id);
    const invoiceRef = useRef();

    if (!invoice) {
        return (
            <div className="page-container">
                <div className="empty-state">
                    <h2>{t('invoiceNotFound')}</h2>
                    <button className="primary-btn" onClick={() => navigate('/archive')}>{t('backToArchive')}</button>
                </div>
            </div>
        );
    }

    const handleDownloadPdf = async () => {
        const element = invoiceRef.current;
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Rechnung_${invoice.invoiceNumber}.pdf`);
        } catch (error) {
            console.error('PDF generation failed:', error);
            window.print(); // Fallback to window.print if jsPDF fails
        }
    };

    const handleDelete = () => {
        if (window.confirm(t('delete') + '?')) {
            const deleted = deleteInvoice(invoice.id);
            if (deleted) {
                navigate('/archive');
            }
        }
    };

    const sender = invoice.senderSnapshot || {};

    const paperData = {
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
        vehicle: invoice.vehicle,
        plate: invoice.plate,
        km: invoice.km,
        currency: invoice.currency || 'EUR',

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
                        <h1>{t('invoiceDetails')}</h1>
                        <p>{invoice.invoiceNumber} - {invoice.recipientName}</p>
                    </div>
                </div>
                <div className="actions" style={{ display: 'flex', gap: '12px' }}>
                    <button className="secondary-btn delete-hover" onClick={handleDelete} style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                        <Trash2 size={20} />
                        {t('delete')}
                    </button>
                    <button className="primary-btn" onClick={handleDownloadPdf}>
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

            <div className="view-layout no-print" style={{ overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
                <InvoicePaper data={paperData} totals={paperTotals} />
            </div>

            <div className="hidden-print-container">
                <InvoicePaper ref={invoiceRef} data={paperData} totals={paperTotals} />
            </div>
        </div>
    );
};

export default InvoiceView;
