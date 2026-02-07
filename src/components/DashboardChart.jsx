import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

const DashboardChart = ({ revenue, profit, expenses }) => {
    const { t } = useLanguage();

    // Find the max value to scale the bars
    const maxVal = Math.max(revenue, Math.abs(profit), expenses, 1);

    const chartData = [
        { label: t('revenue'), value: revenue, color: '#10b981', key: 'revenue' },
        { label: t('netProfit'), value: profit, color: '#3b82f6', key: 'profit' },
        { label: t('expenses'), value: expenses, color: '#ef4444', key: 'expenses' }
    ];

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0
        }).format(val);
    };

    return (
        <div className="card dashboard-chart-card" style={{ marginBottom: '2rem', minWidth: '0' }}>
            <div className="chart-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0 }}>{t('businessStats') || 'Business Statistics'}</h3>
                <div className="chart-legend">
                    {chartData.map(item => (
                        <div key={item.key} className="legend-item">
                            <span className="dot" style={{ backgroundColor: item.color }}></span>
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="chart-container" style={{
                height: '240px',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-around',
                padding: '20px 0',
                gap: 'clamp(8px, 3vw, 20px)'
            }}>
                {chartData.map((item, index) => {
                    const heightPercent = (Math.abs(item.value) / maxVal) * 100;
                    const isNegative = item.value < 0;

                    return (
                        <div key={item.key} className="chart-column" style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            height: '100%',
                            justifyContent: 'flex-end',
                            position: 'relative',
                            minWidth: '0'
                        }}>
                            {/* Bar Value Label */}
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 + index * 0.1 }}
                                style={{
                                    fontSize: 'clamp(0.65rem, 2vw, 0.8rem)',
                                    fontWeight: '700',
                                    marginBottom: '8px',
                                    color: item.color,
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {formatCurrency(item.value)}
                            </motion.span>

                            {/* The Bar */}
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${heightPercent}%` }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 100,
                                    damping: 15,
                                    delay: index * 0.1
                                }}
                                style={{
                                    width: '100%',
                                    maxWidth: '60px',
                                    backgroundColor: item.color,
                                    borderRadius: '8px 8px 4px 4px',
                                    boxShadow: `0 4px 12px ${item.color}40`,
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                {/* Subtle Shine Effect */}
                                <motion.div
                                    animate={{
                                        x: ['-100%', '200%']
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "linear",
                                        repeatDelay: 3
                                    }}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '40%',
                                        height: '100%',
                                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                                        transform: 'skewX(-20deg)'
                                    }}
                                />
                            </motion.div>

                            {/* Label underneath */}
                            <span style={{
                                marginTop: '12px',
                                fontSize: '0.75rem',
                                color: '#64748b',
                                fontWeight: '600'
                            }}>
                                {item.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DashboardChart;
