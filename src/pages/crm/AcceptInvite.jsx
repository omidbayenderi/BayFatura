import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { usePanel } from '../../context/PanelContext';
import { acceptInvitation } from '../../lib/emailService';
import { Mail, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const AcceptInvite = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { currentUser, loading: authLoading } = useAuth();
    const { t, appLanguage } = useLanguage();
    const { showToast } = usePanel();

    const [status, setStatus] = useState('loading');
    const [errorMsg, setErrorMsg] = useState('');

    const token = searchParams.get('token');
    const tenant = searchParams.get('tenant');
    const email = searchParams.get('email');

    useEffect(() => {
        if (authLoading) return;

        if (!token || !tenant) {
            setStatus('error');
            setErrorMsg(t('invalidInvite'));
            return;
        }

        if (!currentUser) {
            setStatus('needsAuth');
            return;
        }

        const doAccept = async () => {
            try {
                await acceptInvitation({ token, tenantId: tenant });
                setStatus('success');
                showToast(t('inviteAccepted'), 'success');
            } catch (error) {
                setStatus('error');
                setErrorMsg(error.message || t('inviteAcceptFailed'));
                showToast(error.message || t('inviteAcceptFailed'), 'error');
            }
        };

        doAccept();
    }, [currentUser, authLoading, token, tenant]);

    if (authLoading || status === 'loading') {
        return (
            <div className="accept-invite-container">
                <div className="accept-invite-card">
                    <div className="accept-invite-icon">
                        <Loader2 size={48} className="spinner" />
                    </div>
                    <h2>{t('checkingInvite')}</h2>
                </div>
            </div>
        );
    }

    if (status === 'needsAuth') {
        return (
            <div className="accept-invite-container">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="accept-invite-card"
                >
                    <div className="accept-invite-icon accept-invite-icon-primary">
                        <Mail size={48} />
                    </div>
                    <h2>{t('acceptInvite')}</h2>
                    <p className="accept-invite-desc">
                        {email ? (
                            <>You've been invited to join a team on <strong>BayFatura</strong> as <strong>{email}</strong></>
                        ) : (
                            t('acceptInviteDesc')
                        )}
                    </p>
                    <p className="accept-invite-hint">{t('loginToAccept')}</p>
                    <button
                        className="primary-btn accept-invite-btn"
                        onClick={() => navigate(`/login?redirect=${encodeURIComponent(`/accept-invite?token=${token}&tenant=${tenant}&email=${encodeURIComponent(email || '')}`)}`)}
                    >
                        {t('loginBtn')}
                        <ArrowRight size={20} />
                    </button>
                    <p className="accept-invite-register">
                        {t('noAccount')}{' '}
                        <button
                            className="link-btn"
                            onClick={() => navigate(`/login?redirect=${encodeURIComponent(`/accept-invite?token=${token}&tenant=${tenant}&email=${encodeURIComponent(email || '')}`)}`)}
                        >
                            {t('signUp')}
                        </button>
                    </p>
                </motion.div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="accept-invite-container">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="accept-invite-card"
                >
                    <div className="accept-invite-icon accept-invite-icon-success">
                        <CheckCircle size={48} />
                    </div>
                    <h2>{t('inviteAcceptedTitle')}</h2>
                    <p className="accept-invite-desc">{t('inviteAcceptedDesc')}</p>
                    <button
                        className="primary-btn accept-invite-btn"
                        onClick={() => navigate('/dashboard')}
                    >
                        {t('goToDashboard')}
                        <ArrowRight size={20} />
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="accept-invite-container">
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="accept-invite-card"
            >
                <div className="accept-invite-icon accept-invite-icon-error">
                    <XCircle size={48} />
                </div>
                <h2>{t('inviteError')}</h2>
                <p className="accept-invite-desc">{errorMsg}</p>
                <button
                    className="primary-btn accept-invite-btn"
                    onClick={() => navigate('/')}
                >
                    {t('goToDashboard')}
                </button>
            </motion.div>
        </div>
    );
};

export default AcceptInvite;
