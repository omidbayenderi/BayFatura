import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="modern-layout">
            <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)}></div>

            <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

            <main className="main-content">
                <header className="mobile-header no-print" style={{ zIndex: 1000 }}>
                    <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
                        <Menu size={24} />
                    </button>
                    <div className="mobile-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
                        <div className="logo-icon">B</div>
                        <h2>BayRechnung</h2>
                    </div>

                    {currentUser && (
                        <div className="user-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>
                                <User size={18} />
                                <span className="hide-mobile">{currentUser.name}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    padding: '0.5rem 1rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    color: '#64748b',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.borderColor = '#cbd5e1';
                                    e.target.style.color = '#475569';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.borderColor = '#e2e8f0';
                                    e.target.style.color = '#64748b';
                                }}
                            >
                                <LogOut size={18} />
                                <span className="hide-mobile">Logout</span>
                            </button>
                        </div>
                    )}
                </header>

                <div className="content-wrapper">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
