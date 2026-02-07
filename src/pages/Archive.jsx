import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoice } from '../context/InvoiceContext';
import { useLanguage } from '../context/LanguageContext';
import { Eye, Trash2, Edit } from 'lucide-react';
import { getIndustryFields } from '../config/industryFields';
import ConfirmDialog from '../components/ConfirmDialog';
import '../index.css';

const Archive = () => {
    const { invoices, deleteInvoice, STATUSES, companyProfile } = useInvoice();
    const { t, appLanguage } = useLanguage();
    const navigate = useNavigate();
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Get industry-specific configuration
    const industryConfig = getIndustryFields(companyProfile.industry || 'general');
    const isAutomotive = companyProfile.industry === 'automotive';

    const handleDelete = (invoice) => {
        setDeleteConfirm(invoice);
    };

    const handleConfirmDelete = () => {
        if (deleteConfirm) {
            deleteInvoice(deleteConfirm.id);
            setDeleteConfirm(null);
        }
    };

    // Get the first industry field name for display in the table
    const primaryField = industryConfig.fields[0];
    const primaryFieldLabel = appLanguage === 'tr' ? primaryField.labelTR : primaryField.label;

    // Helper to get the primary field value from invoice
    const getPrimaryFieldValue = (inv) => {
        // Check industryData first, then fallback to legacy fields
        if (inv.industryData && inv.industryData[primaryField.name]) {
            return inv.industryData[primaryField.name];
        }
        // Fallback for legacy automotive invoices
        if (isAutomotive && inv.vehicle) {
            return `${inv.vehicle} ${inv.plate ? `(${inv.plate})` : ''}`;
        }
        return '-';
    };

    return (
        <>
            <div className="page-container">
                <header className="page-header">
                    <div>
                        <h1>{t('archive')}</h1>
                        <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {industryConfig.icon} {appLanguage === 'tr' ? industryConfig.sectionTitleTR : industryConfig.sectionTitle}
                        </p>
                    </div>
                </header>

                <div className="card">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>{t('date')}</th>
                                <th>{t('invoiceNumber')}</th>
                                <th>{t('customer')}</th>
                                <th>{primaryFieldLabel}</th>
                                <th>{t('total')}</th>
                                <th>{t('status')}</th>
                                <th>{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map(inv => (
                                <tr key={inv.id}>
                                    <td>{new Date(inv.date).toLocaleDateString('de-DE')}</td>
                                    <td>
                                        <span className="invoice-chip">{inv.invoiceNumber}</span>
                                    </td>
                                    <td>
                                        <div className="customer-cell">
                                            <strong>{inv.recipientName}</strong>
                                            <span>{inv.recipientCity}</span>
                                        </div>
                                    </td>
                                    <td>{getPrimaryFieldValue(inv)}</td>
                                    <td className="amount-cell">
                                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: inv.currency || 'EUR' }).format(inv.total)}
                                    </td>
                                    <td>
                                        <span className="badge" style={{
                                            backgroundColor: (STATUSES[inv.status] || STATUSES.draft).color + '20',
                                            color: (STATUSES[inv.status] || STATUSES.draft).color,
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: '600'
                                        }}>
                                            {t(inv.status || 'draft')}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="icon-btn" title="Bearbeiten" onClick={() => navigate(`/invoice/${inv.id}/edit`)}>
                                                <Edit size={18} />
                                            </button>
                                            <button className="icon-btn" title="Anzeigen/Drucken" onClick={() => navigate(`/invoice/${inv.id}`)}>
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                className="icon-btn delete"
                                                title="Löschen"
                                                onClick={() => handleDelete(inv)}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {invoices.length === 0 && (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                                        {appLanguage === 'tr' ? 'Arşivde fatura bulunamadı.' : 'Keine Rechnungen im Archiv gefunden.'}
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
                title={appLanguage === 'tr' ? 'Fatura Silinsin mi?' : 'Rechnung löschen?'}
                message={deleteConfirm ? (appLanguage === 'tr'
                    ? `${deleteConfirm.invoiceNumber} numaralı faturayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
                    : `Sind Sie sicher, dass Sie die Rechnung ${deleteConfirm.invoiceNumber} löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.`
                ) : ''}
                confirmText={appLanguage === 'tr' ? 'Sil' : 'Löschen'}
                cancelText={appLanguage === 'tr' ? 'İptal' : 'Abbrechen'}
                type="danger"
            />
        </>
    );
};

export default Archive;
