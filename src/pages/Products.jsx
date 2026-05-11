import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package, Plus, Search, X, Edit2, Trash2, Tag, Check,
    DollarSign, Hash, Layers, ShoppingBag, Wrench, Code, Zap, Lock,
    AlertTriangle, ShieldAlert
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePanel } from '../context/PanelContext';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';

const UNIT_OPTIONS = ['Stück', 'Std.', 'Pauschal', 'kg', 'm²', 'm', 'Tag', 'Monat'];

const CATEGORY_ICONS = {
    service: Wrench,
    software: Code,
    product: Package,
    subscription: Zap,
    other: ShoppingBag,
};

const EMPTY_PRODUCT = {
    name: '', description: '', price: '', unit: 'Pauschal',
    taxRate: 19, category: 'service', sku: ''
};

const ProductModal = ({ product, onClose, onSave, t }) => {
    const [form, setForm] = useState(product || EMPTY_PRODUCT);
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.price) return;
        setIsSaving(true);
        await onSave({ ...form, price: parseFloat(form.price) });
        onClose();
    };

    const categories = [
        { key: 'service', label: t('catService') },
        { key: 'software', label: t('catSoftware') },
        { key: 'product', label: t('catProduct') },
        { key: 'subscription', label: t('catSubscription') },
        { key: 'other', label: t('catOther') },
    ];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
                className="modal-content product-modal-content"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="product-modal-header">
                    <button onClick={onClose} className="product-modal-close"><X size={14} /></button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="product-modal-icon">
                            <Package size={22} />
                        </div>
                        <div>
                            <h2 className="product-modal-title">
                                {product ? t('editProduct') : t('addProduct')}
                            </h2>
                            <p className="product-modal-subtitle">{t('productModalDesc')}</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="product-modal-form">
                    {/* Category Pills */}
                    <div className="form-group">
                        <label>{t('category')}</label>
                        <div className="product-category-pills">
                            {categories.map(c => {
                                const Icon = CATEGORY_ICONS[c.key];
                                return (
                                    <button key={c.key} type="button"
                                        onClick={() => setForm(prev => ({ ...prev, category: c.key }))}
                                        className={`product-category-pill ${form.category === c.key ? 'active' : ''}`}>
                                        <Icon size={12} /> {c.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group" style={{ flex: 2 }}>
                            <label>{t('productName')} *</label>
                            <input className="form-input" required name="name" value={form.name} onChange={handleChange} placeholder={t('productNamePlaceholder')} />
                        </div>
                        <div className="form-group">
                            <label>{t('sku')}</label>
                            <input className="form-input" name="sku" value={form.sku} onChange={handleChange} placeholder="P-001" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>{t('description')}</label>
                        <input className="form-input" name="description" value={form.description} onChange={handleChange} placeholder={t('productDescPlaceholder')} />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>{t('price')} (€) *</label>
                            <input className="form-input" required type="number" min="0" step="0.01" name="price" value={form.price} onChange={handleChange} placeholder="0.00" />
                        </div>
                        <div className="form-group">
                            <label>{t('unit')}</label>
                            <select className="form-input" name="unit" value={form.unit} onChange={handleChange}>
                                {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>{t('taxRate')} (%)</label>
                            <select className="form-input" name="taxRate" value={form.taxRate} onChange={handleChange}>
                                <option value={0}>0%</option>
                                <option value={7}>7%</option>
                                <option value={19}>19%</option>
                                <option value={20}>20%</option>
                                <option value={21}>21%</option>
                                <option value={23}>23%</option>
                            </select>
                        </div>
                    </div>

                    <div className="product-modal-footer">
                        <button type="button" className="secondary-btn" onClick={onClose}>{t('cancel')}</button>
                        <button type="submit" className="primary-btn product-modal-submit" disabled={isSaving}>
                            <Check size={16} /> {isSaving ? t('saving') : t('save')}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

const Products = () => {
    const { t, appLanguage } = useLanguage();
    const { showToast } = usePanel();
    const { products, saveProduct, updateProduct, deleteProduct, loading } = useProducts();
    const { isPro } = useAuth();

    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState('all');
    const [modalMode, setModalMode] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const categories = [
        { key: 'all', label: t('allCategories') },
        { key: 'service', label: t('catService'), icon: Wrench },
        { key: 'software', label: t('catSoftware'), icon: Code },
        { key: 'product', label: t('catProduct'), icon: Package },
        { key: 'subscription', label: t('catSubscription'), icon: Zap },
        { key: 'other', label: t('catOther'), icon: ShoppingBag },
    ];

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return products.filter(p => {
            const matchSearch = !q || p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
            const matchCat = filterCat === 'all' || p.category === filterCat;
            return matchSearch && matchCat;
        });
    }, [products, search, filterCat]);

    const handleSave = async (form) => {
        try {
            if (modalMode && modalMode !== 'add') {
                await updateProduct(modalMode.id, form);
                showToast(t('productUpdated'), 'success');
            } else {
                await saveProduct(form);
                showToast(t('productAdded'), 'success');
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteProduct(id);
            showToast(t('productDeleted'), 'success');
            setConfirmDelete(null);
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const formatPrice = (val) => new Intl.NumberFormat(appLanguage === 'tr' ? 'tr-TR' : 'de-DE', { style: 'currency', currency: 'EUR' }).format(val || 0);

    const catColors = { service: '#3b82f6', software: '#6366f1', product: '#10b981', subscription: '#f59e0b', other: '#64748b' };

    return (
        <div className="page-container">
            <AnimatePresence>
                {modalMode && (
                    <ProductModal
                        product={modalMode === 'add' ? null : modalMode}
                        onClose={() => setModalMode(null)}
                        onSave={handleSave}
                        t={t}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {confirmDelete && (
                    <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
                            className="modal-content delete-confirm-modal"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="delete-confirm-icon-wrapper">
                                <div className="delete-confirm-icon-bg">
                                    <AlertTriangle size={28} color="#ef4444" />
                                </div>
                            </div>
                            <h2 className="delete-confirm-title">{t('deleteProduct')}</h2>
                            <p className="delete-confirm-message">
                                {t('deleteProductConfirm') || 'Bu ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'}
                            </p>
                            <div className="delete-confirm-info">
                                <ShieldAlert size={14} />
                                <span>{t('deleteWarning') || 'Ürün faturalardan etkilenmez.'}</span>
                            </div>
                            <div className="delete-confirm-actions">
                                <button className="secondary-btn" onClick={() => setConfirmDelete(null)}>
                                    <X size={16} /> {t('cancel')}
                                </button>
                                <button className="danger-btn" onClick={() => handleDelete(confirmDelete)}>
                                    <Trash2 size={16} /> {t('delete')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="page-header">
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="page-title">
                        <div className="product-page-header-icon">
                            <Package size={20} />
                        </div>
                        {t('products')}
                    </h1>
                    <p className="page-subtitle">{t('productsDesc')}</p>
                </div>
                <button className="primary-btn product-page-add-btn" onClick={() => {
                    if (!isPro) {
                                showToast(t('unlockFeatureMsg'), "info");
                        return;
                    }
                    setModalMode('add');
                }}>
                    <Plus size={18} /> {t('addProduct')}
                    {!isPro && <Lock size={14} style={{ marginLeft: '4px', opacity: 0.7 }} />}
                </button>
            </header>

            {/* Stats */}
            <div className="product-stats-grid">
                {[
                    { label: t('totalProducts'), value: products.length, color: 'var(--success)' },
                    { label: t('services'), value: products.filter(p => p.category === 'service').length, color: '#3b82f6' },
                    { label: t('avgPrice'), value: products.length > 0 ? formatPrice(products.reduce((s, p) => s + (p.price || 0), 0) / products.length) : '—', color: '#6366f1' },
                ].map(({ label, value, color }) => (
                    <motion.div key={label} whileHover={{ y: -3 }} className="card stat-card product-stat-card" style={{ borderTop: `3px solid ${color}` }}>
                        <div className="stat-content product-stat-content">
                            <h3 className="product-stat-label">{label}</h3>
                            <p className="stat-value product-stat-value" style={{ color }}>{value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Filters */}
            <div className="product-filters-row">
                <div className="product-search-wrapper">
                    <Search size={16} className="product-search-icon" />
                    <input className="form-input product-search-input"
                        placeholder={t('searchProducts')} value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="product-filter-buttons">
                    {categories.map(c => (
                        <button key={c.key} onClick={() => setFilterCat(c.key)} className={`product-filter-btn ${filterCat === c.key ? 'active' : ''}`}>
                            {c.label} {c.key !== 'all' && <span className="product-filter-count">({products.filter(p => p.category === c.key).length})</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Grid */}
            {loading ? (
                <div>
                    <div className="skeleton-stats-grid">
                        <div className="card stat-card skeleton-stat-card"><div className="skeleton" style={{height: '60px', borderRadius: '8px'}} /></div>
                        <div className="card stat-card skeleton-stat-card"><div className="skeleton" style={{height: '60px', borderRadius: '8px'}} /></div>
                        <div className="card stat-card skeleton-stat-card"><div className="skeleton" style={{height: '60px', borderRadius: '8px'}} /></div>
                    </div>
                    <div className="skeleton-product-filters">
                        <div className="skeleton skeleton-product-search" />
                        <div className="skeleton skeleton-filter-btn" />
                        <div className="skeleton skeleton-filter-btn" />
                        <div className="skeleton skeleton-filter-btn" />
                        <div className="skeleton skeleton-filter-btn" />
                    </div>
                    <div className="skeleton-product-grid">
                        {[1,2,3,4,5,6].map(i => (
                            <div key={i} className="skeleton-product-card">
                                <div className="skeleton-product-card-header">
                                    <div style={{display: 'flex', alignItems: 'center'}}>
                                        <div className="skeleton skeleton-product-icon" />
                                        <div className="skeleton-product-title">
                                            <div className="skeleton skeleton-text" style={{width: '60%'}} />
                                            <div className="skeleton skeleton-text skeleton-text-short" />
                                        </div>
                                    </div>
                                    <div className="skeleton-product-actions">
                                        <div className="skeleton skeleton-action-btn" />
                                        <div className="skeleton skeleton-action-btn" />
                                    </div>
                                </div>
                                <div className="skeleton skeleton-text" style={{marginBottom: '12px'}} />
                                <div className="skeleton-product-card-header" style={{justifyContent: 'space-between'}}>
                                    <div className="skeleton skeleton-text" style={{width: '80px'}} />
                                    <div className="skeleton skeleton-text" style={{width: '60px'}} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : filtered.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card product-empty-state">
                    <div className="product-empty-icon">
                        <Package size={40} color="var(--success)" />
                    </div>
                    <h2 style={{ marginBottom: '12px' }}>{search ? t('noProductsFound') : t('noProductsYet')}</h2>
                    <p className="page-subtitle" style={{ marginBottom: '32px' }}>{search ? t('tryDifferentSearch') : t('addFirstProduct')}</p>
                    {!search && (
                        <button className="primary-btn product-page-add-btn" onClick={() => {
                            if (!isPro) {
                        showToast(t('unlockFeatureMsg'), "info");
                                return;
                            }
                            setModalMode('add');
                        }}>
                            <Plus size={18} /> {t('addProduct')}
                            {!isPro && <Lock size={14} style={{ marginLeft: '4px', opacity: 0.7 }} />}
                        </button>
                    )}
                </motion.div>
            ) : (
                <div className="product-grid">
                    {filtered.map((product, idx) => {
                        const color = catColors[product.category] || '#64748b';
                        const Icon = CATEGORY_ICONS[product.category] || Package;
                        return (
                            <motion.div key={product.id}
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                                className="card product-card" style={{ borderLeft: `4px solid ${color}` }}>

                                <div className="product-card-header">
                                    <div className="product-card-title-row">
                                        <div className="product-card-icon" style={{ background: `${color}18` }}>
                                            <Icon size={18} color={color} />
                                        </div>
                                        <div>
                                            <h3 className="product-card-name">{product.name}</h3>
                                            {product.sku && <span className="product-card-sku">#{product.sku}</span>}
                                        </div>
                                    </div>
                                    <div className="product-card-actions">
                                        <button onClick={() => setModalMode(product)} className="product-card-edit"><Edit2 size={13} /></button>
                                        <button onClick={() => setConfirmDelete(product.id)} className="product-card-delete"><Trash2 size={13} /></button>
                                    </div>
                                </div>

                                {product.description && (
                                    <p className="product-card-desc">
                                        {product.description}
                                    </p>
                                )}

                                <div className="product-card-price-row">
                                    <div>
                                        <div className="product-card-price" style={{ color }}>{formatPrice(product.price)}</div>
                                        <div className="product-card-price-detail">/{product.unit} · {product.taxRate}% MwSt.</div>
                                    </div>
                                    <span className="product-card-category-badge" style={{ color, background: `${color}18` }}>
                                        {categories.find(c => c.key === product.category)?.label || product.category}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Products;
