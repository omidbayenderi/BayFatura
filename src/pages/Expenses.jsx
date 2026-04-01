import React, { useState } from 'react';
import { useInvoice } from '../context/InvoiceContext';
import { Plus, Trash2, Download, Receipt, Camera, Image as ImageIcon, X, Eye } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Expenses = () => {
    const {
        expenses,
        saveExpense,
        deleteExpense,
        exportToCSV,
        CURRENCIES,
        expenseCategories,
        addExpenseCategory
    } = useInvoice();
    const { t } = useLanguage();
    const [showForm, setShowForm] = useState(false);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [viewReceipt, setViewReceipt] = useState(null); // For modal
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        category: 'spareParts',
        currency: 'EUR',
        receiptImage: null
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        saveExpense({
            ...formData,
            amount: parseFloat(formData.amount)
        });
        setFormData({ title: '', amount: '', category: 'spareParts', currency: 'EUR', receiptImage: null });
        setShowForm(false);
    };

    const handleAddCategory = () => {
        if (newCategoryName.trim()) {
            addExpenseCategory(newCategoryName.trim());
            setFormData(prev => ({ ...prev, category: newCategoryName.trim() }));
            setNewCategoryName('');
            setIsAddingCategory(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, receiptImage: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <div>
                    <h1>{t('expenses')} & {t('receipts')}</h1>
                    <p>{t('overviewText')}</p>
                </div>
                <div className="actions">
                    <button className="secondary-btn" onClick={() => exportToCSV(expenses, 'Ausgaben')}>
                        <Download size={20} /> {t('export')}
                    </button>
                    <button className="primary-btn" onClick={() => setShowForm(!showForm)}>
                        <Plus size={20} /> {t('addExpense')}
                    </button>
                </div>
            </header>

            {showForm && (
                <div className="card" style={{ marginBottom: '24px' }}>
                    <h3>{t('addExpense')}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group" style={{ flex: 2 }}>
                                <label>{t('description')}</label>
                                <input
                                    className="form-input"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Tools, Marketing..."
                                />
                            </div>
                            <div className="form-group">
                                <label>{t('amount')}</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-input"
                                    required
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>{t('currency')}</label>
                                <select
                                    className="form-input"
                                    value={formData.currency}
                                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                >
                                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>{t('category')}</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {!isAddingCategory ? (
                                        <>
                                            <select
                                                className="form-input"
                                                style={{ flex: 1 }}
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            >
                                                {expenseCategories.map(cat => (
                                                    <option key={cat} value={cat}>{t(cat) === cat ? cat : t(cat)}</option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                className="secondary-btn"
                                                onClick={() => setIsAddingCategory(true)}
                                                style={{ padding: '8px 12px' }}
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <input
                                                className="form-input"
                                                style={{ flex: 1 }}
                                                placeholder="New category name..."
                                                autoFocus
                                                value={newCategoryName}
                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                            />
                                            <button type="button" className="primary-btn" onClick={handleAddCategory}>OK</button>
                                            <button type="button" className="secondary-btn" onClick={() => setIsAddingCategory(false)}>X</button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Bill Scanner / Image Upload Section */}
                            <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label>Bill Scanner / Beleg</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <label className="secondary-btn" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Camera size={18} />
                                        <span>Scan / Upload</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment" // Hints mobile browsers to use camera
                                            style={{ display: 'none' }}
                                            onChange={handleImageChange}
                                        />
                                    </label>
                                    {formData.receiptImage && (
                                        <div style={{ position: 'relative', height: '40px', width: '40px' }}>
                                            <img
                                                src={formData.receiptImage}
                                                alt="Receipt"
                                                style={{ height: '100%', width: '100%', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, receiptImage: null }))}
                                                style={{
                                                    position: 'absolute', top: '-6px', right: '-6px',
                                                    background: 'var(--danger)', color: 'white',
                                                    borderRadius: '50%', border: 'none',
                                                    width: '16px', height: '16px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    cursor: 'pointer', fontSize: '10px'
                                                }}
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button type="button" className="secondary-btn" onClick={() => setShowForm(false)}>{t('cancel')}</button>
                            <button type="submit" className="primary-btn">{t('save')}</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card">
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th>{t('date')}</th>
                            <th>{t('category')}</th>
                            <th>{t('description')}</th>
                            <th style={{ textAlign: 'center' }}>Beleg</th>
                            <th style={{ textAlign: 'right' }}>{t('amount')}</th>
                            <th style={{ textAlign: 'right' }}>{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.map(exp => (
                            <tr key={exp.id}>
                                <td>{new Date(exp.date).toLocaleDateString('de-DE')}</td>
                                <td><span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>{t(exp.category)}</span></td>
                                <td><strong>{exp.title}</strong></td>
                                <td style={{ textAlign: 'center' }}>
                                    {exp.receiptImage ? (
                                        <button
                                            className="icon-btn"
                                            title="View Receipt"
                                            onClick={() => setViewReceipt(exp.receiptImage)}
                                            style={{ color: 'var(--primary)' }}
                                        >
                                            <Receipt size={18} />
                                        </button>
                                    ) : (
                                        <span style={{ color: '#cbd5e1' }}>-</span>
                                    )}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--danger)' }}>
                                    - {new Intl.NumberFormat('de-DE', { style: 'currency', currency: exp.currency || 'EUR' }).format(exp.amount)}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <button className="icon-btn delete" onClick={() => deleteExpense(exp.id)}>
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {expenses.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                    <Receipt size={40} style={{ marginBottom: '12px', opacity: 0.3 }} /><br />
                                    {t('noData')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Receipt Modal */}
            {viewReceipt && (
                <div className="modal-overlay" onClick={() => setViewReceipt(null)}>
                    <div className="modal-content" style={{ maxWidth: '500px', width: '90%', padding: '0', background: 'transparent', boxShadow: 'none' }} onClick={e => e.stopPropagation()}>
                        <div style={{ position: 'relative' }}>
                            <img
                                src={viewReceipt}
                                alt="Receipt Full"
                                style={{ width: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
                            />
                            <button
                                onClick={() => setViewReceipt(null)}
                                style={{
                                    position: 'absolute', top: '-12px', right: '-12px',
                                    background: 'white', border: 'none', borderRadius: '50%',
                                    width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;
