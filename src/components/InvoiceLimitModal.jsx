import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, FileText, Sparkles, ShieldCheck, TrendingUp } from 'lucide-react';

const ELITE_FEATURES = [
    { icon: FileText, key: 'limitFeature1' },
    { icon: Sparkles, key: 'limitFeature2' },
    { icon: TrendingUp, key: 'limitFeature3' },
    { icon: ShieldCheck, key: 'limitFeature4' },
];

const InvoiceLimitModal = ({ isOpen, onClose, usedCount = 5, limitCount = 5 }) => {
    const { t } = useLanguage();
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleUpgrade = () => {
        onClose();
        const monthly = 'https://buy.stripe.com/aFa28q4fFfIS84P1HA2kw02';
        const url = new URL(monthly);
        if (currentUser?.uid) url.searchParams.set('client_reference_id', currentUser.uid);
        if (currentUser?.email) url.searchParams.set('prefilled_email', currentUser.email);
        window.location.assign(url.toString());
    };

    const handleSeePlans = () => {
        onClose();
        navigate('/billing');
    };

    const progressPct = Math.min((usedCount / limitCount) * 100, 100);

    return (
        <AnimatePresence>
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 24 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 24 }}
                    transition={{ type: 'spring', bounce: 0.35, duration: 0.55 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '28px',
                        boxShadow: '0 30px 60px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)',
                        maxWidth: '480px',
                        width: '100%',
                        padding: '40px',
                        position: 'relative',
                        color: 'white',
                        overflow: 'hidden',
                    }}
                >
                    {/* Arka plan ışıması */}
                    <div style={{
                        position: 'absolute',
                        top: '-80px', left: '50%',
                        transform: 'translateX(-50%)',
                        width: '320px', height: '320px',
                        background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 65%)',
                        pointerEvents: 'none',
                    }} />

                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute', top: '18px', right: '18px',
                            background: 'rgba(255,255,255,0.07)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '50%',
                            width: '34px', height: '34px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#94a3b8', cursor: 'pointer', zIndex: 10,
                        }}
                    >
                        <X size={16} />
                    </button>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        {/* İkon + Başlık */}
                        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                            <div style={{
                                width: '68px', height: '68px',
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                borderRadius: '20px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 20px',
                                boxShadow: '0 12px 28px rgba(99,102,241,0.35)',
                            }}>
                                <Zap size={34} color="white" fill="white" />
                            </div>

                            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#f8fafc', marginBottom: '8px' }}>
                                {t('invoiceLimitTitle')}
                            </h2>
                            <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.55 }}>
                                {t('invoiceLimitDesc')}
                            </p>
                        </div>

                        {/* Kullanım Çubuğu */}
                        <div style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '16px',
                            padding: '16px 20px',
                            marginBottom: '24px',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: '500' }}>
                                    {t('invoiceLimitUsage')}
                                </span>
                                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#f87171' }}>
                                    {usedCount}/{limitCount}
                                </span>
                            </div>
                            <div style={{
                                height: '8px',
                                background: 'rgba(255,255,255,0.08)',
                                borderRadius: '99px',
                                overflow: 'hidden',
                            }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPct}%` }}
                                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                                    style={{
                                        height: '100%',
                                        background: progressPct >= 100
                                            ? 'linear-gradient(90deg, #ef4444, #f97316)'
                                            : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                                        borderRadius: '99px',
                                    }}
                                />
                            </div>
                            <p style={{ marginTop: '8px', fontSize: '0.78rem', color: '#64748b' }}>
                                {t('invoiceLimitResets')}
                            </p>
                        </div>

                        {/* Elite Özellikleri */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
                            {ELITE_FEATURES.map(({ icon: Icon, key }) => (
                                <div key={key} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '11px 16px',
                                    background: 'rgba(99,102,241,0.07)',
                                    border: '1px solid rgba(99,102,241,0.15)',
                                    borderRadius: '12px',
                                }}>
                                    <Icon size={16} color="#818cf8" />
                                    <span style={{ fontSize: '0.88rem', color: '#e2e8f0', fontWeight: '500' }}>
                                        {t(key)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Butonlar */}
                        <motion.button
                            whileHover={{ scale: 1.02, boxShadow: '0 16px 32px rgba(99,102,241,0.45)' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleUpgrade}
                            style={{
                                width: '100%',
                                padding: '16px',
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '14px',
                                fontSize: '1rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                boxShadow: '0 10px 24px rgba(99,102,241,0.35)',
                                marginBottom: '10px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            }}
                        >
                            <Zap size={18} fill="white" />
                            {t('invoiceLimitUpgradeBtn')}
                        </motion.button>

                        <button
                            onClick={handleSeePlans}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: 'transparent',
                                color: '#94a3b8',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '14px',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                            }}
                        >
                            {t('invoiceLimitSeePlans')}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default InvoiceLimitModal;
