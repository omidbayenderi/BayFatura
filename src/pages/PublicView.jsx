import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import InvoicePaper from '../components/InvoicePaper';
import { useLanguage } from '../context/LanguageContext';
import { Printer, Download, Landmark, CreditCard, Zap } from 'lucide-react';
import jsPDF from 'jspdf';

const PublicView = ({ type = 'invoice' }) => {
    const { id } = useParams();
    const { t } = useLanguage();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchParams] = useSearchParams();
    const shouldAutoPrint = searchParams.get('autoprint') === 'true';

    useEffect(() => {
        // Force desktop viewport for exact PC replica on mobile
        const metaViewport = document.querySelector('meta[name=viewport]');
        if (metaViewport) {
            metaViewport.setAttribute('content', 'width=900');
        }
        return () => {
            if (metaViewport) {
                metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
            }
        };
    }, []);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const { doc, getDoc } = await import('firebase/firestore');
                const { db } = await import('../lib/firebase');
                const docSnap = await getDoc(doc(db, type === 'quote' ? 'quotes' : 'invoices', id));
                if (docSnap.exists()) {
                    setInvoice({ id: docSnap.id, ...docSnap.data() });
                } else {
                    setError('Document not found');
                }
            } catch (err) {
                console.error("Error fetching public invoice:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();
    }, [id, type]);

    const [latestSender, setLatestSender] = useState(null);

    // Fetch LATEST profile of the creator for live logo/branding
    useEffect(() => {
        if (!invoice || !invoice.userId) return;
        const fetchLatestProfile = async () => {
            try {
                const userSnap = await getDoc(doc(db, 'users', invoice.userId));
                if (userSnap.exists()) {
                    setLatestSender(userSnap.data());
                }
            } catch (err) {
                console.warn("Could not fetch latest profile, using snapshot fallback:", err);
            }
        };
        fetchLatestProfile();
    }, [invoice]);

    useEffect(() => {
        if (!loading && invoice && shouldAutoPrint) {
            const timer = setTimeout(() => {
                window.print();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [loading, invoice, shouldAutoPrint]);

    const handleDownload = async () => {
        const pages = document.querySelectorAll('.print-page');
        if (!pages.length) return;

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        try {
            const html2canvas = (await import('html2canvas')).default;
            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                if (i > 0) pdf.addPage();

                // Create a clean, off-screen container for the capture
                const container = document.createElement('div');
                container.style.position = 'fixed';
                container.style.left = '-9999px';
                container.style.top = '0';
                container.style.width = '794px'; // EXACT A4 pixels
                container.style.background = 'white';
                document.body.appendChild(container);

                // Clone the page into the clean container
                const clone = page.cloneNode(true);
                clone.style.transform = 'none';
                clone.style.margin = '0';
                clone.style.boxShadow = 'none';
                clone.style.border = 'none';
                clone.style.width = '794px';
                clone.style.height = '1122px'; // A4 Height pixels
                container.appendChild(clone);

                const canvas = await html2canvas(clone, { 
                    scale: 2.5,
                    useCORS: true, 
                    logging: false,
                    backgroundColor: '#ffffff',
                    width: 794,
                    height: 1122
                });

                // Clean up container
                document.body.removeChild(container);

                const imgData = canvas.toDataURL('image/png', 1.0);
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            }

            pdf.save(`${type === 'quote' ? 'Angebot' : 'Rechnung'}_${invoice.invoiceNumber}.pdf`);
        } catch (err) {
            console.error("Multi-Page PDF Error:", err);
            alert("Fehler beim Erstellen des PDFs. Bitte nutzen Sie die 'Drucken' Funktion.");
        }
    };

    if (loading) return <div className="loading-spinner"><div className="spinner"></div><p>{t('loading')}</p></div>;
    if (error || !invoice) return <div className="empty-state"><h2>{t('documentNotFound')}</h2></div>;

    const sender = latestSender || invoice.senderSnapshot || {};

    const paperData = {
        ...invoice,
        type: type,
        // Corporate Identity (Prioritize LIVE data for logo/name, fallback to snapshot)
        logo: latestSender?.logo || invoice.logo || sender.logo, 
        logoUrl: latestSender?.logoUrl || invoice.logoUrl || sender.logoUrl,
        senderCompany: latestSender?.companyName || invoice.senderCompany || sender.companyName,
        senderStreet: latestSender?.street || invoice.senderStreet || sender.street,
        senderHouseNum: latestSender?.houseNum || invoice.senderHouseNum || sender.houseNum,
        senderZip: latestSender?.zip || sender.zip,
        senderCity: latestSender?.city || sender.city,
        senderPhone: latestSender?.phone || sender.phone,
        senderEmail: latestSender?.email || sender.email,
        senderTaxId: latestSender?.taxId || sender.taxId,
        senderVatId: latestSender?.vatId || sender.vatId,
        primaryColor: latestSender?.primaryColor || invoice.primaryColor || sender.primaryColor,

        // Bank
        senderBank: latestSender?.bankName || invoice.senderBank || sender.bankName,
        senderIban: latestSender?.iban || invoice.senderIban || sender.iban,
        senderBic: latestSender?.bic || invoice.senderBic || sender.bic,

        // Industry & Sign
        industry: latestSender?.industry || invoice.industry || sender.industry || 'general',
        logoDisplayMode: latestSender?.logoDisplayMode || invoice.logoDisplayMode || sender.logoDisplayMode || 'both',
        signatureUrl: latestSender?.signatureUrl || invoice.signatureUrl || sender.signatureUrl,
        stampUrl: latestSender?.stampUrl || invoice.stampUrl || sender.stampUrl,

        // Footer
        paymentTerms: invoice.paymentTerms || latestSender?.paymentTerms || sender.paymentTerms || '',
        footerPayment: invoice.footerPayment || `Bank: ${latestSender?.bankName || invoice.senderBank || sender.bankName}\nIBAN: ${latestSender?.iban || invoice.senderIban || sender.iban}\n${invoice.paymentTerms || latestSender?.paymentTerms || sender.paymentTerms || ''}`,
        
        ...(invoice.industryData || {}),
    };

    const paperTotals = {
        subtotal: invoice.subtotal || 0,
        tax: invoice.tax || 0,
        total: invoice.total || 0
    };

    return (
        <div className="public-invoice-container" style={{ padding: '0', background: '#525659', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="no-print" style={{ 
                width: '100%',
                background: '#1e1f23',
                color: 'white',
                padding: '12px 24px',
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                gap: '12px',
                flexWrap: 'wrap'
            }}>
                {/* Left: BayFatura brand + invoice number */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Zap size={16} fill="white" color="white" />
                        </div>
                        <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#94a3b8' }}>BayFatura</span>
                    </div>
                    <div style={{ width: '1px', height: '20px', background: '#374151' }} />
                    <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '500', color: '#e2e8f0' }}>{invoice.invoiceNumber} · {invoice.recipientName}</h3>
                </div>

                {/* Right: Action buttons */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button className="secondary-btn" onClick={handleDownload}
                        style={{ background: 'rgba(255,255,255,0.08)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.15)', padding: '7px 14px', fontSize: '0.85rem' }}>
                        <Download size={16} />
                        PDF
                    </button>
                    <button className="primary-btn" onClick={() => window.print()}
                        style={{ background: '#0078d4', padding: '7px 14px', fontSize: '0.85rem' }}>
                        <Printer size={16} />
                        {t('print')}
                    </button>
                </div>
            </div>

            {/* Customer Self-Service Payment Panel */}
            {invoice.total > 0 && (
                <div className="no-print" style={{
                    width: '100%', maxWidth: '794px',
                    background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                    borderBottom: '1px solid #334155',
                    padding: '16px 24px',
                    display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap',
                    marginTop: '4px'
                }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {type === 'quote' ? 'Angebot' : 'Offener Betrag'}
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#3b82f6', marginTop: '2px' }}>
                            {new Intl.NumberFormat('de-DE', { style: 'currency', currency: invoice.currency || 'EUR' }).format(invoice.total)}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {/* SEPA Bank Transfer info */}
                        {(latestSender?.iban || invoice.senderIban) && (
                            <div style={{ padding: '10px 16px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)', fontSize: '0.78rem', color: '#93c5fd' }}>
                                <div style={{ fontWeight: '700', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: 6 }}><Landmark size={16} /> SEPA Überweisung</div>
                                <div style={{ opacity: 0.8 }}>{(latestSender?.iban || invoice.senderIban || '').replace(/(.{4})/g, '$1 ').trim()}</div>
                                <div style={{ opacity: 0.6, fontSize: '0.72rem' }}>Ref: {invoice.invoiceNumber}</div>
                            </div>
                        )}
                        {/* PayPal / Stripe from sender settings */}
                        {(invoice.senderSnapshot?.paypalMe) && (
                            <a href={invoice.senderSnapshot.paypalMe} target="_blank" rel="noreferrer"
                                style={{ padding: '10px 18px', background: '#003087', borderRadius: '12px', color: 'white', textDecoration: 'none', fontWeight: '700', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CreditCard size={16} /> PayPal</div>
                            </a>
                        )}
                        {invoice.senderSnapshot?.stripeLink && (
                            <a href={invoice.senderSnapshot.stripeLink} target="_blank" rel="noreferrer"
                                style={{ padding: '10px 18px', background: '#635bff', borderRadius: '12px', color: 'white', textDecoration: 'none', fontWeight: '700', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Zap size={16} fill="currentColor" /> {t('payWithStripe')}
                            </a>
                        )}
                    </div>
                </div>
            )}
            
            <div className="view-layout" style={{ marginTop: '20px', marginBottom: '40px', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}>
                <InvoicePaper data={paperData} totals={paperTotals} />
            </div>

            <style>{`
                /* Print styles */
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; padding: 0 !important; margin: 0 !important; }
                    .public-invoice-container { padding: 0 !important; background: white !important; display: block !important; }
                    .view-layout { margin: 0 !important; box-shadow: none !important; display: block !important; width: 210mm !important; }
                    
                    /* The 80% Scale Fix for Mobile Print */
                    .invoice-paper-wrapper { 
                        transform: none !important; 
                        margin: 0 !important; 
                        width: 210mm !important;
                        box-shadow: none !important;
                    }

                    @media (max-width: 800px) {
                        html, body {
                           zoom: 0.8; /* Force 80% scaling for mobile print engines */
                        }
                    }
                }

                /* Mobile Viewer - Force 1:1 Desktop Aspect Ratio */
                .public-invoice-container {
                    background: #525659;
                    min-height: 100vh;
                    overflow-x: hidden;
                    width: 100%;
                    padding: 0;
                    margin: 0;
                }

                .view-layout {
                    display: flex;
                    justify-content: center;
                    width: 100%;
                    padding: 40px 0;
                }

                /* Locked A4 Container for Mobile */
                @media (max-width: 800px) {
                    .view-layout {
                        padding: 10px 0;
                        min-height: calc(297mm * (100vw / 210mm));
                    }
                    .invoice-paper-wrapper {
                        /* Force the desktop A4 layout at any screen size */
                        transform: scale(calc(100vw / 210mm)); 
                        transform-origin: top center;
                        margin: 0 !important;
                        width: 210mm !important;
                        box-shadow: 0 0 10px rgba(0,0,0,0.3) !important;
                    }
                    .print-page {
                        width: 210mm !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                    }
                }

                /* Fix for any global padding overrides */
                .invoice-paper-wrapper, .print-page {
                    box-sizing: border-box !important;
                }
            `}</style>
        </div>
    );
};

export default PublicView;
