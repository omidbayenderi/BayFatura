import React, { createContext, useContext, useState } from 'react';
import { useLanguage } from './LanguageContext';
import {
    LayoutDashboard, FileText, Settings, PlusCircle, Archive, BarChart3, Receipt, Repeat, Users, Sparkles, Users2, Package, Landmark
} from 'lucide-react';

const PanelContext = createContext();

export const usePanel = () => useContext(PanelContext);

export const PanelProvider = ({ children }) => {
    const { t } = useLanguage();

    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const getMenuItems = (role = 'admin') => {
        const items = [
            { path: '/dashboard', icon: LayoutDashboard, label: t('dashboard'), roles: ['admin', 'accountant'] },
            { path: '/new', icon: PlusCircle, label: t('newInvoice'), roles: ['admin', 'accountant', 'member'] },
            { path: '/archive', icon: Archive, label: t('archive'), roles: ['admin', 'accountant', 'member'] },
            { path: '/quotes', icon: FileText, label: t('quotes'), roles: ['admin', 'accountant', 'member'] },
            { path: '/customers', icon: Users2, label: t('customers'), roles: ['admin', 'accountant'] },
            { path: '/products', icon: Package, label: t('products'), roles: ['admin', 'accountant'] },
            { path: '/reports', icon: BarChart3, label: t('reports'), roles: ['admin', 'accountant'] },
            { path: '/expenses', icon: Receipt, label: t('expenses'), roles: ['admin', 'accountant'] },
            { path: '/recurring', icon: Repeat, label: t('recurring'), roles: ['admin', 'accountant', 'member'] },
            { path: '/team', icon: Users, label: t('teamManagement'), roles: ['admin'] },
            { path: '/forecasting', icon: Sparkles, label: t('forecasting'), roles: ['admin', 'accountant'] },
            { path: '/bank-matcher', icon: Landmark, label: t('bankMatcher'), roles: ['admin', 'accountant'] },
            { path: '/settings', icon: Settings, label: t('settings'), roles: ['admin', 'accountant', 'member'] }
        ];

        const rawRole = (role || 'admin').toLowerCase();
        // Map common synonyms to standard roles
        const userRole = rawRole === 'administrator' ? 'admin' : rawRole;
        
        return items.filter(item => item.roles.includes(userRole));
    };

    return (
        <PanelContext.Provider value={{ 
            activePanel: 'accounting', 
            getMenuItems,
            toast,
            showToast,
            setToast
        }}>
            {children}
        </PanelContext.Provider>
    );
};
