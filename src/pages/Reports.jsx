import React from 'react';
import { useInvoice } from '../context/InvoiceContext';
import { Download, TrendingUp, TrendingDown, AlertCircle, Receipt, BarChart3 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Reports = () => {
    const { invoices, expenses, exportToCSV, STATUSES } = useInvoice();
    const { t } = useLanguage();

    // Calculations
    const totalIncome = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const profit = totalIncome - totalExpenses;

    const openInvoices = invoices.filter(inv => inv.status !== 'paid');
    const totalOpenAmount = openInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

    // Client turnover (Top 5)
    const clientTurnover = invoices.reduce((acc, inv) => {
        const name = inv.recipientName || 'Unbekannt';
        acc[name] = (acc[name] || 0) + (inv.total || 0);
        return acc;
    }, {});

    const topClients = Object.entries(clientTurnover)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    const formatCurr = (val) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val);

    return (
        <div className="page-container">
            <header className="page-header">
                <div>
                    <h1>{t('reports')} & {t('netProfit')}</h1>
                    <p>{t('overviewText')}</p>
                </div>
                <div className="actions">
                    <button className="primary-btn" onClick={() => exportToCSV(invoices, 'Finanz_Report')}>
                        <Download size={20} /> DATEV / CSV Export
                    </button>
                </div>
            </header>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#dcfce7', color: '#166534' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{t('revenue')}</h3>
                        <p>{formatCurr(totalIncome)}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                        <TrendingDown size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{t('expenses')}</h3>
                        <p>{formatCurr(totalExpenses)}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: profit >= 0 ? '#dcfce7' : '#fee2e2', color: profit >= 0 ? '#166534' : '#b91c1c' }}>
                        <Receipt size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{t('netProfit')}</h3>
                        <p>{formatCurr(profit)}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#fef9c3', color: '#854d0e' }}>
                        <AlertCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{t('overdue')}</h3>
                        <p>{formatCurr(totalOpenAmount)}</p>
                    </div>
                </div>
            </div>

            <div className="settings-grid">
                <div className="card">
                    <h3>{t('topClients')}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {topClients.map(([name, amount], i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>{name[0]}</div>
                                    <span style={{ fontWeight: '500' }}>{name}</span>
                                </div>
                                <span style={{ fontWeight: '600' }}>{formatCurr(amount)}</span>
                            </div>
                        ))}
                        {topClients.length === 0 && <p style={{ color: '#94a3b8', textAlign: 'center' }}>{t('noData')}</p>}
                    </div>
                </div>

                <div className="card">
                    <h3>{t('businessStats')}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                                <span>{t('paidInvoices')}</span>
                                <span>{invoices.filter(i => i.status === 'paid').length}</span>
                            </div>
                            <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${(invoices.filter(i => i.status === 'paid').length / invoices.length * 100) || 0}%`,
                                    height: '100%',
                                    background: 'var(--success)'
                                }}></div>
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                                <span>{t('overdueInvoices')}</span>
                                <span>{openInvoices.length}</span>
                            </div>
                            <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${(openInvoices.length / invoices.length * 100) || 0}%`,
                                    height: '100%',
                                    background: 'var(--warning)'
                                }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
