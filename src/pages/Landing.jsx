import React, { useState, useRef, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Command, CheckCircle, Smartphone, Globe, Shield, Zap, ArrowRight, Star, Play, ChevronDown, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import '../styles/auth-landing.css';

const Landing = () => {
    const { currentUser, signInAsDemo } = useAuth();
    const { t, appLanguage, setAppLanguage, LANGUAGES } = useLanguage();
    const [isDemoLoading, setIsDemoLoading] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    if (currentUser) return <Navigate to="/dashboard" replace />;

    const handleLiveDemo = async () => {
        setIsDemoLoading(true);
        const res = await signInAsDemo();
        if (!res.success) {
            console.error("Demo login failed:", res.error);
            alert(t('demoError'));
            setIsDemoLoading(false);
        }
    };

    return (
        <div className="landing-page">
            {/* --- Navbar --- */}
            <nav className="landing-nav">
                    <Link to="/" className="nav-brand" style={{ textDecoration: 'none' }}>
                        <img src="/logo.png" alt="BayFatura Logo" style={{ height: '72px', width: 'auto' }} />
                    </Link>
                <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X size={28} color="#fff" /> : <Menu size={28} color="#fff" />}
                </button>
                <div className={`nav-actions ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                    <a href="#features" className="nav-link-item" aria-label={t('features')}>{t('features')}</a>
                    <button onClick={handleLiveDemo} disabled={isDemoLoading} className="nav-login-btn" aria-label={t('liveDemo')}>
                        {isDemoLoading ? <span className="animate-spin" /> : t('liveDemo')}
                    </button>
                    <Link to="/login" className="landing-cta-nav" aria-label={t('getStartedFree')}>{t('getStartedFree')}</Link>
                    
                    {/* Language Selector */}
                    <select 
                        value={appLanguage} 
                        onChange={(e) => setAppLanguage(e.target.value)}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: '#e2e8f0',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            outline: 'none',
                            marginLeft: '8px'
                        }}
                        aria-label="Select language"
                    >
                        {LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code} style={{ background: '#1e293b' }}>
                                {lang.flag} {lang.label}
                            </option>
                        ))}
                    </select>
                </div>
            </nav>

            {/* --- Hero Section --- */}
            <header className="landing-hero-modern">
                <div className="hero-content-wrapper">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <span className="hero-badge">
                            <Zap size={14} /> {t('multiIndustrySupport')}
                        </span>
                        <h1 className="hero-display-title">
                            {t('heroTitle')} <br/>
                            <span className="text-gradient">{t('heroSubtitle')}</span>
                        </h1>
                        <p className="hero-description">
                            {t('heroDesc')}
                        </p>
                        <div className="hero-actions">
                            <Link to="/login" className="hero-btn">
                                {t('getStartedFree')} <ArrowRight size={20} />
                            </Link>
                            <button onClick={handleLiveDemo} disabled={isDemoLoading} className="hero-btn-alt">
                                {isDemoLoading ? <span className="animate-spin" /> : <Play size={18} />}
                                {t('tryInteractiveDemo')}
                            </button>
                        </div>
                    </motion.div>

                </div>
            </header>

            {/* --- Social Proof --- */}
            <section className="social-proof-section">
                <p className="proof-text">{t('trustedByGrowth')}</p>
                <div className="logo-ticker">
                    <div className="ticker-track">
                        {[1,2,3,4,5,6,7,8].map(i => (
                            <div key={i} className="logo-item">
                                <Shield size={24} /> <span>Enterprise</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- Bento Features --- */}
            <section id="features" className="landing-features-grid">
                <div className="container">
                    <div className="section-header-modern">
                        <span className="section-eyebrow">{t('features')}</span>
                        <h2 className="section-title">{t('everythingToScale')}</h2>
                    </div>
                    
                    <div className="features-container">
                        <FeatureCard 
                            icon={<Zap />} 
                            title={t('feature1Title')} 
                            desc={t('feature1Desc')}
                        />
                        <FeatureCard 
                            icon={<Shield />} 
                            title={t('feature5Title')} 
                            desc={t('feature5Desc')}
                        />
                        <FeatureCard 
                            icon={<Globe />} 
                            title={t('feature2Title')} 
                            desc={t('feature2Desc')}
                        />
                        <FeatureCard 
                            icon={<Smartphone />} 
                            title={t('feature3Title')} 
                            desc={t('feature3Desc')}
                        />
                        <FeatureCard 
                            icon={<CheckCircle />} 
                            title={t('feature4Title')} 
                            desc={t('feature4Desc')}
                        />
                    </div>
                </div>
            </section>

            {/* --- Product Showcase --- */}
            <section className="product-showcase-section">
                <div className="container">
                    <div className="section-header-modern center">
                        <span className="section-eyebrow">{t('eliteEcosystem')}</span>
                        <h2 className="section-title">{t('showcaseTitle')}</h2>
                        <p className="section-subtitle">{t('showcaseSubtitle')}</p>
                    </div>

                    <div className="showcase-items">
                        <ShowcaseItem 
                            title={t('showcaseDashboard')}
                            description={t('showcaseDashboardDesc')}
                            type="dashboard"
                            reverse={false}
                        />
                        <ShowcaseItem 
                            title={t('showcaseMatcher')}
                            description={t('showcaseMatcherDesc')}
                            type="matcher"
                            reverse={true}
                        />
                        <ShowcaseItem 
                            title={t('showcaseVision')}
                            description={t('showcaseVisionDesc')}
                            type="vision"
                            reverse={false}
                        />
                        <ShowcaseItem 
                            title={t('showcaseOracle')}
                            description={t('showcaseOracleDesc')}
                            type="oracle"
                            reverse={true}
                        />
                    </div>
                </div>
            </section>

            {/* --- Final CTA --- */}
            <section className="final-cta-section">
                <div className="cta-content">
                    <h2 className="cta-title">{t('readyToSimplify')}</h2>
                    <p className="cta-subtitle">{t('joinHundreds')}</p>
                    <div className="cta-btns">
                        <Link to="/login" className="cta-main-btn">{t('getStartedFree')}</Link>
                        <button onClick={handleLiveDemo} className="cta-sec-btn">{t('tryInteractiveDemo')}</button>
                    </div>
                </div>
            </section>

            <footer className="landing-footer-modern">
                <div className="footer-container">
                    <div className="footer-brand">
                        <img src="/logo.png" alt="BayFatura Logo" style={{ height: '48px', width: 'auto' }} />
                    </div>
                    <div className="footer-links">
                        <a href="#features">Features</a>
                        <Link to="/impressum">Impressum</Link>
                        <Link to="/privacy">Datenschutz</Link>
                        <Link to="/terms">AGB</Link>
                    </div>
                    <div className="footer-copyright">
                        © 2026 BayFatura. All rights reserved. | Made in PT
                    </div>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc }) => (
    <motion.div 
        whileHover={{ scale: 1.02 }}
        className="feature-card-modern"
    >
        <div className="card-icon">{icon}</div>
        <h3 className="card-title">{title}</h3>
        <p className="card-description">{desc}</p>
    </motion.div>
);

const ShowcaseItem = ({ title, description, type, reverse }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className={`showcase-item ${reverse ? 'reverse' : ''}`}
        >
            <div className="showcase-info">
                <h3 className="showcase-item-title">{title}</h3>
                <p className="showcase-item-desc">{description}</p>
                <div className="showcase-stats">
                    <div className="stat-pill">
                        <Zap size={14} /> <span>AI Powered</span>
                    </div>
                    <div className="stat-pill">
                        <CheckCircle size={14} /> <span>Elite Feature</span>
                    </div>
                </div>
            </div>
            <div className="showcase-visual">
                <div className={`mockup-container ${type}`}>
                    {type === 'dashboard' && <DashboardMockup />}
                    {type === 'matcher' && <MatcherMockup />}
                    {type === 'vision' && <VisionMockup />}
                    {type === 'oracle' && <OracleMockup />}
                    <div className="glow-aura"></div>
                </div>
            </div>
        </motion.div>
    );
};

const DashboardMockup = () => (
    <div className="ui-mockup dashboard">
        <div className="mockup-header">
            <div className="dot"></div><div className="dot"></div><div className="dot"></div>
        </div>
        <div className="mockup-body">
            <div className="grid-cards">
                <div className="m-card blue"></div>
                <div className="m-card green"></div>
                <div className="m-card red"></div>
                <div className="m-card orange"></div>
            </div>
            <div className="main-chart">
                <div className="bar-group">
                    <div className="bar" style={{height: '40%'}}></div>
                    <div className="bar" style={{height: '70%'}}></div>
                    <div className="bar" style={{height: '55%'}}></div>
                    <div className="bar" style={{height: '90%'}}></div>
                </div>
            </div>
            <div className="side-list">
                <div className="list-item"></div>
                <div className="list-item"></div>
                <div className="list-item"></div>
            </div>
        </div>
    </div>
);

const MatcherMockup = () => (
    <div className="ui-mockup matcher">
        <div className="magic-zone">
            <div className="magic-circles">
                <div className="c1"></div>
                <div className="c2"></div>
                <div className="c3"></div>
            </div>
            <div className="magic-icon"><Zap size={32} /></div>
            <div className="matching-lines">
                <div className="line l1"></div>
                <div className="line l2"></div>
                <div className="line l3"></div>
            </div>
        </div>
    </div>
);

const VisionMockup = () => (
    <div className="ui-mockup vision">
        <div className="phone-mock">
            <div className="scan-line"></div>
            <div className="receipt-sim">
                <div className="r-line"></div>
                <div className="r-line"></div>
                <div className="r-line w-50"></div>
            </div>
        </div>
        <div className="extraction-data">
            <div className="data-field"><span>Merchant:</span> <div className="f-box"></div></div>
            <div className="data-field"><span>Total:</span> <div className="f-box w-30"></div></div>
        </div>
    </div>
);

const OracleMockup = () => (
    <div className="ui-mockup oracle">
        <div className="forecast-graph">
            <svg viewBox="0 0 200 100" className="svg-graph">
                <path d="M0,80 Q50,20 100,60 T200,30" fill="none" stroke="url(#grad)" strokeWidth="3" />
                <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{stopColor: '#8b5cf6', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#ec4899', stopOpacity: 1}} />
                    </linearGradient>
                </defs>
            </svg>
            <div className="pulse-point" style={{left: '50%', top: '40%'}}></div>
        </div>
        <div className="oracle-insight">
            <div className="i-box"></div>
        </div>
    </div>
);

export default Landing;
