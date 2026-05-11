import React, { useState, useEffect } from 'react';
import { validateNIF } from '../lib/portugalCompliance';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useInvoice, uploadToStorage, deleteFromStorage } from '../context/InvoiceContext';
import { useAuth } from '../context/AuthContext';
import { Save, Languages, User, Camera, LayoutDashboard, Mail, Shield, ChevronRight, XCircle, Trash2, X, Palette, RotateCcw, Check, Lock, Crown, Zap, CheckCircle, CheckCircle2, Gem, Package, Building2, CreditCard } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePanel } from '../context/PanelContext';
import PremiumModal from '../components/PremiumModal';

const TABS = ['general', 'finance', 'premium'];

const Settings = () => {
    const navigate = useNavigate();
    const { companyProfile, updateProfile, invoiceCustomization, updateCustomization, loading } = useInvoice();
    const { currentUser, updateUser, isPro } = useAuth();
    const { appLanguage, setAppLanguage, invoiceLanguage, setInvoiceLanguage, t, LANGUAGES } = useLanguage();
    const { showToast } = usePanel();
    const [activeTab, setActiveTab] = useState('general');
    const [formData, setFormData] = useState(companyProfile);
    const [customizationData, setCustomizationData] = useState(invoiceCustomization);
    const [isInitialized, setIsInitialized] = useState(false);
    const [managedItem, setManagedItem] = useState(null); // 'logo', 'signature', or 'stamp'
    const [isLangOpen, setIsLangOpen] = useState(false);
    const [isSyncEnabled, setIsSyncEnabled] = useState(appLanguage === invoiceLanguage);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showPremiumModal, setShowPremiumModal] = useState(false);

    useEffect(() => {
        if (!loading && !isInitialized) {
            setFormData(companyProfile);
            setCustomizationData(invoiceCustomization);
            setIsInitialized(true);
        }
    }, [loading, companyProfile, invoiceCustomization, isInitialized]);

    useEffect(() => {
        if (formData.logo && (!customizationData.brandPalette || customizationData.brandPalette.length === 0)) {
            extractColors(formData.logo).then(palette => {
                setCustomizationData(prev => ({ ...prev, brandPalette: palette }));
            });
        }
    }, [formData.logo]);

    const extractColors = (imageSrc) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 50; // High performance small scale
                canvas.height = 50;
                ctx.drawImage(img, 0, 0, 50, 50);

                const imageData = ctx.getImageData(0, 0, 50, 50).data;
                const colorMap = {};

                for (let i = 0; i < imageData.length; i += 4) {
                    const r = imageData[i];
                    const g = imageData[i + 1];
                    const b = imageData[i + 2];
                    const a = imageData[i + 3];

                    if (a < 128) continue; // Skip transparency

                    // Simple grouping to avoid too many similar colors
                    const rG = Math.round(r / 20) * 20;
                    const gG = Math.round(g / 20) * 20;
                    const bG = Math.round(b / 20) * 20;
                    const rgb = `rgb(${rG},${gG},${bG})`;

                    // Filter out greys (too close to each other)
                    const diff = Math.max(r, g, b) - Math.min(r, g, b);
                    if (diff < 30) continue;

                    // Filter out very light colors (backgrounds)
                    if (r > 240 && g > 240 && b > 240) continue;

                    colorMap[rgb] = (colorMap[rgb] || 0) + 1;
                }

                const sortedColors = Object.entries(colorMap)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(c => c[0]);

                resolve(sortedColors);
            };
            img.onerror = () => {
                console.warn('Failed to extract colors from image due to CORS or load error.');
                resolve([]);
            };
            
            // Bypass CORS using proxy if it's an http/https url (not base64 data)
            if (imageSrc && (imageSrc.startsWith('http://') || imageSrc.startsWith('https://'))) {
                img.src = `https://images.weserv.nl/?url=${encodeURIComponent(imageSrc)}`;
            } else {
                img.src = imageSrc || '';
            }
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = async (e, directItem = null) => {
        const itemType = directItem || managedItem;
        
        // PRO Check for Signature and Stamp
        if ((itemType === 'signature' || itemType === 'stamp') && !isPro) {
            e.preventDefault();
            setShowPremiumModal(true);
            return;
        }

        const file = e.target.files[0];
        if (!file) return;

        // 5MB limit for Storage uploads (no longer constrained by Firestore)
        if (file.size > 5 * 1024 * 1024) {
            showToast(t('fileSizeError'), 'error');
            return;
        }

        const uid = currentUser.uid;
        const fieldMap = {
            'logo': 'logo',
            'signature': 'signatureUrl',
            'stamp': 'stampUrl'
        };
        const field = fieldMap[itemType];
        const filename = `${itemType}_${Date.now()}.${file.name.split('.').pop()}`;

        try {
            setIsUploading(true);
            showToast(t('uploading'), 'info');

            // Delete old file from Storage if it's a Storage URL (not base64)
            const oldUrl = formData[field];
            if (oldUrl && oldUrl.startsWith('https://firebasestorage')) {
                await deleteFromStorage(oldUrl);
            }

            // Upload to Storage and get download URL
            const downloadUrl = await uploadToStorage(uid, file, filename);

            if (itemType === 'logo') {
                setFormData(prev => ({ ...prev, logo: downloadUrl }));
                // Extract palette from file using a temporary object URL
                const tempUrl = URL.createObjectURL(file);
                const palette = await extractColors(tempUrl);
                URL.revokeObjectURL(tempUrl);
                setCustomizationData(prev => ({ ...prev, brandPalette: palette }));
            } else if (itemType === 'signature') {
                setFormData(prev => ({ ...prev, signatureUrl: downloadUrl }));
            } else if (itemType === 'stamp') {
                setFormData(prev => ({ ...prev, stampUrl: downloadUrl }));
            }

            showToast(t('uploadSuccess'), 'success');
            setManagedItem(null);
        } catch (err) {
            console.error('Storage upload error:', err);
            showToast(t('uploadFailed'), 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteItem = async () => {
        if ((managedItem === 'signature' || managedItem === 'stamp') && !isPro) {
            setShowPremiumModal(true);
            return;
        }

        const fieldMap = { logo: 'logo', signature: 'signatureUrl', stamp: 'stampUrl' };
        const field = fieldMap[managedItem];
        const oldUrl = formData[field];

        // Delete from Firebase Storage if it's a Storage URL
        if (oldUrl && oldUrl.startsWith('https://firebasestorage')) {
            deleteFromStorage(oldUrl); // fire-and-forget
        }

        if (managedItem === 'logo') {
            setFormData(prev => ({ ...prev, logo: null }));
        } else if (managedItem === 'signature') {
            setFormData(prev => ({ ...prev, signatureUrl: null }));
        } else if (managedItem === 'stamp') {
            setFormData(prev => ({ ...prev, stampUrl: null }));
        }
        setManagedItem(null);
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await updateProfile(formData);
            await updateCustomization(customizationData);
            showToast(t('saveSuccessful'), 'success');
        } catch (error) {
            console.error("Save error detail:", error);
            const errorMsg = error.message || error.code || 'Unknown Error';
            showToast(`${t('saveFailed')} [${errorMsg}]`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLanguageChange = (code) => {
        setAppLanguage(code);
        if (isSyncEnabled) {
            setInvoiceLanguage(code);
        }
        setIsLangOpen(false);
    };

    return (
        <div className="page-container">
            <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
            
            {/* Unified Management Modal */}
            <AnimatePresence>
            {managedItem && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="modal-overlay" 
                    onClick={() => !isUploading && setManagedItem(null)}
                    style={{ backdropFilter: 'blur(10px)', background: 'rgba(0,0,0,0.6)' }}
                >
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="modal-content settings-modal-content" 
                        onClick={(e) => e.stopPropagation()}
                        style={{ borderRadius: '24px', padding: '32px', border: '1px solid var(--border)', background: 'var(--card-bg)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
                    >
                        <button className="modal-close" onClick={() => !isUploading && setManagedItem(null)} disabled={isUploading} style={{ top: '24px', right: '24px', background: 'var(--background)' }}>
                            <X size={20} />
                        </button>

                        <h2 className="settings-modal-title" style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px' }}>
                             {managedItem === 'logo' ? t('manageLogo') :
                              managedItem === 'signature' ? t('manageSignature') :
                              t('manageStamp')}
                         </h2>
                         <p className="settings-modal-desc" style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '0.95rem' }}>
                             {managedItem === 'logo' ? t('logoActionDescription') : 
                              managedItem === 'signature' ? t('signatureActionDescription') :
                              t('stampActionDescription')}
                         </p>

                        {isUploading ? (
                             <div className="uploading-container" style={{ padding: '40px 0' }}>
                                 <div className="upload-spinner" />
                                 <span className="uploading-text" style={{ marginTop: '16px', fontWeight: '500' }}>{t('uploading')}</span>
                             </div>
                         ) : (
                            <div className="signature-modal-actions" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <label className="signature-action-option" style={{ padding: '20px', borderRadius: '16px', background: 'var(--background)', border: '1px solid var(--border)', transition: 'all 0.2s', cursor: 'pointer' }}>
                                     <span className="icon-wrapper-blue" style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                         <Camera size={24} />
                                     </span>
                                     <div className="action-option-text">
                                         <span className="action-option-title" style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                                             {managedItem === 'logo' ? t('changeLogo') : 
                                              managedItem === 'signature' ? t('changeSignature') :
                                              t('changeStamp')}
                                         </span>
                                         <span className="action-option-desc" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>{t('changeImageDesc')} (max 5MB)</span>
                                     </div>
                                     <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                                 </label>

                                 <button className="signature-action-option delete" onClick={handleDeleteItem} style={{ padding: '20px', borderRadius: '16px', background: 'var(--background)', border: '1px solid var(--border)', transition: 'all 0.2s', cursor: 'pointer', textAlign: 'left' }}>
                                     <span className="icon-wrapper-red" style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                         <Trash2 size={24} />
                                     </span>
                                     <div className="action-option-text">
                                         <span className="action-option-title" style={{ fontSize: '1.1rem', fontWeight: '600', color: '#ef4444' }}>
                                             {managedItem === 'logo' ? t('deleteLogo') : 
                                              managedItem === 'signature' ? t('deleteSignature') :
                                              t('deleteStamp')}
                                         </span>
                                         <span className="action-option-desc" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>{t('deleteImageDesc')}</span>
                                     </div>
                                 </button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
            </AnimatePresence>

            <header className="page-header">
                <div>
                    <h1>{t('settings')}</h1>
                    <p>{t('companySettings')}</p>
                </div>
                <div className="header-actions">
                     {/* Modern Apple-style Language Dropdown */}
                <div className="lang-dropdown-wrapper">
                    <button
                        className="secondary-btn lang-dropdown-toggle"
                        onClick={() => setIsLangOpen(!isLangOpen)}
                    >
                        <div className="lang-dropdown-current">
                            <span className="lang-flag-emoji">{LANGUAGES.find(l => l.code === appLanguage)?.flag}</span>
                            <span>{LANGUAGES.find(l => l.code === appLanguage)?.label}</span>
                        </div>
                        <ChevronRight size={16} className={`lang-dropdown-chevron ${isLangOpen ? 'open' : ''}`} />
                    </button>

                    {isLangOpen && (
                        <>
                            <div className="lang-dropdown-backdrop" onClick={() => setIsLangOpen(false)} />
                            <div className="lang-dropdown-menu">
                                {LANGUAGES.map(lang => (
                                    <button
                                        key={lang.code}
                                        className={`lang-dropdown-item ${appLanguage === lang.code ? 'active' : ''}`}
                                        onClick={() => handleLanguageChange(lang.code)}
                                    >
                                        <span className="lang-flag-emoji">{lang.flag}</span>
                                        {lang.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                    <button
                         className="secondary-btn profile-btn"
                         onClick={() => navigate('/settings/profile')}
                     >
                         <User size={18} />
                         {t('profileSettings')}
                     </button>
                     <button
                         className="primary-btn save-btn-header"
                         onClick={handleSave}
                         disabled={isSaving || loading}
                     >
                         <Save size={18} className={isSaving ? 'animate-spin' : ''} />
                         {isSaving ? t('saving') : t('save')}
                     </button>
                </div>
            </header>

            <div className="settings-tabs">
                <button className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
                    <Building2 size={18} />
                    {t('general')}
                </button>
                <button className={`settings-tab ${activeTab === 'finance' ? 'active' : ''}`} onClick={() => setActiveTab('finance')}>
                    <CreditCard size={18} />
                    {t('bankDetails')}
                </button>
                <button className={`settings-tab ${activeTab === 'premium' ? 'active' : ''}`} onClick={() => setActiveTab('premium')}>
                    <Crown size={18} />
                    {t('subscription_management')}
                    {!isPro && <Lock size={12} className="tab-lock-icon" />}
                </button>
            </div>

            <div className="settings-grid">
                {activeTab === 'general' && (
                <>
                <div className="settings-card card">
                     <div className="section-header">
                         <Camera size={22} color="var(--primary)" />
                         <h3 className="section-title">{t('logoAndSignature')}</h3>
                     </div>

                     <div className="view-row">
                         <div className="form-group form-group-flex">
                             <label>Logo</label>
                             <div className="logo-preview-box logo-preview-lg">
                                {formData.logo ? (
                                    <div className="signature-overlay-container" onClick={() => setManagedItem('logo')}>
                                        <img src={formData.logo} alt="Logo" className="logo-img-contain" />
                                        <button className="signature-action-btn" type="button">
                                            <XCircle size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
                                        <span className="overlay">{t('edit')}</span>
                                    </>
                                )}
                            </div>

                            {/* Brand Color Palette */}
                            {formData.logo && customizationData?.brandPalette?.length > 0 && (
                                 <div className="brand-palette">
                                     <div className="palette-header">
                                         <span className="palette-label">
                                             <Palette size={14} />
                                             {t('colorsFromLogo')}
                                         </span>
                                         <button
                                             type="button"
                                             onClick={() => setCustomizationData(prev => ({ ...prev, primaryColor: '#374151', accentColor: '#f1f5f9' }))}
                                             className="reset-btn"
                                         >
                                             <RotateCcw size={12} />
                                             {t('reset')}
                                         </button>
                                     </div>
                                     <div className="palette-colors">
                                         {customizationData.brandPalette.map((color, idx) => (
                                             <button
                                                 key={idx}
                                                 type="button"
                                                 onClick={() => setCustomizationData(prev => ({ ...prev, primaryColor: color, accentColor: `${color}15` }))}
                                                 className={`palette-color-btn${customizationData.primaryColor === color ? ' active' : ''}`}
                                                 style={{ background: color }}
                                             >
                                                 {customizationData.primaryColor === color && <Check size={14} color="white" />}
                                             </button>
                                         ))}
                                     </div>
                                 </div>
                             )}
                        </div>

                         <div className="form-group form-group-relative">
                             <label className="sig-label">
                                 {t('signature')}
                                 {!isPro && <Lock size={14} color="#f59e0b" />}
                             </label>
                              <div
                                  className={`logo-preview-box logo-preview-lg${formData?.signatureUrl ? ' view-solid' : ' view-dashed'}${!isPro ? ' view-pro-overlay' : ''}`}
                                  onClick={() => !isPro && setShowPremiumModal(true)}
                              >
                                  {formData?.signatureUrl ? (
                                      <div className="signature-overlay-container" onClick={() => isPro && setManagedItem('signature')}>
                                          <img
                                              src={formData.signatureUrl}
                                              alt="Signature"
                                              className={`signature-img${!isPro ? ' signature-img-pro' : ''}`}
                                          />
                                          <button className="signature-action-btn" type="button" onClick={(e) => { e.stopPropagation(); isPro ? (setManagedItem('signature'), handleDeleteItem()) : setShowPremiumModal(true); }}>
                                              {!isPro ? <Lock size={18} color="#f59e0b" /> : <XCircle size={18} />}
                                          </button>
                                      </div>
                                  ) : (
                                      <>
                                          {isPro && <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'signature')} />}
                                          <span className={`overlay${!isPro ? ' overlay-pro' : ''}`}>
                                              {!isPro ? t('unlockPro') : t('uploadSignature')}
                                          </span>
                                      </>
                                  )}
                              </div>
                         </div>

                         <div className="form-group form-group-relative">
                             <label className="sig-label">
                                 {t('stamp')}
                                 {!isPro && <Lock size={14} color="#f59e0b" />}
                             </label>
                          <div
                                  className={`logo-preview-box logo-preview-lg${formData?.stampUrl ? ' view-solid' : ' view-dashed'}${!isPro ? ' view-pro-overlay' : ''}`}
                                  onClick={() => !isPro && setShowPremiumModal(true)}
                              >
                                  {formData?.stampUrl ? (
                                      <div className="signature-overlay-container" onClick={() => isPro && setManagedItem('stamp')}>
                                          <img
                                              src={formData.stampUrl}
                                              alt="Stamp"
                                              className={`signature-img${!isPro ? ' signature-img-pro' : ''}`}
                                          />
                                         <button className="signature-action-btn" type="button" onClick={(e) => { e.stopPropagation(); isPro ? (setManagedItem('stamp'), handleDeleteItem()) : setShowPremiumModal(true); }}>
                                             {!isPro ? <Lock size={18} color="#f59e0b" /> : <XCircle size={18} />}
                                         </button>
                                     </div>
                                 ) : (
                                     <>
                                         {isPro && <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'stamp')} />}
                                         <span className={`overlay${!isPro ? ' overlay-pro' : ''}`}>
                                             {!isPro ? t('unlockPro') : t('uploadStamp')}
                                         </span>
                                     </>
                                 )}
                             </div>
                         </div>
                    </div>

                    <div className="divider-top">
                         <div className="sync-row">
                             <label className="sync-label">
                                 <Languages size={18} color="var(--primary)" />
                                 {t('invoiceLanguageLabel')}
                             </label>
                             <div className="toggle-container" onClick={() => {
                                 const newSync = !isSyncEnabled;
                                 setIsSyncEnabled(newSync);
                                 if (newSync) setInvoiceLanguage(appLanguage);
                             }}>
                                 <span className="sync-text">{t('syncLang')}</span>
                                 <div className={`toggle-track${isSyncEnabled ? ' toggle-track-on' : ' toggle-track-off'}`}>
                                     <div className={`toggle-thumb${isSyncEnabled ? ' toggle-thumb-on' : ' toggle-thumb-off'}`} />
                                 </div>
                             </div>
                         </div>

                        {!isSyncEnabled && (
                             <div className="lang-grid">
                                 {LANGUAGES.map(lang => (
                                     <button
                                         key={lang.code}
                                         onClick={() => setInvoiceLanguage(lang.code)}
                                         className={`lang-btn${invoiceLanguage === lang.code ? ' lang-btn-active' : ''}`}
                                     >
                                         <span className="flag-icon">{lang.flag}</span>
                                         <span className={`lang-btn-text${invoiceLanguage !== lang.code ? ' lang-btn-text-inactive' : ''}`}>{lang.label}</span>
                                     </button>
                                 ))}
                             </div>
                         )}

                         {isSyncEnabled && (
                             <div className="sync-display">
                                 <span className="lang-flag-emoji">{LANGUAGES.find(l => l.code === invoiceLanguage)?.flag}</span>
                                 <span className="sync-info-text">
                                     {t('invoiceLanguage')}: <strong>{LANGUAGES.find(l => l.code === invoiceLanguage)?.label}</strong> ({t('autoSync')})
                                 </span>
                             </div>
                         )}
                    </div>

                    <div className="form-group form-group-top">
                        <label>{t('logoNameDisplay')}</label>
                        <select className="form-input" name="logoDisplayMode" value={formData.logoDisplayMode || 'both'} onChange={handleChange}>
                            <option value="logoOnly">{t('logoOnly')}</option>
                            <option value="nameOnly">{t('nameOnly')}</option>
                            <option value="both">{t('bothLogoOnTop')}</option>
                        </select>
                    </div>


                    <div className="form-row">
                        <div className="form-group">
                            <label>{t('industryCategory')}</label>
                            <select className="form-input" name="industry" value={formData.industry || 'general'} onChange={handleChange}>
                                <option value="general">{t('general')}</option>
                                <option value="automotive">{t('automotive')}</option>
                                <option value="construction">{t('construction')}</option>
                                <option value="gastronomy">{t('gastronomy')}</option>
                                <option value="healthcare">{t('healthcare')}</option>
                                <option value="it">{t('it')}</option>
                            </select>
                        </div>
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
                            <input className="form-input" name="companyEmail" value={formData.companyEmail} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>{t('phone')}</label>
                            <input className="form-input" name="companyPhone" value={formData.companyPhone} onChange={handleChange} />
                        </div>
                    </div>
                </div>

                {/* Deutschland / Österreich — Steuerrecht: Integrated Address & Tax Info */}
                {(formData.country === 'DE' || formData.country === 'AT') ? (
                <div className="settings-card card" style={{ border: '1px solid rgba(30,130,255,0.2)', background: 'rgba(30,130,255,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <span style={{ fontSize: '1.2rem' }}>{formData.country === 'AT' ? '🇦🇹' : '🇩🇪'}</span>
                        <div>
                            <h3 style={{ margin: 0 }}>{formData.country === 'AT' ? 'Österreich — Steuerrecht' : 'Deutschland — Steuerrecht'}</h3>
                            <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>§19 UStG · §14 UStG · Compliance</p>
                        </div>
                    </div>

                    {/* 1. §19 UStG Toggle (Top Priority as requested) */}
                    <div className="form-row">
                        <div className="form-group form-group-flex2">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                §19 UStG — Kleinunternehmerregelung
                                <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: '#3b82f620', color: '#3b82f6', borderRadius: '6px', fontWeight: '700' }}>
                                    Umsatz &lt; 22.000 €/Jahr
                                </span>
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                                <div
                                    onClick={() => {
                                        const newVal = !(formData.kleinunternehmer === true || formData.kleinunternehmer === 'true');
                                        setFormData(prev => ({
                                            ...prev,
                                            kleinunternehmer: newVal,
                                            defaultTaxRate: newVal ? 0 : (prev.defaultTaxRate || 19)
                                        }));
                                    }}
                                    style={{
                                        width: '48px', height: '26px', borderRadius: '13px', cursor: 'pointer',
                                        background: (formData.kleinunternehmer === true || formData.kleinunternehmer === 'true') ? '#3b82f6' : '#334155',
                                        position: 'relative', transition: 'background 0.2s ease', flexShrink: 0
                                    }}
                                >
                                    <div style={{
                                        position: 'absolute', top: '3px',
                                        left: (formData.kleinunternehmer === true || formData.kleinunternehmer === 'true') ? '25px' : '3px',
                                        width: '20px', height: '20px', borderRadius: '50%',
                                        background: 'white', transition: 'left 0.2s ease', boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
                                    }} />
                                </div>
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                    {(formData.kleinunternehmer === true || formData.kleinunternehmer === 'true')
                                        ? '✓ Aktiv — MwSt wird nicht ausgewiesen (0%)'
                                        : 'Inaktiv — normale MwSt-Ausweisung'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {(formData.kleinunternehmer === true || formData.kleinunternehmer === 'true') && (
                        <div className="form-row" style={{ marginTop: '12px', marginBottom: '24px' }}>
                            <div className="form-group">
                                <label>Pflichttext auf Rechnungen</label>
                                <textarea
                                    className="form-input textarea-auto"
                                    name="kleinunternehmerText"
                                    rows="2"
                                    value={formData.kleinunternehmerText || 'Gemäß §19 UStG wird keine Umsatzsteuer berechnet.'}
                                    onChange={handleChange}
                                />
                                <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                                    Dieser Text erscheint otomatik olarak faturaya eklenir.
                                </span>
                            </div>
                        </div>
                    )}

                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '24px 0' }} />

                    {/* 2. Address & Tax Info (Moved inside and swapped) */}
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {t('generalInfo')}
                    </h4>
                    <div className="form-row">
                        <div className="form-group">
                            <label>{t('taxId')}</label>
                            <input className="form-input" name="taxId" value={formData.taxId || ''} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>{t('vatId')}</label>
                            <input className="form-input" name="vatId" value={formData.vatId || ''} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group form-group-flex2">
                            <label>{t('street')}</label>
                            <input className="form-input" name="street" value={formData.street || ''} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>{t('houseNum')}</label>
                            <input className="form-input" name="houseNum" value={formData.houseNum || ''} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>{t('zip')}</label>
                            <input className="form-input" name="zip" value={formData.zip || ''} onChange={handleChange} />
                        </div>
                        <div className="form-group form-group-flex2">
                            <label>{t('city')}</label>
                            <input className="form-input" name="city" value={formData.city || ''} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>País / Land / Country</label>
                            <select className="form-input" name="country" value={formData.country || 'PT'} onChange={handleChange}>
                                <option value="DE">🇩🇪 Deutschland</option>
                                <option value="AT">🇦🇹 Österreich</option>
                                <option value="PT">🇵🇹 Portugal</option>
                                <option value="FR">🇫🇷 France</option>
                                <option value="ES">🇪🇸 España</option>
                                <option value="NL">🇳🇱 Nederland</option>
                                <option value="TR">🇹🇷 Türkiye</option>
                            </select>
                        </div>
                    </div>
                </div>
                ) : (
                /* Standard General Info for other countries */
                <div className="settings-card card">
                    <h3>{t('generalInfo')}</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>
                                    {formData.country === 'PT' ? 'NIF (Número de Identificação Fiscal)' : t('taxId')}
                                </label>
                                <input
                                    className="form-input"
                                    name="taxId"
                                    value={formData.taxId || ''}
                                    onChange={handleChange}
                                    placeholder={formData.country === 'PT' ? '123 456 789' : ''}
                                />
                                {formData.country === 'PT' && formData.taxId && (() => {
                                    const v = validateNIF(formData.taxId.replace(/\s/g, ''));
                                    return <span style={{ fontSize: '0.72rem', color: v.valid ? '#10b981' : '#ef4444', marginTop: '4px', display: 'block' }}>{v.valid ? '✓ NIF válido' : '✗ ' + v.message}</span>;
                                })()}
                            </div>
                            <div className="form-group">
                                <label>{formData.country === 'PT' ? 'NIPC / NIF Coletivo' : t('vatId')}</label>
                                <input className="form-input" name="vatId" value={formData.vatId || ''} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="form-row">
                        <div className="form-group form-group-flex2">
                             <label>{t('street')}</label>
                                <input className="form-input" name="street" value={formData.street || ''} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>{t('houseNum')}</label>
                                <input className="form-input" name="houseNum" value={formData.houseNum || ''} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('zip')}</label>
                                <input className="form-input" name="zip" value={formData.zip || ''} onChange={handleChange} />
                            </div>
                        <div className="form-group form-group-flex2">
                             <label>{t('city')}</label>
                                <input className="form-input" name="city" value={formData.city || ''} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>País / Land / Country</label>
                                <select className="form-input" name="country" value={formData.country || 'PT'} onChange={handleChange}>
                                    <option value="PT">🇵🇹 Portugal</option>
                                    <option value="DE">🇩🇪 Deutschland</option>
                                    <option value="AT">🇦🇹 Österreich</option>
                                    <option value="FR">🇫🇷 France</option>
                                    <option value="ES">🇪🇸 España</option>
                                    <option value="NL">🇳🇱 Nederland</option>
                                    <option value="TR">🇹🇷 Türkiye</option>
                                </select>
                            </div>
                        </div>
                </div>
                )}
                </>
                )}

                {activeTab === 'finance' && (
                <>
                    <div className="settings-card card">
                        <h3>{t('bankDetails')}</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('bankName')}</label>
                                <input className="form-input" name="bankName" value={formData.bankName} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="form-row">
                             <div className="form-group form-group-flex2">
                                 <label>{t('iban')}</label>
                                <input className="form-input" name="iban" value={formData.iban} onChange={handleChange} placeholder="DE89 3704 ..." />
                            </div>
                            <div className="form-group">
                                <label>BIC / SWIFT</label>
                                <input className="form-input" name="bic" value={formData.bic || ''} onChange={handleChange} placeholder="COBADEFFXXX" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('paymentTerms')}</label>
                                 <textarea
                                     className="form-input textarea-auto"
                                     rows="1"
                                     name="paymentTerms"
                                     value={formData.paymentTerms}
                                     onChange={handleChange}
                                     placeholder={appLanguage === 'tr' ? 'Örn: Lütfen faturayı 14 gün içinde ödeyiniz.' : 'e.g. Please pay within 14 days.'}
                                 />
                            </div>
                        </div>
                    </div>

                <div className="settings-card card full-width online-payments-card">
                     <div className="online-payments-header">
                         <h3 className="online-payments-title">{t('onlinePayments')}</h3>
                         <span className={`badge ${isPro ? 'premium' : 'standard'} online-payments-badge${isPro ? ' online-payments-badge-pro' : ' online-payments-badge-free'}`}>
                             {isPro ? <><Gem size={14} className="badge-icon" /> Elit</> : <><Package size={14} className="badge-icon" /> Free</>}
                         </span>
                     </div>

                    {/* Plan selection removed as requested */}

                    <div className="form-row form-row-top">
                        <div className="form-group">
                            <label>{t('currency')}</label>
                            <select className="form-input" name="defaultCurrency" value={formData.defaultCurrency || 'EUR'} onChange={handleChange}>
                                <option value="EUR">Euro (€)</option>
                                <option value="USD">US Dollar ($)</option>
                                <option value="TRY">Türk Lirası (₺)</option>
                                <option value="GBP">British Pound (£)</option>
                            </select>
                        </div>
                        <div className="form-group form-group-flex2">
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
                            <label>
                                {formData.country === 'PT' ? 'IVA Padrão (%)' : formData.country === 'FR' ? 'TVA (%)' : `${t('taxRate')} (MwSt %)`}
                            </label>
                            {formData.country === 'PT' ? (
                                <select className="form-input" name="defaultTaxRate" value={formData.defaultTaxRate || 23} onChange={handleChange}>
                                    <option value={23}>IVA Normal — 23%</option>
                                    <option value={13}>IVA Intermédia — 13%</option>
                                    <option value={6}>IVA Reduzida — 6%</option>
                                    <option value={0}>Isento — 0%</option>
                                </select>
                            ) : (
                                <input type="number" className="form-input" name="defaultTaxRate" value={formData.defaultTaxRate || 19} onChange={handleChange} />
                            )}
                        </div>
                    </div>

                    {/* Elit Only Section */}
                    <div className={`elite-section${!isPro ? ' elite-section-free' : ''}`}>
                         {!isPro && (
                             <div className="elite-lock-icon">
                                 <Lock size={18} />
                             </div>
                         )}
                         <div className="elite-header">
                             <h4 className="elite-title">
                                 <Zap size={18} fill="#7c3aed" />
                                 {appLanguage === 'tr' ? 'ELİT Özellikler: Otomatik Ödeme Takibi' : 'ELİT Features: Auto Payment Sync'}
                             </h4>
                         </div>

                        <div className="premium-api-grid">
                             {/* Stripe Column */}
                             <div className="api-column">
                                 <label className="api-label">
                                     <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" height="15" alt="Stripe" />
                                     Stripe API
                                 </label>
                                 <div className="form-group">
                                     <label className="api-field-label">Secret Key</label>
                                     <input
                                         className="form-input api-input"
                                         name="stripeApiKey"
                                         type="password"
                                         disabled={!isPro}
                                         value={formData.stripeApiKey || ''}
                                         onChange={handleChange}
                                         placeholder="sk_live_..."
                                     />
                                 </div>
                                 <div className="form-group form-group-mt12">
                                     <label className="api-field-label">Webhook Secret</label>
                                     <input
                                         className="form-input api-input"
                                         name="stripeWebhookSecret"
                                         type="password"
                                         disabled={!isPro}
                                         value={formData.stripeWebhookSecret || ''}
                                         onChange={handleChange}
                                         placeholder="whsec_..."
                                     />
                                 </div>
                             </div>

                             {/* PayPal Column */}
                             <div className="api-column">
                                 <label className="api-label">
                                     <img src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg" height="15" alt="PayPal" />
                                     PayPal API
                                 </label>
                                 <div className="form-group">
                                     <label className="api-field-label">Client ID</label>
                                     <input
                                         className="form-input api-input"
                                         name="paypalClientId"
                                         type="password"
                                         disabled={!isPro}
                                         value={formData.paypalClientId || ''}
                                         onChange={handleChange}
                                         placeholder="AZ..."
                                     />
                                 </div>
                                 <div className="form-group form-group-mt12">
                                     <label className="api-field-label">Secret Key</label>
                                     <input
                                         className="form-input api-input"
                                         name="paypalSecret"
                                         type="password"
                                         disabled={!isPro}
                                         value={formData.paypalSecret || ''}
                                         onChange={handleChange}
                                         placeholder="EK..."
                                     />
                                 </div>
                             </div>
                         </div>

                        <div className="api-note">
                             <CheckCircle2 size={14} color="#7c3aed" />
                             <p className="api-note-text">
                                 {appLanguage === 'tr'
                                     ? "* Bu veriler Elit pakette, Stripe ve PayPal üzerinden ödemeleri otomatik işlemek için kullanılır."
                                     : "* These credentials are used in the Elit plan to automatically process payments via Stripe and PayPal."}
                             </p>
                         </div>
                    </div>
                </div>

                {/* Portugal AT Compliance Section */}
                {(formData.country === 'PT' || !formData.country) && (
                <div className="settings-card card" style={{ border: '1px solid rgba(0,200,100,0.2)', background: 'rgba(0,200,100,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <span style={{ fontSize: '1.2rem' }}>🇵🇹</span>
                        <div>
                            <h3 style={{ margin: 0 }}>Portugal — AT Compliance</h3>
                            <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                Decreto-Lei n.º 28/2019 · Portaria n.º 195/2020
                            </p>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group form-group-flex2">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                Código de Validação AT (para ATCUD)
                                <span title="Obtido no Portal das Finanças por série de faturação" style={{ cursor: 'help', color: '#6366f1', fontSize: '0.8rem' }}>ⓘ</span>
                            </label>
                            <input
                                className="form-input"
                                name="atValidationCode"
                                value={formData.atValidationCode || ''}
                                onChange={handleChange}
                                placeholder="ex: CSDF7T5H (obtido no Portal das Finanças)"
                            />
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                                💡 Obtenha em: portaldefinancas.gov.pt → Comunicação de Séries ATCUD
                            </span>
                        </div>
                        <div className="form-group">
                            <label>Série de Faturação</label>
                            <input
                                className="form-input"
                                name="invoiceSeries"
                                value={formData.invoiceSeries || 'A'}
                                onChange={handleChange}
                                placeholder="A"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                QR Code AT na Fatura
                                <span style={{ fontSize: '0.72rem', padding: '2px 8px', background: '#10b98120', color: '#10b981', borderRadius: '6px', fontWeight: '700' }}>Obrigatório desde 2021</span>
                            </label>
                            <select className="form-input" name="ptQrEnabled" value={formData.ptQrEnabled ?? 'true'} onChange={handleChange}>
                                <option value="true">✓ Ativado (recomendado)</option>
                                <option value="false">Desativado</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Tipo de Documento Padrão</label>
                            <select className="form-input" name="ptDocType" value={formData.ptDocType || 'FT'} onChange={handleChange}>
                                <option value="FT">FT — Fatura</option>
                                <option value="FS">FS — Fatura Simplificada</option>
                                <option value="FR">FR — Fatura-Recibo</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ padding: '12px 16px', background: 'rgba(255,165,0,0.08)', borderRadius: '10px', border: '1px solid rgba(255,165,0,0.2)', marginTop: '8px' }}>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#f59e0b', lineHeight: 1.6 }}>
                            ⚠️ <strong>Nota:</strong> Para emissão legal de faturas em Portugal, o software deve ser certificado pela AT.
                            O ATCUD gerado aqui é para referência. Consulte um TOC (Técnico Oficial de Contas) antes de emitir faturas para clientes.
                        </p>
                    </div>
                </div>
                )}
                </>
                )}

                {activeTab === 'premium' && (
                <div className="settings-card card premium-card">
                    <div className="premium-header">
                        <div className="premium-title-row">
                            <div className={`premium-icon-wrapper${isPro ? ' premium-icon-wrapper-pro' : ' premium-icon-wrapper-free'}`}>
                                <Crown size={22} color={isPro ? '#f59e0b' : '#64748b'} />
                            </div>
                            <h3 className="premium-title">{t('subscription_management')}</h3>
                        </div>
                        <span className={`badge ${isPro ? 'premium' : 'standard'} premium-badge${isPro ? ' premium-badge-pro' : ''}`}>
                            {isPro ? 'ELITE' : 'FREE'}
                        </span>
                    </div>
                    <p className="premium-desc">
                        {isPro ? t('subscription_desc_pro') : t('subscription_desc_free')}
                    </p>

                    <div className={`benefits-wrapper${isPro ? ' benefits-wrapper-pro' : ''}`}>
                        <div className="benefits-grid">
                            {[1, 2, 3, 4].map(num => (
                                <motion.div
                                    key={num}
                                    whileHover={{
                                        scale: 1.02,
                                        backgroundColor: isPro ? 'white' : '#ffffff',
                                        borderColor: isPro ? '#f59e0b' : '#e2e8f0',
                                        boxShadow: '0 8px 16px rgba(0,0,0,0.06)'
                                    }}
                                    whileTap={{ scale: 0.97 }}
                                    className={`benefit-item${isPro ? ' benefit-item-pro' : ' benefit-item-free'}`}
                                >
                                    <div className={`benefit-icon${isPro ? ' benefit-icon-pro' : ' benefit-icon-free'}`}>
                                        <CheckCircle2 size={16} color={isPro ? '#f59e0b' : '#94a3b8'} />
                                    </div>
                                    <span className={`benefit-text${isPro ? ' benefit-text-pro' : ' benefit-text-free'}`}>{t(`proBenefit${num}`)}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                    <button
                         className={`secondary-btn w-full billing-btn${isPro ? ' billing-btn-pro' : ' billing-btn-free'}`}
                         onClick={() => navigate('/billing')}
                     >
                         <Zap size={18} className="btn-icon-left" fill={isPro ? 'none' : 'currentColor'} />
                         {isPro ? t('subscription_title') : t('getProBtn')}
                     </button>
                </div>
                )}
            </div>

            <div className="floating-actions">
                <button 
                    className="primary-btn" 
                    onClick={handleSave}
                    disabled={isSaving || loading}
                >
                    <Save size={20} className={isSaving ? 'animate-spin' : ''} />
                    {isSaving ? t('saving') : t('save')}
                </button>
            </div>
        </div>
    );
};

export default Settings;
