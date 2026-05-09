import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Home, FileQuestion } from 'lucide-react';

const NotFound = () => {
    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            textAlign: 'center',
            padding: '24px'
        }}>
            <motion.div
                initial={{ scale: 0.8, opacity: 1, rotate: -20 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ duration: 0.5, type: 'spring' }}
                style={{
                    width: '120px',
                    height: '120px',
                    background: 'white',
                    borderRadius: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
                    marginBottom: '40px',
                    color: '#ef4444'
                }}
            >
                <FileQuestion size={64} />
            </motion.div>

            <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ fontSize: '6rem', margin: 0, fontWeight: 900, color: '#1e293b', lineHeight: 1 }}
            >
                404
            </motion.h1>

            <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{ fontSize: '1.875rem', fontWeight: 700, color: '#475569', marginBottom: '16px', fontFamily: 'Outfit' }}
            >
                Uuups! Seite nicht gefunden.
            </motion.h2>

            <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                style={{ color: '#64748b', fontSize: '1.125rem', maxWidth: '450px', marginBottom: '40px', lineHeight: 1.6 }}
            >
                Es scheint, als ob Sie einen falschen Abzweig genommen haben. Vielleicht wurde die Seite verschoben oder gelöscht.
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                style={{ display: 'flex', gap: '16px' }}
            >
                <Link to="/" className="primary-btn" style={{ padding: '12px 32px' }}>
                    <Home size={20} style={{ marginRight: '8px' }} /> Zurück zum Start
                </Link>
                <Link to="/archive" className="secondary-btn" style={{ padding: '12px 32px' }}>
                    <Search size={20} style={{ marginRight: '8px' }} /> Rechnungen suchen
                </Link>
            </motion.div>

            <div style={{ position: 'absolute', bottom: '40px', color: '#94a3b8', fontSize: '0.85rem' }}>
                © 2026 BayFatura Support System
            </div>
        </div>
    );
};

export default NotFound;
