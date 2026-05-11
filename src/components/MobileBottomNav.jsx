import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, Plus, Receipt, Menu } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const MobileBottomNav = ({ onOpenMenu }) => {
    const { t } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();

    // Do not show bottom nav on these specific full-screen pages if we don't want to
    const hiddenRoutes = ['/login', '/', '/success'];
    if (hiddenRoutes.includes(location.pathname) || location.pathname.startsWith('/p/')) {
        return null;
    }

    return (
        <nav className="mobile-bottom-nav desktop-hide">
            <NavLink
                to="/dashboard"
                className={({ isActive }) => `nav-item-mobile ${isActive ? 'active' : ''}`}
            >
                <div className="icon-wrapper">
                    <Home size={22} />
                </div>
                <span>{t('home')}</span>
            </NavLink>

            <NavLink
                to="/archive"
                className={({ isActive }) => `nav-item-mobile ${isActive ? 'active' : ''}`}
            >
                <div className="icon-wrapper">
                    <FileText size={22} />
                </div>
                <span>{t('invoices')}</span>
            </NavLink>

            <div className="nav-item-mobile center-action">
                <button
                    className="fab-button"
                    onClick={() => navigate('/new')}
                >
                    <Plus size={28} />
                </button>
            </div>

            <NavLink
                to="/expenses"
                className={({ isActive }) => `nav-item-mobile ${isActive ? 'active' : ''}`}
            >
                <div className="icon-wrapper">
                    <Receipt size={22} />
                </div>
                <span>{t('expenses')}</span>
            </NavLink>

            <button
                className="nav-item-mobile"
                onClick={onOpenMenu}
            >
                <div className="icon-wrapper">
                    <Menu size={22} />
                </div>
                <span>{t('more')}</span>
            </button>
        </nav>
    );
};

export default MobileBottomNav;
