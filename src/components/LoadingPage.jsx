import React from 'react';
import { motion } from 'framer-motion';
import { Command } from 'lucide-react';

/**
 * 🚀 BayFatura Premium Loading Page
 * Ultra modern, glassmorphism destekli yükleme ekranı.
 */
const LoadingPage = ({ message = "Lädt..." }) => {
    const splashBg = 'rgb(26, 36, 54)';

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: splashBg,
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
                    opacity: [0.08, 0.16, 0.08]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                style={{
                    position: 'absolute',
                    width: '400px',
                    height: '400px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(96, 165, 250, 0.85) 0%, transparent 70%)',
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
                        border: '4px solid rgba(203, 213, 225, 0.14)',
                        borderTopColor: '#60a5fa',
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
                    <img src="/logo.png" alt="BayFatura Logo" style={{ height: '100%', width: 'auto', filter: 'drop-shadow(0 8px 20px rgba(0, 0, 0, 0.28))' }} />
                </motion.div>
            </div>

            {/* Yazı ve İlerleme Noktaları */}
            <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.9rem', color: '#e2e8f0', fontWeight: '500' }}>{message}</span>
                    <motion.div 
                        style={{ display: 'flex', gap: '4px' }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        <div style={{ width: '4px', height: '4px', background: '#60a5fa', borderRadius: '50%' }} />
                        <div style={{ width: '4px', height: '4px', background: '#60a5fa', borderRadius: '50%', opacity: 0.6 }} />
                        <div style={{ width: '4px', height: '4px', background: '#60a5fa', borderRadius: '50%', opacity: 0.3 }} />
                    </motion.div>
                </div>
            </div>

            {/* Footer / Powered By */}
            <div style={{ 
                position: 'absolute', 
                bottom: '40px', 
                fontSize: '0.75rem', 
                color: '#cbd5e1', 
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
