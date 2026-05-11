import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Crown, CheckCircle2, ShieldCheck, Zap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PremiumModal = ({ isOpen, onClose }) => {
    const { t } = useLanguage();
    const { updateUser } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleUpgrade = () => {
        onClose();
        navigate('/billing');
    };

    return (
        <AnimatePresence>
            <div 
                className="modal-overlay" 
                style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.7)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}
                onClick={onClose}
            >
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
                    className="modal-content"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '24px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        maxWidth: '480px',
                        width: '100%',
                        padding: '40px',
                        position: 'relative',
                        color: 'white',
                        overflow: 'hidden'
                    }}
                >
                    {/* Background Glow */}
                    <div style={{
                        position: 'absolute',
                        top: '-50%', left: '-50%',
                        width: '200%', height: '200%',
                        background: 'radial-gradient(circle, rgba(217, 119, 6, 0.15) 0%, transparent 60%)',
                        pointerEvents: 'none',
                        zIndex: 0
                    }} />

                    <button 
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '20px', right: '20px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '50%',
                            width: '32px', height: '32px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#e2e8f0',
                            cursor: 'pointer',
                            zIndex: 10,
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        }}
                    >
                        <X size={18} />
                    </button>

                    <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                        <div style={{
                            width: '72px', height: '72px',
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            borderRadius: '20px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 24px auto',
                            boxShadow: '0 10px 25px rgba(245, 158, 11, 0.3)',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}>
                            <Crown size={36} color="white" />
                        </div>

                        <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '12px', color: '#f8fafc' }}>
                            {t('unlockPro')}
                        </h2>
                        
                        <p style={{ color: '#cbd5e1', fontSize: '1rem', lineHeight: 1.5, marginBottom: '32px' }}>
                            {t('unlockProDesc')}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', marginBottom: '32px' }}>
                            {[1, 2, 3, 4].map(num => {
                                const icons = [
                                    <Zap size={20} color="#f59e0b" />,
                                    <ShieldCheck size={20} color="#f59e0b" />,
                                    <CheckCircle2 size={20} color="#f59e0b" />,
                                    <Crown size={20} color="#f59e0b" />
                                ];
                                return (
                                    <motion.div 
                                        key={num}
                                        whileHover={{ x: 5, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                                        whileTap={{ scale: 0.98 }}
                                        style={{ 
                                            display: 'flex', 
                                            gap: '14px', 
                                            alignItems: 'center',
                                            padding: '12px 16px',
                                            background: 'rgba(255,255,255,0.03)',
                                            borderRadius: '16px',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <div style={{ flexShrink: 0 }}>{icons[num-1]}</div>
                                        <span style={{ color: '#f1f5f9', fontSize: '0.95rem', fontWeight: '500' }}>{t(`proBenefit${num}`)}</span>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <button 
                            onClick={handleUpgrade}
                            disabled={isProcessing}
                            style={{
                                width: '100%',
                                padding: '16px 24px',
                                background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '16px',
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s',
                                boxShadow: '0 10px 20px rgba(234, 88, 12, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                opacity: isProcessing ? 0.7 : 1
                            }}
                            onMouseEnter={(e) => {
                                if (!isProcessing) {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 15px 25px rgba(234, 88, 12, 0.4)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isProcessing) {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(234, 88, 12, 0.3)';
                                }
                            }}
                        >
                            {isProcessing ? (
                                <span className="animate-spin" style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
                            ) : (
                                <Crown size={20} />
                            )}
                            {isProcessing ? t('loading') : t('getProBtn')}
                        </button>
                        
                        <p style={{ marginTop: '16px', fontSize: '0.8rem', color: '#64748b' }}>
                            * Das ist eine Stripe Mock-Integration. (Testing Mode)
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PremiumModal;
