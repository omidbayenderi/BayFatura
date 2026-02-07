import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, PlusCircle, Archive, BarChart3, Receipt, Repeat, X, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, closeSidebar }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t, appLanguage } = useLanguage();
    const { currentUser, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
        { path: '/new', icon: PlusCircle, label: t('newInvoice') },
        { path: '/archive', icon: Archive, label: t('archive') },
        { path: '/reports', icon: BarChart3, label: t('reports') },
        { path: '/expenses', icon: Receipt, label: t('expenses') },
        { path: '/recurring', icon: Repeat, label: t('recurring') },
        { path: '/settings', icon: Settings, label: t('settings') },
    ];

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="logo-icon">B</div>
                    <h2>BayRechnung</h2>
                </div>
                <button className="close-sidebar no-desktop" onClick={closeSidebar}>
                    <X size={20} />
                </button>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={closeSidebar}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                            {isActive && (
                                <motion.div
                                    className="nav-active-indicator"
                                    layoutId="activeNav"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <div
                    className="user-mini-profile"
                    onClick={() => { closeSidebar(); navigate('/settings/profile'); }}
                    style={{ cursor: 'pointer' }}
                    title={appLanguage === 'tr' ? 'Profil Ayarlarına Git' : 'Zu Profileinstellungen'}
                >
                    <div className="avatar">
                        {currentUser?.avatar ? (
                            <img src={currentUser.avatar} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            currentUser?.name?.charAt(0) || 'U'
                        )}
                    </div>
                    <div className="info">
                        <span className="name">{currentUser?.name || 'User'}</span>
                        <span className="role">{currentUser?.email || currentUser?.role || 'Administrator'}</span>
                    </div>
                </div>
                <button
                    className="logout-btn"
                    onClick={handleLogout}
                    style={{
                        width: '100%',
                        marginTop: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '8px',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(239, 68, 68, 0.15)';
                        e.target.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                        e.target.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                    }}
                >
                    <LogOut size={16} />
                    {appLanguage === 'tr' ? 'Çıkış Yap' : 'Abmelden'}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
