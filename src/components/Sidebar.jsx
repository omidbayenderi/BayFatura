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



    const menuItems = getMenuItems();

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>

            {/* Simple Header */}
            <div className="sidebar-header" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                    <div className="sidebar-logo" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
                        <div className="logo-icon" style={{ background: 'var(--primary)' }}><Command size={20} /></div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <h2 style={{ fontSize: '1.1rem' }}>{t('appName') || 'BayFatura'}</h2>
                            <span style={{ fontSize: '0.7rem', opacity: 0.7, fontWeight: 'normal' }}>BayFatura Cloud</span>
                        </div>
                    </div>
                    <button className="close-sidebar no-desktop" onClick={closeSidebar}>
                        <X size={20} />
                    </button>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div style={{ padding: '0 20px', marginBottom: '10px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>
                    Menü
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
                    style={{ cursor: 'pointer', background: 'transparent', padding: '8px 4px' }}
                >
                    <div className="avatar" style={{ width: '36px', height: '36px' }}>
                        {currentUser?.avatar ? (
                            <img src={currentUser.avatar} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            currentUser?.name?.charAt(0) || 'U'
                        )}
                    </div>
                    <div className="info">
                        <span className="name" style={{ fontSize: '0.9rem' }}>{currentUser?.name || 'User'}</span>
                        <span className="role" style={{ fontSize: '0.75rem' }}>Administrator</span>
                    </div>
                </div>


            </div>
        </aside>
    );
};

export default Sidebar;
