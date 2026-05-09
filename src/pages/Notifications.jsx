import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, Info, AlertTriangle, CheckCircle, Search } from 'lucide-react';

const Notifications = () => {
    const { currentUser } = useAuth();
    const { t, appLanguage } = useLanguage();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        const notifsRef = collection(db, 'users', currentUser.uid, 'notifications');
        const q = query(notifsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setNotifications(notifs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const markAsRead = async (id) => {
        if (!currentUser) return;
        await updateDoc(doc(db, 'users', currentUser.uid, 'notifications', id), { read: true });
    };

    const markAllAsRead = async () => {
        if (!currentUser || notifications.length === 0) return;
        
        const batch = writeBatch(db);
        notifications.filter(n => !n.read).forEach(n => {
            const ref = doc(db, 'users', currentUser.uid, 'notifications', n.id);
            batch.update(ref, { read: true });
        });
        await batch.commit();
    };

    const deleteNotification = async (id) => {
        if (!currentUser) return;
        const batch = writeBatch(db);
        const ref = doc(db, 'users', currentUser.uid, 'notifications', id);
        batch.delete(ref);
        await batch.commit();
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle size={20} color="#10b981" />;
            case 'warning': return <AlertTriangle size={20} color="#f59e0b" />;
            case 'error': return <AlertTriangle size={20} color="#ef4444" />;
            default: return <Info size={20} color="#3b82f6" />;
        }
    };

    if (loading) {
        return (
            <div className="page-container">
                <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="skeleton" style={{ width: '44px', height: '44px', borderRadius: '14px' }}></div>
                            <div className="skeleton skeleton-text" style={{ width: '200px', height: '28px' }}></div>
                        </div>
                        <div className="skeleton skeleton-text skeleton-text-short" style={{ marginTop: '8px', marginLeft: '56px' }}></div>
                    </div>
                    <div className="skeleton skeleton-button"></div>
                </header>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[1,2,3,4].map(i => (
                        <div className="card skeleton-notification" key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '20px' }}>
                            <div className="skeleton" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}></div>
                            <div style={{ flex: 1 }}>
                                <div className="skeleton skeleton-text" style={{ width: '60%', height: '18px', marginBottom: '8px' }}></div>
                                <div className="skeleton skeleton-text" style={{ width: '90%', height: '14px', marginBottom: '6px' }}></div>
                                <div className="skeleton skeleton-text" style={{ width: '40%', height: '12px' }}></div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <div className="skeleton" style={{ width: '30px', height: '30px', borderRadius: '6px' }}></div>
                                <div className="skeleton" style={{ width: '30px', height: '30px', borderRadius: '6px' }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '44px', height: '44px', borderRadius: '14px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                            boxShadow: '0 4px 14px rgba(59,130,246,0.4)'
                        }}>
                            <Bell size={22} />
                        </div>
                        {t('notifications')}
                    </h1>
                    <p style={{ color: '#64748b' }}>{t('notificationsDesc') || 'Sistem ve hesap uyarılarınızı buradan takip edin.'}</p>
                </div>
                {notifications.some(n => !n.read) && (
                    <button className="secondary-btn" onClick={markAllAsRead}>
                        <Check size={16} /> {t('markAllRead') || 'Tümünü Okundu İşaretle'}
                    </button>
                )}
            </header>

            {notifications.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '80px 20px' }}>
                    <Search size={48} style={{ color: '#cbd5e1', display: 'block', margin: '0 auto 16px' }} />
                    <h2 style={{ marginBottom: '12px', color: '#64748b' }}>{t('noNotifications') || 'Bildirim Yok'}</h2>
                    <p style={{ color: '#94a3b8' }}>{t('noNotificationsDesc') || 'Şu an için yeni bir bildiriminiz bulunmuyor.'}</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <AnimatePresence>
                        {notifications.map((n) => (
                            <motion.div 
                                key={n.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="card"
                                style={{
                                    display: 'flex', alignItems: 'flex-start', gap: '16px',
                                    padding: '20px',
                                    borderLeft: n.read ? '4px solid transparent' : '4px solid #3b82f6',
                                    background: n.read ? '#ffffff' : '#f8fafc',
                                    transition: 'all 0.3s ease',
                                    position: 'relative'
                                }}
                            >
                                <div style={{ 
                                    background: 'white', padding: '10px', borderRadius: '12px', 
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)', flexShrink: 0 
                                }}>
                                    {getIcon(n.type)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', color: n.read ? '#475569' : '#1e293b' }}>
                                        {n.title}
                                    </h3>
                                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                        {n.message}
                                    </p>
                                    <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#94a3b8' }}>
                                        {n.createdAt?.toDate ? new Date(n.createdAt.toDate()).toLocaleString(appLanguage === 'tr' ? 'tr-TR' : 'en-US') : 'Şimdi'}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {!n.read && (
                                        <button 
                                            onClick={() => markAsRead(n.id)}
                                            style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '6px' }}
                                            title="Okundu İşaretle"
                                        >
                                            <Check size={18} />
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => deleteNotification(n.id)}
                                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px', opacity: 0.6 }}
                                        title="Sil"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default Notifications;
