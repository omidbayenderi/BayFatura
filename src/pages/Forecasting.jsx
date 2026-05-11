import React, { useState, useEffect } from 'react';
import { useInvoice } from '../context/InvoiceContext';
import { useLanguage } from '../context/LanguageContext';
import { usePanel } from '../context/PanelContext';
import { useAuth } from '../context/AuthContext';
import { analyzeFinancials } from '../lib/geminiService';
import { 
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
    Sparkles, 
    TrendingUp, 
    TrendingDown, 
    AlertTriangle, 
    Calculator, 
    Lightbulb, 
    BrainCircuit,
    Zap,
    Download,
    Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Forecasting = () => {
    const { invoices, expenses } = useInvoice();
    const { t, appLanguage } = useLanguage();
    const { showToast } = usePanel();
    const { isPro } = useAuth();
    
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);

    const handleRunAnalysis = async () => {
        if (!isPro) {
                        showToast(t('unlockFeatureMsg'), "info");
            return;
        }

        setIsAnalyzing(true);
        try {
            const historicalData = {
                invoices: invoices.map(i => ({ date: i.date, total: i.total })),
                expenses: expenses.map(e => ({ date: e.date, amount: e.amount }))
            };

            const result = await analyzeFinancials(historicalData);
            setAnalysisResult(result);
            showToast(t('analysisComplete'), "success");
        } catch (error) {
            console.error("Forecasting Error:", error);
            showToast(error.message, "error");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const formatCurr = (val) => new Intl.NumberFormat(appLanguage === 'tr' ? 'tr-TR' : 'de-DE', { style: 'currency', currency: 'EUR' }).format(val || 0);

    return (
        <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <header className="page-header" style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <motion.div 
                        initial={{ scale: 0.8, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        style={{ 
                            width: '64px', height: '64px', borderRadius: '18px', 
                            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                            boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.4)'
                        }}
                    >
                        <BrainCircuit size={36} />
                    </motion.div>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>{t('forecasting')}</h1>
                        <p style={{ color: '#64748b' }}>{t('forecastingDesc')}</p>
                    </div>
                </div>
                {!analysisResult && (
                    <button 
                        className="primary-btn" 
                        onClick={handleRunAnalysis}
                        disabled={isAnalyzing}
                        style={{ 
                            padding: '12px 28px', 
                            background: 'var(--primary)', 
                            gap: '10px',
                            boxShadow: '0 8px 16px -4px rgba(99, 102, 241, 0.3)',
                            borderRadius: '14px'
                        }}
                    >
                        {isAnalyzing ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                                <Sparkles size={20} />
                            </motion.div>
                        ) : <Sparkles size={20} />}
                        {isAnalyzing ? t('analyzing') : t('analyzeNow')}
                        {!isPro && <Lock size={14} style={{ marginLeft: '4px', opacity: 0.7 }} />}
                    </button>
                )}
            </header>

            <AnimatePresence mode="wait">
                {!analysisResult && !isAnalyzing && (
                    <motion.div 
                        key="ready"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="card glass-card" 
                        style={{ textAlign: 'center', padding: '80px 20px', border: '1px solid rgba(255,255,255,0.8)' }}
                    >
                        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                            <div style={{ 
                                width: '100px', height: '100px', borderRadius: '50%', background: '#f8fafc',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px',
                                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)'
                            }}>
                                <Zap size={48} color="var(--primary)" />
                            </div>
                            <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>{t('aiReady')}</h2>
                            <p style={{ color: '#64748b', marginBottom: '40px', fontSize: '1.1rem', lineHeight: 1.6 }}>
                                {t('aiIntro')}
                            </p>
                            <button 
                                className="primary-btn" 
                                onClick={handleRunAnalysis} 
                                style={{ margin: '0 auto', padding: '16px 40px', fontSize: '1.1rem', borderRadius: '16px' }}
                            >
                                <Sparkles size={20} style={{ marginRight: '8px' }} />
                                {t('startAiAnalysis')}
                            </button>
                        </div>
                    </motion.div>
                )}

                {isAnalyzing && (
                    <motion.div 
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="card glass-card" 
                        style={{ textAlign: 'center', padding: '100px 20px' }}
                    >
                        <motion.div 
                            animate={{ 
                                scale: [1, 1.15, 1],
                                opacity: [0.3, 1, 0.3],
                                filter: ["blur(0px)", "blur(2px)", "blur(0px)"]
                            }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                            style={{ color: 'var(--primary)', marginBottom: '32px' }}
                        >
                            <BrainCircuit size={100} style={{ margin: '0 auto' }} />
                        </motion.div>
                        <h3 style={{ fontSize: '1.8rem', marginBottom: '12px' }}>{t('aiThinking')}</h3>
                        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>{t('aiAnalystNote')}</p>
                    </motion.div>
                )}

                {analysisResult && (
                    <motion.div 
                        key="result"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="forecasting-dashboard"
                    >
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                            <div className="card glass-card" style={{ padding: '28px', borderLeft: '4px solid #10b981' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <TrendingUp size={24} />
                                    </div>
                                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#10b981', background: '#ecfdf5', padding: '4px 10px', borderRadius: '20px' }}>
                                        {t('nextMonth')}
                                    </span>
                                </div>
                                <h4 style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px' }}>{t('predictedRevenue')}</h4>
                                <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{formatCurr(analysisResult.forecast[0].predictedIncome)}</div>
                            </div>

                            <div className="card glass-card" style={{ padding: '28px', borderLeft: '4px solid #ef4444' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <TrendingDown size={24} />
                                    </div>
                                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#ef4444', background: '#fef2f2', padding: '4px 10px', borderRadius: '20px' }}>
                                        {t('nextMonth')}
                                    </span>
                                </div>
                                <h4 style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px' }}>{t('predictedExpense')}</h4>
                                <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{formatCurr(analysisResult.forecast[0].predictedExpense)}</div>
                            </div>

                            <div className="card glass-card" style={{ padding: '28px', borderLeft: '4px solid #f59e0b' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fff7ed', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Calculator size={24} />
                                    </div>
                                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#f59e0b', background: '#fff7ed', padding: '4px 10px', borderRadius: '20px' }}>
                                        ESTIMATE
                                    </span>
                                </div>
                                <h4 style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px' }}>{t('taxEstimate')}</h4>
                                <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{formatCurr(analysisResult.taxEstimate?.amount)}</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.1fr', gap: '32px' }}>
                            <div className="card glass-card" style={{ padding: '32px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                    <h3 style={{ fontSize: '1.3rem', fontWeight: '700' }}>{t('cashFlowForecast')}</h3>
                                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', fontWeight: '600' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#6366f1' }} /> {t('income')}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '3px', border: '2px dashed #ef4444' }} /> {t('expense')}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ width: '100%', height: '320px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={analysisResult.forecast} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                                            <XAxis 
                                                dataKey="month" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{fill: '#94a3b8', fontSize: 13, fontWeight: '500'}} 
                                                dy={10}
                                            />
                                            <YAxis 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{fill: '#94a3b8', fontSize: 13}} 
                                                tickFormatter={(val) => `€${val}`} 
                                            />
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                                                itemStyle={{ fontWeight: '700' }}
                                                formatter={(value) => formatCurr(value)}
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="predictedIncome" 
                                                stroke="#6366f1" 
                                                strokeWidth={4}
                                                fillOpacity={1} 
                                                fill="url(#colorIncome)" 
                                                name={t('income')} 
                                                animationDuration={2000}
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="predictedExpense" 
                                                stroke="#ef4444" 
                                                strokeWidth={2}
                                                strokeDasharray="6 6"
                                                fill="none" 
                                                name={t('expense')} 
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="card glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Lightbulb size={24} color="#f59e0b" fill="#fef3c7" />
                                    {t('aiInsights')}
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                                    {analysisResult.insights.map((insight, idx) => (
                                        <motion.div 
                                            key={idx}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.2 }}
                                            style={{ 
                                                padding: '20px', borderRadius: '16px', 
                                                background: insight.type === 'warning' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(99, 102, 241, 0.05)',
                                                border: insight.type === 'warning' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(99, 102, 241, 0.2)',
                                                display: 'flex', gap: '14px'
                                            }}
                                        >
                                            {insight.type === 'warning' ? <AlertTriangle size={20} color="#ef4444" /> : <Sparkles size={20} color="#6366f1" />}
                                            <p style={{ fontSize: '0.95rem', margin: 0, lineHeight: 1.5, color: '#334155', fontWeight: '500' }}>
                                                {insight.text}
                                            </p>
                                        </motion.div>
                                    ))}
                                </div>
                                <div style={{ 
                                    marginTop: '24px', padding: '20px', 
                                    background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', 
                                    borderRadius: '16px', border: '1px solid #e2e8f0'
                                }}>
                                    <p style={{ fontSize: '0.9rem', margin: 0, fontWeight: '600', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <TrendingUp size={16} /> Summary
                                    </p>
                                    <p style={{ fontSize: '0.9rem', margin: '8px 0 0', lineHeight: 1.5, color: '#475569' }}>
                                        {analysisResult.summary}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Forecasting;
