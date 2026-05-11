import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, PlusCircle, Archive, BarChart3, Receipt, Repeat, X, LogOut, Command } from 'lucide-react';
import { motion } from 'framer-motion';

import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { usePanel } from '../context/PanelContext';

const Sidebar = ({ isOpen, closeSidebar }) => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { currentUser, logout } = useAuth();
    const { getMenuItems } = usePanel();

    const menuItems = getMenuItems(currentUser?.role || 'admin');

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>

            {/* Simple Header */}
            <div className="sidebar-header">
                <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                    <div className="sidebar-logo" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
                        <img src="/logo.png" alt="BayFatura Logo" style={{ height: '72px', width: 'auto' }} />
                    </div>
                    <button className="close-sidebar no-desktop" onClick={closeSidebar}>
                        <X size={20} />
                    </button>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div style={{ padding: '0 20px', marginBottom: '10px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>
                    {t('menu')}
                </div>
                {menuItems.map((item) => {
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={closeSidebar}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <div
                    className="user-mini-profile"
                    onClick={() => { closeSidebar(); navigate('/settings/profile'); }}
                    style={{ cursor: 'pointer', background: 'transparent', padding: '8px 4px', marginBottom: '12px' }}
                >
                    <div className="avatar" style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '50%', fontWeight: '600' }}>
                        {currentUser?.avatar || currentUser?.photoURL ? (
                            <img src={currentUser.avatar || currentUser.photoURL} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            currentUser?.name?.charAt(0).toUpperCase() || 'U'
                        )}
                    </div>
                    <div className="info" style={{ flex: 1 }}>
                        <span className="name" style={{ fontSize: '0.85rem', fontWeight: '600', color: 'white' }}>{currentUser?.name || 'User'}</span>
                        <span className="role" style={{ fontSize: '0.7rem', opacity: 0.6 }}>{currentUser?.role || t('role_admin')}</span>
                    </div>
                </div>

                <button 
                    onClick={() => { logout(); navigate('/login'); }}
                    className="nav-item" 
                    style={{ 
                        width: '100%', 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        color: '#f87171', 
                        border: 'none', 
                        cursor: 'pointer',
                        marginTop: '4px'
                    }}
                >
                    <LogOut size={20} />
                    <span>{t('logout')}</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
