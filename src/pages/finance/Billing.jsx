import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { motion } from 'framer-motion';
import {
    Check, Star, Sparkles, TrendingUp, Users,
    Zap, Shield, Clock, FileSpreadsheet, Ghost, Crown
} from 'lucide-react';

const stripeLinks = {
    monthly: 'https://buy.stripe.com/aFa28q4fFfIS84P1HA2kw02',
    yearly: 'https://buy.stripe.com/8x24gyeUj2W61GrgCu2kw01',
    lifetime: 'https://buy.stripe.com/fZuaEWfYnfIS2Kv9a22kw00'
};

const Billing = () => {
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const [billingCycle, setBillingCycle] = useState('monthly');

    const hasEliteAccess = ['elite', 'premium', 'lifetime'].includes(currentUser?.plan) ||
        currentUser?.subscriptionType === 'lifetime' ||
        currentUser?.featureAccess === 'all';
    const isLifetime = currentUser?.subscriptionType === 'lifetime' || currentUser?.plan === 'lifetime';
    const isSubscriptionActive = hasEliteAccess && !isLifetime;

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

    const eliteIconColor = isSubscriptionActive ? 'var(--primary)' : '#fcd34d';
    const eliteTextColor = isSubscriptionActive ? '#1e293b' : 'white';

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
                            <Check size={18} color="#10b981" /> {t('upTo50Invoices')}
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
                        background: isSubscriptionActive ? 'var(--glass-white)' : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                        color: eliteTextColor,
                        border: '2px solid',
                        borderColor: isSubscriptionActive ? 'var(--primary)' : '#334155',
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
                        {isSubscriptionActive ? t('active') : t('recommended')}
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: eliteIconColor, fontWeight: '700', marginBottom: '8px' }}>
                            <Star size={18} fill={eliteIconColor} /> ELITE
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>
                            €{billingCycle === 'monthly' ? '9' : '77'}
                            <span style={{ fontSize: '1rem', color: isSubscriptionActive ? '#64748b' : '#94a3b8', fontWeight: '400' }}>
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
                        {isSubscriptionActive ? t('active') : t('upgradeToElite')}
                    </button>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.02 }}
                    style={{
                        padding: '32px',
                        borderRadius: '24px',
                        background: isLifetime ? 'var(--glass-white)' : 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)',
                        color: isLifetime ? '#1e293b' : '#451a03',
                        border: '2px solid',
                        borderColor: isLifetime ? 'var(--primary)' : '#b45309',
                        boxShadow: isLifetime ? 'none' : '0 25px 50px -12px rgba(245,158,11,0.2)',
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
                        background: isLifetime ? 'var(--primary)' : '#b45309',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '700'
                    }}>
                        {isLifetime ? t('active') : 'PREMIUM'}
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isLifetime ? 'var(--primary)' : '#b45309', fontWeight: '800', marginBottom: '8px' }}>
                            <Crown size={18} fill={isLifetime ? 'var(--primary)' : '#b45309'} /> {t('eliteLifetime')}
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '900' }}>
                            €299
                        </div>
                        <p style={{ fontSize: '0.85rem', color: isLifetime ? '#64748b' : '#78350f', marginTop: '8px', fontWeight: '600' }}>
                            {t('eliteLifetimeDesc')}
                        </p>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                        {[
                            t('forecasting'),
                            t('bankMatcher'),
                            t('teamManagementElite'),
                            `${t('products')} & ${t('customers')}`,
                            t('quotes'),
                            t('aiVatPrediction'),
                            t('unlimitedAndAdFree')
                        ].map(label => (
                            <li key={label} style={{ display: 'flex', gap: '12px', fontWeight: '600' }}>
                                <Check size={20} color={isLifetime ? '#10b981' : 'inherit'} />
                                <span>{label}</span>
                            </li>
                        ))}
                    </ul>

                    <button
                        className="primary-btn"
                        onClick={() => handleUpgrade('lifetime')}
                        style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '12px',
                            background: isLifetime ? 'transparent' : '#0f172a',
                            color: isLifetime ? '#16a34a' : 'white',
                            border: isLifetime ? '2px solid #16a34a' : 'none',
                            fontWeight: '700',
                            fontSize: '1rem'
                        }}
                    >
                        {isLifetime ? t('active') : t('getLifetimeBtn')}
                    </button>
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
