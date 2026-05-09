import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Plus, Search, X, Edit2, Trash2, Mail, Phone,
    MapPin, Building2, FileText, TrendingUp, ChevronRight, User, Check, Lock,
    AlertTriangle, ShieldAlert
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePanel } from '../context/PanelContext';
import { useCustomers } from '../context/CustomerContext';
import { useInvoice } from '../context/InvoiceContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const EMPTY_CUSTOMER = {
    name: '', email: '', phone: '', company: '',
    street: '', houseNum: '', zip: '', city: '', country: '',
    vatId: '', notes: ''
};

const CustomerModal = ({ customer, onClose, onSave }) => {
    const { t } = useLanguage();
    const [form, setForm] = useState(customer || EMPTY_CUSTOMER);
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        setIsSaving(true);
        await onSave(form);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
                className="modal-content customer-modal-content"
                 onClick={e => e.stopPropagation()}
             >
                {/* Header */}
                 <div className="customer-modal-header">
                     <button onClick={onClose} className="customer-modal-close">
                         <X size={16} />
                     </button>
                     <div className="customer-modal-header-inner">
                         <div className="customer-modal-icon">
                             <User size={24} />
                         </div>
                         <div>
                             <h2 className="customer-modal-title">
                                 {customer ? t('editCustomer') : t('addCustomer')}
                             </h2>
                             <p className="customer-modal-subtitle">{t('customerModalDesc')}</p>
                         </div>
                     </div>
                 </div>

                {/* Form */}
                 <form onSubmit={handleSubmit} className="customer-modal-form">
                     <div className="form-row">
                         <div className="form-group form-group-flex2">
                             <label>{t('fullName')} *</label>
                             <input className="form-input" required name="name" value={form.name} onChange={handleChange} placeholder="Max Mustermann" />
                         </div>
                         <div className="form-group">
                             <label>{t('company')}</label>
                             <input className="form-input" name="company" value={form.company} onChange={handleChange} placeholder="GmbH / AG" />
                         </div>
                     </div>
                     <div className="form-row">
                         <div className="form-group">
                             <label>{t('email')}</label>
                             <input className="form-input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="max@firma.de" />
                         </div>
                         <div className="form-group">
                             <label>{t('phone')}</label>
                             <input className="form-input" name="phone" value={form.phone} onChange={handleChange} placeholder="+49 123 456 789" />
                         </div>
                     </div>
                     <div className="form-row">
                         <div className="form-group form-group-flex2">
                             <label>{t('street')}</label>
                             <input className="form-input" name="street" value={form.street} onChange={handleChange} />
                         </div>
                         <div className="form-group">
                             <label>{t('houseNum')}</label>
                             <input className="form-input" name="houseNum" value={form.houseNum} onChange={handleChange} />
                         </div>
                     </div>
                     <div className="form-row">
                         <div className="form-group">
                             <label>{t('zip')}</label>
                             <input className="form-input" name="zip" value={form.zip} onChange={handleChange} />
                         </div>
                         <div className="form-group form-group-flex2">
                             <label>{t('city')}</label>
                             <input className="form-input" name="city" value={form.city} onChange={handleChange} />
                         </div>
                         <div className="form-group">
                             <label>{t('country')}</label>
                             <input className="form-input" name="country" value={form.country} onChange={handleChange} placeholder="DE" />
                         </div>
                     </div>
                     <div className="form-row">
                         <div className="form-group">
                             <label>{t('vatId')}</label>
                             <input className="form-input" name="vatId" value={form.vatId} onChange={handleChange} placeholder="DE123456789" />
                         </div>
                         <div className="form-group form-group-flex2">
                             <label>{t('notes')}</label>
                             <input className="form-input" name="notes" value={form.notes} onChange={handleChange} />
                         </div>
                     </div>

                     <div className="customer-form-actions">
                         <button type="button" className="secondary-btn" onClick={onClose}>{t('cancel')}</button>
                         <button type="submit" className="primary-btn" disabled={isSaving}>
                             <Check size={16} />
                             {isSaving ? t('saving') : t('save')}
                         </button>
                     </div>
                 </form>
            </motion.div>
        </div>
    );
};

const Customers = () => {
    const { t, appLanguage } = useLanguage();
    const { showToast } = usePanel();
    const { customers, saveCustomer, updateCustomer, deleteCustomer, loading } = useCustomers();
    const { invoices } = useInvoice();
    const { isPro } = useAuth();
    const navigate = useNavigate();

    const [search, setSearch] = useState('');
    const [modalMode, setModalMode] = useState(null); // null | 'add' | customer object
    const [confirmDelete, setConfirmDelete] = useState(null);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return customers.filter(c =>
            c.name?.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q) ||
            c.company?.toLowerCase().includes(q) ||
            c.city?.toLowerCase().includes(q)
        );
    }, [customers, search]);

    const getCustomerStats = (customer) => {
        const customerInvoices = invoices.filter(inv =>
            inv.recipientName === customer.name || inv.clientId === customer.id
        );
        const total = customerInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        return { count: customerInvoices.length, total };
    };

    const handleSave = async (form) => {
        try {
            if (modalMode && modalMode !== 'add') {
                await updateCustomer(modalMode.id, form);
                showToast(t('customerUpdated'), 'success');
            } else {
                await saveCustomer(form);
                showToast(t('customerAdded'), 'success');
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteCustomer(id);
            showToast(t('customerDeleted'), 'success');
            setConfirmDelete(null);
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleCreateInvoice = (customer) => {
        navigate('/new', {
            state: {
                prefill: {
                    recipientName: customer.name,
                    recipientId: customer.id,
                    recipientStreet: customer.street,
                    recipientHouseNum: customer.houseNum,
                    recipientZip: customer.zip,
                    recipientCity: customer.city,
                    recipientEmail: customer.email,
                }
            }
        });
    };

    const formatCurr = (val) => new Intl.NumberFormat(appLanguage === 'tr' ? 'tr-TR' : 'de-DE', { style: 'currency', currency: 'EUR' }).format(val);

    return (
        <div className="page-container">
            <AnimatePresence>
                {modalMode && (
                    <CustomerModal
                        customer={modalMode === 'add' ? null : modalMode}
                        onClose={() => setModalMode(null)}
                        onSave={handleSave}
                    />
                )}
            </AnimatePresence>

            {/* Confirm Delete Dialog */}
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
                            <h2 className="delete-confirm-title">{t('deleteCustomer')}</h2>
                            <p className="delete-confirm-message">
                                {t('deleteCustomerConfirm') || 'Bu müşteriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'}
                            </p>
                            <div className="delete-confirm-info">
                                <ShieldAlert size={14} />
                                <span>{t('deleteWarning') || 'Müşteriye ait tüm fatura verileri etkilenmez.'}</span>
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
                     <h1 className="customers-page-title">
                         <div className="customers-page-icon">
                             <Users size={20} />
                         </div>
                         {t('customers')}
                     </h1>
                     <p className="customers-page-subtitle">{t('customersDesc')}</p>
                 </div>
                 <button className="primary-btn" onClick={() => {
                     if (!isPro) {
                                showToast(t('unlockFeatureMsg'), "info");
                         return;
                     }
                     setModalMode('add');
                 }}>
                     <Plus size={18} /> {t('addCustomer')}
                     {!isPro && <Lock size={14} className="lock-icon-inline" />}
                 </button>
             </header>

            {/* Stats Row */}
             <div className="customers-stats-grid">
                 {[
                     { label: t('totalCustomers'), value: customers.length, color: '#3b82f6', icon: Users },
                     { label: t('activeThisMonth'), value: customers.filter(c => {
                         const stats = getCustomerStats(c);
                         return stats.count > 0;
                     }).length, color: '#10b981', icon: TrendingUp },
                     { label: t('totalRevenue'), value: formatCurr(customers.reduce((s, c) => s + getCustomerStats(c).total, 0)), color: '#6366f1', icon: FileText },
                 ].map(({ label, value, color, icon: Icon }) => (
                     <motion.div key={label} whileHover={{ y: -3 }} className="card stat-card stat-card-colored" style={{ borderTopColor: color }}>
                         <div className="stat-icon stat-icon-colored" style={{ color, background: `${color}15` }}><Icon size={20} /></div>
                         <div className="stat-content">
                             <h3>{label}</h3>
                             <p className="stat-value stat-value-lg">{value}</p>
                         </div>
                     </motion.div>
                 ))}
             </div>

            {/* Search */}
             <div className="customers-search-wrapper">
                 <Search size={18} className="customers-search-icon" />
                 <input
                     className="form-input customers-search-input"
                     placeholder={t('searchCustomers')}
                     value={search}
                     onChange={e => setSearch(e.target.value)}
                 />
             </div>

            {/* Customer Cards Grid */}
            {loading ? (
                <div>
                    <div className="skeleton-stats-grid">
                        <div className="card stat-card skeleton-stat-card"><div className="skeleton" style={{height: '60px', borderRadius: '8px'}} /></div>
                        <div className="card stat-card skeleton-stat-card"><div className="skeleton" style={{height: '60px', borderRadius: '8px'}} /></div>
                        <div className="card stat-card skeleton-stat-card"><div className="skeleton" style={{height: '60px', borderRadius: '8px'}} /></div>
                    </div>
                    <div className="skeleton skeleton-product-search" style={{marginBottom: '24px'}} />
                    <div className="skeleton-customer-grid">
                        {[1,2,3,4,5,6].map(i => (
                            <div key={i} className="skeleton-customer-card">
                                <div className="skeleton-customer-header">
                                    <div className="skeleton skeleton-customer-avatar" />
                                    <div className="skeleton-customer-info" style={{flex: 1}}>
                                        <div className="skeleton skeleton-text" style={{width: '60%', marginBottom: '8px'}} />
                                        <div className="skeleton skeleton-text skeleton-text-short" />
                                    </div>
                                    <div style={{display: 'flex', gap: '8px'}}>
                                        <div className="skeleton" style={{width: '28px', height: '28px', borderRadius: '6px'}} />
                                        <div className="skeleton" style={{width: '28px', height: '28px', borderRadius: '6px'}} />
                                    </div>
                                </div>
                                <div className="skeleton-customer-contact">
                                    <div className="skeleton skeleton-contact-item" />
                                    <div className="skeleton skeleton-contact-item" style={{width: '65%'}} />
                                    <div className="skeleton skeleton-contact-item" style={{width: '70%'}} />
                                </div>
                                <div className="skeleton-customer-stats">
                                    <div className="skeleton skeleton-customer-stat"><div className="skeleton skeleton-text" style={{width: '30px', marginBottom: '4px'}} /><div className="skeleton skeleton-text skeleton-text-short" /></div>
                                    <div className="skeleton skeleton-customer-stat"><div className="skeleton skeleton-text" style={{width: '50px', marginBottom: '4px'}} /><div className="skeleton skeleton-text skeleton-text-short" /></div>
                                </div>
                                <div className="skeleton" style={{height: '38px', borderRadius: 'var(--radius-md)'}} />
                            </div>
                        ))}
                    </div>
                </div>
            ) : filtered.length === 0 ? (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card customers-empty-state">
                     <div className="customers-empty-icon">
                         <Users size={40} color="#6366f1" />
                     </div>
                     <h2 className="customers-empty-title">{search ? t('noCustomersFound') : t('noCustomersYet')}</h2>
                     <p className="customers-empty-text">{search ? t('tryDifferentSearch') : t('addFirstCustomer')}</p>
                     {!search && (
                         <button className="primary-btn customers-empty-btn" onClick={() => {
                             if (!isPro) {
                        showToast(t('unlockFeatureMsg'), "info");
                                 return;
                             }
                             setModalMode('add');
                         }}>
                             <Plus size={18} /> {t('addCustomer')}
                             {!isPro && <Lock size={14} className="lock-icon-inline" />}
                         </button>
                     )}
                 </motion.div>
             ) : (
                <div className="customers-grid">
                     {filtered.map((customer, idx) => {
                         const stats = getCustomerStats(customer);
                         const initials = customer.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
                         const colors = ['#3b82f6', '#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
                         const color = colors[idx % colors.length];

                         return (
                             <motion.div
                                 key={customer.id}
                                 initial={{ opacity: 0, y: 20 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 transition={{ delay: idx * 0.04 }}
                                 whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.08)' }}
                                 className="card customer-card"
                             >
                                 {/* Card Header */}
                                 <div className="customer-card-header">
                                     <div className="customer-avatar" style={{
                                         background: `linear-gradient(135deg, ${color}cc, ${color}88)`,
                                     }}>
                                         {initials}
                                     </div>
                                     <div style={{ flex: 1, minWidth: 0 }}>
                                         <h3 className="customer-name">{customer.name}</h3>
                                         {customer.company && (
                                             <p className="customer-company">
                                                 <Building2 size={12} /> {customer.company}
                                             </p>
                                         )}
                                     </div>
                                     <div className="customer-card-actions">
                                         <button onClick={() => setModalMode(customer)} className="customer-edit-btn">
                                             <Edit2 size={14} />
                                         </button>
                                         <button onClick={() => setConfirmDelete(customer.id)} className="customer-delete-btn">
                                             <Trash2 size={14} />
                                         </button>
                                     </div>
                                 </div>

                                 {/* Contact Info */}
                                 <div className="customer-contact-info">
                                     {customer.email && (
                                         <div className="customer-contact-item">
                                             <Mail size={13} className="customer-contact-icon" /> {customer.email}
                                         </div>
                                     )}
                                     {customer.phone && (
                                         <div className="customer-contact-item">
                                             <Phone size={13} className="customer-contact-icon" /> {customer.phone}
                                         </div>
                                     )}
                                     {(customer.city || customer.zip) && (
                                         <div className="customer-contact-item">
                                             <MapPin size={13} className="customer-contact-icon" /> {[customer.zip, customer.city, customer.country].filter(Boolean).join(', ')}
                                         </div>
                                     )}
                                 </div>

                                 {/* Stats */}
                                 <div className="customer-stats">
                                     <div className="customer-stat-item">
                                         <div className="customer-stat-value">{stats.count}</div>
                                         <div className="customer-stat-label">{t('invoices')}</div>
                                     </div>
                                     <div className="customer-stat-item customer-stat-divider">
                                         <div className="customer-stat-value customer-stat-value-colored" style={{ color }}>{formatCurr(stats.total)}</div>
                                         <div className="customer-stat-label">{t('total')}</div>
                                     </div>
                                 </div>

                                 {/* Action */}
                                 <button
                                     onClick={() => handleCreateInvoice(customer)}
                                     className="secondary-btn customer-invoice-btn"
                                 >
                                     <FileText size={15} /> {t('createInvoice')} <ChevronRight size={14} />
                                 </button>
                             </motion.div>
                         );
                     })}
                 </div>
            )}
        </div>
    );
};

export default Customers;
