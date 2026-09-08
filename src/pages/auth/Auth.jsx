import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Mail, Lock, User, Building, LogIn, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import {
    consumeAuthRedirectError,
    consumeAuthRedirectTarget,
    normalizeAuthRedirectTarget,
    saveAuthRedirectTarget,
} from '../../lib/authRedirect';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        companyName: ''
    });
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [isWaitingForAuthState, setIsWaitingForAuthState] = useState(false);
    
    const { login, register, resetPassword, signInWithGoogle, signInWithMicrosoft, isAuthenticated } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectTo = normalizeAuthRedirectTarget(searchParams.get('redirect') || '/dashboard');

    useEffect(() => {
        const redirectError = consumeAuthRedirectError();
        if (redirectError) {
            setError(redirectError);
            setIsLoading(false);
            setIsRedirecting(false);
        }
    }, []);

    // iOS redirect sonrası: Google auth tamamlandı, authState değişti → navigate
    useEffect(() => {
        if (isAuthenticated) {
            setIsWaitingForAuthState(false);
            navigate(consumeAuthRedirectTarget(redirectTo), { replace: true });
        }
    }, [isAuthenticated, navigate, redirectTo]);

    useEffect(() => {
        if (!isWaitingForAuthState) return undefined;

        const timeout = window.setTimeout(() => {
            if (!isAuthenticated) {
                setIsWaitingForAuthState(false);
                setIsRedirecting(false);
                setIsLoading(false);
                setError(t('loginError') || 'Sign in failed. Please try again.');
            }
        }, 12000);

        return () => window.clearTimeout(timeout);
    }, [isAuthenticated, isWaitingForAuthState, t]);

    // iOS redirect bekleme ekranı
    if (isRedirecting) {
        return (
            <div className="auth-container">
                <div className="auth-card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: '50%',
                        border: '3px solid rgba(255,255,255,0.1)',
                        borderTopColor: '#4F8EF7',
                        animation: 'spin 0.8s linear infinite',
                        margin: '0 auto 1.5rem'
                    }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}>
                        {t('processing') || 'Signing in...'}
                    </p>
                </div>
            </div>
        );
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError('');
        if (notice) setNotice('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setNotice('');
        setIsLoading(true);

        try {
            if (isLogin) {
                const success = await login(formData.email, formData.password);
                if (success) navigate(redirectTo);
                else setError(t('invalidEmailPass'));
            } else {
                const res = await register(formData);
                if (res.success) navigate(redirectTo);
                else setError(res.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        setError('');
        setNotice('');

        const email = formData.email.trim();
        if (!email) {
            setError(t('resetPasswordEmailRequired'));
            return;
        }

        setIsLoading(true);
        try {
            const res = await resetPassword(email);
            if (res?.success) {
                setNotice(t('resetPasswordEmailSent'));
            } else {
                setError(res?.messageKey ? t(res.messageKey) : (res?.error || t('resetPasswordFailed')));
            }
        } catch (err) {
            setError(err?.message || t('resetPasswordFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLogin = async (provider) => {
        setError('');
        setNotice('');
        saveAuthRedirectTarget(redirectTo);
        try {
            const loginPromise = provider === 'google' ? signInWithGoogle() : signInWithMicrosoft();
            setIsLoading(true);
            
            const res = await loginPromise;
            
            if (res?.redirecting) {
                setIsWaitingForAuthState(true);
                setIsRedirecting(true);
                setIsLoading(false);
                return;
            }
            if (res?.success) {
                if (res?.appUser) {
                    navigate(consumeAuthRedirectTarget(redirectTo), { replace: true });
                    return;
                }
                setIsWaitingForAuthState(true);
                setIsRedirecting(true);
                setIsLoading(false);
            } else if (res?.error) {
                setError(res.error);
                setIsLoading(false);
            } else {
                setError(t('loginError') || 'Sign in failed. Please try again.');
                setIsLoading(false);
            }
        } catch (err) {
            setError(err?.message || t('loginError') || 'Sign in failed. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-icon-wrapper">
                        <LogIn size={32} />
                    </div>
                    <h1 className="auth-title">
                        {isLogin ? t('welcomeBack') : t('getStarted')}
                    </h1>
                    <p className="auth-subtitle">
                        {isLogin ? t('enterDetails') : t('createAccountMsg')}
                    </p>
                </div>

                {error && (
                    <div className="auth-error">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {notice && (
                    <div className="auth-success">
                        <CheckCircle size={18} />
                        {notice}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    {!isLogin && (
                        <>
                            <div className="form-group">
                                <label className="auth-label">
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
                                <label className="auth-label">
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
                        <label className="auth-label">
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
                        <div className="auth-label-row">
                            <label className="auth-label">
                                <Lock size={16} /> {t('passwordLabel')}
                            </label>
                            {isLogin && (
                                <button
                                    type="button"
                                    className="forgot-password-btn"
                                    onClick={handleForgotPassword}
                                    disabled={isLoading}
                                >
                                    {t('forgotPassword')}
                                </button>
                            )}
                        </div>
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
                        className="primary-btn auth-submit" 
                        disabled={isLoading}
                    >
                        {isLoading ? t('processing') : isLogin ? t('loginBtn') : t('registerBtn')}
                    </button>
                </form>

                <div className="auth-divider">
                    <div className="auth-divider-line"></div>
                    <span>{t('orContinueWith')}</span>
                    <div className="auth-divider-line"></div>
                </div>

                <div className="auth-social-grid">
                    <button 
                        type="button"
                        onClick={() => handleSocialLogin('google')}
                        className="secondary-btn auth-social-btn"
                        disabled={isLoading}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Google
                    </button>
                    <button 
                        type="button"
                        onClick={() => handleSocialLogin('microsoft')}
                        className="secondary-btn auth-social-btn"
                        disabled={isLoading}
                    >
                        <svg width="18" height="18" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
                            <rect x="12" y="1" width="10" height="10" fill="#7FBA00"/>
                            <rect x="1" y="12" width="10" height="10" fill="#00A4EF"/>
                            <rect x="12" y="12" width="10" height="10" fill="#FFB900"/>
                        </svg>
                        Microsoft
                    </button>
                </div>

                <div className="auth-toggle">
                    <p>
                        {isLogin ? t('noAccount') : t('haveAccount')}
                        <button 
                            onClick={() => setIsLogin(!isLogin)}
                            className="auth-toggle-btn"
                        >
                            {isLogin ? t('signUp') : t('loginLink')}
                        </button>
                    </p>
                </div>

                <Link to="/" className="auth-landing-link">
                    <ArrowLeft size={16} />
                    {t('backToLanding')}
                </Link>
            </div>
        </div>
    );
};

export default Auth;
