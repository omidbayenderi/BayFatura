import React, { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useInvoice } from '../context/InvoiceContext';
import InvoicePaper from '../components/InvoicePaper';
import { Download, ArrowLeft, Trash2, ArrowRightCircle, Edit, MessageCircle, FileCode, Building2, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { generateUBL21, downloadUBL } from '../lib/ublGenerator';
import { generateXRechnungXML, downloadXRechnungXML } from '../lib/xrechnungGenerator';

const InvoiceSkeleton = () => (
    <div className="page-container">
        <header className="page-header no-print">
            <div className="page-header-row">
                <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
                <div>
                    <div className="skeleton-text" style={{ height: '28px', width: '300px', marginBottom: '8px' }} />
                    <div className="skeleton-text" style={{ width: '200px' }} />
                </div>
            </div>
            <div className="actions actions-row">
                {[1,2,3,4,5].map(i => (
                    <div key={i} className="skeleton-button" style={{ width: '140px', height: '40px' }} />
                ))}
            </div>
        </header>
        <div className="skeleton-card" style={{ height: '120px', marginBottom: '24px' }} />
        <div className="view-layout">
            <div className="skeleton" style={{ width: '210mm', height: '297mm', borderRadius: 'var(--radius-lg)' }} />
        </div>
    </div>
);

const InvoiceView = ({ type = 'invoice' }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { invoices, quotes, deleteInvoice, deleteQuote, saveInvoice, companyProfile, loading } = useInvoice();
    const { t } = useLanguage();
    const invoiceRef = useRef();
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    // FIX: All hooks must be called BEFORE any conditional returns (React Rules of Hooks)
    useEffect(() => {
        if (loading !== undefined) {
            setIsLoading(loading);
        } else if (invoices.length > 0 || quotes.length > 0) {
            setIsLoading(false);
        } else {
            const timer = setTimeout(() => setIsLoading(false), 500);
            return () => clearTimeout(timer);
        }
    }, [loading, invoices, quotes]);

    const shouldAutoPrint = searchParams.get('autoprint') === 'true';

    const list = type === 'quote' ? quotes : invoices;
    const invoice = list.find(inv => inv.id === Number(id) || inv.id === id);

    useEffect(() => {
        if (shouldAutoPrint && invoice) {
            const timer = setTimeout(() => {
                handleDownloadPDF();
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [shouldAutoPrint, invoice]);

    if (isLoading) {
        return <InvoiceSkeleton />;
    }

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

    const handleDownloadPDF = async () => {
        setIsGeneratingPDF(true);
        try {
            const element = invoiceRef.current;
            if (!element) throw new Error("Invoice ref not found");

            // Safeguard: Force desktop dimensions temporarily for flawless canvas capture on mobile
            const originalStyle = element.getAttribute('style') || '';
            element.style.setProperty('transform', 'none', 'important');
            element.style.setProperty('margin', '0', 'important');
            element.style.setProperty('padding', '0', 'important');
            element.style.setProperty('width', '794px', 'important'); // 210mm in px at 96dpi
            element.style.setProperty('max-width', '794px', 'important');
            element.style.setProperty('min-width', '794px', 'important');

            // Safeguard: Remove margins on individual pages to prevent gap artifacts in PDF slicing
            const pages = element.querySelectorAll('.invoice-paper');
            const originalPageMargins = [];
            pages.forEach(p => {
                originalPageMargins.push(p.style.marginBottom);
                p.style.setProperty('margin-bottom', '0', 'important');
            });

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: 794 // Match the forced width precisely
            });

            // Restore original styles
            element.setAttribute('style', originalStyle);
            pages.forEach((p, i) => {
                p.style.marginBottom = originalPageMargins[i];
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            let heightLeft = pdfHeight;
            let position = 0;

            // First page
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;

            // Subsequent pages
            while (heightLeft >= 1) { // 1mm tolerance for rounding errors
                position -= pageHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`Rechnung_${invoice.invoiceNumber}.pdf`);
        } catch (error) {
            console.error('PDF generation failed:', error);
            // Fallback to native print if canvas fails
            window.print();
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handlePrint = async () => {
        await handleDownloadPDF();
    };

    // FIX: Await the async delete and properly navigate
    const handleDelete = async () => {
        if (window.confirm(t('delete') + '?')) {
            const deleteFunc = type === 'quote' ? deleteQuote : deleteInvoice;
            await deleteFunc(invoice.id);
            navigate(type === 'quote' ? '/quotes' : '/archive');
        }
    };

    // FIX: Await saveInvoice which is async (returns a Promise)
    const handleConvert = async () => {
        const { id: _id, type: _type, ...rest } = invoice;

        const newInvoiceData = {
            ...rest,
            status: 'draft',
            type: 'invoice',
            footerNote: '',
            invoiceNumber: new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 1000)).padStart(4, '0'),
            date: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString()
        };

        try {
            const savedInvoice = await saveInvoice(newInvoiceData);
            if (savedInvoice && savedInvoice.id) {
                navigate(`/invoice/${savedInvoice.id}/edit`);
            }
        } catch (err) {
            console.error('Convert failed:', err);
        }
    };

    // — B2G: UBL 2.1 CIUS-PT XML download (Portugal public sector)
    const handleDownloadUBL = () => {
        const senderForUBL = {
            companyName: companyProfile.companyName,
            street: companyProfile.street,
            houseNum: companyProfile.houseNum,
            zip: companyProfile.zip,
            city: companyProfile.city,
            taxId: companyProfile.taxId,
            vatId: companyProfile.vatId,
            country: companyProfile.country || 'PT',
            companyEmail: companyProfile.companyEmail,
            iban: companyProfile.iban,
            bic: companyProfile.bic,
        };
        const totals = {
            subtotal: invoice.subtotal || 0,
            tax: invoice.tax || 0,
            total: invoice.total || 0,
        };
        const xml = generateUBL21({ ...invoice, type: 'invoice' }, senderForUBL, totals);
        downloadUBL(xml, invoice.invoiceNumber);
    };

    // — XRechnung XML download (Germany B2G)
    const handleDownloadXRechnung = () => {
        try {
            const senderForXR = {
                companyName: companyProfile.companyName,
                street: companyProfile.street,
                houseNum: companyProfile.houseNum,
                zip: companyProfile.zip,
                city: companyProfile.city,
                taxId: companyProfile.taxId,
                vatId: companyProfile.vatId,
                country: companyProfile.country || 'DE',
                email: companyProfile.companyEmail,
                iban: companyProfile.iban,
                bic: companyProfile.bic,
            };
            downloadXRechnungXML(invoice, senderForXR);
        } catch(e) {
            console.error('XRechnung error:', e);
        }
    };

    const isPortugal = (companyProfile.country || 'PT') === 'PT';
    const isGermany = companyProfile.country === 'DE';

    const sender = invoice.senderSnapshot || {};

    const paperData = {
        type: type,
        logo: companyProfile.logo || sender.logo,
        signatureUrl: companyProfile.signatureUrl || sender.signatureUrl || '',
        stampUrl: companyProfile.stampUrl || sender.stampUrl || '',
        senderCompany: companyProfile.companyName || sender.companyName,
        senderStreet: companyProfile.street || sender.street,
        senderHouseNum: companyProfile.houseNum || sender.houseNum,
        senderZip: companyProfile.zip || sender.zip,
        senderCity: companyProfile.city || sender.city,
        // FIX: Use correct field names (companyPhone / companyEmail, not phone / email)
        senderPhone: companyProfile.companyPhone || sender.companyPhone || sender.phone,
        senderEmail: companyProfile.companyEmail || sender.companyEmail || sender.email,
        senderTaxId: companyProfile.taxId || sender.taxId,
        senderVatId: companyProfile.vatId || sender.vatId,

        senderBank: companyProfile.bankName || sender.bankName,
        senderIban: companyProfile.iban || sender.iban,
        senderBic: companyProfile.bic || sender.bic,

        industry: companyProfile.industry || sender.industry || 'general',
        logoDisplayMode: companyProfile.logoDisplayMode || 'both',

        // FIX: Pass paymentTerms from invoice data (previously missing)
        paymentTerms: invoice.paymentTerms || companyProfile.paymentTerms || sender.paymentTerms || '',
        footerPayment: `Bank: ${companyProfile.bankName || sender.bankName}\nIBAN: ${companyProfile.iban || sender.iban}\n${invoice.paymentTerms || companyProfile.paymentTerms || ''}`,
        footerNote: invoice.footerNote,

        recipientName: invoice.recipientName,
        recipientStreet: invoice.recipientStreet,
        recipientHouseNum: invoice.recipientHouseNum,
        recipientZip: invoice.recipientZip,
        recipientCity: invoice.recipientCity,
        recipientCountry: invoice.recipientCountry || '',
        recipientVatId: invoice.recipientVatId || '',

        invoiceNumber: invoice.invoiceNumber,
        date: invoice.date,
        leistungsdatum: invoice.leistungsdatum || '',
        currency: invoice.currency || 'EUR',
        taxRate: invoice.taxRate || (isPortugal ? 23 : 19),
        language: invoice.language,

        // Compliance fields
        senderCountry: companyProfile.country || 'PT',
        country: companyProfile.country || 'PT',
        atValidationCode: companyProfile.atValidationCode,
        ptQrEnabled: companyProfile.ptQrEnabled,
        ptDocType: companyProfile.ptDocType || 'FT',
        kleinunternehmer: companyProfile.kleinunternehmer,
        kleinunternehmerText: companyProfile.kleinunternehmerText,
        reverseCharge: invoice.reverseCharge,
        b2g: invoice.b2g,

        ...(invoice.industryData || {}),
        vehicle: invoice.vehicle || invoice.industryData?.vehicle || '',
        plate: invoice.plate || invoice.industryData?.plate || '',
        km: invoice.km || invoice.industryData?.km || '',
        vin: invoice.vin || invoice.industryData?.vin || '',

        items: invoice.items || [],

        paypalMe: sender.paypalMe || companyProfile.paypalMe,
        stripeLink: sender.stripeLink || companyProfile.stripeLink
    };

    const paperTotals = {
        subtotal: invoice.subtotal || 0,
        tax: invoice.tax || 0,
        total: invoice.total || 0
    };

    return (
        <div className="page-container">
            <header className="page-header no-print">
                <div className="page-header-row">
                    <button className="icon-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft />
                    </button>
                    <div>
                        <h1>{type === 'quote' ? t('quoteDetails') : t('invoiceDetails')}</h1>
                        <p>{invoice.invoiceNumber} - {invoice.recipientName}</p>
                    </div>
                </div>
                <div className="actions actions-row">
                    {/* B2G: UBL 2.1 XML for Portugal public sector */}
                    {type === 'invoice' && isPortugal && invoice.b2g && (
                        <button
                            className="secondary-btn"
                            onClick={handleDownloadUBL}
                            title="UBL 2.1 CIUS-PT — eSPap / PEPPOL"
                            style={{ borderColor: '#15803d', color: '#15803d' }}
                        >
                            <Building2 size={18} />
                            B2G XML (eSPap)
                        </button>
                    )}
                    {/* XRechnung for Germany B2G */}
                    {type === 'invoice' && isGermany && invoice.b2g && (
                        <button
                            className="secondary-btn"
                            onClick={handleDownloadXRechnung}
                            title="XRechnung XML — ZRE / OZG-RE"
                            style={{ borderColor: '#3b82f6', color: '#3b82f6' }}
                        >
                            <FileCode size={18} />
                            XRechnung XML
                        </button>
                    )}
                    {/* Standard XML exports (always available) */}
                    {type === 'invoice' && (
                        <button
                            className="secondary-btn"
                            onClick={isGermany ? handleDownloadXRechnung : handleDownloadUBL}
                            title={isGermany ? 'XRechnung XML' : 'UBL 2.1 CIUS-PT XML'}
                        >
                            <FileCode size={18} />
                            {isGermany ? 'XRechnung' : 'UBL XML'}
                        </button>
                    )}
                    <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                            `${t('hello')} ${invoice.recipientName},\n\n` +
                            `${t('invoiceReadyMsg')} ` +
                            `${t('invoiceNumber')}: ${invoice.invoiceNumber}\n` +
                            `${t('total')}: ${new Intl.NumberFormat('de-DE', { style: 'currency', currency: invoice.currency || 'EUR' }).format(invoice.total || 0)}\n\n` +
                            `${window.location.href}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="primary-btn whatsapp-btn"
                    >
                        <MessageCircle size={20} />
                        WhatsApp
                    </a>
                    {type === 'quote' && (
                        <button className="primary-btn convert-btn" onClick={handleConvert}>
                            <ArrowRightCircle size={20} />
                            {t('convertToInvoice')}
                        </button>
                    )}
                    <button className="secondary-btn" onClick={() => navigate(`/${type}/${invoice.id}/edit`)}>
                        <Edit size={20} />
                        {t('edit')}
                    </button>
                    <button className="secondary-btn delete-hover delete-danger-btn" onClick={handleDelete}>
                        <Trash2 size={20} />
                        {t('delete')}
                    </button>
                    <button className="primary-btn" onClick={handlePrint} disabled={isGeneratingPDF}>
                        {isGeneratingPDF ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <Download size={20} />
                        )}
                        {isGeneratingPDF ? (t('generatingPDF') || 'Generating...') : t('printPdf')}
                    </button>
                </div>
            </header>

            {(sender.paypalMe || sender.stripeLink || companyProfile.paypalMe || companyProfile.stripeLink) && (
                <div className="payment-actions no-print payment-actions-card">
                    <h3 className="payment-actions-title">{t('payOnline')}</h3>
                    <div className="payment-buttons-row">
                        {(sender.paypalMe || companyProfile.paypalMe) && (
                            <a
                                href={sender.paypalMe || companyProfile.paypalMe}
                                target="_blank"
                                rel="noreferrer"
                                className="primary-btn paypal-btn"
                            >
                                <img src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg" alt="PayPal" className="paypal-logo" />
                                {t('payWithPaypal')}
                            </a>
                        )}
                        {(sender.stripeLink || companyProfile.stripeLink) && (
                            <a
                                href={sender.stripeLink || companyProfile.stripeLink}
                                target="_blank"
                                rel="noreferrer"
                                className="primary-btn stripe-btn"
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
