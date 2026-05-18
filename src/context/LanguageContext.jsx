import React, { createContext, useContext, useState, useEffect } from 'react';

import de from '../translations/de';
import tr from '../translations/tr';
import en from '../translations/en';
import fr from '../translations/fr';
import es from '../translations/es';
import pt from '../translations/pt';

const LanguageContext = createContext();

const translations = { de, tr, en, fr, es, pt };

export const LanguageProvider = ({ children }) => {
    const [appLanguage, setAppLanguage] = useState(() => localStorage.getItem('bay_app_lang') || 'de');
    const [invoiceLanguage, setInvoiceLanguage] = useState(() => localStorage.getItem('bay_inv_lang') || 'de');

    useEffect(() => {
        localStorage.setItem('bay_app_lang', appLanguage);
    }, [appLanguage]);

    useEffect(() => {
        localStorage.setItem('bay_inv_lang', invoiceLanguage);
    }, [invoiceLanguage]);

    const t = (key) => {
        return translations[appLanguage]?.[key] || translations['en']?.[key] || translations['de']?.[key] || key;
    };

    const tInvoice = (key, overrideLang) => {
        const lang = overrideLang || invoiceLanguage;
        return translations[lang]?.[key] || translations['en']?.[key] || translations['de']?.[key] || key;
    };

    const LANGUAGES = [
        { code: 'de', label: 'Deutsch', countryCode: 'de', flag: '🇩🇪' },
        { code: 'en', label: 'English', countryCode: 'us', flag: '🇺🇸' },
        { code: 'tr', label: 'Türkçe', countryCode: 'tr', flag: '🇹🇷' },
        { code: 'fr', label: 'Français', countryCode: 'fr', flag: '🇫🇷' },
        { code: 'es', label: 'Español', countryCode: 'es', flag: '🇪🇸' },
        { code: 'pt', label: 'Português', countryCode: 'pt', flag: '🇵🇹' }
    ];

    return (
        <LanguageContext.Provider value={{
            appLanguage,
            setAppLanguage,
            invoiceLanguage,
            setInvoiceLanguage,
            t,
            tInvoice,
            serviceLanguages: { invoicing: invoiceLanguage, appointments: appLanguage, stock: appLanguage, website: appLanguage },
            setServiceLanguage: () => {},
            LANGUAGES
        }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
