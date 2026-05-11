import React from 'react';
import { motion } from 'framer-motion';
import { Command } from 'lucide-react';

/**
 * 🚀 BayFatura Premium Loading Page
 * Ultra modern, glassmorphism destekli yükleme ekranı.
 */
const LoadingPage = ({ message = "Lädt..." }) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            overflow: 'hidden'
        }}>
            {/* Arkaplan Dekoratif Halkalar */}
            <motion.div 
                animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.2, 0.1]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                style={{
                    position: 'absolute',
                    width: '400px',
                    height: '400px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)',
                    filter: 'blur(60px)',
                    zIndex: -1
                }}
            />

            {/* Logo Konteynırı */}
            <div style={{ position: 'relative', marginBottom: '32px' }}>
                {/* Dönen Dış Halka */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        border: '4px solid rgba(37, 99, 235, 0.1)',
                        borderTopColor: 'var(--primary)',
                        position: 'absolute',
                        top: -10,
                        left: -10
                    }}
                />

                {/* Ana Logo İkonu */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    style={{
                        height: '80px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1
                    }}
                >
                    <img src="/logo.png" alt="BayFatura Logo" style={{ height: '100%', width: 'auto', filter: 'drop-shadow(0 4px 12px rgba(79, 70, 229, 0.3))' }} />
                </motion.div>
            </div>

            {/* Yazı ve İlerleme Noktaları */}
            <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>{message}</span>
                    <motion.div 
                        style={{ display: 'flex', gap: '4px' }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        <div style={{ width: '4px', height: '4px', background: 'var(--primary)', borderRadius: '50%' }} />
                        <div style={{ width: '4px', height: '4px', background: 'var(--primary)', borderRadius: '50%', opacity: 0.6 }} />
                        <div style={{ width: '4px', height: '4px', background: 'var(--primary)', borderRadius: '50%', opacity: 0.3 }} />
                    </motion.div>
                </div>
            </div>

            {/* Footer / Powered By */}
            <div style={{ 
                position: 'absolute', 
                bottom: '40px', 
                fontSize: '0.75rem', 
                color: '#94a3b8', 
                letterSpacing: '1px',
                textTransform: 'uppercase',
                fontWeight: '600'
            }}>
                Powered by BayFatura Cloud
            </div>
        </div>
    );
};

export default LoadingPage;
