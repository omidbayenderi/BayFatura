import React, { useState, useEffect } from 'react';
import { useStock } from '../../context/StockContext';
import { useLanguage } from '../../context/LanguageContext';
import { Plus, Trash2, Edit2, Check, X, Tag, Store, CreditCard, AlertCircle, Save, Database, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StockSettings = () => {
    const { categories, addCategory, updateCategory, deleteCategory, settings, updateSettings, clearSales, factoryReset } = useStock();
    const { t } = useLanguage();

    // Local state for form handling to prevent excessive context updates
    const [formData, setFormData] = useState({
        storeName: '',
        storeAddress: '',
        storePhone: '',
        taxRate: 19,
        currency: '€',
        defaultLowStock: 5
    });

    const [isDirty, setIsDirty] = useState(false);

    // Sync local state with context settings on load
    useEffect(() => {
        if (settings) {
            setFormData({
                storeName: settings.storeName || '',
                storeAddress: settings.storeAddress || '',
                storePhone: settings.storePhone || '',
                taxRate: settings.taxRate || 19,
                currency: settings.currency || '€',
                defaultLowStock: settings.defaultLowStock || 5
            });
        }
    }, [settings]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
    };

    const handleSaveSettings = () => {
        updateSettings(formData);
        setIsDirty(false);
        // Optional: Show success toast
        alert(t('settingsSaved') || 'Ayarlar kaydedildi!');
    };

    // Category Management State
    const [newCategory, setNewCategory] = useState('');
    const [editingCategory, setEditingCategory] = useState(null);
    const [editValue, setEditValue] = useState('');

    const handleAddCategory = () => {
        if (newCategory.trim() && !categories.includes(newCategory.trim())) {
            addCategory(newCategory.trim());
            setNewCategory('');
        }
    };

    const startEditing = (category) => {
        setEditingCategory(category);
        setEditValue(category);
    };

    const saveEdit = () => {
        if (editValue.trim() && editValue !== editingCategory) {
            updateCategory(editingCategory, editValue.trim());
        }
        setEditingCategory(null);
        setEditValue('');
    };

    const cancelEdit = () => {
        setEditingCategory(null);
        setEditValue('');
    };

    const handleDelete = (category) => {
        if (window.confirm(`${category} ${t('confirmDeleteCategory') || 'kategorisini silmek istediğinize emin misiniz?'}`)) {
            deleteCategory(category);
        }
    };

    return (
        <div className="page-container" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
                    <Edit2 size={32} color="var(--primary)" />
                    {t('stockSettings') || 'Mağaza & POS Ayarları'}
                </h1>
                {isDirty && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="primary-btn"
                        onClick={handleSaveSettings}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px' }}
                    >
                        <Save size={20} />
                        {t('saveChanges') || 'Değişiklikleri Kaydet'}
                    </motion.button>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>

                {/* Store Information */}
                <div className="settings-section" style={{ background: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '10px', background: '#eff6ff', borderRadius: '12px', color: 'var(--primary)' }}>
                            <Store size={24} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>{t('storeInfo') || 'Mağaza Bilgileri'}</h2>
                            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                {t('storeInfoDesc') || 'Fiş ve faturalarda görünecek bilgiler.'}
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-secondary)' }}>{t('storeName') || 'Mağaza Adı'}</label>
                            <input
                                className="form-input"
                                value={formData.storeName}
                                onChange={e => handleInputChange('storeName', e.target.value)}
                                placeholder="Örn: Rechnung Auto Service"
                                style={{ width: '100%', height: '48px', padding: '0 16px', borderRadius: '12px', border: '1px solid var(--border)' }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-secondary)' }}>{t('address') || 'Adres'}</label>
                            <textarea
                                className="form-input"
                                value={formData.storeAddress}
                                onChange={e => handleInputChange('storeAddress', e.target.value)}
                                placeholder="Örn: Musterstraße 1..."
                                style={{ width: '100%', height: '100px', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', resize: 'none' }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-secondary)' }}>{t('phone') || 'Telefon'}</label>
                            <input
                                className="form-input"
                                value={formData.storePhone}
                                onChange={e => handleInputChange('storePhone', e.target.value)}
                                placeholder="+49 ..."
                                style={{ width: '100%', height: '48px', padding: '0 16px', borderRadius: '12px', border: '1px solid var(--border)' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Financial & System Settings */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Financial */}
                    <div className="settings-section" style={{ background: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ padding: '10px', background: '#f0fdf4', borderRadius: '12px', color: '#16a34a' }}>
                                <CreditCard size={24} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>{t('financialSettings') || 'Finansal Ayarlar'}</h2>
                                <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    {t('financialSettingsDesc') || 'Vergi oranları ve para birimi.'}
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-secondary)' }}>{t('taxRate') || 'KDV Oranı (%)'}</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.taxRate}
                                    onChange={e => handleInputChange('taxRate', parseFloat(e.target.value))}
                                    style={{ width: '100%', height: '48px', padding: '0 16px', borderRadius: '12px', border: '1px solid var(--border)' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-secondary)' }}>{t('currency') || 'Para Birimi'}</label>
                                <select
                                    className="form-input"
                                    value={formData.currency}
                                    onChange={e => handleInputChange('currency', e.target.value)}
                                    style={{ width: '100%', height: '48px', padding: '0 16px', borderRadius: '12px', border: '1px solid var(--border)' }}
                                >
                                    <option value="€">EUR (€)</option>
                                    <option value="$">USD ($)</option>
                                    <option value="£">GBP (£)</option>
                                    <option value="₺">TRY (₺)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* System Defaults */}
                    <div className="settings-section" style={{ background: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ padding: '10px', background: '#fff7ed', borderRadius: '12px', color: '#ea580c' }}>
                                <AlertCircle size={24} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>{t('systemDefaults') || 'Sistem Varsayılanları'}</h2>
                                <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    {t('systemDefaultsDesc') || 'Otomatik uyarı ve stok limitleri.'}
                                </p>
                            </div>
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-secondary)' }}>{t('defaultLowStock') || 'Varsayılan Kritik Stok Limiti'}</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.defaultLowStock}
                                    onChange={e => handleInputChange('defaultLowStock', parseInt(e.target.value))}
                                    style={{ width: '100px', height: '48px', padding: '0 16px', borderRadius: '12px', border: '1px solid var(--border)' }}
                                />
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Adet (Yeni ürün eklerken bu değer kullanılır)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Category Management (Full Width) */}
                <div className="settings-section" style={{ gridColumn: '1 / -1', background: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '10px', background: '#eff6ff', borderRadius: '12px', color: 'var(--primary)' }}>
                            <Tag size={24} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>{t('manageCategories') || 'Kategori Yönetimi'}</h2>
                            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                {t('manageCategoriesDesc') || 'Ürünleriniz için kategorileri ekleyin, düzenleyin veya silin.'}
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', maxWidth: '600px' }}>
                        <input
                            type="text"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder={t('newCategoryPlaceholder') || 'Yeni kategori adı...'}
                            className="form-input"
                            style={{ flex: 1, height: '50px', borderRadius: '12px', padding: '0 16px', border: '1px solid var(--border)' }}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                        />
                        <button
                            className="primary-btn"
                            onClick={handleAddCategory}
                            disabled={!newCategory.trim()}
                            style={{ height: '50px', padding: '0 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <Plus size={20} />
                            {t('add') || 'Ekle'}
                        </button>
                    </div>

                    <div className="categories-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                        <AnimatePresence>
                            {categories.map((category) => (
                                <motion.div
                                    key={category}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    layout
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '16px 20px',
                                        background: '#f8fafc',
                                        borderRadius: '16px',
                                        border: '1px solid var(--border)'
                                    }}
                                >
                                    {editingCategory === category ? (
                                        <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                                            <input
                                                type="text"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="form-input"
                                                autoFocus
                                                style={{ flex: 1, padding: '8px', borderRadius: '8px', height: '36px', border: '1px solid var(--primary)' }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveEdit();
                                                    if (e.key === 'Escape') cancelEdit();
                                                }}
                                            />
                                            <button onClick={saveEdit} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                <Check size={16} />
                                            </button>
                                            <button onClick={cancelEdit} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--text-main)' }}>{category}</span>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => startEditing(category)}
                                                    style={{ padding: '8px', background: 'white', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    title={t('edit') || 'Düzenle'}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(category)}
                                                    style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    title={t('delete') || 'Sil'}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default StockSettings;
