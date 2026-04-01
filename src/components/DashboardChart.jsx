import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useInvoice } from '../context/InvoiceContext'; // Needed for real history calculation

const DashboardChart = ({ revenue, profit, expenses }) => {
    const { t } = useLanguage();
    const { invoices = [], expenses: expenseList = [] } = useInvoice();

    // 1. Calculate 6-month history properly for ALL metrics
    const getLast6MonthsData = () => {
        const today = new Date();
        const data = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthLabel = d.toLocaleString('default', { month: 'short' });

            // Filter invoices for this month (Revenue)
            const monthlyRevenue = invoices
                .filter(inv => {
                    const invDate = new Date(inv.date);
                    return invDate.getMonth() === d.getMonth() && invDate.getFullYear() === d.getFullYear();
                })
                .reduce((sum, inv) => sum + (inv.total || 0), 0);

            // Filter expenses for this month (Expenses)
            const monthlyExpenses = expenseList
                .filter(exp => {
                    const expDate = new Date(exp.date);
                    return expDate.getMonth() === d.getMonth() && expDate.getFullYear() === d.getFullYear();
                })
                .reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);

            // Calculate Profit
            const monthlyProfit = monthlyRevenue - monthlyExpenses;

            data.push({
                name: monthLabel,
                revenue: monthlyRevenue,
                expenses: monthlyExpenses,
                profit: monthlyProfit
            });
        }
        return data;
    };

    const historyData = getLast6MonthsData();

    // Normalize data for SVG path
    // Find absolute max value across all datasets to scale Y-axis properly
    const allValues = historyData.flatMap(d => [d.revenue, d.expenses, Math.abs(d.profit)]);
    const maxHistoryVal = Math.max(...allValues, 100);

    const chartHeight = 150;
    const chartWidth = 300; // viewBox width
    const padding = 20;

    const getX = (index) => (index / (historyData.length - 1)) * (chartWidth - 2 * padding) + padding;
    const getY = (value) => chartHeight - (value / maxHistoryVal) * (chartHeight - 2 * padding) - padding;

    // Generate Path String Helper
    const generatePath = (dataKey) => {
        return historyData.map((d, i) => `${getX(i)},${getY(d[dataKey])}`).join(' ');
    };

    const formatCurrency = (val) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

    // --- LEFT CHART DATA ---
    const maxVal = Math.max(revenue, Math.abs(profit), expenses, 1);
    const barData = [
        { label: t('revenue'), value: revenue, color: '#10b981', key: 'revenue' },
        { label: t('netProfit'), value: profit, color: '#3b82f6', key: 'profit' },
        { label: t('expenses'), value: expenses, color: '#ef4444', key: 'expenses' }
    ];

    // Chart Lines Config
    const lines = [
        { key: 'revenue', color: '#10b981', label: t('revenue') }, // Green
        { key: 'profit', color: '#3b82f6', label: t('netProfit') },  // Blue
        { key: 'expenses', color: '#ef4444', label: t('expenses') } // Red
    ];

    return (
        <div className="card dashboard-stats-container" style={{ marginBottom: '2rem', padding: '0', overflow: 'hidden' }}>

            <div className="split-layout" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>

                {/* --- LEFT: COMPARISON BARS (1/3) --- */}
                <div className="chart-section left-section" style={{ flex: '1 1 30%', minWidth: '280px', padding: '24px', borderRight: '1px solid #e2e8f0' }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: '#1e293b' }}>
                        {t('businessStats') || 'Business Statistics'}
                    </h3>

                    <div className="bars-container" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '200px', gap: '16px' }}>
                        {barData.map((item, index) => {
                            const heightPercent = Math.min((Math.abs(item.value) / maxVal) * 100, 100);
                            return (
                                <div key={item.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', flex: 1 }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: item.color, marginBottom: '6px' }}>
                                        {formatCurrency(item.value)}
                                    </span>
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${heightPercent}%` }}
                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                        style={{
                                            width: '40px',
                                            backgroundColor: item.color,
                                            borderRadius: '6px 6px 2px 2px',
                                            position: 'relative',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                    />
                                    <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '8px', fontWeight: '500' }}>
                                        {item.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* --- RIGHT: 6-MONTH TREND LINE (2/3) --- */}
                <div className="chart-section right-section" style={{ flex: '2 1 60%', minWidth: '300px', padding: '24px', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>
                            {t('revenueTrend') || '6-Month Trend'}
                        </h3>
                        {/* Legend */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {lines.map(line => (
                                <div key={line.key} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#64748b' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: line.color }}></span>
                                    {line.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ height: '200px', width: '100%', position: 'relative' }}>
                        {/* SVG Line Chart */}
                        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>

                            {/* Grid Lines (Background) */}
                            {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => (
                                <line
                                    key={i}
                                    x1={0}
                                    y1={chartHeight * tick}
                                    x2={chartWidth}
                                    y2={chartHeight * tick}
                                    stroke="#f1f5f9"
                                    strokeWidth="1"
                                />
                            ))}

                            {/* Render Lines for Each Metric */}
                            {lines.map((line, idx) => (
                                <React.Fragment key={line.key}>
                                    <motion.path
                                        d={`M ${generatePath(line.key)}`}
                                        fill="none"
                                        stroke={line.color}
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 1.5, ease: "easeInOut", delay: idx * 0.2 }}
                                    />
                                    {/* Dots */}
                                    {historyData.map((d, i) => (
                                        <circle
                                            key={i}
                                            cx={getX(i)}
                                            cy={getY(d[line.key])}
                                            r="3.5"
                                            fill="#fff"
                                            stroke={line.color}
                                            strokeWidth="2"
                                        />
                                    ))}
                                </React.Fragment>
                            ))}

                        </svg>

                        {/* X-Axis Labels */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '-20px', padding: '0 10px' }}>
                            {historyData.map((d, i) => (
                                <span key={i} style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                    {d.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default DashboardChart;
