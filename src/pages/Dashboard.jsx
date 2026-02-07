import React from 'react';
import { useInvoice } from '../context/InvoiceContext';
import { motion } from 'framer-motion';
import { FileText, TrendingUp, TrendingDown, Users, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import DashboardChart from '../components/DashboardChart';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <motion.div
        className="stat-card"
        whileHover={{ y: -5 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
    >
        <div className="stat-icon" style={{ backgroundColor: color + '20', color: color }}>
            <Icon size={24} />
        </div>
        <div className="stat-info">
            <h3>{title}</h3>
            <p>{value}</p>
        </div>
    </motion.div>
);

const Dashboard = () => {
    const { invoices, expenses, companyProfile } = useInvoice();
    const { t } = useLanguage();

    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const profit = totalRevenue - totalExpenses;

    // Logic for profit/loss UI
    const isProfit = profit >= 0;
    const profitColor = isProfit ? '#10b981' : '#ef4444'; // Green or Red
    const ProfitIcon = isProfit ? TrendingUp : TrendingDown;
    const profitStatusText = isProfit ? t('inProfit') : t('inLoss');

    return (
        <div className="page-container">
            <header className="page-header">
                <div>
                    <h1>{t('welcome')}, {companyProfile.owner.split(' ')[0]}</h1>
                    <p>{t('overviewText')}</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Link to="/expenses" className="secondary-btn">
                        + {t('expenses')}
                    </Link>
                    <Link to="/new" className="primary-btn">
                        + {t('newInvoice')}
                    </Link>
                </div>
            </header>

            <div className="stats-grid">
                <StatCard
                    title={t('revenue')}
                    value={new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totalRevenue)}
                    icon={TrendingUp}
                    color="#3b82f6"
                />
                <StatCard
                    title={`${t('netProfit')} (${profitStatusText})`}
                    value={new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(profit)}
                    icon={ProfitIcon}
                    color={profitColor}
                />
                <StatCard
                    title={t('expenses')}
                    value={new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totalExpenses)}
                    icon={Clock}
                    color="#ef4444"
                />
            </div>

            <DashboardChart
                revenue={totalRevenue}
                profit={profit}
                expenses={totalExpenses}
            />

            <div className="recent-section">
                <h2>{t('recentInvoices')}</h2>
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
