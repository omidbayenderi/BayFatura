import React, { useState } from 'react';
import { useInvoice } from '../context/InvoiceContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Download, Receipt, Camera, Image as ImageIcon, X, Eye, FileSpreadsheet, Sparkles, Lock, RotateCcw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePanel } from '../context/PanelContext';
import PremiumModal from '../components/PremiumModal';
import { scanReceipt } from '../lib/geminiService';
import ConfirmDialog from '../components/ConfirmDialog';

const Expenses = () => {
    const {
        expenses,
        deletedExpenses,
        saveExpense,
        deleteExpense,
        restoreExpense,
        deleteExpensePermanently,
        exportToCSV,
        CURRENCIES,
        expenseCategories,
        addExpenseCategory
    } = useInvoice();
    const { t, appLanguage } = useLanguage();
    const { isPro } = useAuth();
    const { showToast } = usePanel();
    
    const [showForm, setShowForm] = useState(false);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [viewReceipt, setViewReceipt] = useState(null); // For modal
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [isAiScanning, setIsAiScanning] = useState(false);
    const [showTrash, setShowTrash] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deletePermanentConfirm, setDeletePermanentConfirm] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        category: 'spareParts',
        currency: 'EUR',
        receiptImage: null
    });

    const activeExpenses = showTrash ? deletedExpenses : expenses;

    const handleSubmit = (e) => {
        e.preventDefault();
        saveExpense({
            ...formData,
            amount: parseFloat(formData.amount)
        });
        setFormData({ title: '', amount: '', category: 'spareParts', currency: 'EUR', receiptImage: null });
        setShowForm(false);
        showToast(appLanguage === 'tr' ? 'Gider kaydedildi' : 'Ausgabe gespeichert', 'success');
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

    const handleAiScanChange = async (e) => {
        if (!isPro) {
            e.preventDefault();
            setShowPremiumModal(true);
            return;
        }

        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result;
                setFormData(prev => ({ ...prev, receiptImage: base64 }));
                
                // Real AI Extraction via Gemini
                setIsAiScanning(true);
                try {
                    const result = await scanReceipt(base64);
                    setFormData(prev => ({
                        ...prev,
                        title: result.vendor || result.title || prev.title,
                        amount: result.totalAmount || result.amount || prev.amount,
                        currency: result.currency || prev.currency,
                        category: result.category || prev.category,
                        date: result.date || prev.date,
                        taxAmount: result.taxAmount || 0
                    }));
                    showToast(t('exportSuccessful'), 'success');
                } catch (error) {
                    console.error("AI Scan Error:", error);
                    showToast(t('aiScanError') + ": " + error.message, 'error');
                } finally {
                    setIsAiScanning(false);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAccountantExport = () => {
        if (!isPro) {
            setShowPremiumModal(true);
            return;
        }
        exportToCSV(activeExpenses, 'Steuerberater_Export_DATEV');
        alert(t('exportSuccessful'));
    };

    return (
        <div className="page-container">
            <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
            <header className="page-header">
                <div>
                    <h1>{t('expenses')} & {t('receipts')}</h1>
                    <p>{t('overviewText')}</p>
                </div>
                <div className="actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button className={`secondary-btn ${showTrash ? 'active' : ''}`} onClick={() => setShowTrash(p => !p)} style={{ height: '42px', display: 'flex', alignItems: 'center', gap: '6px', color: showTrash ? '#ef4444' : undefined, borderColor: showTrash ? '#ef4444' : undefined, background: showTrash ? '#ef444415' : undefined }}>
                        <Trash2 size={16} /> {showTrash ? (appLanguage === 'tr' ? "Normal Görünüm" : "Aktiv") : (appLanguage === 'tr' ? `Çöp Kutusu (${deletedExpenses.length})` : `Papierkorb (${deletedExpenses.length})`)}
                    </button>
                    <button 
                        className="secondary-btn" 
                        onClick={handleAccountantExport} 
                        style={{ 
                            background: '#1e293b', 
                            color: 'white', 
                            border: 'none', 
                            height: '42px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            position: 'relative',
                            padding: '0 16px'
                        }}
                    >
                        <FileSpreadsheet size={18} /> {t('sendToAccountant')}
                        {!isPro && <Lock size={12} style={{ position: 'absolute', top: '4px', right: '4px', color: '#fcd34d' }} />}
                    </button>
                    <button 
                        className="secondary-btn" 
                        onClick={() => exportToCSV(activeExpenses, 'Ausgaben')}
                        style={{ height: '42px', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px' }}
                    >
                        <Download size={18} /> {t('export')}
                    </button>
                    <button 
                        className="primary-btn" 
                        onClick={() => setShowForm(!showForm)}
                        style={{ height: '42px', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px' }}
                    >
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
                                                placeholder={t('newCategoryPlaceholder')}
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
                                <label>{t('billScanner')}</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                    
                                    <label 
                                        className="primary-btn" 
                                        style={{ 
                                            cursor: !isPro ? 'pointer' : 'pointer', 
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                                            border: 'none',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                        onClick={(e) => { if(!isPro) { e.preventDefault(); setShowPremiumModal(true); } }}
                                    >
                                        <Sparkles size={18} />
                                        <span>{t('aiScanText')}</span>
                                        {!isPro && <Lock size={14} style={{ marginLeft: '4px', opacity: 0.8 }} />}
                                        {isPro && (
                                            <input
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                style={{ display: 'none' }}
                                                onChange={handleAiScanChange}
                                            />
                                        )}
                                        {/* CSS Scanner Effect */}
                                        {isAiScanning && (
                                            <div style={{
                                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                                background: 'rgba(255,255,255,0.2)',
                                                animation: 'scanBar 1.5s infinite linear'
                                            }} />
                                        )}
                                    </label>

                                    <label className="secondary-btn" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Camera size={18} />
                                        <span>{t('manual')}</span>
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
                                                style={{ height: '100%', width: '100%', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e2e8f0', filter: isAiScanning ? 'brightness(1.5) contrast(1.2)' : 'none' }}
                                            />
                                            {isAiScanning && (
                                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: '#22c55e', boxShadow: '0 0 8px #22c55e', animation: 'scanLine 1.5s infinite alternate' }} />
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, receiptImage: null }))}
                                                disabled={isAiScanning}
                                                style={{
                                                    position: 'absolute', top: '-6px', right: '-6px',
                                                    background: 'var(--danger)', color: 'white',
                                                    borderRadius: '50%', border: 'none',
                                                    width: '18px', height: '18px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    cursor: isAiScanning ? 'not-allowed' : 'pointer', fontSize: '12px',
                                                    opacity: isAiScanning ? 0.5 : 1
                                                }}
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    )}
                                    {isAiScanning && <span style={{ fontSize: '0.85rem', color: '#8b5cf6', fontWeight: '500', animation: 'pulse 1.5s infinite' }}>{t('scanSimulating')}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Injecting basic keyframes for scanner inline just for simplicity */}
                        <style>{`
                            @keyframes scanBar { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
                            @keyframes scanLine { 0% { top: 0; } 100% { top: 100%; } }
                        `}</style>

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
                            <th style={{ textAlign: 'center' }}>{t('receipt')}</th>
                            <th style={{ textAlign: 'right' }}>{t('amount')}</th>
                            <th style={{ textAlign: 'right' }}>{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeExpenses.map(exp => (
                            <tr key={exp.id}>
                                <td>{new Date(exp.date).toLocaleDateString(appLanguage === 'tr' ? 'tr-TR' : appLanguage === 'en' ? 'en-US' : 'de-DE')}</td>
                                <td><span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>{t(exp.category)}</span></td>
                                <td><strong>{exp.title}</strong></td>
                                <td style={{ textAlign: 'center' }}>
                                    {exp.receiptImage ? (
                                        <button
                                            className="icon-btn"
                                            title={t('viewReceipt')}
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
                                    - {new Intl.NumberFormat(appLanguage === 'tr' ? 'tr-TR' : appLanguage === 'en' ? 'en-US' : 'de-DE', { style: 'currency', currency: exp.currency || 'EUR' }).format(exp.amount)}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                                        {showTrash ? (
                                            <>
                                                <button className="icon-btn" style={{ color: '#10b981' }} title={appLanguage === 'tr' ? 'Geri Yükle' : 'Wiederherstellen'} onClick={() => { restoreExpense(exp.id); showToast(appLanguage === 'tr' ? 'Gider geri yüklendi' : 'Ausgabe wiederhergestellt', 'success'); }}>
                                                    <RotateCcw size={18} />
                                                </button>
                                                <button className="icon-btn delete" title={appLanguage === 'tr' ? 'Kalıcı Olarak Sil' : 'Endgültig löschen'} onClick={() => setDeletePermanentConfirm(exp)}>
                                                    <Trash2 size={18} />
                                                </button>
                                            </>
                                        ) : (
                                            <button className="icon-btn delete" onClick={() => setDeleteConfirm(exp)}>
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {activeExpenses.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                    <Receipt size={40} style={{ marginBottom: '12px', opacity: 0.3 }} /><br />
                                    {showTrash ? (appLanguage === 'tr' ? "Çöp kutusu boş!" : "Papierkorb leer!") : t('noData')}
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

            <ConfirmDialog
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={() => { deleteExpense(deleteConfirm.id); setDeleteConfirm(null); showToast(appLanguage === 'tr' ? 'Gider çöp kutusuna taşındı' : 'Ausgabe in den Papierkorb verschoben', 'info'); }}
                title={appLanguage === 'tr' ? 'Gider Silme' : 'Ausgabe löschen'}
                message={deleteConfirm ? (appLanguage === 'tr' ? `Bu gideri (${deleteConfirm.title}) silmek istediğinize emin misiniz?` : `Möchten Sie diese Ausgabe (${deleteConfirm.title}) wirklich löschen?`) : ''}
                confirmText={t('delete')}
                cancelText={t('cancel')}
                type="danger"
            />

            <ConfirmDialog
                isOpen={!!deletePermanentConfirm}
                onClose={() => setDeletePermanentConfirm(null)}
                onConfirm={() => { deleteExpensePermanently(deletePermanentConfirm.id); setDeletePermanentConfirm(null); showToast(appLanguage === 'tr' ? 'Gider kalıcı olarak silindi' : 'Ausgabe endgültig gelöscht', 'success'); }}
                title={appLanguage === 'tr' ? 'Kalıcı Olarak Sil' : 'Endgültig löschen'}
                message={deletePermanentConfirm ? (appLanguage === 'tr' ? `Bu gider (${deletePermanentConfirm.title}) kalıcı olarak silinecek. Bu işlem geri alınamaz!` : `Diese Ausgabe (${deletePermanentConfirm.title}) wird endgültig gelöscht. Dies kann nicht rückgängig gemacht werden!`) : ''}
                confirmText={appLanguage === 'tr' ? 'Kalıcı Sil' : 'Löschen'}
                cancelText={t('cancel')}
                type="danger"
            />
        </div>
    );
};

export default Expenses;
