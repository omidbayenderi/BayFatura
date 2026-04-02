import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Mail, Lock, User, Building, LogIn, AlertCircle, Chrome, Apple } from 'lucide-react';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        companyName: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const { login, register, signInWithGoogle, signInWithApple } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (isLogin) {
                const success = await login(formData.email, formData.password);
                if (success) navigate('/dashboard');
                else setError(t('invalidEmailPass'));
            } else {
                const res = await register(formData);
                if (res.success) navigate('/dashboard');
                else setError(res.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLogin = async (provider) => {
        setError('');
        setIsLoading(true);
        try {
            const res = provider === 'google' ? await signInWithGoogle() : await signInWithApple();
            if (res.success) navigate('/dashboard');
            else setError(res.error);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container" style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}>
            <div className="auth-card" style={{
                width: '100%',
                maxWidth: '450px',
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                borderRadius: '24px',
                padding: '40px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255,255,255,0.2)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ 
                        width: '64px', 
                        height: '64px', 
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px auto',
                        color: 'white',
                        boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)'
                    }}>
                        <LogIn size={32} />
                    </div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#1e293b' }}>
                        {isLogin ? t('welcomeBack') : t('getStarted')}
                    </h1>
                    <p style={{ color: '#64748b', marginTop: '8px' }}>
                        {isLogin ? t('enterDetails') : t('createAccountMsg')}
                    </p>
                </div>

                {error && (
                    <div style={{
                        background: '#fee2e2',
                        color: '#ef4444',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.9rem'
                    }}>
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {!isLogin && (
                        <>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500' }}>
                                    <User size={16} /> {t('fullName')}
                                </label>
                                <input 
                                    className="form-input" 
                                    name="name" 
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500' }}>
                                    <Building size={16} /> {t('companyNameLabel')}
                                </label>
                                <input 
                                    className="form-input" 
                                    name="companyName" 
                                    placeholder="BayFatura GmbH"
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>
                        </>
                    )}

                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500' }}>
                            <Mail size={16} /> {t('emailAddress')}
                        </label>
                        <input 
                            type="email"
                            className="form-input" 
                            name="email" 
                            placeholder="mail@fatura.com"
                            value={formData.email}
                            onChange={handleChange}
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500' }}>
                            <Lock size={16} /> {t('passwordLabel')}
                        </label>
                        <input 
                            type="password"
                            className="form-input" 
                            name="password" 
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required 
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="primary-btn" 
                        disabled={isLoading}
                        style={{ width: '100%', height: '48px', marginTop: '8px' }}
                    >
                        {isLoading ? t('processing') : isLogin ? t('loginBtn') : t('registerBtn')}
                    </button>
                </form>

                <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{t('orContinueWith')}</span>
                    <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <button 
                        onClick={() => handleSocialLogin('google')}
                        className="secondary-btn"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', height: '44px' }}
                    >
                        <Chrome size={18} /> Google
                    </button>
                    <button 
                        onClick={() => handleSocialLogin('apple')}
                        className="secondary-btn"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', height: '44px' }}
                    >
                        <Apple size={18} /> iCloud
                    </button>
                </div>

                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                        {isLogin ? t('noAccount') : t('haveAccount')}
                        <button 
                            onClick={() => setIsLogin(!isLogin)}
                            style={{ 
                                background: 'none', 
                                border: 'none', 
                                color: '#6366f1', 
                                fontWeight: '600', 
                                padding: '0 4px', 
                                cursor: 'pointer',
                                marginLeft: '8px'
                            }}
                        >
                            {isLogin ? t('signUp') : t('loginLink')}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Auth;
