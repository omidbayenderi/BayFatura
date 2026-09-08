import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, FileText, Plus, Receipt, Menu } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const MobileBottomNav = ({ onOpenMenu }) => {
    const { t } = useLanguage();
    const location = useLocation();
    const navRef = React.useRef(null);
    const itemRefs = React.useRef([]);
    const [notchX, setNotchX] = React.useState('50%');

    const getActiveIndex = () => {
        if (location.pathname === '/dashboard') return 0;
        if (
            location.pathname.startsWith('/archive') ||
            location.pathname.startsWith('/invoice') ||
            location.pathname.startsWith('/quotes') ||
            location.pathname.startsWith('/quote')
        ) return 1;
        if (location.pathname.startsWith('/new')) return 2;
        if (location.pathname.startsWith('/expenses')) return 3;
        return null;
    };

    const activeIndex = getActiveIndex();
    const fabLifted = activeIndex === 2;

    React.useLayoutEffect(() => {
        if (activeIndex === null || !navRef.current || !itemRefs.current[activeIndex]) {
            setNotchX('-100px');
            return;
        }

        const updateNotchPosition = () => {
            const navRect = navRef.current.getBoundingClientRect();
            const itemRect = itemRefs.current[activeIndex].getBoundingClientRect();
            const center = itemRect.left - navRect.left + (itemRect.width / 2);
            setNotchX(`${Math.round(center)}px`);
        };

        updateNotchPosition();
        window.addEventListener('resize', updateNotchPosition);
        return () => window.removeEventListener('resize', updateNotchPosition);
    }, [activeIndex]);

    // Do not show bottom nav on these specific full-screen pages if we don't want to
    const hiddenRoutes = ['/login', '/', '/success'];
    if (hiddenRoutes.includes(location.pathname) || location.pathname.startsWith('/p/')) {
        return null;
    }

    return (
        <nav ref={navRef} className="mobile-bottom-nav desktop-hide" style={{ '--notch-x': notchX }}>
            <NavLink ref={(node) => { itemRefs.current[0] = node; }} to="/dashboard" className={`nav-item-mobile ${activeIndex === 0 ? 'active' : ''}`}>
                <div className="icon-wrapper"><Home size={20} /></div>
                <span>{t('home')}</span>
            </NavLink>

            <NavLink ref={(node) => { itemRefs.current[1] = node; }} to="/archive" className={`nav-item-mobile ${activeIndex === 1 ? 'active' : ''}`}>
                <div className="icon-wrapper"><FileText size={20} /></div>
                <span>{t('invoices')}</span>
            </NavLink>

            <NavLink ref={(node) => { itemRefs.current[2] = node; }} to="/new" className={`nav-item-mobile nav-item-fab ${activeIndex === 2 ? 'active' : ''} ${fabLifted ? 'fab-lifted' : ''}`}>
                <div className="icon-wrapper"><Plus size={24} /></div>
                <span>{t('newInvoice')}</span>
            </NavLink>

            <NavLink ref={(node) => { itemRefs.current[3] = node; }} to="/expenses" className={`nav-item-mobile ${activeIndex === 3 ? 'active' : ''}`}>
                <div className="icon-wrapper"><Receipt size={20} /></div>
                <span>{t('expenses')}</span>
            </NavLink>

            <button ref={(node) => { itemRefs.current[4] = node; }} className="nav-item-mobile" onClick={onOpenMenu}>
                <div className="icon-wrapper"><Menu size={20} /></div>
                <span>{t('more')}</span>
            </button>
        </nav>
    );
};

export default MobileBottomNav;
