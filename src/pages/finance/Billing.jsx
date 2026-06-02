import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { motion } from 'framer-motion';
import {
    Check, Star, Sparkles, TrendingUp, Users,
    Zap, Shield, Clock, FileSpreadsheet, Ghost
} from 'lucide-react';

const stripeLinks = {
    monthly: 'https://buy.stripe.com/aFa28q4fFfIS84P1HA2kw02',
    yearly: 'https://buy.stripe.com/8x24gyeUj2W61GrgCu2kw01'
};

const Billing = () => {
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const [billingCycle, setBillingCycle] = useState('monthly');

    const hasEliteAccess = ['elite', 'premium'].includes(currentUser?.plan) ||
        currentUser?.featureAccess === 'all';

    const handleUpgrade = (planType) => {
        const paymentLink = stripeLinks[planType];
        if (!paymentLink || !currentUser?.uid) return;

        const checkoutUrl = new URL(paymentLink);
        checkoutUrl.searchParams.set('client_reference_id', currentUser.uid);
        if (currentUser.email) {
            checkoutUrl.searchParams.set('prefilled_email', currentUser.email);
        }

        window.location.assign(checkoutUrl.toString());
    };

    const eliteIconColor = hasEliteAccess ? 'var(--primary)' : '#fcd34d';
    const eliteTextColor = hasEliteAccess ? '#1e293b' : 'white';

    return (
        <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ textAlign: 'center', marginBottom: '48px' }}>
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="gradient-text" style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '1rem' }}>
                        {t('choosePlan')}
                    </h1>
                    <p style={{ fontSize: '1.2rem', color: '#64748b' }}>
                        {t('billingHeaderDesc')}
                    </p>
                </motion.div>

                <div style={{
                    marginTop: '32px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.5)',
                    padding: '4px',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                }}>
                    <button
                        onClick={() => setBillingCycle('monthly')}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '12px',
                            border: 'none',
                            background: billingCycle === 'monthly' ? 'white' : 'transparent',
                            color: billingCycle === 'monthly' ? 'var(--primary)' : '#64748b',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        {t('monthly')}
                    </button>
                    <button
                        onClick={() => setBillingCycle('yearly')}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '12px',
                            border: 'none',
                            background: billingCycle === 'yearly' ? 'white' : 'transparent',
                            color: billingCycle === 'yearly' ? 'var(--primary)' : '#64748b',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {t('yearly')}
                        <span style={{ fontSize: '0.7rem', background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: '10px' }}>
                            {t('tenPercentSaved')}
                        </span>
                    </button>
                </div>
            </header>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))',
                gap: '24px',
                alignItems: 'stretch'
            }}>
                <div className="card glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0', height: '100%' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>
                            <Ghost size={18} /> {t('basicPlan')}
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1e293b' }}>
                            €0 <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: '400' }}>/ {t('month').toLowerCase()}</span>
                        </div>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#475569' }}>
                            <Check size={18} color="#10b981" /> {t('upTo5Invoices')}
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#475569' }}>
                            <Check size={18} color="#10b981" /> {t('expenses')}
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#94a3b8', fontSize: '0.9rem' }}>
                            <Clock size={18} /> {t('adSupported')}
                        </li>
                    </ul>

                    <button className="secondary-btn" disabled style={{ width: '100%', padding: '14px', borderRadius: '12px', opacity: 0.7 }}>
                        {hasEliteAccess ? t('basicPlan') : t('currentPlan')}
                    </button>
                </div>

                <motion.div
                    whileHover={{ y: -5 }}
                    style={{
                        padding: '32px',
                        borderRadius: '24px',
                        background: hasEliteAccess ? 'var(--glass-white)' : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                        color: eliteTextColor,
                        border: '2px solid',
                        borderColor: hasEliteAccess ? 'var(--primary)' : '#334155',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%'
                    }}
                >
                    <div style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'var(--primary)',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '700'
                    }}>
                        {hasEliteAccess ? t('active') : t('recommended')}
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: eliteIconColor, fontWeight: '700', marginBottom: '8px' }}>
                            <Star size={18} fill={eliteIconColor} /> ELITE
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>
                            €{billingCycle === 'monthly' ? '9' : '77'}
                            <span style={{ fontSize: '1rem', color: hasEliteAccess ? '#64748b' : '#94a3b8', fontWeight: '400' }}>
                                {' '}/ {billingCycle === 'monthly' ? t('month').toLowerCase() : t('yearly').toLowerCase()}
                            </span>
                        </div>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                        {[
                            [TrendingUp, t('forecasting')],
                            [Zap, t('bankMatcher')],
                            [Users, t('teamManagementElite')],
                            [Star, `${t('products')} & ${t('customers')}`],
                            [FileSpreadsheet, t('quotes')],
                            [Sparkles, t('aiVatPrediction')],
                            [Shield, t('unlimitedAndAdFree')]
                        ].map(([Icon, label]) => (
                            <li key={label} style={{ display: 'flex', gap: '12px', fontSize: '0.9rem' }}>
                                <Icon size={18} color={eliteIconColor} />
                                <span>{label}</span>
                            </li>
                        ))}
                    </ul>

                    <button
                        className="primary-btn"
                        onClick={() => handleUpgrade(billingCycle)}
                        style={{ width: '100%', padding: '14px', borderRadius: '12px' }}
                    >
                        {hasEliteAccess ? t('active') : 'Zahlungspflichtig bestellen'}
                    </button>
                    {!hasEliteAccess && (
                        <p style={{ margin: '12px 0 0', color: hasEliteAccess ? '#64748b' : '#cbd5e1', fontSize: '0.76rem', lineHeight: 1.6 }}>
                            Preis inkl. gesetzlicher Umsatzsteuer, soweit anwendbar. Abonnement mit automatischer Verlängerung,
                            kündbar zum Ende des Abrechnungszeitraums. Es gelten{' '}
                            <Link to="/terms" style={{ color: '#a5b4fc' }}>AGB</Link>,{' '}
                            <Link to="/privacy" style={{ color: '#a5b4fc' }}>Datenschutz</Link> und{' '}
                            <Link to="/widerruf" style={{ color: '#a5b4fc' }}>Widerrufsbelehrung</Link>.
                        </p>
                    )}
                </motion.div>
            </div>

            <footer style={{ marginTop: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                {t('billingFooter')} <br />
                {t('stripeSecurity')}
            </footer>
        </div>
    );
};

export default Billing;
