import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Login = () => {
    const { login, isAuthenticated } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    // Redirect if already logged in
    React.useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!formData.email || !formData.password) {
            setError(t('fillAllFields') || 'Please fill all fields');
            setLoading(false);
            return;
        }

        try {
            const success = await login(formData.email, formData.password);
            if (success) {
                navigate('/dashboard');
            } else {
                setError(t('invalidCredentials') || 'Invalid email or password');
            }
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <motion.div
                className="glass-card auth-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="auth-header">
                    <div className="logo-icon" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>B</div>
                    <h1 className="gradient-text">BayRechnung</h1>
                    <p style={{ color: '#64748b', marginTop: '0.5rem' }}>{t('welcomeBack') || 'Welcome back!'}</p>
                </div>

                {error && (
                    <motion.div
                        className="error-message"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>
                            <Mail size={18} />
                            {t('email')}
                        </label>
                        <input
                            type="email"
                            className="form-input"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="user@example.com"
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            <Lock size={18} />
                            {t('password')}
                        </label>
                        <input
                            type="password"
                            className="form-input"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="form-extras">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <span>{t('rememberMe')}</span>
                        </label>
                        <a href="#" className="link-text">{t('forgotPassword')}</a>
                    </div>

                    <button type="submit" className="cta-button w-full" disabled={loading}>
                        <LogIn size={20} />
                        {loading ? (t('signingIn') || 'Signing in...') : t('signIn')}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        {t('noAccount')} <Link to="/register" className="link-primary">{t('signUp')}</Link>
                    </p>
                </div>

                <div className="demo-hint" style={{ marginTop: '2rem', padding: '1rem', background: '#f1f5f9', borderRadius: '8px', fontSize: '0.85rem', color: '#475569' }}>
                    <strong>Demo Account:</strong><br />
                    Email: demo@bayrechnung.com<br />
                    Password: demo123
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
