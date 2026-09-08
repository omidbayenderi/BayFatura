import React, { useState } from 'react';
import { useInvoice } from '../context/InvoiceContext';
import { Plus, Trash2, Calendar, RefreshCcw, Play, ToggleLeft, ToggleRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const FREQ_LABELS = { weekly: 'weekly', monthly: 'monthly', quarterly: 'quarterly', yearly: 'yearly' };

const computeNextDate = (fromDate, freq) => {
    const d = new Date(fromDate || Date.now());
    switch (freq) {
        case 'weekly': d.setDate(d.getDate() + 7); break;
        case 'monthly': d.setMonth(d.getMonth() + 1); break;
        case 'quarterly': d.setMonth(d.getMonth() + 3); break;
        case 'yearly': d.setFullYear(d.getFullYear() + 1); break;
    }
    return d.toISOString().split('T')[0];
};

const Recurring = () => {
    const { recurringTemplates, saveRecurringTemplate, updateRecurringTemplate, deleteRecurringTemplate } = useInvoice();
    const { t } = useLanguage();
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        recipientName: '',
        amount: '',
        frequency: 'monthly',
        description: '',
        currency: 'EUR',
        active: true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const nextDate = computeNextDate(null, formData.frequency);
        saveRecurringTemplate({ ...formData, amount: parseFloat(formData.amount) || 0, nextInvoiceDate: nextDate });
        setFormData({ recipientName: '', amount: '', frequency: 'monthly', description: '', currency: 'EUR', active: true });
        setShowForm(false);
    };

    const toggleActive = async (tpl) => {
        await updateRecurringTemplate(tpl.id, { active: !tpl.active });
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <div>
                    <h1>{t('recurringInvoices')}</h1>
                    <p>{t('recurringDesc')}</p>
                </div>
                <div className="actions">
                    <button className="primary-btn" onClick={() => setShowForm(!showForm)} style={{ height: '42px' }}>
                        <Plus size={20} /> {t('createTemplate')}
                    </button>
                </div>
            </header>

            {showForm && (
                <div className="card" style={{ marginBottom: '24px' }}>
                    <h3>{t('createTemplate')}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group" style={{ flex: 2 }}>
                                <label>{t('customer')}</label>
                                <input className="form-input" required value={formData.recipientName}
                                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })} placeholder="..." />
                            </div>
                            <div className="form-group">
                                <label>{t('amount')}</label>
                                <input type="number" className="form-input" required value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('frequency')}</label>
                                <select className="form-input" value={formData.frequency}
                                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}>
                                    <option value="weekly">{t('weekly')}</option>
                                    <option value="monthly">{t('monthly')}</option>
                                    <option value="quarterly">{t('quarterly') || 'Quartalsweise'}</option>
                                    <option value="yearly">{t('yearly') || 'Jährlich'}</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>{t('currency') || 'Währung'}</label>
                                <select className="form-input" value={formData.currency}
                                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}>
                                    <option value="EUR">EUR</option>
                                    <option value="USD">USD</option>
                                    <option value="TRY">TRY</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ flex: 2 }}>
                                <label>{t('description')}</label>
                                <input className="form-input" value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="..." />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button type="button" className="secondary-btn" onClick={() => setShowForm(false)}>{t('cancel')}</button>
                            <button type="submit" className="primary-btn">{t('save')}</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card">
                {/* Desktop table */}
                <div className="table-scroll list-desktop-table">
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th>{t('customer')}</th>
                            <th>{t('frequency')}</th>
                            <th>{t('amount')}</th>
                            <th>{t('nextDate') || 'Nächstes Datum'}</th>
                            <th>{t('status')}</th>
                            <th style={{ textAlign: 'right' }}>{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recurringTemplates.map(tpl => {
                            const nextDate = tpl.nextInvoiceDate ? new Date(tpl.nextInvoiceDate + 'T00:00:00') : null;
                            const isOverdue = nextDate && nextDate <= new Date();
                            return (
                                <tr key={tpl.id}>
                                    <td>
                                        <strong>{tpl.recipientName}</strong>
                                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>{tpl.description}</p>
                                    </td>
                                    <td>
                                        <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                                            <RefreshCcw size={12} style={{ marginRight: '4px' }} /> {t(FREQ_LABELS[tpl.frequency]) || tpl.frequency}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: '600' }}>
                                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: tpl.currency || 'EUR' }).format(tpl.amount)}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px',
                                            color: isOverdue ? '#ef4444' : '#64748b', fontSize: '0.9rem' }}>
                                            <Calendar size={14} />
                                            {nextDate ? nextDate.toLocaleDateString('de-DE') : '-'}
                                            {isOverdue && <span className="badge" style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.7rem' }}>{t('overdue') || 'Fällig'}</span>}
                                        </div>
                                    </td>
                                    <td>
                                        <button className="icon-btn" onClick={() => toggleActive(tpl)}
                                            title={tpl.active ? t('deactivate') || 'Deaktivieren' : t('activate') || 'Aktivieren'}>
                                            {tpl.active ? <ToggleRight size={20} color="#10b981" /> : <ToggleLeft size={20} color="#94a3b8" />}
                                        </button>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="icon-btn delete" onClick={() => deleteRecurringTemplate(tpl.id)}>
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {recurringTemplates.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                    {t('nothingFound') || 'Keine Daten'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                </div>
                {/* Mobile cards */}
                <div className="list-mobile-cards">
                    {recurringTemplates.length === 0 && (
                        <div className="lmc-empty">{t('nothingFound') || 'Keine Daten'}</div>
                    )}
                    {recurringTemplates.map(tpl => {
                        const nextDate = tpl.nextInvoiceDate ? new Date(tpl.nextInvoiceDate + 'T00:00:00') : null;
                        const isOverdue = nextDate && nextDate <= new Date();
                        return (
                            <div key={tpl.id} className="lmc-row">
                                <div className="lmc-top">
                                    <div>
                                        <span className="lmc-title">{tpl.recipientName}</span>
                                        {tpl.description && <span className="lmc-sub">{tpl.description}</span>}
                                    </div>
                                    <div className="lmc-actions">
                                        <button className="icon-btn" onClick={() => toggleActive(tpl)}>
                                            {tpl.active ? <ToggleRight size={22} color="#10b981" /> : <ToggleLeft size={22} color="#94a3b8" />}
                                        </button>
                                        <button className="icon-btn delete" onClick={() => deleteRecurringTemplate(tpl.id)}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="lmc-bottom">
                                    <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem' }}>
                                        <RefreshCcw size={11} style={{ marginRight: '3px' }} />{t(FREQ_LABELS[tpl.frequency]) || tpl.frequency}
                                    </span>
                                    <span className="lmc-date" style={{ color: isOverdue ? '#ef4444' : '#64748b' }}>
                                        <Calendar size={12} /> {nextDate ? nextDate.toLocaleDateString('de-DE') : '-'}
                                    </span>
                                    <span className="lmc-amount">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: tpl.currency || 'EUR' }).format(tpl.amount)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Recurring;
