import React, { useState } from 'react';
import { useInvoice } from '../context/InvoiceContext';
import { motion } from 'framer-motion';
import { FileText, TrendingUp, TrendingDown, Users, Clock, PlusCircle, Receipt, Sparkles, Lock, ArrowRightLeft, Database } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { usePanel } from '../context/PanelContext';
import DashboardChart from '../components/DashboardChart';
import QuickAddExpenseModal from '../components/QuickAddExpenseModal';
import PremiumModal from '../components/PremiumModal';
import LoadingPage from '../components/LoadingPage';
import { generateDemoData } from '../lib/demoDataGenerator';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="card stat-card"
        style={{ borderTop: `4px solid ${color}` }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
    >
        <div className="stat-icon" style={{ color: color, background: `${color}15` }}>
            <Icon size={24} />
        </div>
        <div className="stat-content">
            <h3>{title}</h3>
            <p className="stat-value">{value}</p>
        </div>
    </motion.div>
);

const Dashboard = () => {
    const { invoices, expenses, quotes, recurringTemplates, companyProfile, loading: invoicesLoading, saveInvoice, saveExpense, saveQuote, deleteInvoice, deleteExpense, deleteQuote, saveRecurringTemplate, deleteRecurringTemplate } = useInvoice();
    // Tüm verileri silen yardımcı fonksiyon (developer tool)
    const { currentUser, loading: authLoading, isPro } = useAuth();
    const { t, appLanguage } = useLanguage();
    const { showToast } = usePanel();

    // Bank Matcher & Demo Logic
    const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid');
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [isMatching, setIsMatching] = useState(false);
    const [matchedToday, setMatchedToday] = useState(0);
    const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);
    const [isClearing, setIsClearing] = useState(false);

    const handleClearData = async () => {
        if (!window.confirm(t('confirmDeleteAllData'))) return;
        setIsClearing(true);
        try {
            // Tüm faturaları, giderleri ve teklifleri sil
            await Promise.all([
                ...invoices.map(inv => deleteInvoice(inv.id)),
                ...expenses.map(exp => deleteExpense(exp.id)),
                ...quotes.map(q => deleteQuote(q.id)),
                ...recurringTemplates.map(rt => deleteRecurringTemplate(rt.id)),
            ]);
            showToast(t('allDataCleared') || 'Tüm veriler temizlendi', 'success');
        } catch (error) {
            console.error("Error clearing data:", error);
            showToast("Veri temizleme hatası", "error");
        }
        setIsClearing(false);
    };

    const handleGenerateDemoData = async () => {
        setIsGeneratingDemo(true);
        try {
            await generateDemoData(saveInvoice, saveExpense, saveQuote, saveRecurringTemplate);
            showToast(t('demoDataGenerated'), 'success');
            // Small delay to let states settle
            setTimeout(() => setIsGeneratingDemo(false), 1500);
        } catch (error) {
            console.error("Error generating demo data:", error);
            setIsGeneratingDemo(false);
        }
    };

    const handleMagicMatch = async () => {
        if (!isPro) {
            setShowPremiumModal(true);
            return;
        }
        
        if (unpaidInvoices.length === 0) return;

        setIsMatching(true);
        try {
            const { doc, updateDoc } = await import('firebase/firestore');
            const { db } = await import('../lib/firebase');
            
            // Match up to 3 for demo/speed or all of them
            const toMatch = unpaidInvoices.slice(0, 3);
            
            await Promise.all(toMatch.map(inv => 
                updateDoc(doc(db, 'invoices', inv.id), { status: 'paid' })
            ));

            setMatchedToday(toMatch.length);
            showToast(`${toMatch.length} ${t('invoicePaid')}`, 'success');
        } catch (error) {
            console.error("Magic match error:", error);
        } finally {
            setIsMatching(false);
        }
    };

    React.useEffect(() => {
        // Auto-generate demo data for anonymous demo users if dashboard is empty
        // This ensures the "Live Demo" lands on a pre-filled professional-looking dashboard
        if (currentUser?.isAnonymous && invoices.length === 0 && !invoicesLoading && !authLoading && !isGeneratingDemo) {
            handleGenerateDemoData();
        }
    }, [currentUser, invoices.length, invoicesLoading, authLoading, isGeneratingDemo]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return t('goodMorning');
        if (hour >= 12 && hour < 18) return t('goodAfternoon');
        if (hour >= 18 && hour < 22) return t('goodEvening');
        return t('goodNight');
    };

    const userName = currentUser?.name?.split(' ')[0] || companyProfile.owner.split(' ')[0];

    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const debts = invoices.filter(inv => inv.status !== 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0);
    const profit = totalRevenue - totalExpenses;

    const isProfit = profit >= 0;
    const profitColor = isProfit ? '#10b981' : '#ef4444';
    const ProfitIcon = isProfit ? TrendingUp : TrendingDown;

    const formatCurr = (val) => new Intl.NumberFormat(appLanguage === 'tr' ? 'tr-TR' : appLanguage === 'en' ? 'en-US' : 'de-DE', { style: 'currency', currency: 'EUR' }).format(val);

    const navigate = useNavigate();
    const [showQuickExpense, setShowQuickExpense] = React.useState(false);

    return (
        <div className="page-container">
            {invoicesLoading || authLoading ? (
                <div className="skeleton-dashboard">
                    <div className="skeleton skeleton-text" style={{ width: '200px', height: '32px', marginBottom: '8px' }} />
                    <div className="skeleton skeleton-text" style={{ width: '150px', height: '16px', marginBottom: '32px' }} />
                    <div className="stats-grid">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="skeleton skeleton-card" />
                        ))}
                    </div>
                    <div className="dashboard-main-grid">
                        <div className="skeleton skeleton-chart" />
                        <div className="skeleton skeleton-card" />
                    </div>
                </div>
            ) : (
                <>
            <header className="page-header">
                <div>
                    <h1>{getGreeting()}, {userName}</h1>
                    <p>{t('overviewText')}</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="secondary-btn" onClick={() => setShowQuickExpense(true)} style={{ color: '#ef4444', borderColor: '#ef4444' }}>
                        - {t('addExpense')}
                    </button>
                    <Link to="/new" className="primary-btn">
                        + {t('newInvoice')}
                    </Link>
                </div>
            </header>

            <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
            <QuickAddExpenseModal isOpen={showQuickExpense} onClose={() => setShowQuickExpense(false)} />

                <div className="stats-grid">
                <StatCard
                    title={t('revenue')}
                    value={formatCurr(totalRevenue)}
                    icon={TrendingUp}
                    color="#3b82f6"
                />
                <StatCard
                    title={t('netProfit')}
                    value={formatCurr(profit)}
                    icon={ProfitIcon}
                    color={profitColor}
                />
                <StatCard
                    title={t('expenses')}
                    value={formatCurr(totalExpenses)}
                    icon={Receipt}
                    color="#ef4444"
                />
                <StatCard
                    title={t('debts')}
                    value={formatCurr(debts)}
                    icon={TrendingDown}
                    color="#f59e0b"
                />
            </div>

            <div className="dashboard-main-grid" style={{ marginTop: '24px' }}>
                <DashboardChart
                    revenue={totalRevenue}
                    profit={profit}
                    expenses={totalExpenses}
                />
                
                <div className="card matcher-card">
                    <h3 className="card-header-flex">
                        <ArrowRightLeft size={20} color="#6366f1" /> 
                        {t('unmatchedTx')}
                    </h3>
                    
                    <div className="matcher-widget-content">
                        {matchedToday > 0 ? (
                            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="matcher-success">
                                <div className="matcher-success-count">{matchedToday}</div>
                                <p className="matcher-success-label">{t('matchesFound')}</p>
                            </motion.div>
                        ) : (
                            <>
                                <div className={`matcher-widget-icon ${isMatching ? 'matching' : ''}`}>
                                    <Sparkles size={32} color={isMatching ? '#a855f7' : '#6366f1'} />
                                </div>
                                <h2 className="matcher-pending-count">{unpaidInvoices.length}</h2>
                                <p className="matcher-pending-label">{t('pending')}</p>
                                
                                <button 
                                    className="matcher-btn"
                                    onClick={handleMagicMatch}
                                    disabled={isMatching || (isPro && unpaidInvoices.length === 0)}
                                >
                                    {isMatching ? t('processing') : t('magicMatchText')}
                                    {!isPro && <Lock size={12} className="lock-icon" />}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="recent-section">
                <div className="section-header-row">
                    <h2>{t('recentInvoices')}</h2>
                    <Link to="/archive" className="view-all-link">{t('viewAll')}</Link>
                </div>
                <div className="invoice-list card">
                    {invoices.length === 0 ? (
                        <div className="empty-state-lg">
                            <div className="empty-state-lg-icon">
                                <Database size={40} color="#4f46e5" />
                            </div>
                            <h2>
                                {t('emptyDashboardTitle')}
                            </h2>
                            <p>
                                {t('emptyDashboardDesc')}
                            </p>
                            <div className="empty-state-actions">
                                <button 
                                    className="secondary-btn btn-demo"
                                    onClick={handleGenerateDemoData}
                                    disabled={isGeneratingDemo}
                                >
                                    {isGeneratingDemo ? (
                                        <div className="animate-spin" />
                                    ) : (
                                        <>
                                            <Sparkles size={18} />
                                            {t('exploreWithDemo')}
                                        </>
                                    )}
                                </button>
                                <button className="primary-btn" onClick={() => navigate('/new')}>
                                    {t('newInvoice')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>{t('invoiceNumber')}</th>
                                    <th>{t('customer')}</th>
                                    <th>{t('date')}</th>
                                    <th>{t('total')}</th>
                                    <th>{t('status')}</th>
                                    <th>{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.slice(0, 5).map(inv => (
                                    <tr key={inv.id}>
                                        <td>{inv.invoiceNumber}</td>
                                        <td>{inv.recipientName}</td>
                                        <td>{new Date(inv.date).toLocaleDateString(appLanguage === 'tr' ? 'tr-TR' : appLanguage === 'en' ? 'en-US' : 'de-DE')}</td>
                                        <td className="tabular-nums">{new Intl.NumberFormat(appLanguage === 'tr' ? 'tr-TR' : appLanguage === 'en' ? 'en-US' : 'de-DE', { style: 'currency', currency: inv.currency || 'EUR' }).format(inv.total)}</td>
                                        <td><span className="badge success">{t(inv.status || 'paid')}</span></td>
                                        <td>
                                            <Link to={`/invoice/${inv.id}`} className="view-link">{t('open')}</Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {(invoices.length > 0 || expenses.length > 0) && (
                <div className="dev-clear-data-wrapper">
                    <button 
                        onClick={handleClearData} 
                        disabled={isClearing}
                        className="dev-clear-btn"
                    >
                        {isClearing ? t('deleting') : t('devClearData')}
                    </button>
                </div>
            )}
            </>
            )}
        </div>
    );
};

export default Dashboard;
