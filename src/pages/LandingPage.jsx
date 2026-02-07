import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check, FileText, TrendingUp, Globe, Shield, Smartphone, Palette, CreditCard, Zap } from 'lucide-react';
import { useLanguage, detectUserLanguage } from '../context/LanguageContext';
import { useStripeCheckout } from '../hooks/useStripeCheckout';

const LandingPage = () => {
    const { t, appLanguage, setAppLanguage } = useLanguage();
    const { redirectToCheckout } = useStripeCheckout();
    const [billingCycle, setBillingCycle] = React.useState('monthly'); // 'monthly' or 'yearly'
    const basePath = import.meta.env.BASE_URL;

    // Handle purchase button click
    const handlePurchase = (plan, cycle) => {
        // Map plan and billing cycle to Stripe Price IDs
        const priceIds = {
            standard: {
                monthly: import.meta.env.VITE_PRICE_STANDARD_MONTHLY,
                yearly: import.meta.env.VITE_PRICE_STANDARD_YEARLY,
            },
            premium: {
                monthly: import.meta.env.VITE_PRICE_PREMIUM_MONTHLY,
                yearly: import.meta.env.VITE_PRICE_PREMIUM_YEARLY,
            },
        };

        const priceId = priceIds[plan]?.[cycle];
        if (priceId) {
            redirectToCheckout(priceId);
        } else {
            alert('Price ID not found. Please configure Stripe products.');
        }
    };

    // Auto-detect language on first visit
    React.useEffect(() => {
        // Check if user has manually set a language preference before
        const landingLangPreference = localStorage.getItem('landing_language_set');

        // Only auto-detect if this is the first visit (no preference saved)
        if (!landingLangPreference) {
            const detectedLang = detectUserLanguage();
            console.log('🌍 Auto-detected browser language:', detectedLang);
            setAppLanguage(detectedLang);
        }
    }, []); // Run only once on mount

    // Save language preference when user manually changes it
    React.useEffect(() => {
        // Mark that user has set a language (either auto or manual)
        localStorage.setItem('landing_language_set', 'true');
    }, [appLanguage]);

    const features = [
        { icon: <FileText />, title: t('multiLanguageInvoices') || 'Multi-language Invoices', desc: t('multiLanguageInvoicesDesc') || 'Create invoices in 5 languages' },
        { icon: <TrendingUp />, title: t('financialTracking') || 'Financial Tracking', desc: t('financialTrackingDesc') || 'Track revenue, expenses, and profit' },
        { icon: <Globe />, title: t('industryTemplates') || 'Industry Templates', desc: t('industryTemplatesDesc') || 'Automotive and general business' },
        { icon: <Shield />, title: t('secureStorage') || 'Secure Storage', desc: t('secureStorageDesc') || 'Your data is safe and encrypted' },
        { icon: <Smartphone />, title: t('mobileResponsive') || 'Mobile Responsive', desc: t('mobileResponsiveDesc') || 'Works perfectly on all devices' },
        { icon: <Palette />, title: t('customBranding') || 'Custom Branding', desc: t('customBrandingDesc') || 'Add your logo and company details' },
        { icon: <CreditCard />, title: t('onlinePayments') || 'Online Payments', desc: t('onlinePaymentsDesc') || 'Accept payments via PayPal & Stripe' },
        { icon: <Zap />, title: t('fastEasy') || 'Fast & Easy', desc: t('fastEasyDesc') || 'Create invoices in seconds' }
    ];

    const pricingPlans = [
        {
            name: t('standard'),
            priceMonthly: '19€',
            priceYearly: '199€',
            savings: billingCycle === 'yearly' ? t('save17') || 'Save 17%' : null,
            badge: null,
            features: [
                t('unlimitedInvoices') || 'Unlimited invoices',
                t('basicReports') || 'Basic reports',
                t('emailSupport') || 'Email support',
                t('mobileAccess') || 'Mobile access',
                t('customBranding') || 'Custom branding'
            ],
            cta: t('getStarted'),
            plan: 'standard'
        },
        {
            name: t('premium'),
            priceMonthly: '49€',
            priceYearly: '499€',
            savings: billingCycle === 'yearly' ? t('save17') || 'Save 17%' : null,
            badge: t('mostPopular') || 'Most Popular',
            features: [
                t('everythingInStandard') || 'Everything in Standard',
                t('advancedReports') || 'Advanced analytics & reports',
                t('apiIntegrations') || 'API integrations (Stripe, PayPal)',
                t('prioritySupport') || 'Priority support',
                t('multiUser') || 'Multi-user access',
                t('customDomain') || 'Custom domain'
            ],
            cta: t('startPremium') || 'Start Premium',
            plan: 'premium'
        }
    ];

    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section className="landing-hero">
                <div className="hero-content">
                    <motion.h1
                        className="gradient-text hero-title"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        {t('heroTitle') || 'Professional Invoices in Seconds'}
                    </motion.h1>
                    <motion.p
                        className="hero-subtitle"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        {t('heroSubtitle') || 'The simplest way to manage invoices and finances for small businesses'}
                    </motion.p>
                    <motion.div
                        className="hero-cta"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                    >
                        <Link to="/register" className="cta-button large">
                            {t('getStarted')} <ArrowRight />
                        </Link>
                        <a href="#pricing" className="secondary-button large">
                            {t('pricing')}
                        </a>
                    </motion.div>
                </div>
                <motion.div
                    className="hero-visual"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                >
                    <div className="app-mockup">
                        <img
                            src={`${basePath}dashboard_mockup_1770332375000.png`}
                            alt="BayRechnung Dashboard"
                            className="mockup-image"
                        />
                    </div>
                </motion.div>
            </section>

            {/* Features Section */}
            <section className="landing-features" id="features">
                <div className="section-header">
                    <h2>{t('features') || 'Features'}</h2>
                    <p>{t('featuresSubtitle') || 'Everything you need to manage your business finances'}</p>
                </div>
                <div className="features-grid">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            className="feature-card"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div className="feature-icon">{feature.icon}</div>
                            <h3>{feature.title}</h3>
                            <p>{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* App Showcase Section */}
            <section className="app-showcase" style={{ padding: '6rem', background: '#1e293b' }}>
                <div className="section-header">
                    <h2>{t('appInAction') || 'See BayRechnung in Action'}</h2>
                    <p>{t('appInActionDesc') || 'Create professional invoices in just a few clicks'}</p>
                </div>

                <div className="showcase-grid" style={{ maxWidth: '1200px', margin: '3rem auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                    <motion.div
                        className="showcase-item"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="showcase-image-wrapper">
                            <img
                                src={`${basePath}invoice_editor_mockup_1770332390637.png`}
                                alt="Invoice Editor"
                                style={{ width: '100%', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}
                            />
                        </div>
                        <h3 style={{ marginTop: '1.5rem', fontSize: '1.5rem' }}>{t('easyInvoiceCreation') || '⚡ Easy Invoice Creation'}</h3>
                        <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>
                            {t('easyInvoiceCreationDesc') || 'Intuitive interface makes creating invoices fast and simple. Add items, calculate totals automatically.'}
                        </p>
                    </motion.div>

                    <motion.div
                        className="showcase-item"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="showcase-image-wrapper">
                            <img
                                src={`${basePath}invoice_pdf_mockup_1770332410769.png`}
                                alt="Professional PDF Output"
                                style={{ width: '100%', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}
                            />
                        </div>
                        <h3 style={{ marginTop: '1.5rem', fontSize: '1.5rem' }}>{t('professionalPDFs') || '📄 Professional PDFs'}</h3>
                        <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>
                            {t('professionalPDFsDesc') || 'Generate beautiful, print-ready invoices that impress your clients and meet legal requirements.'}
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="landing-pricing" id="pricing">
                <div className="section-header">
                    <h2>{t('pricing') || 'Pricing'}</h2>
                    <p>{t('pricingSubtitle') || 'Choose the plan that fits your needs'}</p>

                    {/* Billing Toggle */}
                    <div className="billing-toggle" style={{ marginTop: '2rem' }}>
                        <button
                            className={billingCycle === 'monthly' ? 'active' : ''}
                            onClick={() => setBillingCycle('monthly')}
                        >
                            {t('monthly') || 'Monthly'}
                        </button>
                        <button
                            className={billingCycle === 'yearly' ? 'active' : ''}
                            onClick={() => setBillingCycle('yearly')}
                        >
                            {t('yearly') || 'Yearly'}
                            <span className="save-badge">{t('save17') || 'Save 17%'}</span>
                        </button>
                    </div>
                </div>
                <div className="pricing-grid">
                    {pricingPlans.map((plan, index) => (
                        <motion.div
                            key={index}
                            className={`pricing-card ${plan.badge ? 'featured' : ''}`}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2 }}
                        >
                            {plan.badge && <div className="pricing-badge">{plan.badge}</div>}
                            <h3>{plan.name}</h3>
                            <div className="pricing-price">
                                <span className="price">
                                    {billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly}
                                </span>
                                <span className="period">
                                    {billingCycle === 'monthly' ? (t('perMonth') || '/ month') : (t('perYear') || '/ year')}
                                </span>
                            </div>
                            {plan.savings && billingCycle === 'yearly' && (
                                <div className="savings-badge">{plan.savings}</div>
                            )}
                            <ul className="pricing-features">
                                {plan.features.map((feature, i) => (
                                    <li key={i}>
                                        <Check size={18} color="#10b981" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => handlePurchase(plan.plan, billingCycle)}
                                className="cta-button w-full"
                                style={{ width: '100%' }}
                            >
                                {plan.cta}
                            </button>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <div className="logo-icon">B</div>
                        <h3>BayRechnung</h3>
                        <p>{t('footerTagline') || 'Professional invoicing made simple'}</p>
                    </div>
                    <div className="footer-links">
                        <div className="footer-column">
                            <h4>{t('product') || 'Product'}</h4>
                            <a href="#features">{t('features')}</a>
                            <a href="#pricing">{t('pricing')}</a>
                            <Link to="/login">{t('signIn')}</Link>
                            <Link to="/register">{t('signUp')}</Link>
                        </div>
                        <div className="footer-column">
                            <h4>{t('company') || 'Company'}</h4>
                            <a href="#">{t('about') || 'About'}</a>
                            <a href="#">{t('contact') || 'Contact'}</a>
                            <a href="#">{t('privacy') || 'Privacy'}</a>
                            <a href="#">{t('terms') || 'Terms'}</a>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2025 BayRechnung. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
