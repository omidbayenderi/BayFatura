import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoice } from '../context/InvoiceContext';
import { useAuth } from '../context/AuthContext';
import { Save, Languages, User, Camera, LayoutDashboard, Mail, Shield, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Settings = () => {
    const navigate = useNavigate();
    const { companyProfile, updateProfile } = useInvoice();
    const { currentUser, updateUser } = useAuth();
    const { appLanguage, setAppLanguage, invoiceLanguage, setInvoiceLanguage, t, LANGUAGES } = useLanguage();
    const [formData, setFormData] = useState(companyProfile);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, logo: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (updateUser) {
                    updateUser({ ...currentUser, avatar: reader.result });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        updateProfile(formData);
        alert(t('saveSuccessful') || 'Erfolgreich gespeichert!');
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <h1>{t('settings')}</h1>
                <p>{t('companySettings')}</p>
            </header>

            {/* Ultra-Modern User Profile Card */}
            <div className="settings-grid" style={{ marginBottom: '24px' }}>
                <div className="settings-card card" style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Background Pattern */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                        opacity: 0.5
                    }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                            {/* Avatar with Upload */}
                            <div style={{ position: 'relative' }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.2)',
                                    backdropFilter: 'blur(10px)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '32px',
                                    fontWeight: '700',
                                    border: '3px solid rgba(255,255,255,0.3)',
                                    overflow: 'hidden'
                                }}>
                                    {currentUser?.avatar ? (
                                        <img src={currentUser.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        currentUser?.name?.charAt(0) || 'U'
                                    )}
                                </div>
                                <label style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    width: '28px',
                                    height: '28px',
                                    background: 'white',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                }}>
                                    <Camera size={14} color="#667eea" />
                                    <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                                </label>
                            </div>

                            {/* User Info */}
                            <div style={{ flex: 1 }}>
                                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
                                    {currentUser?.name || 'User'}
                                </h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', opacity: 0.9 }}>
                                    <Mail size={14} />
                                    <span style={{ fontSize: '14px' }}>{currentUser?.email || 'user@example.com'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', opacity: 0.8 }}>
                                    <Shield size={14} />
                                    <span style={{ fontSize: '13px' }}>{currentUser?.role || 'Administrator'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                            <button
                                onClick={() => navigate('/dashboard')}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    padding: '12px 16px',
                                    background: 'rgba(255,255,255,0.15)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '10px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.25)'}
                                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
                            >
                                <LayoutDashboard size={18} />
                                {appLanguage === 'tr' ? 'Genel Bakış' : 'Übersicht'}
                            </button>
                            <button
                                onClick={() => navigate('/settings/profile')}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    padding: '12px 16px',
                                    background: 'rgba(255,255,255,0.25)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    borderRadius: '10px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.35)'}
                                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.25)'}
                            >
                                <User size={18} />
                                {appLanguage === 'tr' ? 'Profili Düzenle' : 'Profil bearbeiten'}
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="settings-grid">
                <div className="settings-card card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                        <Languages size={22} color="var(--primary)" />
                        <h3 style={{ margin: 0 }}>{t('language')}</h3>
                    </div>

                    <div className="form-group">
                        <label>{t('appLanguageLabel')}</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' }}>
                            {LANGUAGES.map(lang => (
                                <button
                                    key={lang.code}
                                    onClick={() => setAppLanguage(lang.code)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '8px',
                                        borderRadius: '8px',
                                        border: appLanguage === lang.code ? '2px solid var(--primary)' : '1px solid #e2e8f0',
                                        background: appLanguage === lang.code ? '#eff6ff' : 'white',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    <span>{lang.flag}</span>
                                    <span style={{ fontWeight: appLanguage === lang.code ? '600' : '400' }}>{lang.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #eee' }}>
                        <label>{t('invoiceLanguageLabel')}</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' }}>
                            {LANGUAGES.map(lang => (
                                <button
                                    key={lang.code}
                                    onClick={() => setInvoiceLanguage(lang.code)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '8px',
                                        borderRadius: '8px',
                                        border: invoiceLanguage === lang.code ? '2px solid var(--primary)' : '1px solid #e2e8f0',
                                        background: invoiceLanguage === lang.code ? '#eff6ff' : 'white',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    <span>{lang.flag}</span>
                                    <span style={{ fontWeight: invoiceLanguage === lang.code ? '600' : '400' }}>{lang.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="settings-card card">
                    <h3>{t('companySettings')}</h3>

                    <div className="form-group">
                        <label>Logo</label>
                        <div className="logo-preview-box">
                            {formData.logo && <img src={formData.logo} alt="Logo" />}
                            <input type="file" accept="image/*" onChange={handleLogoChange} />
                            <span className="overlay">{t('edit')}</span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>{t('logoDisplayMode')}</label>
                        <select className="form-input" name="logoDisplayMode" value={formData.logoDisplayMode || 'both'} onChange={handleChange}>
                            <option value="logoOnly">{t('logoOnly')}</option>
                            <option value="nameOnly">{t('nameOnly')}</option>
                            <option value="both">{t('bothLogoOnTop')}</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>{t('industry')}</label>
                        <select className="form-input" name="industry" value={formData.industry} onChange={handleChange}>
                            <option value="automotive">🚗 {t('automotive')}</option>
                            <option value="general">💼 {t('generalService')}</option>
                            <option value="construction">🏗️ Bauwesen / İnşaat</option>
                            <option value="gastronomy">🍽️ Gastronomie / Gastronomi</option>
                            <option value="healthcare">🏥 Gesundheitswesen / Sağlık</option>
                            <option value="it">💻 IT & Technologie / Teknoloji</option>
                            <option value="retail">🛒 Einzelhandel / Perakende</option>
                            <option value="crafts">🔧 Handwerk / Zanaatkar</option>
                            <option value="consulting">📊 Beratung / Danışmanlık</option>
                            <option value="education">📚 Bildung / Eğitim</option>
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>{t('companyName')}</label>
                            <input className="form-input" name="companyName" value={formData.companyName} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>{t('owner')}</label>
                            <input className="form-input" name="owner" value={formData.owner} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>{t('email')}</label>
                            <input className="form-input" name="email" value={formData.email} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>{t('phone')}</label>
                            <input className="form-input" name="phone" value={formData.phone} onChange={handleChange} />
                        </div>
                    </div>
                </div>

                <div className="settings-card card">
                    <h3>{t('generalInfo')}</h3>
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 2 }}>
                            <label>{t('street')}</label>
                            <input className="form-input" name="street" value={formData.street} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>{t('houseNum')}</label>
                            <input className="form-input" name="houseNum" value={formData.houseNum} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>{t('zip')}</label>
                            <input className="form-input" name="zip" value={formData.zip} onChange={handleChange} />
                        </div>
                        <div className="form-group" style={{ flex: 2 }}>
                            <label>{t('city')}</label>
                            <input className="form-input" name="city" value={formData.city} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>{t('taxId')}</label>
                            <input className="form-input" name="taxId" value={formData.taxId} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>{t('vatId')}</label>
                            <input className="form-input" name="vatId" value={formData.vatId} onChange={handleChange} />
                        </div>
                    </div>
                </div>

                <div className="settings-card card full-width">
                    <h3>{t('bankDetails')}</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label>{t('bankName')}</label>
                            <input className="form-input" name="bankName" value={formData.bankName} onChange={handleChange} />
                        </div>
                        <div className="form-group" style={{ flex: 2 }}>
                            <label>{t('iban')}</label>
                            <input className="form-input" name="iban" value={formData.iban} onChange={handleChange} placeholder="DE89 3704 0044 0532 0130 00" />
                        </div>
                        <div className="form-group">
                            <label>BIC / SWIFT</label>
                            <input className="form-input" name="bic" value={formData.bic || ''} onChange={handleChange} placeholder="COBADEFFXXX" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>{t('paymentTerms')}</label>
                        <textarea className="form-input" rows="3" name="paymentTerms" value={formData.paymentTerms} onChange={handleChange} />
                    </div>
                </div>

                <div className="settings-card card full-width" style={{ border: '1px solid #e2e8f0', background: 'linear-gradient(to bottom right, #f8fafc, #ffffff)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ color: '#3b82f6', margin: 0 }}>{t('onlinePayments')}</h3>
                        <span className={`badge ${formData.plan === 'premium' ? 'premium' : 'standard'}`} style={{
                            background: formData.plan === 'premium' ? '#ddd6fe' : '#f1f5f9',
                            color: formData.plan === 'premium' ? '#5b21b6' : '#475569',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontWeight: 'bold',
                            fontSize: '0.75rem'
                        }}>
                            {formData.plan === 'premium' ? `💎 ${t('premium')}` : `📦 ${t('standard')}`}
                        </span>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>{t('plan')}</label>
                            <select className="form-input" name="plan" value={formData.plan} onChange={handleChange}>
                                <option value="standard">{t('standard')}</option>
                                <option value="premium">{t('premium')}</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row" style={{ marginTop: '1rem' }}>
                        <div className="form-group">
                            <label>{t('currency')}</label>
                            <select className="form-input" name="defaultCurrency" value={formData.defaultCurrency || 'EUR'} onChange={handleChange}>
                                <option value="EUR">Euro (€)</option>
                                <option value="USD">US Dollar ($)</option>
                                <option value="TRY">Türk Lirası (₺)</option>
                                <option value="GBP">British Pound (£)</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ flex: 2 }}>
                            <label>PayPal.me Link</label>
                            <input className="form-input" name="paypalMe" value={formData.paypalMe || ''} onChange={handleChange} placeholder="https://paypal.me/deinprofil" />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Stripe Checkout Link (Optional)</label>
                            <input className="form-input" name="stripeLink" value={formData.stripeLink || ''} onChange={handleChange} placeholder="https://buy.stripe.com/..." />
                        </div>
                        <div className="form-group">
                            <label>{t('taxRate')} (MwSt %)</label>
                            <input type="number" className="form-input" name="defaultTaxRate" value={formData.defaultTaxRate || 19} onChange={handleChange} />
                        </div>
                    </div>

                    {/* Premium Only Section */}
                    <div style={{
                        marginTop: '20px',
                        padding: '20px',
                        borderRadius: '12px',
                        border: '1px dashed #c084fc',
                        background: formData.plan === 'premium' ? '#f5f3ff' : '#fafafa',
                        opacity: formData.plan === 'premium' ? 1 : 0.6
                    }}>
                        <h4 style={{ color: '#7c3aed', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {formData.plan !== 'premium' && <span style={{ fontSize: '10px', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', color: '#64748b' }}>{t('premiumOnly')}</span>}
                            {t('premiumApiSection')}
                        </h4>

                        <div className="premium-api-grid">
                            {/* Stripe Column */}
                            <div style={{ padding: '15px', background: 'white', borderRadius: '8px', border: '1px solid #ddd' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', marginBottom: '10px' }}>
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" height="15" alt="Stripe" />
                                    Stripe API
                                </label>
                                <div className="form-group">
                                    <label style={{ fontSize: '11px' }}>Secret Key</label>
                                    <input
                                        className="form-input"
                                        name="stripeApiKey"
                                        type="password"
                                        disabled={formData.plan !== 'premium'}
                                        value={formData.stripeApiKey || ''}
                                        onChange={handleChange}
                                        placeholder="sk_live_..."
                                    />
                                </div>
                                <div className="form-group" style={{ marginTop: '10px' }}>
                                    <label style={{ fontSize: '11px' }}>Webhook Secret</label>
                                    <input
                                        className="form-input"
                                        name="stripeWebhookSecret"
                                        type="password"
                                        disabled={formData.plan !== 'premium'}
                                        value={formData.stripeWebhookSecret || ''}
                                        onChange={handleChange}
                                        placeholder="whsec_..."
                                    />
                                </div>
                            </div>

                            {/* PayPal Column */}
                            <div style={{ padding: '15px', background: 'white', borderRadius: '8px', border: '1px solid #ddd' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', marginBottom: '10px' }}>
                                    <img src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg" height="15" alt="PayPal" />
                                    PayPal API
                                </label>
                                <div className="form-group">
                                    <label style={{ fontSize: '11px' }}>Client ID</label>
                                    <input
                                        className="form-input"
                                        name="paypalClientId"
                                        type="password"
                                        disabled={formData.plan !== 'premium'}
                                        value={formData.paypalClientId || ''}
                                        onChange={handleChange}
                                        placeholder="AZ..."
                                    />
                                </div>
                                <div className="form-group" style={{ marginTop: '10px' }}>
                                    <label style={{ fontSize: '11px' }}>Secret Key</label>
                                    <input
                                        className="form-input"
                                        name="paypalSecret"
                                        type="password"
                                        disabled={formData.plan !== 'premium'}
                                        value={formData.paypalSecret || ''}
                                        onChange={handleChange}
                                        placeholder="EK..."
                                    />
                                </div>
                            </div>
                        </div>

                        <p style={{ fontSize: '11px', color: '#666', marginBottom: 0 }}>
                            {t('premiumApiHint')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="floating-actions">
                <button className="primary-btn" onClick={handleSave}>
                    <Save size={20} />
                    {t('save')}
                </button>
            </div>
        </div>
    );
};

export default Settings;
