import React, { useState } from 'react';
import { useInvoice } from '../context/InvoiceContext';
import { Plus, Trash2, Calendar, RefreshCcw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Recurring = () => {
    const { recurringTemplates, saveRecurringTemplate, deleteRecurringTemplate } = useInvoice();
    const { t } = useLanguage();
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        recipientName: '',
        amount: '',
        frequency: 'monthly',
        description: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        saveRecurringTemplate(formData);
        setFormData({ recipientName: '', amount: '', frequency: 'monthly', description: '' });
        setShowForm(false);
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <div>
                    <h1>{t('recurringInvoices')}</h1>
                    <p>{t('recurringInvoicesDesc')}</p>
                </div>
                <div className="actions">
                    <button className="primary-btn" onClick={() => setShowForm(!showForm)}>
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
                                <input
                                    className="form-input"
                                    required
                                    value={formData.recipientName}
                                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                                    placeholder="e.g. Acme Corp"
                                />
                            </div>
                            <div className="form-group">
                                <label>{t('amount')} (Netto)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    required
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('frequency')}</label>
                                <select
                                    className="form-input"
                                    value={formData.frequency}
                                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                >
                                    <option value="weekly">{t('weekly')}</option>
                                    <option value="monthly">{t('monthly')}</option>
                                    <option value="quarterly">{t('quarterly')}</option>
                                    <option value="yearly">{t('yearly')}</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ flex: 2 }}>
                                <label>{t('description')}</label>
                                <input
                                    className="form-input"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="e.g. Monthly Maintenance"
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button type="button" className="secondary-btn" onClick={() => setShowForm(false)}>{t('cancel')}</button>
                            <button type="submit" className="primary-btn">{t('save')} {t('addRow')}</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card">
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th>{t('customer')}</th>
                            <th>{t('frequency')}</th>
                            <th>{t('amount')}</th>
                            <th>{t('upcoming')}</th>
                            <th style={{ textAlign: 'right' }}>{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recurringTemplates.map(tpl => (
                            <tr key={tpl.id}>
                                <td>
                                    <strong>{tpl.recipientName}</strong>
                                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>{tpl.description}</p>
                                </td>
                                <td>
                                    <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                                        <RefreshCcw size={12} style={{ marginRight: '4px' }} /> {t(tpl.frequency || 'monthly')}
                                    </span>
                                </td>
                                <td style={{ fontWeight: '600' }}>
                                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(tpl.amount)}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.9rem' }}>
                                        <Calendar size={14} /> {t('upcoming')}
                                    </div>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <button className="icon-btn delete" onClick={() => deleteRecurringTemplate(tpl.id)}>
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {recurringTemplates.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                    {t('noRecurring')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Recurring;
