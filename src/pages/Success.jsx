import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Success = () => {
    const { updateUser, isPro } = useAuth();
    const { t } = useLanguage();

    React.useEffect(() => {
        // Webhook henüz işlemediyse frontend'den manuel plan güncelle
        const upgradeUser = async () => {
            if (!isPro) {
                await updateUser({ plan: 'elite' }); // ✅ 'premium' değil 'elite'
            }
        };
        upgradeUser();
        sessionStorage.removeItem('checkout_session_id');
    }, []);

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%)' }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                    maxWidth: '500px',
                    width: '90%',
                    textAlign: 'center',
                    padding: '3rem',
                    background: 'white',
                    borderRadius: '28px',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(99,102,241,0.1)'
                }}
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    style={{ marginBottom: '1.5rem' }}
                >
                    <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                        <CheckCircle size={56} color="white" />
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fef3c7', color: '#d97706', padding: '4px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', marginBottom: '16px' }}>
                        <Sparkles size={14} /> ELITE
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1rem', color: '#1e293b' }}>
                        {t('paymentSuccessTitle')}
                    </h1>
                    <p style={{ fontSize: '1rem', color: '#64748b', marginBottom: '2rem', lineHeight: '1.6' }}>
                        {t('paymentSuccessDesc')}
                    </p>
                </motion.div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', borderRadius: '14px', textDecoration: 'none', fontWeight: '700', fontSize: '0.95rem' }}>
                        {t('goToDashboard')} <ArrowRight size={18} />
                    </Link>
                    <Link to="/new" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', background: '#f1f5f9', color: '#1e293b', borderRadius: '14px', textDecoration: 'none', fontWeight: '600', fontSize: '0.95rem' }}>
                        {t('newInvoice')}
                    </Link>
                </div>

                <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '2rem' }}>
                    {t('confirmationEmailSent')}
                </p>
            </motion.div>
        </div>
    );
};

export default Success;
