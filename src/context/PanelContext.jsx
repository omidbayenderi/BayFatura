import React, { createContext, useContext, useState } from 'react';
import { useLanguage } from './LanguageContext';
import {
    LayoutDashboard, FileText, Settings, PlusCircle, Archive, BarChart3, Receipt, Repeat
} from 'lucide-react';

const PanelContext = createContext();

export const usePanel = () => useContext(PanelContext);

export const PanelProvider = ({ children }) => {
    const { t } = useLanguage();

    const getMenuItems = () => {
        return [
            { path: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
            { path: '/new', icon: PlusCircle, label: t('newInvoice') },
            { path: '/archive', icon: Archive, label: t('archive') },
            { path: '/quotes', icon: FileText, label: t('quotes') },
            { path: '/reports', icon: BarChart3, label: t('reports') },
            { path: '/expenses', icon: Receipt, label: t('expenses') },
            { path: '/recurring', icon: Repeat, label: t('recurring') },
            { path: '/settings', icon: Settings, label: t('settings') }
        ];
    };

    return (
        <PanelContext.Provider value={{ activePanel: 'accounting', getMenuItems }}>
            {children}
        </PanelContext.Provider>
    );
};
