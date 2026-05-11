import React, { useState, useMemo } from 'react';
import { useInvoice } from '../context/InvoiceContext';
import { Download, TrendingUp, TrendingDown, AlertCircle, Receipt, BarChart3, Calendar } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Reports = () => {
    const { invoices, expenses, exportToCSV, STATUSES } = useInvoice();
    const { t, appLanguage } = useLanguage();

    // Calculations
    const totalIncome = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const profit = totalIncome - totalExpenses;

    const openInvoices = invoices.filter(inv => inv.status !== 'paid');
    const totalOpenAmount = openInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

    // Client turnover (Top 5)
    const clientTurnover = invoices.reduce((acc, inv) => {
        const name = inv.recipientName || t('unknown');
        acc[name] = (acc[name] || 0) + (inv.total || 0);
        return acc;
    }, {});

    const topClients = Object.entries(clientTurnover)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    const [activeTab, setActiveTab] = useState('financial');

    const formatCurr = (val) => new Intl.NumberFormat(appLanguage === 'tr' ? 'tr-TR' : appLanguage === 'en' ? 'en-US' : 'de-DE', { style: 'currency', currency: 'EUR' }).format(val);

    return (
        <div className="page-container">
            <header className="page-header">
                <div>
                    <h1>{t('reportsAndProfit')}</h1>
                    <p>{t('overviewText')}</p>
                </div>
                <div className="actions">
                    <button className="primary-btn" onClick={() => exportToCSV(invoices, t('financeReport'))}>
                        <Download size={20} /> {t('exportDatev')}
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

            <div className="card" style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
                    <h3
                        onClick={() => setActiveTab('financial')}
                        style={{
                            margin: 0, paddingBottom: '12px',
                            borderBottom: activeTab === 'financial' ? '2px solid var(--primary)' : '2px solid transparent',
                            color: activeTab === 'financial' ? 'var(--primary)' : 'var(--text-muted)',
                            cursor: 'pointer'
                        }}
                    >
                        {t('financialReports')}
                    </h3>
                    <h3
                        onClick={() => setActiveTab('daily')}
                        style={{
                            margin: 0, paddingBottom: '12px',
                            borderBottom: activeTab === 'daily' ? '2px solid var(--primary)' : '2px solid transparent',
                            color: activeTab === 'daily' ? 'var(--primary)' : 'var(--text-muted)',
                            cursor: 'pointer'
                        }}
                    >
                        {t('dailyReports')}
                    </h3>
                </div>

                {activeTab === 'financial' ? (
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
                                            width: `${(invoices.filter(i => i.status === 'paid').length / (invoices.length || 1) * 100)}%`,
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
                                            width: `${(openInvoices.length / (invoices.length || 1) * 100)}%`,
                                            height: '100%',
                                            background: 'var(--warning)'
                                        }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Daily Reports — Son 7 günün özeti
                    (() => {
                        const days = Array.from({ length: 7 }, (_, i) => {
                            const d = new Date();
                            d.setDate(d.getDate() - (6 - i));
                            const key = d.toISOString().slice(0, 10);
                            const dayInvoices = invoices.filter(inv => (inv.date || '').slice(0, 10) === key);
                            const dayExpenses = expenses.filter(exp => (exp.date || '').slice(0, 10) === key);
                            return {
                                label: d.toLocaleDateString(appLanguage === 'tr' ? 'tr-TR' : 'de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' }),
                                income: dayInvoices.reduce((s, inv) => s + (inv.total || 0), 0),
                                expense: dayExpenses.reduce((s, exp) => s + (exp.amount || 0), 0),
                                count: dayInvoices.length,
                            };
                        });
                        const maxVal = Math.max(...days.map(d => Math.max(d.income, d.expense)), 1);
                        return (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: '#64748b' }}>
                                    <Calendar size={18} />
                                        <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{t('last7Days')}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {days.map((day, i) => (
                                        <div key={i}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '5px', color: '#475569' }}>
                                                <span style={{ fontWeight: '600' }}>{day.label}</span>
                                                <span style={{ display: 'flex', gap: '16px' }}>
                                                    <span style={{ color: '#10b981' }}>+{formatCurr(day.income)}</span>
                                                    <span style={{ color: '#ef4444' }}>-{formatCurr(day.expense)}</span>
                                                </span>
                                            </div>
                                            <div style={{ position: 'relative', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${(day.income / maxVal) * 100}%`, background: '#10b981', borderRadius: '4px', opacity: 0.8 }} />
                                                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${(day.expense / maxVal) * 100}%`, background: '#ef4444', borderRadius: '4px', opacity: 0.4 }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {days.every(d => d.income === 0 && d.expense === 0) && (
                                    <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', marginTop: '16px' }}>
                                        <BarChart3 size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
                                        <p style={{ margin: 0, fontSize: '0.9rem' }}>{t('noData')}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })()
                )}
            </div>
        </div>
    );
};

export default Reports;
