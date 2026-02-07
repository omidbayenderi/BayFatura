import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const Success = () => {
    React.useEffect(() => {
        // Clear any checkout-related session data
        sessionStorage.removeItem('checkout_session_id');
    }, []);

    return (
        <div className="auth-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div
                className="glass-card"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                style={{
                    maxWidth: '500px',
                    textAlign: 'center',
                    padding: '3rem'
                }}
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                    <CheckCircle size={80} color="#10b981" style={{ margin: '0 auto 1.5rem' }} />
                </motion.div>

                <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                    🎉 Payment Successful!
                </h1>

                <p style={{ fontSize: '1.1rem', color: '#94a3b8', marginBottom: '2rem', lineHeight: '1.6' }}>
                    Thank you for your purchase! Your subscription is now active.
                    <br />
                    You can start using all premium features immediately.
                </p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/dashboard" className="cta-button">
                        Go to Dashboard
                    </Link>
                    <Link to="/new-invoice" className="secondary-button">
                        Start Creating Invoices
                    </Link>
                </div>

                <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '2rem' }}>
                    A confirmation email has been sent to your registered email address.
                </p>
            </motion.div>
        </div>
    );
};

export default Success;
