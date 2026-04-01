import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoice } from '../context/InvoiceContext';
import { useLanguage } from '../context/LanguageContext';
import { Eye, Trash2, Edit, ArrowRightCircle, FileInput } from 'lucide-react';
import { getIndustryFields } from '../config/industryFields';
import ConfirmDialog from '../components/ConfirmDialog';
import '../index.css';

const Quotes = () => {
    const { quotes, deleteQuote, updateQuote, saveInvoice, companyProfile, STATUSES } = useInvoice(); // Use quotes array
    const { t, appLanguage } = useLanguage();
    const navigate = useNavigate();
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Get industry-specific configuration
    const industryConfig = getIndustryFields(companyProfile.industry || 'general');
    const isAutomotive = companyProfile.industry === 'automotive';

    const handleDelete = (quote) => {
        setDeleteConfirm(quote);
    };

    const handleConfirmDelete = () => {
        if (deleteConfirm) {
            deleteQuote(deleteConfirm.id);
            setDeleteConfirm(null);
        }
    };

    // Helper to update status directly via updateQuote
    const handleStatusChange = (id, newStatus) => {
        updateQuote(id, { status: newStatus });
    };

    const handleConvert = (quote) => {
        if (!quote) return;

        // Destructure to separate ID and type from rest of data
        const { id, type, ...rest } = quote;

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

        // Optionally mark quote as accepted
        updateQuote(quote.id, { status: 'accepted' });

        // Navigate to edit the new invoice with short delay
        setTimeout(() => {
            navigate(`/invoice/${savedInvoice.id}/edit`);
        }, 300);
    };

    // Get the first industry field name for display in the table
    const primaryField = industryConfig.fields[0];
    const primaryFieldLabel = appLanguage === 'tr' ? primaryField.labelTR : primaryField.label;

    // Helper to get the primary field value from invoice
    const getPrimaryFieldValue = (quote) => {
        if (quote.industryData && quote.industryData[primaryField.name]) {
            return quote.industryData[primaryField.name];
        }
        if (isAutomotive && quote.vehicle) {
            return `${quote.vehicle} ${quote.plate ? `(${quote.plate})` : ''}`;
        }
        return '-';
    };

    return (
        <>
            <div className="page-container">
                <header className="page-header">
                    <div>
                        <h1>{t('quotes')}</h1>
                        <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {t('quotesDesc')}
                        </p>
                    </div>
                    <div className="actions">
                        <button className="primary-btn" onClick={() => navigate('/quotes/new')}>
                            + {t('newQuote')}
                        </button>
                    </div>
                </header>

                <div className="card">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>{t('date')}</th>
                                <th>{t('quoteNumber')}</th>
                                <th>{t('customer')}</th>
                                <th>{primaryFieldLabel}</th>
                                <th>{t('total')}</th>
                                <th>{t('status')}</th>
                                <th>{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quotes.map(quote => (
                                <tr key={quote.id}>
                                    <td>{new Date(quote.date).toLocaleDateString('de-DE')}</td>
                                    <td>
                                        <span className="invoice-chip">{quote.invoiceNumber}</span>
                                    </td>
                                    <td>
                                        <div className="customer-cell">
                                            <strong>{quote.recipientName}</strong>
                                            <span>{quote.recipientCity}</span>
                                        </div>
                                    </td>
                                    <td>{getPrimaryFieldValue(quote)}</td>
                                    <td className="amount-cell">
                                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: quote.currency || 'EUR' }).format(quote.total)}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <select
                                                className="status-select"
                                                value={quote.status || 'draft'}
                                                onChange={(e) => handleStatusChange(quote.id, e.target.value)}
                                                style={{
                                                    backgroundColor: (STATUSES && STATUSES[quote.status || 'draft'] ? STATUSES[quote.status || 'draft'].color : '#94a3b8') + '20',
                                                    color: (STATUSES && STATUSES[quote.status || 'draft'] ? STATUSES[quote.status || 'draft'].color : '#94a3b8'),
                                                    borderColor: 'transparent',
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    appearance: 'none',
                                                    WebkitAppearance: 'none',
                                                    textAlign: 'center',
                                                    minWidth: '80px'
                                                }}
                                            >
                                                <option value="draft">{t('draft')}</option>
                                                <option value="sent">{t('sent')}</option>
                                                <option value="accepted">{t('accepted')}</option>
                                                <option value="rejected">{t('rejected')}</option>
                                            </select>
                                            <button
                                                className="icon-btn"
                                                title={t('convertToInvoice')}
                                                onClick={() => handleConvert(quote)}
                                                style={{ color: '#10b981', padding: '4px' }}
                                            >
                                                <FileInput size={18} />
                                            </button>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="icon-btn" title={t('edit')} onClick={() => navigate(`/quote/${quote.id}/edit`)}>
                                                <Edit size={18} />
                                            </button>
                                            <button className="icon-btn" title={t('view')} onClick={() => navigate(`/quote/${quote.id}`)}>
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                className="icon-btn delete"
                                                title={t('delete')}
                                                onClick={() => handleDelete(quote)}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {quotes.length === 0 && (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                                        {t('no_quotes_found')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmDialog
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleConfirmDelete}
                title={t('quote_deletion_title')}
                message={deleteConfirm ? t('quote_deletion_msg').replace('{number}', deleteConfirm.invoiceNumber) : ''}
                confirmText={t('confirm_delete')}
                cancelText={t('confirm_cancel')}
                type="danger"
            />
        </>
    );
};

export default Quotes;
