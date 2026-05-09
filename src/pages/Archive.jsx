import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoice } from '../context/InvoiceContext';
import { useLanguage } from '../context/LanguageContext';
import { usePanel } from '../context/PanelContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Eye, Trash2, Edit, AlertTriangle, Bell, Search, Filter,
    Download, Mail, Clock, CheckCircle, FileText, TrendingUp,
    Send, X, Loader, Check, ChevronDown, AlertOctagon, RotateCcw
} from 'lucide-react';
import { getIndustryFields } from '../config/industryFields';
import ConfirmDialog from '../components/ConfirmDialog';
import { sendInvoiceEmail } from '../lib/emailService';
import '../index.css';

// ─── DATEV Export ────────────────────────────────────────────────────────────
const exportDATEV = (invoices, companyProfile) => {
    // DATEV Buchungsstapel format (simplified DATEV ASCII)
    const header = [
        '"EXTF"', '700', '21', '"Buchungsstapel"', '9', '', '',
        `"${companyProfile.companyName || 'Unternehmen'}"`,
        '', '', '', '', '', '', '0', '', '', '', '', '', '', '', ''
    ].join(';') + '\r\n';

    const colHeader = [
        '"Umsatz (ohne Soll/Haben-Kz)"', '"Soll/Haben-Kennzeichen"',
        '"WKZ Umsatz"', '"Kurs"', '"Basis-Umsatz"', '"WKZ Basis-Umsatz"',
        '"Konto"', '"Gegenkonto (ohne BU-Schlüssel)"', '"BU-Schlüssel"',
        '"Belegdatum"', '"Belegfeld 1"', '"Belegfeld 2"', '"Skonto"',
        '"Buchungstext"', '"Postensperre"', '"Diverse Adressnummer"',
        '"Geschäftspartnerbank"', '"Sachverhalt"', '"Zinssperre"',
        '"Beleglink"', '"Beleginfo - Art 1"', '"Beleginfo - Inhalt 1"',
        '"Beleginfo - Art 2"', '"Beleginfo - Inhalt 2"',
        '"Beleginfo - Art 3"', '"Beleginfo - Inhalt 3"',
        '"Beleginfo - Art 4"', '"Beleginfo - Inhalt 4"',
        '"Beleginfo - Art 5"', '"Beleginfo - Inhalt 5"',
        '"Beleginfo - Art 6"', '"Beleginfo - Inhalt 6"',
        '"Beleginfo - Art 7"', '"Beleginfo - Inhalt 7"',
        '"Beleginfo - Art 8"', '"Beleginfo - Inhalt 8"',
        '"KOST1 - Kostenstelle"', '"KOST2 - Kostenstelle"',
        '"KOST-Menge"', '"EU-Land u. UStID"', '"EU-Steuersatz"',
        '"Abw. Versteuerungsart"', '"Sachverhalt L+L"',
        '"Funktionsergänzung L+L"', '"BU 49 Hauptfunktionstyp"',
        '"BU 49 Hauptfunktionsnummer"', '"BU 49 Funktionsergänzung"',
        '"Zusatzinformation - Art 1"', '"Zusatzinformation- Inhalt 1"',
        '"Zusatzinformation - Art 2"', '"Zusatzinformation- Inhalt 2"'
    ].join(';') + '\r\n';

    const rows = invoices.filter(inv => inv.status !== 'draft').map(inv => {
        const date = inv.date ? inv.date.replace(/-/g, '').slice(4) : ''; // DDMM format
        const amount = parseFloat(inv.total || 0).toFixed(2).replace('.', ',');
        const invoiceNum = `"${inv.invoiceNumber || ''}"`;
        const customer = `"${inv.recipientName || ''}"`;

        return [
            amount,         // Umsatz
            '"S"',          // Soll
            '"EUR"',        // WKZ
            '', '', '',
            '"8400"',       // Erlöskonto (standard)
            '"10000"',      // Gegenkonto Debitoren
            '',             // BU-Schlüssel
            `"${date}"`,   // Belegdatum
            invoiceNum,     // Belegfeld 1
            '',
            '',
            customer,       // Buchungstext
            '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
            '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
        ].join(';');
    }).join('\r\n');

    const content = header + colHeader + rows;
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DATEV_Buchungen_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
};

// ─── Quick CSV Export ─────────────────────────────────────────────────────────
const exportCSV = (invoices, t, language) => {
    const locale = language === 'tr' ? 'tr-TR' : language === 'en' ? 'en-US' : 'de-DE';
    const header = ['Datum', 'Rechnungsnummer', 'Kunde', 'Netto', 'MwSt.', 'Brutto', 'Währung', 'Status'].join(';');
    const rows = invoices.map(inv => [
        inv.date || '',
        inv.invoiceNumber || '',
        `"${inv.recipientName || ''}"`,
        parseFloat(inv.subtotal || 0).toFixed(2).replace('.', ','),
        parseFloat(inv.tax || 0).toFixed(2).replace('.', ','),
        parseFloat(inv.total || 0).toFixed(2).replace('.', ','),
        inv.currency || 'EUR',
        inv.status || 'draft'
    ].join(';')).join('\n');
    const blob = new Blob(['\ufeff' + header + '\n' + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rechnungen_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
};

// ─── Reminder Modal ───────────────────────────────────────────────────────────
const ReminderModal = ({ invoice, companyProfile, onClose, t, showToast, appLanguage }) => {
    const [form, setForm] = useState({
        toEmail: invoice.recipientEmail || '',
        toName: invoice.recipientName || '',
        language: appLanguage || 'de',
        level: invoice.reminderCount >= 1 ? '2' : '1',
    });
    const [status, setStatus] = useState('idle');

    const reminderLabels = {
        de: { '1': '1. Zahlungserinnerung', '2': '2. Mahnung' },
        tr: { '1': '1. Ödeme Hatırlatması', '2': '2. İhtar' },
        en: { '1': '1st Payment Reminder', '2': '2nd Final Notice' },
    };

    const handleSend = async (e) => {
        e.preventDefault();
        setStatus('sending');
        try {
            const level = parseInt(form.level);
            const levelLabel = (reminderLabels[form.language] || reminderLabels.de)[form.level];
            const overdueInvoice = {
                ...invoice,
                footerNote: levelLabel,
            };
            await sendInvoiceEmail({
                toEmail: form.toEmail,
                toName: form.toName,
                invoice: overdueInvoice,
                senderName: companyProfile.companyName || 'BayFatura',
                senderEmail: companyProfile.email || '',
                type: 'invoice',
                language: form.language,
                isReminder: true,
                reminderLevel: level,
            });
            setStatus('sent');
            showToast(t('reminderSent'), 'success');
            setTimeout(onClose, 2000);
        } catch (err) {
            setStatus('error');
            showToast(err.message, 'error');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
                className="modal-content reminger-modal-content"
                onClick={e => e.stopPropagation()}
            >
                <div className="reminder-modal-header">
                    <button onClick={onClose} className="reminder-modal-header-close">
                        <X size={13} />
                    </button>
                        <div className="reminder-modal-title-row">
                        <div className="reminder-modal-icon">
                            <Bell size={20} />
                        </div>
                        <div>
                            <h2 className="reminder-modal-title">{t('sendReminder')}</h2>
                            <p className="reminder-modal-subtitle">{invoice.invoiceNumber} · {invoice.recipientName}</p>
                        </div>
                    </div>
                </div>

                {status === 'sent' ? (
                    <div className="reminder-sent-content">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
                            className="reminder-sent-icon-wrapper">
                            <Check size={30} color="#10b981" />
                        </motion.div>
                        <h3 className="reminder-sent-title">{t('reminderSent')}</h3>
                        <p className="reminder-sent-text">{form.toEmail}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSend} className="reminder-form">
                        {/* Overdue Banner */}
                        <div className="overdue-alert-inline">
                            <AlertTriangle size={15} color="#ef4444" />
                            <span>
                                {t('overdueAmount')}: {new Intl.NumberFormat('de-DE', { style: 'currency', currency: invoice.currency || 'EUR' }).format(invoice.total || 0)}
                            </span>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('reminderLevel')}</label>
                                <select className="form-input" value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value }))}>
                                    <option value="1">1. {t('reminder')}</option>
                                    <option value="2">2. {t('finalNotice')}</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>{t('emailLanguage')}</label>
                                <select className="form-input" value={form.language} onChange={e => setForm(p => ({ ...p, language: e.target.value }))}>
                                    <option value="de">Deutsch</option>
                                    <option value="tr">Türkçe</option>
                                    <option value="en">English</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>{t('emailAddress')} *</label>
                            <input className="form-input" type="email" required value={form.toEmail} onChange={e => setForm(p => ({ ...p, toEmail: e.target.value }))} placeholder="kunde@firma.de" />
                        </div>

                        <div className="reminder-form-actions">
                            <button type="button" className="secondary-btn" onClick={onClose}>{t('cancel')}</button>
                            <button type="submit" className="primary-btn reminder-submit-btn" disabled={status === 'sending'}>
                                {status === 'sending'
                                    ? <><Loader size={15} className="animate-spin" /> {t('sending')}...</>
                                    : <><Send size={15} /> {t('sendReminder')}</>
                                }
                            </button>
                        </div>
                    </form>
                )}
            </motion.div>
        </div>
    );
};

// ─── Main Archive Component ───────────────────────────────────────────────────
const Archive = () => {
    const { 
        invoices, deleteInvoice, restoreInvoice, deleteInvoicePermanently, deletedInvoices,
        updateInvoiceStatus, STATUSES, companyProfile 
    } = useInvoice();
    const { t, appLanguage } = useLanguage();
    const { showToast } = usePanel();
    const navigate = useNavigate();

    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deletePermanentConfirm, setDeletePermanentConfirm] = useState(null);
    const [reminderInvoice, setReminderInvoice] = useState(null);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showTrash, setShowTrash] = useState(false);

    const industryConfig = getIndustryFields(companyProfile.industry || 'general');
    const isAutomotive = companyProfile.industry === 'automotive';

    const activeInvoices = showTrash ? deletedInvoices : invoices;

    // Detect overdue invoices (sent but not paid, date > 30 days ago)
    const isOverdue = (inv) => {
        if (inv.status === 'paid' || inv.status === 'draft') return false;
        if (inv.status === 'overdue') return true;
        const invoiceDate = new Date(inv.date);
        const daysSince = (Date.now() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince > 30;
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return activeInvoices.filter(inv => {
            const matchSearch = !q ||
                inv.recipientName?.toLowerCase().includes(q) ||
                inv.invoiceNumber?.toLowerCase().includes(q) ||
                inv.recipientCity?.toLowerCase().includes(q);
            const matchStatus = filterStatus === 'all' || inv.status === filterStatus ||
                (filterStatus === 'overdue' && isOverdue(inv));
            return matchSearch && matchStatus;
        });
    }, [activeInvoices, search, filterStatus]);

    const overdueInvoices = useMemo(() => activeInvoices.filter(isOverdue), [activeInvoices]);

    // Summary stats
    const stats = useMemo(() => {
        const paid = activeInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0);
        const open = activeInvoices.filter(i => i.status !== 'paid' && i.status !== 'draft').reduce((s, i) => s + (i.total || 0), 0);
        const overdue = overdueInvoices.reduce((s, i) => s + (i.total || 0), 0);
        return { paid, open, overdue };
    }, [activeInvoices, overdueInvoices]);

    const locale = appLanguage === 'tr' ? 'tr-TR' : appLanguage === 'en' ? 'en-US' : 'de-DE';

    const formatMoney = (val, currency = 'EUR') =>
        new Intl.NumberFormat(locale, { style: 'currency', currency }).format(val || 0);

    const primaryField = industryConfig.fields[0];

    const getPrimaryFieldValue = (inv) => {
        if (inv.industryData?.[primaryField.name]) return inv.industryData[primaryField.name];
        if (isAutomotive && inv.vehicle) return `${inv.vehicle} ${inv.plate ? `(${inv.plate})` : ''}`;
        return '-';
    };

    const statusConfig = {
        all: { label: t('allStatuses'), color: '#6b7280' },
        draft: { label: t('draft'), color: '#94a3b8' },
        sent: { label: t('sent'), color: '#3b82f6' },
        paid: { label: t('paid'), color: '#10b981' },
        partial: { label: t('partial'), color: '#f59e0b' },
        overdue: { label: t('overdue'), color: '#ef4444' },
    };

    return (
        <>
            <div className="page-container">

                {/* ─── Reminder Modal ─── */}
                <AnimatePresence>
                    {reminderInvoice && (
                        <ReminderModal
                            invoice={reminderInvoice}
                            companyProfile={companyProfile}
                            onClose={() => setReminderInvoice(null)}
                            t={t}
                            showToast={showToast}
                            appLanguage={appLanguage}
                        />
                    )}
                </AnimatePresence>

                {/* ─── Header ─── */}
                <header className="page-header">
                    <div>
                        <h1 className="page-header-title">
                            <div className="page-header-icon">
                                <FileText size={20} />
                            </div>
                            {t('archive')}
                        </h1>
                    </div>
                    <div className="page-header-actions">
                        <div className="export-wrapper">
                            <button className="secondary-btn export-btn" onClick={() => setShowExportMenu(p => !p)}>
                                <Download size={16} /> {t('export')} <ChevronDown size={14} />
                            </button>
                            {showExportMenu && (
                                <div className="export-dropdown">
                                    <button onClick={() => { exportCSV(filtered, t, appLanguage); setShowExportMenu(false); }}
                                        className="export-dropdown-item">
                                        <FileText size={16} color="#6366f1" /> CSV Export
                                    </button>
                                    <button onClick={() => { exportDATEV(filtered, companyProfile); setShowExportMenu(false); }}
                                        className="export-dropdown-item">
                                        <Download size={16} color="#10b981" /> DATEV Export
                                        <span className="export-new-badge">NEU</span>
                                    </button>
                                </div>
                            )}
                        </div>
                        <button className={`secondary-btn ${showTrash ? 'active' : ''}`} onClick={() => setShowTrash(p => !p)} style={{ marginRight: 8, display: 'flex', alignItems: 'center', gap: '6px', color: showTrash ? '#ef4444' : undefined, borderColor: showTrash ? '#ef4444' : undefined, background: showTrash ? '#ef444415' : undefined }}>
                            <Trash2 size={16} /> {showTrash ? (appLanguage === 'tr' ? "Normal Görünüm" : "Aktiv") : (appLanguage === 'tr' ? `Çöp Kutusu (${deletedInvoices.length})` : `Papierkorb (${deletedInvoices.length})`)}
                        </button>
                        <button className="primary-btn" onClick={() => navigate('/new')}>+ {t('newInvoice')}</button>
                    </div>
                </header>

                {/* ─── Stats ─── */}
                <div className="archive-stats-grid">
                    {[
                        { label: t('paidRevenue'), value: formatMoney(stats.paid), color: '#10b981', icon: CheckCircle },
                        { label: t('openInvoices'), value: formatMoney(stats.open), color: '#3b82f6', icon: Clock },
                        { label: t('overdueAmount'), value: formatMoney(stats.overdue), color: '#ef4444', icon: AlertTriangle, urgent: overdueInvoices.length > 0 },
                        { label: t('totalInvoices'), value: invoices.length, color: '#6366f1', icon: TrendingUp },
                    ].map(({ label, value, color, icon: Icon, urgent }) => (
                        <motion.div key={label} whileHover={{ y: -3 }} className="card stat-card stat-card-dynamic"
                            style={{ borderTop: `3px solid ${color}` }}>
                            {urgent && <div className="stat-urgent-dot" />}
                            <div className="stat-icon" style={{ color, background: `${color}15` }}><Icon size={18} /></div>
                            <div className="stat-content">
                                <h3 className="stat-card-label">{label}</h3>
                                <p className="stat-value stat-card-value" style={{ color: urgent ? color : undefined }}>{value}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* ─── Overdue Alert Banner ─── */}
                <AnimatePresence>
                    {overdueInvoices.length > 0 && filterStatus !== 'overdue' && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="overdue-banner"
                            onClick={() => setFilterStatus('overdue')}>
                            <div className="overdue-icon">
                                <AlertTriangle size={18} color="white" />
                            </div>
                                    <div className="overdue-banner-content">
                                <strong className="overdue-banner-title">
                                    {overdueInvoices.length} {t('overdueInvoicesAlert')}
                                </strong>
                                <p className="overdue-banner-text">
                                    {t('totalOverdue')}: {formatMoney(stats.overdue)} — {t('clickToFilter')}
                                </p>
                            </div>
                                <Bell size={18} className="overdue-banner-icon" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ─── Search + Filters ─── */}
                <div className="search-filter-wrapper">
                    <div className="search-input-wrapper">
                        <Search size={16} />
                        <input className="form-input"
                            placeholder={t('searchInvoices')} value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="filter-pills-wrapper">
                        {Object.entries(statusConfig).map(([key, cfg]) => (
                            <button key={key} onClick={() => setFilterStatus(key)} className="filter-pill"
                                style={{
                                    borderColor: filterStatus === key ? cfg.color : '#e2e8f0',
                                    background: filterStatus === key ? cfg.color + '18' : 'transparent',
                                    color: filterStatus === key ? cfg.color : '#64748b',
                                }}>
                                {cfg.label}
                                {key !== 'all' && <span className="filter-pill-count">({invoices.filter(i => key === 'overdue' ? isOverdue(i) : i.status === key).length})</span>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ─── Table ─── */}
                <div className="card card-no-padding">
                    <table className="modern-table table-no-radius">
                        <thead>
                            <tr>
                                <th>{t('date')}</th>
                                <th>{t('invoiceNumber')}</th>
                                <th>{t('customer')}</th>
                                <th>{t(primaryField.name + 'Label')}</th>
                                <th>{t('total')}</th>
                                <th>{t('status')}</th>
                                <th>{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((inv, idx) => {
                                const overdue = isOverdue(inv);
                                const stat = STATUSES[inv.status || 'draft'] || STATUSES.draft;

                                return (
                                    <motion.tr key={inv.id}
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                                        style={{ background: overdue && inv.status !== 'paid' ? '#fef9f9' : undefined }}>
                                        <td>{new Date(inv.date).toLocaleDateString(locale)}</td>
                                        <td>
                                            <div className="invoice-number-cell">
                                                <span className="invoice-chip">{inv.invoiceNumber}</span>
                                                {overdue && inv.status !== 'paid' && (
                                                    <span className="overdue-badge">
                                                            <AlertOctagon size={12} style={{ marginRight: 2 }} /> {t('overdue')}
                                                        </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="customer-cell">
                                                <strong>{inv.recipientName}</strong>
                                                <span>{inv.recipientCity}</span>
                                            </div>
                                        </td>
                                        <td>{getPrimaryFieldValue(inv)}</td>
                                        <td className="amount-cell">
                                            <strong style={{ color: overdue && inv.status !== 'paid' ? '#ef4444' : undefined }}>
                                                {formatMoney(inv.total, inv.currency)}
                                            </strong>
                                        </td>
                                        <td>
                                            <select className="status-select status-select-custom" value={inv.status || 'draft'}
                                                onChange={(e) => updateInvoiceStatus(inv.id, e.target.value)}
                                                style={{
                                                    backgroundColor: stat.color + '20', color: stat.color,
                                                }}>
                                                <option value="draft">{t('draft')}</option>
                                                <option value="sent">{t('sent')}</option>
                                                <option value="paid">{t('paid')}</option>
                                                <option value="partial">{t('partial')}</option>
                                                <option value="overdue">{t('overdue')}</option>
                                            </select>
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                {showTrash ? (
                                                    <>
                                                        <button className="icon-btn" style={{ color: '#10b981' }} title={appLanguage === 'tr' ? 'Geri Yükle' : 'Wiederherstellen'} onClick={() => { restoreInvoice(inv.id); showToast(appLanguage === 'tr' ? 'Fatura geri yüklendi' : 'Rechnung wiederhergestellt', 'success'); }}>
                                                             <RotateCcw size={18} />
                                                        </button>
                                                        <button className="icon-btn delete" title={appLanguage === 'tr' ? 'Kalıcı Olarak Sil' : 'Endgültig löschen'} onClick={() => setDeletePermanentConfirm(inv)}>
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        {/* 🔔 Mahnung Button */}
                                                        {overdue && inv.status !== 'paid' && (
                                                            <button className="icon-btn icon-btn-reminder" title={t('sendReminder')}
                                                                onClick={() => setReminderInvoice(inv)}>
                                                                <Bell size={16} />
                                                            </button>
                                                        )}
                                                        <button className="icon-btn" title={t('editInvoice')} onClick={() => navigate(`/invoice/${inv.id}/edit`)}>
                                                            <Edit size={18} />
                                                        </button>
                                                        <button className="icon-btn" title={t('viewInvoice')} onClick={() => navigate(`/invoice/${inv.id}`)}>
                                                            <Eye size={18} />
                                                        </button>
                                                        <button className="icon-btn delete" title={t('delete')} onClick={() => setDeleteConfirm(inv)}>
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="table-empty-state">
                                        <FileText size={40} className="empty-state-icon" />
                                        {showTrash ? (appLanguage === 'tr' ? "Çöp kutusu boş!" : "Papierkorb leer!") : t('noInvoicesFound')}
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
                onConfirm={() => { deleteInvoice(deleteConfirm.id); setDeleteConfirm(null); showToast(appLanguage === 'tr' ? 'Fatura çöp kutusuna taşındı' : 'Rechnung in den Papierkorb verschoben', 'info'); }}
                title={t('invoiceDeletionTitle')}
                message={deleteConfirm ? t('invoiceDeletionMsg').replace('{number}', deleteConfirm.invoiceNumber) : ''}
                confirmText={t('delete')}
                cancelText={t('cancel')}
                type="danger"
            />

            <ConfirmDialog
                isOpen={!!deletePermanentConfirm}
                onClose={() => setDeletePermanentConfirm(null)}
                onConfirm={() => { deleteInvoicePermanently(deletePermanentConfirm.id); setDeletePermanentConfirm(null); showToast(appLanguage === 'tr' ? 'Fatura kalıcı olarak silindi' : 'Rechnung endgültig gelöscht', 'success'); }}
                title={appLanguage === 'tr' ? 'Kalıcı Olarak Sil' : 'Endgültig löschen'}
                message={deletePermanentConfirm ? (appLanguage === 'tr' ? `Bu fatura (${deletePermanentConfirm.invoiceNumber}) kalıcı olarak silinecek. Bu işlem geri alınamaz!` : `Diese Rechnung (${deletePermanentConfirm.invoiceNumber}) wird endgültig gelöscht. Dies kann nicht rückgängig gemacht werden!`) : ''}
                confirmText={appLanguage === 'tr' ? 'Kalıcı Sil' : 'Löschen'}
                cancelText={t('cancel')}
                type="danger"
            />
        </>
    );
};

export default Archive;
