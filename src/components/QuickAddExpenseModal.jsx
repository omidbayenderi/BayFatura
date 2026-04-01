import React, { useState } from 'react';
import { X, Check, Save, Upload, Camera, FileText, Banknote, Tag, Image as ImageIcon } from 'lucide-react';
import { useInvoice } from '../context/InvoiceContext';
import { useLanguage } from '../context/LanguageContext';

const QuickAddExpenseModal = ({ isOpen, onClose }) => {
    const { saveExpense, expenseCategories, CURRENCIES, addExpenseCategory } = useInvoice();
    const { t } = useLanguage();

    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        category: 'materials',
        currency: 'EUR',
        date: new Date().toISOString().split('T')[0],
        receiptImage: null
    });

    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        saveExpense({
            ...formData,
            amount: parseFloat(formData.amount)
        });
        onClose();
        // Reset form
        setFormData({
            title: '',
            amount: '',
            category: 'materials',
            currency: 'EUR',
            date: new Date().toISOString().split('T')[0],
            receiptImage: null
        });
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
        <div className="modal-overlay">
            <div className="modal-content" style={{ width: '500px', maxWidth: '95%', padding: '0', borderRadius: '16px', overflow: 'hidden' }}>

                {/* Header */}
                <div className="modal-header" style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#f8fafc'
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                        {t('addExpense') || 'Hızlı Gider Ekle'}
                    </h2>
                    <button className="icon-btn" onClick={onClose} style={{ background: 'white', border: '1px solid var(--border)' }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '24px' }}>

                    {/* Description */}
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                            <FileText size={16} /> {t('description') || 'Açıklama'}
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Örn: Benzin, Malzeme, Yemek..."
                            autoFocus
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', width: '100%', fontSize: '1rem' }}
                        />
                    </div>

                    {/* Amount & Currency Row */}
                    <div className="form-row" style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                        <div className="form-group" style={{ flex: 2 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                                <Banknote size={16} /> {t('amount') || 'Tutar'}
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                className="form-input"
                                required
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="0.00"
                                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', width: '100%', fontSize: '1rem', fontWeight: '600' }}
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                                {t('currency') || 'Para Birimi'}
                            </label>
                            <select
                                className="form-input"
                                value={formData.currency}
                                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', width: '100%', fontSize: '1rem' }}
                            >
                                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Category Selection */}
                    <div className="form-group" style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                            <Tag size={16} /> {t('category') || 'Kategori'}
                        </label>
                        {!isAddingCategory ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <select
                                    className="form-input"
                                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    {expenseCategories.map(cat => (
                                        <option key={cat} value={cat}>{t(cat) || cat}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    className="secondary-btn"
                                    onClick={() => setIsAddingCategory(true)}
                                    title="Yeni Kategori Ekle"
                                    style={{ padding: '0 16px', borderRadius: '8px' }}
                                >
                                    +
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    className="form-input"
                                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                                    placeholder="Yeni kategori..."
                                    value={newCategoryName}
                                    onChange={e => setNewCategoryName(e.target.value)}
                                />
                                <button type="button" className="primary-btn" onClick={handleAddCategory} style={{ borderRadius: '8px' }}>OK</button>
                                <button type="button" className="secondary-btn" onClick={() => setIsAddingCategory(false)} style={{ borderRadius: '8px' }}>X</button>
                            </div>
                        )}
                    </div>

                    {/* Receipt Upload Area */}
                    <div className="form-group" style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                            <ImageIcon size={16} /> {t('receipt') || 'Fiş / Fatura Görseli'}
                        </label>

                        {formData.receiptImage ? (
                            <div style={{
                                position: 'relative',
                                width: '100%',
                                height: '200px',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                border: '1px solid var(--border)',
                                background: '#f8fafc',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <img
                                    src={formData.receiptImage}
                                    alt="Receipt"
                                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, receiptImage: null })}
                                    style={{
                                        position: 'absolute', top: '12px', right: '12px',
                                        background: 'rgba(239, 68, 68, 0.9)', color: 'white',
                                        borderRadius: '50%', border: 'none',
                                        width: '32px', height: '32px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                        transition: 'transform 0.2s'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    title="Görseli Kaldır"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ) : (
                            <label className="secondary-btn" style={{
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                width: '100%',
                                height: '140px',
                                border: '2px dashed #cbd5e1',
                                background: '#f8fafc',
                                color: 'var(--text-muted)',
                                borderRadius: '12px',
                                transition: 'all 0.2s'
                            }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--primary)';
                                    e.currentTarget.style.background = '#eff6ff';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.borderColor = '#cbd5e1';
                                    e.currentTarget.style.background = '#f8fafc';
                                }}
                            >
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    background: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                    border: '1px solid var(--border)'
                                }}>
                                    <Camera size={24} color="var(--primary)" />
                                </div>
                                <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{t('uploadReceiptPrompt') || 'Fiş fotoğrafı çekmek için dokunun'}</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    style={{ display: 'none' }}
                                    onChange={handleImageChange}
                                />
                            </label>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                        <button type="button" className="secondary-btn" onClick={onClose} style={{ borderRadius: '8px', padding: '12px 24px' }}>
                            {t('cancel') || 'İptal'}
                        </button>
                        <button type="submit" className="primary-btn" style={{ background: '#ef4444', borderRadius: '8px', padding: '12px 24px', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}>
                            <Save size={18} /> {t('save') || 'Kaydet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default QuickAddExpenseModal;
