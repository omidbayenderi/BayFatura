import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoice } from '../context/InvoiceContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { usePanel } from '../context/PanelContext';
import { Eye, Trash2, Edit, ArrowRightCircle, FileInput, Lock, RotateCcw } from 'lucide-react';
import { getIndustryFields } from '../config/industryFields';
import ConfirmDialog from '../components/ConfirmDialog';
import '../index.css';

const Quotes = () => {
    const { 
        quotes, deleteQuote, restoreQuote, deleteQuotePermanently, deletedQuotes,
        updateQuote, saveInvoice, companyProfile, STATUSES 
    } = useInvoice();
    const { t, appLanguage } = useLanguage();
    const { isPro } = useAuth();
    const { showToast } = usePanel();
    const navigate = useNavigate();
    
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deletePermanentConfirm, setDeletePermanentConfirm] = useState(null);
    const [showTrash, setShowTrash] = useState(false);

    // Get industry-specific configuration
    const industryConfig = getIndustryFields(companyProfile.industry || 'general');
    const isAutomotive = companyProfile.industry === 'automotive';

    const activeQuotes = showTrash ? deletedQuotes : quotes;

    const handleDelete = (quote) => {
        setDeleteConfirm(quote);
    };

    const handleConfirmDelete = () => {
        if (deleteConfirm) {
            deleteQuote(deleteConfirm.id);
            setDeleteConfirm(null);
            showToast(appLanguage === 'tr' ? 'Teklif çöp kutusuna taşındı' : 'Angebot in den Papierkorb verschoben', 'info');
        }
    };

    const handleConfirmDeletePermanent = () => {
        if (deletePermanentConfirm) {
            deleteQuotePermanently(deletePermanentConfirm.id);
            setDeletePermanentConfirm(null);
            showToast(appLanguage === 'tr' ? 'Teklif kalıcı olarak silindi' : 'Angebot endgültig gelöscht', 'success');
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
    const primaryFieldLabel = t(primaryField.name + 'Label');

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
                            {t('offersDesc')}
                        </p>
                    </div>
                    <div className="actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button className={`secondary-btn ${showTrash ? 'active' : ''}`} onClick={() => setShowTrash(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: showTrash ? '#ef4444' : undefined, borderColor: showTrash ? '#ef4444' : undefined, background: showTrash ? '#ef444415' : undefined }}>
                            <Trash2 size={16} /> {showTrash ? (appLanguage === 'tr' ? "Normal Görünüm" : "Aktiv") : (appLanguage === 'tr' ? `Çöp Kutusu (${deletedQuotes.length})` : `Papierkorb (${deletedQuotes.length})`)}
                        </button>
                        <button className="primary-btn" onClick={() => {
                            if (!isPro) {
                                showToast(t('unlockFeatureMsg'), "info");
                                return;
                            }
                            navigate('/quotes/new');
                        }}>
                            + {t('newOffer')}
                            {!isPro && <Lock size={14} style={{ marginLeft: '4px', opacity: 0.7 }} />}
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
                            {activeQuotes.map(quote => (
                                <tr key={quote.id}>
                                    <td>{new Date(quote.date).toLocaleDateString(appLanguage === 'tr' ? 'tr-TR' : appLanguage === 'en' ? 'en-US' : 'de-DE')}</td>
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
                                        {new Intl.NumberFormat(appLanguage === 'tr' ? 'tr-TR' : appLanguage === 'en' ? 'en-US' : 'de-DE', { style: 'currency', currency: quote.currency || 'EUR' }).format(quote.total)}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <select
                                                className="status-select"
                                                value={quote.status || 'draft'}
                                                onChange={(e) => handleStatusChange(quote.id, e.target.value)}
                                                disabled={showTrash}
                                                style={{
                                                    backgroundColor: (STATUSES && STATUSES[quote.status || 'draft'] ? STATUSES[quote.status || 'draft'].color : '#94a3b8') + '20',
                                                    color: (STATUSES && STATUSES[quote.status || 'draft'] ? STATUSES[quote.status || 'draft'].color : '#94a3b8'),
                                                    borderColor: 'transparent',
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    cursor: showTrash ? 'not-allowed' : 'pointer',
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
                                            {!showTrash && (
                                                <button
                                                    className="icon-btn"
                                                    title={t('convertToInvoice')}
                                                    onClick={() => handleConvert(quote)}
                                                    style={{ color: '#10b981', padding: '4px' }}
                                                >
                                                    <FileInput size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            {showTrash ? (
                                                <>
                                                    <button className="icon-btn" style={{ color: '#10b981' }} title={appLanguage === 'tr' ? 'Geri Yükle' : 'Wiederherstellen'} onClick={() => { restoreQuote(quote.id); showToast(appLanguage === 'tr' ? 'Teklif geri yüklendi' : 'Angebot wiederhergestellt', 'success'); }}>
                                                        <RotateCcw size={18} />
                                                    </button>
                                                    <button className="icon-btn delete" title={appLanguage === 'tr' ? 'Kalıcı Olarak Sil' : 'Endgültig löschen'} onClick={() => setDeletePermanentConfirm(quote)}>
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
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
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {activeQuotes.length === 0 && (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                                        {showTrash ? (appLanguage === 'tr' ? "Çöp kutusu boş!" : "Papierkorb leer!") : t('noOffers')}
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

            <ConfirmDialog
                isOpen={!!deletePermanentConfirm}
                onClose={() => setDeletePermanentConfirm(null)}
                onConfirm={handleConfirmDeletePermanent}
                title={appLanguage === 'tr' ? 'Kalıcı Olarak Sil' : 'Endgültig löschen'}
                message={deletePermanentConfirm ? (appLanguage === 'tr' ? `Bu teklif (${deletePermanentConfirm.invoiceNumber}) kalıcı olarak silinecek. Bu işlem geri alınamaz!` : `Dieses Angebot (${deletePermanentConfirm.invoiceNumber}) wird endgültig gelöscht. Dies kann nicht rückgängig gemacht werden!`) : ''}
                confirmText={appLanguage === 'tr' ? 'Kalıcı Sil' : 'Löschen'}
                cancelText={t('confirm_cancel')}
                type="danger"
            />
        </>
    );
};

export default Quotes;
