import React, { useState } from 'react';
import { X, Check, Save, Upload, Camera, FileText, Banknote, Tag, Image as ImageIcon, Sparkles, Lock } from 'lucide-react';
import { useInvoice } from '../context/InvoiceContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import PremiumModal from './PremiumModal';

const QuickAddExpenseModal = ({ isOpen, onClose }) => {
    const { saveExpense, expenseCategories, CURRENCIES, addExpenseCategory } = useInvoice();
    const { t } = useLanguage();
    const { isPro } = useAuth();

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
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [isAiScanning, setIsAiScanning] = useState(false);

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

    const handleAiScanChange = (e) => {
        if (!isPro) {
            e.preventDefault();
            setShowPremiumModal(true);
            return;
        }

        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, receiptImage: reader.result }));
                
                // Simulate AI Extraction
                setIsAiScanning(true);
                setTimeout(() => {
                    setFormData(prev => ({
                        ...prev,
                        title: 'Tanken / Fuel (AI)',
                        amount: '85.20',
                        category: 'fuel'
                    }));
                    setIsAiScanning(false);
                }, 2500);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="modal-overlay">
            <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
            <div className="modal-content" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', padding: '0', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>

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
                        {t('addExpense')}
                    </h2>
                    <button className="icon-btn" onClick={onClose} style={{ background: 'white', border: '1px solid var(--border)' }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>

                    {/* Description */}
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                            <FileText size={16} /> {t('description')}
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="..."
                            autoFocus
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', width: '100%', fontSize: '1rem' }}
                        />
                    </div>

                    {/* Amount & Currency Row */}
                    <div className="form-row" style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                        <div className="form-group" style={{ flex: 2 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                                <Banknote size={16} /> {t('amount')}
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
                                {t('currency')}
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
                            <Tag size={16} /> {t('category')}
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
                                    title="..."
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
                                    placeholder="..."
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
                            <ImageIcon size={16} /> {t('receipt')}
                        </label>

                        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                            <label 
                                className="primary-btn" 
                                style={{ 
                                    flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    background: 'linear-gradient(135deg, #6366f1, #a855f7)', border: 'none', position: 'relative', overflow: 'hidden'
                                }}
                                onClick={(e) => { if(!isPro) { e.preventDefault(); setShowPremiumModal(true); } }}
                            >
                                <Sparkles size={18} />
                                <span>{t('aiScanText')}</span>
                                {!isPro && <Lock size={14} style={{ marginLeft: '4px', opacity: 0.8 }} />}
                                {isPro && (
                                    <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleAiScanChange} />
                                )}
                                {isAiScanning && (
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.2)', animation: 'scanBar 1.5s infinite linear' }} />
                                )}
                            </label>
                            
                            <label className="secondary-btn" style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <Camera size={18} />
                                <span>{t('manual')}</span>
                                <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleImageChange} />
                            </label>
                        </div>

                        {formData.receiptImage && (
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
                                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', filter: isAiScanning ? 'brightness(1.5) contrast(1.2)' : 'none' }}
                                />
                                {isAiScanning && (
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: '#22c55e', boxShadow: '0 0 8px #22c55e', animation: 'scanLine 1.5s infinite alternate' }} />
                                )}
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, receiptImage: null })}
                                    disabled={isAiScanning}
                                    style={{
                                        position: 'absolute', top: '12px', right: '12px',
                                        background: 'rgba(239, 68, 68, 0.9)', color: 'white',
                                        borderRadius: '50%', border: 'none',
                                        width: '32px', height: '32px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: isAiScanning ? 'not-allowed' : 'pointer', fontSize: '18px',
                                        opacity: isAiScanning ? 0.5 : 1
                                    }}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        )}
                        {isAiScanning && <div style={{ textAlign: 'center', marginTop: '8px', color: '#8b5cf6', fontWeight: '500', animation: 'pulse 1.5s infinite' }}>{t('scanSimulating')}</div>}
                    </div>

                    {/* Actions */}
                    <div className="modal-actions" style={{ marginTop: '32px' }}>
                        <button type="button" className="secondary-btn" onClick={onClose} style={{ borderRadius: '8px', padding: '12px 24px' }}>
                            {t('cancel')}
                        </button>
                        <button type="submit" className="primary-btn" style={{ background: '#ef4444', borderRadius: '8px', padding: '12px 24px', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}>
                            <Save size={18} /> {t('save')}
                        </button>
                    </div>
                </form>

                <style>{`
                    @keyframes scanBar { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
                    @keyframes scanLine { 0% { top: 0; } 100% { top: 100%; } }
                `}</style>
            </div>
        </div>
    );
};

export default QuickAddExpenseModal;
