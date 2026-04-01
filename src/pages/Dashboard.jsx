import React from 'react';
import { useInvoice } from '../context/InvoiceContext';
import { motion } from 'framer-motion';
import { FileText, TrendingUp, TrendingDown, Users, Clock, PlusCircle, Receipt } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import DashboardChart from '../components/DashboardChart';
import QuickAddExpenseModal from '../components/QuickAddExpenseModal';

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
    const { invoices, expenses, companyProfile } = useInvoice();
    const { t } = useLanguage();

    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const debts = invoices.filter(inv => inv.status !== 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0);
    const profit = totalRevenue - totalExpenses;

    const isProfit = profit >= 0;
    const profitColor = isProfit ? '#10b981' : '#ef4444';
    const ProfitIcon = isProfit ? TrendingUp : TrendingDown;

    const formatCurr = (val) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val);

    const navigate = useNavigate();
    const [showQuickExpense, setShowQuickExpense] = React.useState(false);

    return (
        <div className="page-container">
            <header className="page-header">
                <div>
                    <h1>{t('welcome')}, {companyProfile.owner.split(' ')[0]}</h1>
                    <p>{t('overviewText')}</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="secondary-btn" onClick={() => setShowQuickExpense(true)} style={{ color: '#ef4444', borderColor: '#ef4444' }}>
                        - {t('addExpense') || 'Ausgabe hinzufügen'}
                    </button>
                    <Link to="/new" className="primary-btn">
                        + {t('newInvoice')}
                    </Link>
                </div>
            </header>

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
                <div className="card">
                    <DashboardChart
                        revenue={totalRevenue}
                        profit={profit}
                        expenses={totalExpenses}
                    />
                </div>
            </div>

            <div className="recent-section" style={{ marginTop: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ margin: 0 }}>{t('recentInvoices')}</h2>
                    <Link to="/archive" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>Tümünü Gör</Link>
                </div>
                <div className="invoice-list card">
                    {invoices.length === 0 ? (
                        <div className="empty-state">
                            <p>{t('loading')}</p>
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
                                    <th>Aktion</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.slice(0, 5).map(inv => (
                                    <tr key={inv.id}>
                                        <td>{inv.invoiceNumber}</td>
                                        <td>{inv.recipientName}</td>
                                        <td>{new Date(inv.date).toLocaleDateString('de-DE')}</td>
                                        <td>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(inv.total)}</td>
                                        <td><span className="badge success">{t(inv.status || 'paid')}</span></td>
                                        <td>
                                            <Link to={`/invoice/${inv.id}`} style={{ color: 'var(--primary)' }}>Öffnen</Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
