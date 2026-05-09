import React, { useState } from 'react';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, LogOut, User, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { usePanel } from '../context/PanelContext';
import { useInvoice } from '../context/InvoiceContext';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import Toast from './Toast';
import { AnimatePresence } from 'framer-motion';
import OnboardingWizard from './OnboardingWizard';

const Layout = () => {
    const { toast, setToast } = usePanel();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { companyProfile, loading: invoiceLoading } = useInvoice();
    const { t } = useLanguage();
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [hasClosedOnboarding, setHasClosedOnboarding] = useState(false);

    React.useEffect(() => {
        // Show onboarding if the user has no company name and onboarding is not marked complete
        // and they haven't already closed it in this session.
        if (!invoiceLoading && currentUser && !companyProfile?.companyName && companyProfile?.onboardingCompleted !== true && !hasClosedOnboarding) {
            setShowOnboarding(true);
        } else {
            setShowOnboarding(false);
        }
    }, [invoiceLoading, currentUser, companyProfile, hasClosedOnboarding]);

    const [unreadCount, setUnreadCount] = useState(0);

    React.useEffect(() => {
        if (!currentUser) {
            setUnreadCount(0);
            return;
        }

        const notifsRef = collection(db, 'users', currentUser.uid, 'notifications');
        const q = query(notifsRef, where('read', '==', false));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setUnreadCount(snapshot.size);
        }, (error) => {
            console.error("Notifications listener error:", error);
        });

        return () => unsubscribe();
    }, [currentUser]);

    return (
        <div className="modern-layout">
            <AnimatePresence>
                {toast && (
                    <Toast 
                        message={toast.message} 
                        type={toast.type} 
                        onClose={() => setToast(null)} 
                    />
                )}
            </AnimatePresence>

            {showOnboarding && (
                <OnboardingWizard onComplete={() => {
                    setHasClosedOnboarding(true);
                    setShowOnboarding(false);
                }} />
            )}

            <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)}></div>

            <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

            <main className="main-content">
                <header className="mobile-header no-print" style={{ zIndex: 1000, justifyContent: 'flex-start', gap: '16px' }}>
                    <div className="mobile-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
                        <img src="/logo.png" alt="BayFatura Logo" style={{ height: '42px', width: 'auto', filter: 'drop-shadow(0 2px 8px rgba(79, 70, 229, 0.25))' }} />
                    </div>

                    <div style={{ flex: 1 }}></div>

                    {currentUser && (
                        <div className="user-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {/* Notification Bell */}
                            <div
                                onClick={() => navigate('/notifications')}
                                style={{ position: 'relative', cursor: 'pointer', padding: '8px' }}
                            >
                                <Bell size={20} color="#64748b" />
                                {unreadCount > 0 && (
                                    <span 
                                        className="notification-dot"
                                        style={{
                                            position: 'absolute', top: '0', right: '0',
                                            background: '#ef4444', color: 'white',
                                            borderRadius: '50%', width: '16px', height: '16px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '10px', fontWeight: 'bold'
                                        }}
                                    >
                                        {unreadCount}
                                    </span>
                                )}
                            </div>

                            <div 
                                className="user-info" 
                                onClick={() => navigate('/settings/profile')}
                                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}
                            >
                                {currentUser?.avatar || currentUser?.photoURL ? (
                                    <img src={currentUser.avatar || currentUser.photoURL} alt="Avatar" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                    <User size={18} />
                                )}
                                <span className="hide-mobile">{currentUser.name}</span>
                            </div>

                        </div>
                    )}
                </header>

                <div className="content-wrapper">
                    <Outlet />
                </div>
            </main>

            <MobileBottomNav onOpenMenu={() => setSidebarOpen(true)} />
        </div>
    );
};

export default Layout;
