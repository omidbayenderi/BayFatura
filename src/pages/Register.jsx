import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Building2, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Register = () => {
    const { register, isAuthenticated } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        companyName: '',
        industry: 'general',
        plan: 'standard',
        agreeTerms: false
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Redirect if already logged in
    React.useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name) newErrors.name = t('required') || 'Required';
        if (!formData.email) newErrors.email = t('required') || 'Required';
        if (!formData.password) newErrors.password = t('required') || 'Required';
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = t('passwordMismatch') || 'Passwords do not match';
        }
        if (!formData.companyName) newErrors.companyName = t('required') || 'Required';
        if (!formData.agreeTerms) newErrors.agreeTerms = t('mustAcceptTerms') || 'You must accept terms';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        setErrors({});

        try {
            const result = await register(formData);
            if (result.success) {
                navigate('/dashboard');
            } else {
                setErrors({ general: result.error });
            }
        } catch (err) {
            setErrors({ general: err.message || 'Registration failed' });
        } finally {
            setLoading(false);
        }
    };

    const getPasswordStrength = () => {
        const { password } = formData;
        if (!password) return null;
        if (password.length < 6) return { label: 'Weak', color: '#ef4444' };
        if (password.length < 10) return { label: 'Medium', color: '#f59e0b' };
        return { label: 'Strong', color: '#10b981' };
    };

    const strength = getPasswordStrength();

    return (
        <div className="auth-container">
            <motion.div
                className="glass-card auth-card register-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="auth-header">
                    <div className="logo-icon" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>B</div>
                    <h1 className="gradient-text">BayRechnung</h1>
                    <p style={{ color: '#64748b', marginTop: '0.5rem' }}>{t('createAccount')}</p>
                </div>

                {errors.general && (
                    <div className="error-message">{errors.general}</div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label><User size={18} />{t('fullName')}</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                            {errors.name && <span className="error-text">{errors.name}</span>}
                        </div>
                        <div className="form-group">
                            <label><Building2 size={18} />{t('companyName')}</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.companyName}
                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                            />
                            {errors.companyName && <span className="error-text">{errors.companyName}</span>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label><Mail size={18} />{t('email')}</label>
                        <input
                            type="email"
                            className="form-input"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                        {errors.email && <span className="error-text">{errors.email}</span>}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label><Lock size={18} />{t('password')}</label>
                            <input
                                type="password"
                                className="form-input"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                            {strength && (
                                <div className="password-strength" style={{ marginTop: '4px' }}>
                                    <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: formData.password.length < 6 ? '33%' : formData.password.length < 10 ? '66%' : '100%', background: strength.color, transition: 'all 0.3s' }}></div>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: strength.color }}>{strength.label}</span>
                                </div>
                            )}
                            {errors.password && <span className="error-text">{errors.password}</span>}
                        </div>
                        <div className="form-group">
                            <label><Lock size={18} />{t('confirmPassword')}</label>
                            <input
                                type="password"
                                className="form-input"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            />
                            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>{t('industry')}</label>
                        <select className="form-input" value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })}>
                            <option value="automotive">🚗 {t('automotive')}</option>
                            <option value="general">💼 {t('generalService')}</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>{t('plan')}</label>
                        <div className="plan-selector">
                            <button
                                type="button"
                                className={`plan-option ${formData.plan === 'standard' ? 'active' : ''}`}
                                onClick={() => setFormData({ ...formData, plan: 'standard' })}
                            >
                                <div className="plan-name">📦 {t('standard')}</div>
                                <div className="plan-price">Free</div>
                            </button>
                            <button
                                type="button"
                                className={`plan-option ${formData.plan === 'premium' ? 'active' : ''}`}
                                onClick={() => setFormData({ ...formData, plan: 'premium' })}
                            >
                                <div className="plan-name">💎 {t('premium')}</div>
                                <div className="plan-price">29.99€/mo</div>
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.agreeTerms}
                                onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                            />
                            <span>{t('termsAgree')}</span>
                        </label>
                        {errors.agreeTerms && <span className="error-text">{errors.agreeTerms}</span>}
                    </div>

                    <button type="submit" className="cta-button w-full" disabled={loading}>
                        <CheckCircle2 size={20} />
                        {loading ? (t('creatingAccount') || 'Creating account...') : t('createAccount')}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        {t('alreadyHaveAccount')} <Link to="/login" className="link-primary">{t('signIn')}</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
