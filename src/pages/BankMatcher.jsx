import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Landmark, Upload, CheckCircle, XCircle, AlertCircle, Zap,
    RefreshCw, ChevronRight, FileText, Search, Check, X,
    TrendingUp, DollarSign, Clock, Sparkles, ArrowRight, Lock
} from 'lucide-react';
import { useInvoice } from '../context/InvoiceContext';
import { useLanguage } from '../context/LanguageContext';
import { usePanel } from '../context/PanelContext';
import { useAuth } from '../context/AuthContext';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import {
    confidenceColor,
    confidenceLabel,
} from '../lib/bankMatcher';

// ─── Sample data for demo ────────────────────────────────────────────────────
const DEMO_CSV = `Buchungsdatum;Auftraggeber / Beguenstigter;Verwendungszweck;Betrag
15.04.2024;Max Mustermann GmbH;Rechnung 2024-0042 vielen Dank;1250,00
16.04.2024;Sabine Mueller;RE 2024-0039;850,50
17.04.2024;Tech Solutions AG;Zahlung Angebot April;320,00
18.04.2024;Hans Werner KG;Rechnungsbegleichung 2024-0041;2100,00
19.04.2024;Daniel Fischer;April Rechnung;540,90`;

// ─── Sub-components ──────────────────────────────────────────────────────────

const ConfidenceBadge = ({ confidence, t }) => {
    const color = confidenceColor(confidence);
    const label = confidenceLabel(confidence, t);
    const icons = { high: Check, medium: AlertCircle, low: XCircle };
    const Icon = icons[confidence] || AlertCircle;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '3px 10px', borderRadius: '20px',
            background: `${color}18`, color, border: `1px solid ${color}30`,
            fontSize: '0.72rem', fontWeight: '700'
        }}>
            <Icon size={11} /> {label}
        </span>
    );
};

const ScoreBar = ({ score }) => (
    <div style={{ width: '80px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
            height: '100%', borderRadius: '3px', transition: 'width 0.8s ease',
            width: `${score}%`,
            background: score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444',
        }} />
    </div>
);

// ─── Main BankMatcher Component ───────────────────────────────────────────────
const BankMatcher = () => {
    const { invoices, updateInvoiceStatus } = useInvoice();
    const { t, appLanguage } = useLanguage();
    const { showToast } = usePanel();
    const { isPro } = useAuth();

    const [step, setStep] = useState('upload'); // upload | matching | results
    const [rawText, setRawText] = useState('');
    const [transactions, setTransactions] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [accepted, setAccepted] = useState({}); // suggestionIdx → true/false/null
    const [isDragging, setIsDragging] = useState(false);
    const [processing, setProcessing] = useState(false);

    const locale = appLanguage === 'tr' ? 'tr-TR' : appLanguage === 'en' ? 'en-US' : 'de-DE';
    const formatMoney = (val, currency = 'EUR') =>
        new Intl.NumberFormat(locale, { style: 'currency', currency }).format(val || 0);

    // ── File drop handler ──
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setRawText(ev.target.result);
        reader.readAsText(file, 'utf-8');
    }, []);

    // ── Run matcher ──
    const runMatcher = useCallback(async () => {
        if (!isPro) {
            showToast(t('unlockFeatureMsg') || "This feature is exclusive for ELITE users.", "info");
            return;
        }
        setProcessing(true);
        try {
            const textToProcess = rawText || DEMO_CSV;
            
            // FIX: Status is stored lowercase ('pending', not 'PENDING')
            const pendingInvoices = invoices
                .filter(inv => inv.status === 'pending' || inv.status === 'sent' || inv.status === 'overdue')
                .map(inv => ({
                    id: inv.id,
                    invoiceNumber: inv.invoiceNumber,
                    recipientName: inv.recipientName || inv.clientName || 'Unknown',
                    total: inv.total,
                    currency: inv.currency || 'EUR',
                    date: inv.date
                }));

            const analyzeBankStatement = httpsCallable(functions, 'analyzeBankStatement');
            const result = await analyzeBankStatement({
                csvData: textToProcess,
                existingInvoices: pendingInvoices
            });

            // Reconstruct the suggestions structure expected by the UI
            const { matches } = result.data;
            const uiSuggestions = matches.map(match => {
                const invoice = invoices.find(inv => inv.id === match.matchedInvoiceId);
                return {
                    transaction: {
                        date: match.transactionDate,
                        amount: match.transactionAmount,
                        reference: match.transactionDescription,
                        isCredit: match.transactionAmount > 0
                    },
                    invoice: invoice || null,
                    confidence: match.confidenceScore >= 80 ? 'high' : match.confidenceScore >= 50 ? 'medium' : 'low',
                    score: match.confidenceScore,
                    reason: match.reason
                };
            }).filter(sg => sg.invoice); // only keep those that actually matched an invoice

            // FIX: was split('\\n') (escaped literal) — should be split('\n') for real newline
            const lines = textToProcess.split('\n').filter(l => l.trim().length > 0);
            setTransactions(lines.slice(1).map(l => ({ isCredit: !l.includes('-') }))); // dummy structure for stats
            
            setSuggestions(uiSuggestions);
            setAccepted({});
            setStep('results');
        } catch (error) {
            console.error("AI Matcher error:", error);
            showToast(t('errorOccurred'), "error");
        } finally {
            setProcessing(false);
        }
    }, [rawText, invoices, isPro, showToast, t]);

    // ── Accept a match → mark invoice as paid ──
    const handleAccept = async (idx) => {
        const suggestion = suggestions[idx];
        if (!suggestion) return;
        try {
            await updateInvoiceStatus(suggestion.invoice.id, 'paid');
            setAccepted(prev => ({ ...prev, [idx]: 'accepted' }));
            showToast(`${suggestion.invoice.invoiceNumber} — ${t('markedAsPaid')}`, 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleReject = (idx) => {
        setAccepted(prev => ({ ...prev, [idx]: 'rejected' }));
    };

    // ── Stats ──
    const stats = useMemo(() => {
        const acceptedCount = Object.values(accepted).filter(v => v === 'accepted').length;
        const rejectedCount = Object.values(accepted).filter(v => v === 'rejected').length;
        const pendingCount = suggestions.length - acceptedCount - rejectedCount;
        const acceptedSum = suggestions
            .filter((_, i) => accepted[i] === 'accepted')
            .reduce((s, sg) => s + (sg.invoice.total || 0), 0);
        return { acceptedCount, rejectedCount, pendingCount, acceptedSum };
    }, [accepted, suggestions]);

    // ──────────────────────────────────────────────────────────────────────────
    return (
        <div className="page-container">
            {/* ── Header ── */}
            <header className="page-header">
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '44px', height: '44px', borderRadius: '14px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                            boxShadow: '0 4px 14px rgba(99,102,241,0.4)'
                        }}>
                            <Landmark size={22} />
                        </div>
                        {t('bankMatcher')}
                        <span style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontSize: '0.65rem', padding: '3px 10px', borderRadius: '20px', fontWeight: '800', letterSpacing: '0.5px' }}>
                            AI <Sparkles size={12} style={{ marginLeft: 2 }} />
                        </span>
                    </h1>
                    <p style={{ color: '#64748b' }}>{t('bankMatcherDesc')}</p>
                </div>
                {step === 'results' && (
                    <button className="secondary-btn" onClick={() => { setStep('upload'); setRawText(''); setSuggestions([]); }}>
                        <RefreshCw size={16} /> {t('startOver')}
                    </button>
                )}
            </header>

            {/* ── Step: Upload ── */}
            {step === 'upload' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    {/* How it works */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '14px', marginBottom: '28px'
                    }}>
                        {[
                            { step: '1', icon: Upload, label: t('stepUpload'), desc: t('stepUploadDesc'), color: '#3b82f6' },
                            { step: '2', icon: Sparkles, label: t('stepAI'), desc: t('stepAIDesc'), color: '#6366f1' },
                            { step: '3', icon: CheckCircle, label: t('stepConfirm'), desc: t('stepConfirmDesc'), color: '#10b981' },
                        ].map(({ step: s, icon: Icon, label, desc, color }) => (
                            <motion.div key={s} whileHover={{ y: -3 }} className="card"
                                style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', borderTop: `3px solid ${color}` }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Icon size={18} color={color} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '4px' }}>{label}</div>
                                    <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>{desc}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Drop Zone */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        style={{
                            border: `2px dashed ${isDragging ? '#6366f1' : '#cbd5e1'}`,
                            borderRadius: '20px', padding: '60px 40px', textAlign: 'center',
                            background: isDragging ? '#f5f3ff' : '#f8fafc',
                            transition: 'all 0.2s ease', cursor: 'pointer', marginBottom: '20px'
                        }}
                        onClick={() => document.getElementById('bank-file-input').click()}
                    >
                        <motion.div animate={{ y: isDragging ? -8 : 0 }} transition={{ type: 'spring', stiffness: 300 }}>
                            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: isDragging ? '#e0e7ff' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                <Upload size={32} color={isDragging ? '#6366f1' : '#94a3b8'} />
                            </div>
                        </motion.div>
                        <h3 style={{ margin: '0 0 8px', color: isDragging ? '#6366f1' : '#334155', fontSize: '1.1rem' }}>
                            {isDragging ? t('dropNow') : t('dropCSV')}
                        </h3>
                        <p style={{ margin: '0 0 16px', color: '#94a3b8', fontSize: '0.85rem' }}>
                            {t('dropCSVDesc')}
                        </p>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', background: '#e2e8f0', padding: '4px 12px', borderRadius: '20px' }}>
                            CSV · TXT · MT940
                        </span>
                        <input id="bank-file-input" type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={handleDrop} />
                    </div>

                    {/* Manual paste area */}
                    <div className="card" style={{ marginBottom: '20px' }}>
                        <label style={{ fontWeight: '700', fontSize: '0.85rem', display: 'block', marginBottom: '8px', color: '#64748b' }}>
                            {t('pasteCSV')}
                        </label>
                        <textarea
                            value={rawText}
                            onChange={e => setRawText(e.target.value)}
                            placeholder={DEMO_CSV}
                            style={{
                                width: '100%', height: '140px', fontFamily: 'monospace', fontSize: '0.78rem',
                                padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0',
                                resize: 'vertical', color: '#334155', background: '#f8fafc', lineHeight: 1.6,
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button
                            className="primary-btn"
                            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', minWidth: '200px', justifyContent: 'center' }}
                            onClick={runMatcher}
                            disabled={processing}
                        >
                            {processing ? (
                                <><RefreshCw size={18} className="animate-spin" /> {t('analyzing')}...</>
                            ) : (
                                <><Sparkles size={18} /> {t('runMatcher')} {!isPro && <Lock size={14} style={{ marginLeft: '4px', opacity: 0.7 }} />}</>
                            )}
                        </button>
                        <button className="secondary-btn" onClick={() => { setRawText(DEMO_CSV); }}>
                            {t('loadDemo')}
                        </button>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{t('demoHint')}</span>
                    </div>
                </motion.div>
            )}

            {/* ── Loading animation ── */}
            <AnimatePresence>
                {processing && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ textAlign: 'center', padding: '80px 20px' }}>
                        <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 24px' }}>
                            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid #e0e7ff', borderTopColor: '#6366f1', animation: 'spin 1s linear infinite' }} />
                            <div style={{ position: 'absolute', inset: '15px', borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#8b5cf6', animation: 'spin 0.7s linear infinite reverse' }} />
                            <div style={{ position: 'absolute', inset: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Sparkles size={20} color="#6366f1" />
                            </div>
                        </div>
                        <h3 style={{ margin: '0 0 8px' }}>{t('aiAnalyzing')}</h3>
                        <p style={{ color: '#64748b', margin: 0, fontSize: '0.85rem' }}>{t('aiAnalyzingDesc')}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Results ── */}
            {step === 'results' && !processing && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

                    {/* Stats bar */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                        {[
                            { label: t('txnsFound'), value: transactions.filter(t => t.isCredit).length, color: '#6366f1', icon: Landmark },
                            { label: t('matchesFound'), value: suggestions.length, color: '#3b82f6', icon: Zap },
                            { label: t('accepted'), value: stats.acceptedCount, color: '#10b981', icon: CheckCircle },
                            { label: t('totalMatched'), value: formatMoney(stats.acceptedSum), color: '#10b981', icon: TrendingUp },
                        ].map(({ label, value, color, icon: Icon }) => (
                            <motion.div key={label} whileHover={{ y: -3 }} className="card stat-card"
                                style={{ borderTop: `3px solid ${color}`, padding: '14px 16px' }}>
                                <div className="stat-icon" style={{ color, background: `${color}15` }}><Icon size={16} /></div>
                                <div>
                                    <h3 style={{ fontSize: '0.72rem', margin: '0 0 4px' }}>{label}</h3>
                                    <p className="stat-value" style={{ fontSize: '1.2rem', color }}>{value}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Suggestion Cards */}
                    {suggestions.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '80px 20px' }}>
                            <Search size={48} style={{ color: '#cbd5e1', display: 'block', margin: '0 auto 16px' }} />
                            <h2 style={{ marginBottom: '12px', color: '#64748b' }}>{t('noMatchesFound')}</h2>
                            <p style={{ color: '#94a3b8' }}>{t('noMatchesHint')}</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {suggestions.map((sg, idx) => {
                                const state = accepted[idx];
                                const isAccepted = state === 'accepted';
                                const isRejected = state === 'rejected';

                                return (
                                    <motion.div key={idx}
                                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        style={{
                                            borderRadius: '18px', overflow: 'hidden',
                                            border: isAccepted ? '2px solid #10b981' : isRejected ? '2px solid #ef444440' : '2px solid #e2e8f0',
                                            background: isAccepted ? '#f0fdf4' : isRejected ? '#fef9f9' : 'white',
                                            opacity: isRejected ? 0.6 : 1,
                                            transition: 'all 0.3s ease'
                                        }}>

                                        {/* Match header */}
                                        <div style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '14px 18px', background: isAccepted ? '#dcfce7' : '#f8fafc',
                                            borderBottom: '1px solid #f1f5f9'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <ConfidenceBadge confidence={sg.confidence} t={t} />
                                                <ScoreBar score={sg.score} />
                                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{sg.score}%</span>
                                            </div>
                                            {isAccepted ? (
                                                <span style={{ fontWeight: '700', color: '#10b981', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <CheckCircle size={16} /> {t('markedAsPaid')}
                                                </span>
                                            ) : isRejected ? (
                                                <span style={{ fontWeight: '700', color: '#ef4444', fontSize: '0.85rem' }}>✕ {t('ignored')}</span>
                                            ) : (
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button onClick={() => handleReject(idx)}
                                                        style={{ padding: '6px 14px', borderRadius: '10px', border: '1px solid #fecaca', background: '#fef2f2', color: '#ef4444', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}>
                                                        ✕ {t('ignore')}
                                                    </button>
                                                    <button onClick={() => handleAccept(idx)}
                                                        style={{ padding: '6px 14px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <Check size={14} /> {t('markAsPaid')}
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Match body: transaction ↔ invoice */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', padding: '16px 18px', alignItems: 'center' }}>
                                            {/* Bank transaction */}
                                            <div style={{ padding: '12px 14px', background: '#eff6ff', borderRadius: '12px' }}>
                                                <div style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                                                    <Landmark size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> {t('bankTransaction')}
                                                </div>
                                                <div style={{ fontWeight: '800', fontSize: '1.15rem', color: '#1e293b' }}>
                                                    {formatMoney(sg.transaction.amount)}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>{sg.transaction.date}</div>
                                                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                                                    {sg.transaction.reference}
                                                </div>
                                            </div>

                                            {/* Arrow */}
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px' }}>
                                                    <ArrowRight size={16} color="#6366f1" />
                                                </div>
                                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', textAlign: 'center' }}>MATCH</div>
                                            </div>

                                            {/* Invoice */}
                                            <div style={{ padding: '12px 14px', background: '#f0fdf4', borderRadius: '12px' }}>
                                                <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                                                    <FileText size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> {t('openInvoice')}
                                                </div>
                                                <div style={{ fontWeight: '800', fontSize: '1.15rem', color: '#1e293b' }}>
                                                    {formatMoney(sg.invoice.total, sg.invoice.currency)}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>{sg.invoice.invoiceNumber}</div>
                                                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                                                    {sg.invoice.recipientName}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Reasons */}
                                        <div style={{ padding: '8px 18px 12px', fontSize: '0.75rem', color: '#64748b', borderTop: '1px solid #f1f5f9' }}>
                                            <strong style={{ color: '#94a3b8' }}>{t('matchReason')}: </strong>{sg.reason}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Spin animation style */}
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
};

export default BankMatcher;
