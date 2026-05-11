import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInvoice } from '../context/InvoiceContext';
import { useLanguage } from '../context/LanguageContext';
import { Building, Globe, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePanel } from '../context/PanelContext';

const OnboardingWizard = ({ onComplete }) => {
    const { companyProfile, updateProfile } = useInvoice();
    const { currentUser } = useAuth();
    const { setToast } = usePanel();
    const { t, LANGUAGES, appLanguage, setAppLanguage } = useLanguage();
    
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        companyName: '',
        industry: 'general',
        owner: currentUser?.name || '',
    });
    const [isSaving, setIsSaving] = useState(false);

    // Helpers for dynamic fallback localization
    const getLocalText = (tr, de, en) => {
        if (appLanguage === 'tr') return tr;
        if (appLanguage === 'de') return de;
        return en;
    };

    // Initialize formData when companyProfile loads
    useEffect(() => {
        if (companyProfile) {
            setFormData(prev => ({ 
                ...prev, 
                ...companyProfile,
                // Ensure we don't overwrite user input if they started typing
                companyName: prev.companyName || companyProfile.companyName || '',
                owner: prev.owner || companyProfile.owner || currentUser?.name || ''
            }));
        }
    }, [companyProfile, currentUser]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNext = () => {
        if (step === 1 && !formData.companyName?.trim()) {
            return;
        }
        setStep(prev => prev + 1);
    };

    const handleFinish = async () => {
        if (!formData.companyName?.trim()) {
            setStep(1); // Go back to step 1 if name is missing
            return;
        }
        
        setIsSaving(true);
        try {
            const success = await updateProfile({
                ...formData,
                onboardingCompleted: true
            });
             
            setToast({
                message: getLocalText('Kurulum başarıyla tamamlandı!', 'Setup erfolgreich abgeschlossen!', 'Setup completed successfully!'),
                type: 'success'
            });

            // Small delay to ensure Firestore syncs before closing modal
            setTimeout(() => {
                onComplete();
            }, 500);
        } catch (error) {
            console.error("Onboarding save error:", error);
            setToast({
                message: getLocalText('Bir hata oluştu. Lütfen tekrar deneyin.', 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.', 'An error occurred. Please try again.'),
                type: 'error'
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', zIndex: 9999 }}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="modal-content"
                style={{ maxWidth: '500px', width: '90%', padding: '2rem', borderRadius: '24px', overflow: 'hidden' }}
            >
                {/* Progress Bar */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '2rem' }}>
                    {[1, 2].map(i => (
                        <div key={i} style={{ 
                            height: '6px', 
                            flex: 1, 
                            borderRadius: '3px',
                            background: step >= i ? 'var(--primary)' : '#e2e8f0',
                            transition: 'background 0.3s'
                        }} />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                <div style={{ width: '64px', height: '64px', background: '#eff6ff', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                    <Building size={32} color="var(--primary)" />
                                </div>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#0f172a' }}>{t('welcome') || getLocalText('Hoş Geldiniz', 'Willkommen', 'Welcome')} 👋</h2>
                                <p style={{ color: '#64748b' }}>{getLocalText('Başlamak için şirket profilinizi oluşturalım.', 'Lassen Sie uns Ihr Unternehmensprofil einrichten, um zu beginnen.', 'Let\'s set up your business profile to get started.')}</p>
                            </div>

                            <div className="form-group">
                                <label style={{ fontWeight: '600' }}>{t('companyName') || getLocalText('Şirket Adı', 'Firmenname', 'Company Name')} *</label>
                                <input 
                                    autoFocus
                                    className="form-input" 
                                    name="companyName" 
                                    value={formData.companyName} 
                                    onChange={handleChange}
                                    placeholder={getLocalText('Örn: BayFatura Ltd.', 'z.B. Acme GmbH', 'e.g. Acme Corp')}
                                    style={{ padding: '12px', fontSize: '1rem' }}
                                />
                            </div>

                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label style={{ fontWeight: '600' }}>{t('industryCategory') || getLocalText('Sektör', 'Branche', 'Industry')}</label>
                                <select 
                                    className="form-input" 
                                    name="industry" 
                                    value={formData.industry} 
                                    onChange={handleChange}
                                    style={{ padding: '12px', fontSize: '1rem' }}
                                >
                                    <option value="general">{t('general') || getLocalText('Genel', 'Allgemein', 'General')}</option>
                                    <option value="automotive">{t('automotive') || getLocalText('Otomotiv', 'Automobil', 'Automotive')}</option>
                                    <option value="construction">{t('construction') || getLocalText('İnşaat', 'Bauwesen', 'Construction')}</option>
                                    <option value="gastronomy">{t('gastronomy') || getLocalText('Gastronomi', 'Gastronomie', 'Gastronomy')}</option>
                                    <option value="healthcare">{t('healthcare') || getLocalText('Sağlık', 'Gesundheitswesen', 'Healthcare')}</option>
                                    <option value="it">{t('it') || 'IT & Tech'}</option>
                                </select>
                            </div>

                            <button 
                                className="primary-btn" 
                                onClick={handleNext}
                                disabled={!formData.companyName.trim()}
                                style={{ width: '100%', marginTop: '2rem', padding: '14px', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                            >
                                {getLocalText('Devam Et', 'Weiter', 'Continue')} <ArrowRight size={18} />
                            </button>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                <div style={{ width: '64px', height: '64px', background: '#f0fdf4', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                    <Globe size={32} color="#16a34a" />
                                </div>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#0f172a' }}>{getLocalText('Yerelleştirme', 'Lokalisierung', 'Localization')}</h2>
                                <p style={{ color: '#64748b' }}>{getLocalText('Lütfen tercih ettiğiniz uygulama dilini seçin.', 'Bitte wählen Sie Ihre bevorzugte App-Sprache.', 'Choose your preferred app language.')}</p>
                            </div>

                            <div className="form-group">
                                <label style={{ fontWeight: '600' }}>{getLocalText('Uygulama Dili', 'App-Sprache', 'App Language')}</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    {LANGUAGES.map(lang => (
                                        <button
                                            key={lang.code}
                                            onClick={() => setAppLanguage(lang.code)}
                                            style={{
                                                padding: '12px',
                                                borderRadius: '12px',
                                                border: appLanguage === lang.code ? '2px solid var(--primary)' : '1px solid #e2e8f0',
                                                background: appLanguage === lang.code ? '#eff6ff' : 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <span style={{ fontSize: '1.2rem' }}>{lang.flag}</span>
                                            <span style={{ fontWeight: appLanguage === lang.code ? '600' : '400', color: '#0f172a' }}>{lang.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button 
                                className="primary-btn" 
                                onClick={handleFinish}
                                disabled={isSaving}
                                style={{ width: '100%', marginTop: '2rem', padding: '14px', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                            >
                                {isSaving ? getLocalText('Kaydediliyor...', 'Wird gespeichert...', 'Saving...') : (
                                    <>{getLocalText('Kurulumu Tamamla', 'Setup abschließen', 'Finish Setup')} <CheckCircle2 size={18} /></>
                                )}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default OnboardingWizard;
