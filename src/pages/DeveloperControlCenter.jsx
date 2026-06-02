import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Cpu, Users, Zap, Shield, Activity, Database, Globe,
    Settings, Crown, Terminal, Radio, Server,
    Lock, Search, X, RefreshCw, Mail, Trash2, AlertTriangle, Gift, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { collection, query, getDocs, doc, updateDoc, onSnapshot, addDoc, serverTimestamp, deleteDoc, writeBatch, orderBy, limit } from 'firebase/firestore';
import { db, functions } from '../lib/firebase';
import { httpsCallable } from 'firebase/functions';

const AGENT_META = {
    conversion:  { emoji: '💰', label: 'Conversion',  color: '#6366f1', desc: 'Free limit → Elite ikna' },
    churn:       { emoji: '🛡️', label: 'Churn',       color: '#f59e0b', desc: '7 gün sessiz Elite uyarı' },
    onboarding:  { emoji: '🚀', label: 'Onboarding',  color: '#10b981', desc: '24s kayıt, fatura yok' },
    winback:     { emoji: '🔄', label: 'Win-back',    color: '#8b5cf6', desc: 'Elite düşen → geri kazan' },
};

const AgentControlCenter = () => {
    const [logs, setLogs] = React.useState([]);
    const [runs, setRuns] = React.useState([]);
    const [triggering, setTriggering] = React.useState(null);
    const [triggerResult, setTriggerResult] = React.useState(null);

    React.useEffect(() => {
        const unsubLogs = onSnapshot(
            query(collection(db, 'agent_logs'), orderBy('sentAt', 'desc'), limit(20)),
            snap => setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        );
        const unsubRuns = onSnapshot(
            query(collection(db, 'agent_runs'), orderBy('runAt', 'desc'), limit(5)),
            snap => setRuns(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        );
        return () => { unsubLogs(); unsubRuns(); };
    }, []);

    const handleTrigger = async (agentType) => {
        setTriggering(agentType);
        setTriggerResult(null);
        try {
            const fn = httpsCallable(functions, 'triggerAgent');
            const res = await fn({ agentType });
            setTriggerResult({ type: agentType, success: true, result: res.data.result });
        } catch (err) {
            setTriggerResult({ type: agentType, success: false, error: err.message });
        } finally {
            setTriggering(null);
        }
    };

    const lastRun = runs[0];
    const totalSent = logs.filter(l => l.status === 'sent').length;
    const totalErrors = logs.filter(l => l.status === 'error').length;

    return (
        <div className="dcc-card" style={{ padding: '24px' }}>
            <h4 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: '#6366f1' }}>
                <Cpu size={18} color="#6366f1" /> 🤖 AGENT TEAM — GROWTH ENGINE
            </h4>

            {/* Son çalışma özeti */}
            {lastRun && (
                <div style={{ background: '#0d1117', border: '1px solid #6366f130', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', fontSize: '0.72rem' }}>
                    <span style={{ color: '#555' }}>Son çalışma: </span>
                    <span style={{ color: '#94a3b8' }}>{lastRun.runAt?.toDate?.()?.toLocaleString('tr-TR') || '—'}</span>
                    {lastRun.results && (
                        <span style={{ marginLeft: '12px', color: '#6366f1' }}>
                            {Object.entries(lastRun.results).map(([k, v]) =>
                                `${AGENT_META[k]?.emoji || ''} ${v.contacted || 0} gönderildi`
                            ).join(' · ')}
                        </span>
                    )}
                </div>
            )}

            {/* Agent kartları + tetikleme */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                {Object.entries(AGENT_META).map(([type, meta]) => {
                    const agentLogs = logs.filter(l => l.agentType === type);
                    const sent = agentLogs.filter(l => l.status === 'sent').length;
                    const isTriggering = triggering === type;
                    return (
                        <div key={type} style={{ background: '#111', borderRadius: '12px', border: `1px solid ${meta.color}25`, padding: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                <div>
                                    <div style={{ fontSize: '0.72rem', fontWeight: '700', color: meta.color }}>{meta.emoji} {meta.label}</div>
                                    <div style={{ fontSize: '0.62rem', color: '#555', marginTop: '2px' }}>{meta.desc}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1rem', fontWeight: '800', color: meta.color }}>{sent}</div>
                                    <div style={{ fontSize: '0.6rem', color: '#555' }}>gönderildi</div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleTrigger(type)}
                                disabled={!!triggering}
                                style={{
                                    width: '100%', padding: '7px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: '700',
                                    background: isTriggering ? `${meta.color}30` : '#0a0a0a',
                                    border: `1px solid ${meta.color}40`, color: meta.color,
                                    cursor: triggering ? 'not-allowed' : 'pointer', opacity: triggering && !isTriggering ? 0.4 : 1,
                                }}
                            >
                                {isTriggering ? '⏳ ÇALIŞIYOR...' : '▶ MANUEL ÇALIŞTIR'}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Tetikleme sonucu */}
            {triggerResult && (
                <div style={{
                    padding: '10px 14px', borderRadius: '10px', fontSize: '0.72rem', marginBottom: '16px',
                    background: triggerResult.success ? '#10b98115' : '#ef444415',
                    border: `1px solid ${triggerResult.success ? '#10b98130' : '#ef444430'}`,
                    color: triggerResult.success ? '#10b981' : '#ef4444',
                }}>
                    {triggerResult.success
                        ? `✅ ${AGENT_META[triggerResult.type]?.label}: ${triggerResult.result?.contacted || 0} gönderildi, ${triggerResult.result?.skipped || 0} atlandı`
                        : `❌ Hata: ${triggerResult.error}`}
                </div>
            )}

            {/* Son loglar */}
            <div style={{ fontSize: '0.7rem', color: '#555', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>SON AKSİYONLAR</span>
                <span style={{ color: '#10b981' }}>{totalSent} gönderildi · <span style={{ color: '#ef4444' }}>{totalErrors} hata</span></span>
            </div>
            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {logs.length === 0 && (
                    <div style={{ color: '#333', fontSize: '0.72rem', textAlign: 'center', padding: '20px' }}>
                        Henüz agent aksiyonu yok. Manuel çalıştır veya yarınki otomatik çalışmayı bekle.
                    </div>
                )}
                {logs.map(log => {
                    const meta = AGENT_META[log.agentType] || { emoji: '🤖', color: '#666' };
                    return (
                        <div key={log.id} style={{
                            background: '#0a0a0a', borderRadius: '8px', padding: '8px 12px',
                            display: 'flex', gap: '10px', alignItems: 'center',
                            border: `1px solid ${log.status === 'sent' ? '#10b98115' : log.status === 'error' ? '#ef444415' : '#222'}`,
                        }}>
                            <span style={{ fontSize: '0.8rem' }}>{meta.emoji}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <span style={{ color: meta.color, fontSize: '0.65rem', fontWeight: '700' }}>{log.agentName || log.agentType}</span>
                                    <span style={{
                                        fontSize: '0.6rem', padding: '1px 6px', borderRadius: '4px',
                                        background: log.status === 'sent' ? '#10b98120' : log.status === 'error' ? '#ef444420' : '#22222230',
                                        color: log.status === 'sent' ? '#10b981' : log.status === 'error' ? '#ef4444' : '#666',
                                    }}>{log.status}</span>
                                </div>
                                <div style={{ color: '#444', fontSize: '0.62rem', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {log.email} {log.subject ? `· ${log.subject}` : log.reason ? `· ${log.reason}` : ''}
                                </div>
                            </div>
                            <span style={{ color: '#333', fontSize: '0.6rem', flexShrink: 0 }}>
                                {log.sentAt?.toDate?.()?.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) || ''}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const DCC = () => {
    const { currentUser } = useAuth();
    const [activeAgent, setActiveAgent] = useState('Vision');
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [confirmAction, setConfirmAction] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 10;
    
    // DB Recovery Tool States
    const [orphanStats, setOrphanStats] = useState([]);
    const [isMigrating, setIsMigrating] = useState(false);

    // LocalStorage Recovery State
    const [localCache, setLocalCache] = useState({ invoices: 0, quotes: 0, expenses: 0 });
    const [isSyncing, setIsSyncing] = useState(false);

    // Grant Elite State
    const [grantDuration, setGrantDuration] = useState(30);
    const [grantReason, setGrantReason] = useState('reward');
    const [isGranting, setIsGranting] = useState(false);
    const [grantResult, setGrantResult] = useState(null);

    const handleSyncAuthUsers = async () => {
        setIsSyncing(true);
        try {
            const syncFn = httpsCallable(functions, 'syncAllAuthUsers');
            const result = await syncFn();
            const { totalAuthUsers, createdMissingProfiles } = result.data;
            alert(`Sync complete! Checked ${totalAuthUsers} accounts in Firebase Auth. Created ${createdMissingProfiles} missing Firestore profiles.`);
        } catch (error) {
            console.error("Sync Auth Users Error:", error);
            alert("Sync failed: " + error.message);
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        // Check localStorage for pre-Firebase migration data
        const lInvoices = JSON.parse(localStorage.getItem('bay_invoices') || '[]');
        const lQuotes = JSON.parse(localStorage.getItem('bay_quotes') || '[]');
        const lExpenses = JSON.parse(localStorage.getItem('bay_expenses') || '[]');
        setLocalCache({
            invoices: lInvoices.length,
            quotes: lQuotes.length,
            expenses: lExpenses.length
        });

        const fetchOrphans = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'invoices'));
                const tenantCounts = {};
                snapshot.forEach(doc => {
                    const tid = doc.data().tenantId || 'none';
                    tenantCounts[tid] = (tenantCounts[tid] || 0) + 1;
                });
                
                const quoteSnap = await getDocs(collection(db, 'quotes'));
                const quoteCounts = {};
                quoteSnap.forEach(doc => {
                    const tid = doc.data().tenantId || 'none';
                    quoteCounts[tid] = (quoteCounts[tid] || 0) + 1;
                });
                
                const combined = Object.keys(tenantCounts).map(tid => ({
                    tenantId: tid,
                    invoiceCount: tenantCounts[tid] || 0,
                    quoteCount: quoteCounts[tid] || 0,
                    isCurrent: tid === currentUser?.tenantId
                }));
                
                setOrphanStats(combined);
            } catch (err) {
                console.error("Fetch orphans error:", err);
            }
        };
        fetchOrphans();
    }, [currentUser, isMigrating]);

    const handleClaimData = async (oldTenantId) => {
        if (!window.confirm(`Are you sure you want to claim and merge all data from tenant ID "${oldTenantId}" into your active account? This will update all invoices and quotes to your current active ID.`)) return;
        setIsMigrating(true);
        try {
            const batch = writeBatch(db);
            
            // 1. Migrate invoices
            const invSnap = await getDocs(collection(db, 'invoices'));
            let count = 0;
            invSnap.forEach(d => {
                if (d.data().tenantId === oldTenantId) {
                    batch.update(doc(db, 'invoices', d.id), { tenantId: currentUser.tenantId, userId: currentUser.uid });
                    count++;
                }
            });
            
            // 2. Migrate quotes
            const quoSnap = await getDocs(collection(db, 'quotes'));
            quoSnap.forEach(d => {
                if (d.data().tenantId === oldTenantId) {
                    batch.update(doc(db, 'quotes', d.id), { tenantId: currentUser.tenantId, userId: currentUser.uid });
                    count++;
                }
            });
            
            // 3. Migrate expenses
            const expSnap = await getDocs(collection(db, 'expenses'));
            expSnap.forEach(d => {
                if (d.data().tenantId === oldTenantId) {
                    batch.update(doc(db, 'expenses', d.id), { tenantId: currentUser.tenantId, userId: currentUser.uid });
                    count++;
                }
            });
            
            await batch.commit();
            alert(`Success! Successfully migrated ${count} records to your active account.`);
        } catch (err) {
            console.error("Migration error:", err);
            alert("Migration failed: " + err.message);
        } finally {
            setIsMigrating(false);
        }
    };
    
    const handleLocalStorageMigration = async () => {
        if (!window.confirm('Bu işlem tarayıcınızdaki eski (yerel) faturaları Firebase canlı veritabanına yükleyecektir. Onaylıyor musunuz?')) return;
        setIsMigrating(true);
        try {
            const lInvoices = JSON.parse(localStorage.getItem('bay_invoices') || '[]');
            const lQuotes = JSON.parse(localStorage.getItem('bay_quotes') || '[]');
            const lExpenses = JSON.parse(localStorage.getItem('bay_expenses') || '[]');
            
            let count = 0;
            // Invoices cannot be batched easily if we use addDoc, so we iterate
            for (const inv of lInvoices) {
                const { id, ...data } = inv;
                await addDoc(collection(db, 'invoices'), { ...data, tenantId: currentUser.tenantId, userId: currentUser.uid });
                count++;
            }
            for (const quo of lQuotes) {
                const { id, ...data } = quo;
                await addDoc(collection(db, 'quotes'), { ...data, tenantId: currentUser.tenantId, userId: currentUser.uid });
                count++;
            }
            for (const exp of lExpenses) {
                const { id, ...data } = exp;
                await addDoc(collection(db, 'expenses'), { ...data, tenantId: currentUser.tenantId, userId: currentUser.uid });
                count++;
            }
            
            // Clear local storage so they don't migrate twice
            localStorage.removeItem('bay_invoices');
            localStorage.removeItem('bay_quotes');
            localStorage.removeItem('bay_expenses');
            setLocalCache({ invoices: 0, quotes: 0, expenses: 0 });
            
            alert(`Başarılı! Toplam ${count} eski kayıt Firebase veritabanına aktarıldı.`);
        } catch (err) {
            console.error("Local migration error:", err);
            alert("Aktarım hatası: " + err.message);
        } finally {
            setIsMigrating(false);
        }
    };

    useEffect(() => {
        const q = query(collection(db, 'users'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTenants(usersList);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const agentStats = [
        { name: 'Vision Agent', status: 'Online', health: 98, latency: '420ms', color: '#10b981' },
        { name: 'Bank Matcher', status: 'Online', health: 100, latency: '150ms', color: '#8b5cf6' },
        { name: 'Financial Oracle', status: 'Idle', health: 100, latency: '890ms', color: '#3b82f6' },
        { name: 'Mail Engine', status: 'Online', health: 95, latency: '1.2s', color: '#f59e0b' }
    ];

    const handleAction = async (userId, updates) => {
        setIsUpdating(true);
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, updates);
            
            await addDoc(collection(db, 'audit_logs'), {
                action: Object.keys(updates).join(', '),
                targetUserId: userId,
                targetUserEmail: tenants.find(t => t.id === userId)?.email || 'unknown',
                adminEmail: currentUser?.email,
                changes: updates,
                timestamp: serverTimestamp()
            });
            
            setTimeout(() => {
                setIsUpdating(false);
                setSelectedTenant(null);
            }, 500);
        } catch (error) {
            console.error("DCC Update Error:", error);
            alert("Error updating user: " + error.message);
            setIsUpdating(false);
        }
    };

    const handleGrantElite = async () => {
        if (!selectedTenant) return;
        setIsGranting(true);
        setGrantResult(null);
        try {
            const grantFn = httpsCallable(functions, 'grantElitePlan');
            const res = await grantFn({
                targetUserId: selectedTenant.id,
                durationDays: grantDuration,
                reason: grantReason,
            });
            const expiresAt = res.data?.planExpiresAt;
            setGrantResult({
                success: true,
                msg: grantDuration === 0
                    ? `✅ Süresiz Elite verildi.`
                    : `✅ Elite verildi — ${new Date(expiresAt).toLocaleDateString('tr-TR')} tarihinde sona erer.`,
            });
            // Seçili kullanıcıyı güncelle
            setSelectedTenant(prev => ({ ...prev, plan: 'elite', subscriptionType: 'granted', planExpiresAt: expiresAt }));
            setTenants(prev => prev.map(t => t.id === selectedTenant.id ? { ...t, plan: 'elite' } : t));
        } catch (err) {
            setGrantResult({ success: false, msg: '❌ Hata: ' + (err.message || 'Bilinmeyen hata') });
        } finally {
            setIsGranting(false);
        }
    };

    const handleDelete = async (userId) => {
        setIsUpdating(true);
        try {
            await deleteDoc(doc(db, 'users', userId));
            setDeleteTarget(null);
        } catch (error) {
            console.error("Delete Error:", error);
            alert("Error deleting user: " + error.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const isOwner = ['support@bayfatura.com', 'omidbayenderi@gmail.com'].includes(currentUser?.email);

    const filteredTenants = tenants.filter(t => 
        t.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOwner && process.env.NODE_ENV === 'production') {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#000', color: '#fff' }}>
                <div style={{ textAlign: 'center' }}>
                    <Lock size={48} color="#ef4444" style={{ margin: '0 auto 20px' }} />
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Access Denied</h1>
                    <p style={{ color: '#666' }}>SaaS Owner Authentication Required.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dcc-container">
            {/* Command Modal */}
            <AnimatePresence>
                {selectedTenant && (
                    <div className="modal-overlay">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '480px', boxShadow: '0 0 50px rgba(16, 185, 129, 0.1)' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ background: '#10b98120', padding: '8px', borderRadius: '10px' }}>
                                        <Terminal size={18} color="#10b981" />
                                    </div>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>COMMAND_HUB</h2>
                                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#666' }}>USER_ID: {selectedTenant.id}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedTenant(null)} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div style={{ marginBottom: '32px' }}>
                                <div style={{ fontSize: '0.8rem', color: '#444', marginBottom: '8px', textTransform: 'uppercase' }}>Selected Account</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#111', padding: '16px', borderRadius: '16px', border: '1px solid #222' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                        {selectedTenant.name?.[0] || 'U'}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {selectedTenant.name} 
                                            <span style={{ fontSize: '0.65rem', background: '#10b98120', color: '#10b981', padding: '2px 6px', borderRadius: '4px' }}>{selectedTenant.plan?.toUpperCase()}</span>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                            <Mail size={12} /> {selectedTenant.email}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginBottom: '12px' }}>OVERRIDE SUBSCRIPTION PLAN (REAL-TIME)</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                        {['standard', 'premium', 'elite'].map(p => (
                                            <button 
                                                key={p}
                                                onClick={() => handleAction(selectedTenant.id, { plan: p })}
                                                disabled={isUpdating}
                                                style={{ 
                                                    background: selectedTenant.plan === p ? '#10b98120' : '#111',
                                                    border: `1px solid ${selectedTenant.plan === p ? '#10b981' : '#222'}`,
                                                    color: selectedTenant.plan === p ? '#10b981' : '#666',
                                                    padding: '12px 4px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer',
                                                    textTransform: 'uppercase'
                                                }}
                                            >
                                                {p === 'standard' ? 'FREE' : p}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ gridColumn: 'span 2', marginTop: '10px' }}>
                                    <label style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginBottom: '12px' }}>ACCOUNT ACCESS CONTROL</label>
                                    <button 
                                        onClick={() => setConfirmAction({ type: 'status', userId: selectedTenant.id, newStatus: selectedTenant.status === 'Suspended' ? 'Active' : 'Suspended' })}
                                        disabled={isUpdating}
                                        style={{ 
                                            width: '100%', background: selectedTenant.status === 'Suspended' ? '#10b98115' : '#ef444415',
                                            border: `1px solid ${selectedTenant.status === 'Suspended' ? '#10b981' : '#ef4444'}`,
                                            color: selectedTenant.status === 'Suspended' ? '#10b981' : '#ef4444',
                                            padding: '12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                        }}
                                    >
                                        {selectedTenant.status === 'Suspended' ? <Shield size={14} /> : <Lock size={14} />}
                                        {selectedTenant.status === 'Suspended' ? 'REACTIVATE ACCOUNT' : 'SUSPEND ACCOUNT'}
                                    </button>
                                </div>
                            </div>

                            {/* ── Elite Ödülü Ver ── */}
                            <div style={{ marginTop: '24px', background: '#0d1117', border: '1px solid #6366f130', borderRadius: '16px', padding: '20px' }}>
                                <label style={{ fontSize: '0.75rem', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', fontWeight: '700', textTransform: 'uppercase' }}>
                                    <Gift size={13} /> Elite Ödülü Ver
                                </label>

                                {/* Sebep */}
                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ fontSize: '0.7rem', color: '#555', marginBottom: '6px' }}>SEBEP</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                                        {[
                                            { value: 'reward', label: '🎁 Ödül' },
                                            { value: 'partner', label: '🤝 Ortak' },
                                            { value: 'trial', label: '🧪 Deneme' },
                                            { value: 'support', label: '💬 Destek' },
                                        ].map(opt => (
                                            <button key={opt.value} onClick={() => setGrantReason(opt.value)}
                                                style={{
                                                    padding: '8px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: '600', cursor: 'pointer',
                                                    background: grantReason === opt.value ? '#6366f120' : '#111',
                                                    border: `1px solid ${grantReason === opt.value ? '#6366f1' : '#222'}`,
                                                    color: grantReason === opt.value ? '#818cf8' : '#555',
                                                }}
                                            >{opt.label}</button>
                                        ))}
                                    </div>
                                </div>

                                {/* Süre */}
                                <div style={{ marginBottom: '14px' }}>
                                    <div style={{ fontSize: '0.7rem', color: '#555', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Clock size={10} /> SÜRE
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                                        {[
                                            { days: 7, label: '1 Hafta' },
                                            { days: 30, label: '1 Ay' },
                                            { days: 60, label: '2 Ay' },
                                            { days: 0, label: '♾ Süresiz' },
                                        ].map(opt => (
                                            <button key={opt.days} onClick={() => setGrantDuration(opt.days)}
                                                style={{
                                                    padding: '8px 4px', borderRadius: '8px', fontSize: '0.68rem', fontWeight: '700', cursor: 'pointer',
                                                    background: grantDuration === opt.days ? '#6366f120' : '#111',
                                                    border: `1px solid ${grantDuration === opt.days ? '#6366f1' : '#222'}`,
                                                    color: grantDuration === opt.days ? '#818cf8' : '#555',
                                                }}
                                            >{opt.label}</button>
                                        ))}
                                    </div>
                                </div>

                                {/* Mevcut durum */}
                                {selectedTenant.subscriptionType === 'granted' && selectedTenant.planExpiresAt && (
                                    <div style={{ fontSize: '0.7rem', color: '#f59e0b', marginBottom: '10px', background: '#f59e0b10', padding: '6px 10px', borderRadius: '8px' }}>
                                        ⏳ Mevcut: {new Date(selectedTenant.planExpiresAt).toLocaleDateString('tr-TR')} tarihine kadar verilmiş Elite
                                    </div>
                                )}

                                <button
                                    onClick={handleGrantElite}
                                    disabled={isGranting}
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: '700', cursor: isGranting ? 'not-allowed' : 'pointer',
                                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                        border: 'none', color: 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        opacity: isGranting ? 0.6 : 1,
                                    }}
                                >
                                    <Gift size={14} />
                                    {isGranting ? 'VERİLİYOR...' : `ELİTE VER — ${grantDuration === 0 ? 'SÜRESİZ' : grantDuration + ' GÜN'}`}
                                </button>

                                {grantResult && (
                                    <div style={{
                                        marginTop: '10px', padding: '8px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '600',
                                        background: grantResult.success ? '#10b98115' : '#ef444415',
                                        color: grantResult.success ? '#10b981' : '#ef4444',
                                        border: `1px solid ${grantResult.success ? '#10b98130' : '#ef444430'}`,
                                    }}>
                                        {grantResult.msg}
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.65rem', color: '#333' }}>
                                <p>CAUTION: Plan changes trigger instant feature unlocking for the user.</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {confirmAction && (
                    <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.9)', zIndex: 10001 }}>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            style={{ background: '#0a0a0a', border: '1px solid #ef4444', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '400px', textAlign: 'center' }}
                        >
                            <Lock size={48} color="#ef4444" style={{ margin: '0 auto 20px' }} />
                            <h2 style={{ margin: '0 0 10px', fontSize: '1.2rem' }}>CONFIRM ACTION</h2>
                            <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '24px' }}>
                                Are you sure you want to <strong style={{ color: '#ef4444' }}>{confirmAction.newStatus === 'Suspended' ? 'SUSPEND' : 'REACTIVATE'}</strong> this account?
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button 
                                    onClick={() => setConfirmAction(null)}
                                    style={{ flex: 1, background: '#111', border: '1px solid #222', color: '#fff', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600' }}
                                >
                                    CANCEL
                                </button>
                                <button 
                                    onClick={() => {
                                        handleAction(confirmAction.userId, { status: confirmAction.newStatus });
                                        setConfirmAction(null);
                                    }}
                                    style={{ flex: 1, background: '#ef4444', border: 'none', color: '#fff', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600' }}
                                >
                                    CONFIRM
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteTarget && (
                    <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.9)', zIndex: 10002 }}>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            style={{ background: '#0a0a0a', border: '1px solid #ef4444', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '400px', textAlign: 'center' }}
                        >
                            <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 20px' }} />
                            <h2 style={{ margin: '0 0 10px', fontSize: '1.2rem' }}>DELETE USER</h2>
                            <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '24px' }}>
                                Are you sure you want to <strong style={{ color: '#ef4444' }}>permanently delete</strong> {deleteTarget.name || deleteTarget.email}?
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button 
                                    onClick={() => setDeleteTarget(null)}
                                    style={{ flex: 1, background: '#111', border: '1px solid #222', color: '#fff', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600' }}
                                >
                                    CANCEL
                                </button>
                                <button 
                                    onClick={() => handleDelete(deleteTarget.id)}
                                    style={{ flex: 1, background: '#ef4444', border: 'none', color: '#fff', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600' }}
                                >
                                    DELETE
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid #111', paddingBottom: '20px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Terminal size={32} color="#10b981" />
                            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, letterSpacing: '-0.05em' }}>
                                BAYFATURA <span style={{ color: '#10b981' }}>DCC_V2.5</span>
                            </h1>
                        </div>
                        <p style={{ color: '#666', margin: '4px 0 0', fontSize: '0.85rem' }}>DEVELOPER CONTROL CENTER · REAL-TIME FIREBASE LINK</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button 
                            onClick={handleSyncAuthUsers}
                            disabled={isSyncing}
                            style={{ 
                                background: '#10b98115', border: '1px solid #10b981', color: '#10b981',
                                padding: '10px 16px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}
                        >
                            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                            {isSyncing ? 'SYNCING...' : 'SYNC AUTH PROFILES'}
                        </button>
                        <div style={{ background: '#111', padding: '10px 20px', borderRadius: '12px', border: '1px solid #222' }}>
                            <span style={{ color: '#666', fontSize: '0.7rem' }}>DATABASE:</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: '700' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                                CONNECTED
                            </div>
                        </div>
                    </div>
                </div>

                {/* Metrics Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                    <MetricCard title="REAL USERS" value={tenants.length} trend="LIVE" icon={<Users size={20} color="#3b82f6" />} />
                    <MetricCard title="PRO USERS" value={tenants.filter(t => t.plan !== 'standard').length} trend="PRO" icon={<Crown size={20} color="#f59e0b" />} />
                    <MetricCard title="ACTIVE SESSIONS" value={Math.floor(tenants.length * 0.4)} trend="ONLINE" icon={<Activity size={20} color="#10b981" />} />
                    <MetricCard title="TOTAL INVOICES" value={orphanStats.reduce((sum, s) => sum + s.invoiceCount, 0)} trend="DB" icon={<Server size={20} color="#8b5cf6" />} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        {/* Tenant Manager */}
                        <div className="dcc-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Database size={20} color="#3b82f6" /> REAL-TIME USER DATABASE
                                </h3>
                                <div style={{ position: 'relative' }}>
                                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#666' }} />
                                    <input 
                                        placeholder="Search by Name, Email or ID..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{ background: '#111', border: '1px solid #222', padding: '8px 12px 8px 30px', borderRadius: '8px', fontSize: '0.8rem', color: '#fff', width: '300px' }}
                                    />
                                </div>
                            </div>

                            {loading ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
                                    Loading Users...
                                </div>
                            ) : (
                                <>
                                    <table className="dcc-table">
                                        <thead>
                                            <tr>
                                                <th>USER / EMAIL</th>
                                                <th>PLAN</th>
                                                <th>STATUS</th>
                                                <th>JOINED</th>
                                                <th style={{ textAlign: 'right', paddingRight: '15px' }}>ACTIONS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredTenants
                                                .slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage)
                                                .map(tenant => (
                                                    <tr key={tenant.id}>
                                                        <td style={{ padding: '15px' }}>
                                                            <div style={{ fontWeight: '600' }}>{tenant.name || 'Anonymous'}</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#10b981' }}>{tenant.email || 'N/A'}</div>
                                                        </td>
                                                        <td>
                                                            <span style={{ 
                                                                fontSize: '0.7rem', padding: '4px 8px', borderRadius: '100px', 
                                                                background: tenant.plan === 'standard' ? '#222' : '#10b98120',
                                                                color: tenant.plan === 'standard' ? '#666' : '#10b981',
                                                                fontWeight: '700', textTransform: 'uppercase'
                                                            }}>
                                                                {tenant.plan === 'standard' ? 'FREE' : tenant.plan}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: tenant.status === 'Suspended' ? '#ef4444' : '#10b981' }}>
                                                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: tenant.status === 'Suspended' ? '#ef4444' : '#10b981' }} />
                                                                {tenant.status || 'Active'}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div style={{ fontSize: '0.75rem', color: '#444' }}>{tenant.createdAt?.toDate ? new Date(tenant.createdAt.toDate()).toLocaleDateString() : tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : 'N/A'}</div>
                                                        </td>
                                                        <td style={{ textAlign: 'right', paddingRight: '15px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                                <button 
                                                                    onClick={() => setDeleteTarget(tenant)}
                                                                    style={{ background: '#ef444415', border: '1px solid #ef444430', color: '#ef4444', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => setSelectedTenant(tenant)}
                                                                    style={{ background: '#111', border: '1px solid #222', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                                                >
                                                                    <Settings size={14} /> CONTROL
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    
                                    {filteredTenants.length > usersPerPage && (
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
                                            <button 
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                style={{ background: '#111', border: '1px solid #222', color: '#fff', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}
                                            >
                                                Previous
                                            </button>
                                            <span style={{ fontSize: '0.85rem', color: '#666' }}>
                                                Page {currentPage} of {Math.ceil(filteredTenants.length / usersPerPage)}
                                            </span>
                                            <button 
                                                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredTenants.length / usersPerPage), p + 1))}
                                                disabled={currentPage === Math.ceil(filteredTenants.length / usersPerPage)}
                                                style={{ background: '#111', border: '1px solid #222', color: '#fff', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        {/* Agent Control Center */}
                        <AgentControlCenter />

                        {/* Database Recovery & Claims Tool */}
                        <div className="dcc-card" style={{ padding: '24px' }}>
                            <h4 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: '#f59e0b' }}>
                                <Database size={18} color="#f59e0b" /> ORPHANED DATA RECOVERY
                            </h4>
                            <p style={{ fontSize: '0.75rem', color: '#666', margin: '0 0 16px', lineHeight: '1.4' }}>
                                Found active invoice/quote databases in Firestore. If you lost your archives due to a new UID, you can merge them into your current active ID instantly.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {orphanStats.filter(stat => !stat.isCurrent && (stat.invoiceCount > 0 || stat.quoteCount > 0)).map(stat => (
                                    <div key={stat.tenantId} style={{ background: '#111', padding: '16px', borderRadius: '16px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#fff', fontFamily: 'monospace' }}>
                                                ID: {stat.tenantId.slice(0, 10)}...
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '4px' }}>
                                                📄 {stat.invoiceCount} Invoices · 📝 {stat.quoteCount} Quotes
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleClaimData(stat.tenantId)}
                                            disabled={isMigrating}
                                            style={{ 
                                                background: '#f59e0b20', border: '1px solid #f59e0b', color: '#f59e0b',
                                                padding: '8px 12px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer'
                                            }}
                                        >
                                            {isMigrating ? 'CLAIMING...' : 'CLAIM ALL'}
                                        </button>
                                    </div>
                                ))}
                                {orphanStats.filter(stat => !stat.isCurrent && (stat.invoiceCount > 0 || stat.quoteCount > 0)).length === 0 && (
                                    <div style={{ fontSize: '0.75rem', color: '#444', textAlign: 'center', padding: '12px', border: '1px dashed #222', borderRadius: '12px' }}>
                                        NO ORPHANED DATABASE DETECTED
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Local Storage Recovery */}
                        {(localCache.invoices > 0 || localCache.quotes > 0) && (
                            <div className="dcc-card" style={{ padding: '24px' }}>
                                <h4 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: '#10b981' }}>
                                    <Database size={18} color="#10b981" /> LOCAL CACHE RECOVERY
                                </h4>
                                <p style={{ fontSize: '0.75rem', color: '#666', margin: '0 0 16px', lineHeight: '1.4' }}>
                                    Sistem tarayıcınızın hafızasında Firebase öncesi döneme ait veriler buldu!
                                </p>
                                <div style={{ background: '#111', padding: '16px', borderRadius: '16px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#fff' }}>Local Storage Data</div>
                                        <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '4px' }}>
                                            📄 {localCache.invoices} Invoices · 📝 {localCache.quotes} Quotes
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleLocalStorageMigration}
                                        disabled={isMigrating}
                                        style={{ 
                                            background: '#10b98120', border: '1px solid #10b981', color: '#10b981',
                                            padding: '8px 12px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer'
                                        }}
                                    >
                                        {isMigrating ? 'UPLOADING...' : 'UPLOAD TO FIREBASE'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Live System Logs */}
                        <div className="dcc-card" style={{ padding: '24px', flexGrow: 1 }}>
                            <h4 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                                <Radio size={18} color="#ef4444" className="animate-pulse" /> LIVE SYSLOG
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.7rem', color: '#444' }}>
                                <LogItem time={new Date().toLocaleTimeString()} level="INFO" msg="DCC Live Link Established" />
                                <LogItem time="18:50:00" level="DB" msg="Firestore Snapshot Active" />
                                <LogItem time="18:45:12" level="INFO" msg="SaaS Owner Logged In" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
                .animate-pulse { animation: pulse 2s infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin { animation: spin 1s linear infinite; }
                
                .dcc-container { background: #000; min-height: 100vh; color: #fff; padding: 40px 5%; font-family: monospace; }
                .dcc-card { background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 24px; padding: 30px; }
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 10000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); }
                .dcc-metric-card { background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 20px; padding: 20px; display: flex; align-items: center; gap: 15px; }
                .dcc-table { width: 100%; border-collapse: collapse; text-align: left; }
                .dcc-table th { color: #666; font-size: 0.75rem; border-bottom: 1px solid #222; padding: 15px; }
                .dcc-table td { padding: 15px; border-bottom: 1px solid #111; font-size: 0.85rem; }
            `}</style>
        </div>
    );
};

const MetricCard = ({ title, value, trend, icon }) => (
    <div className="dcc-metric-card">
        <div style={{ background: '#111', padding: '12px', borderRadius: '12px' }}>{icon}</div>
        <div>
            <div style={{ color: '#666', fontSize: '0.7rem', textTransform: 'uppercase' }}>{title}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: '800' }}>{value}</span>
                <span style={{ fontSize: '0.75rem', color: '#10b981' }}>{trend}</span>
            </div>
        </div>
    </div>
);

const LogItem = ({ time, level, msg }) => (
    <div style={{ display: 'flex', gap: '10px' }}>
        <span style={{ color: '#333' }}>[{time}]</span>
        <span style={{ color: level === 'WARN' ? '#f59e0b' : '#555', fontWeight: 'bold' }}>{level}</span>
        <span style={{ color: '#888' }}>{msg}</span>
    </div>
);

export default DCC;
