import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDb, storage, functions } from '../lib/firebase';
import {
    collection, addDoc, deleteDoc, doc, onSnapshot, query, where,
    or, orderBy, updateDoc, setDoc, getDocs, writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from './AuthContext';
import { logger } from '../lib/logger';

const checkInvoiceLimitFn = httpsCallable(functions, 'checkInvoiceLimit');

/**
 * Uploads a File object to Firebase Storage and returns the public download URL.
 * Path: users/{uid}/assets/{filename}
 */
export const uploadToStorage = async (uid, file, filename) => {
    const storageRef = ref(storage, `users/${uid}/assets/${filename}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
};

/**
 * Deletes a file from Firebase Storage by its download URL.
 * Silently ignores errors (e.g. file already deleted).
 */
export const deleteFromStorage = async (downloadUrl) => {
    try {
        const storageRef = ref(storage, downloadUrl);
        await deleteObject(storageRef);
    } catch (e) {
        // Ignore - file may not exist
    }
};

const InvoiceContext = createContext();

const INITIAL_COMPANY_PROFILE = {
    companyName: '', owner: '', companyEmail: '', companyPhone: '', website: '',
    taxId: '', vatId: '', street: '', houseNum: '', zip: '', city: '',
    bankName: '', iban: '', bic: '', 
    logo: null, signature: null, stamp: null,
    paymentTerms: '', industry: 'general'
};

// Keep Settings writes intentionally narrow.  The user document also contains
// server-controlled plan, role and tenant fields; sending the whole document
// back from the browser makes a harmless bank-details change vulnerable to a
// rules rejection when the document schema evolves.
const COMPANY_PROFILE_EDITABLE_FIELDS = [
    'name', 'companyName', 'email', 'avatar', 'phone', 'address', 'city', 'country',
    'owner', 'companyEmail', 'companyPhone', 'website', 'taxId', 'vatId', 'street',
    'houseNum', 'zip', 'bankName', 'iban', 'bic', 'logo', 'signature', 'signatureUrl',
    'stamp', 'stampUrl', 'paymentTerms', 'industry', 'industryData', 'logoDisplayMode',
    'kleinunternehmer', 'kleinunternehmerText', 'defaultCurrency', 'defaultTaxRate',
    'paypalMe', 'stripeLink', 'atValidationCode', 'invoiceSeries', 'ptQrEnabled',
    'ptDocType', 'language', 'stripePublicKey', 'paypalClientId'
];

export const InvoiceProvider = ({ children }) => {
    const { currentUser } = useAuth();
    // Route all Firestore reads/writes to the user's assigned DB
    const db = getDb(currentUser?._db);
    const [invoices, setInvoices] = useState([]);
    const [quotes, setQuotes] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [deletedInvoices, setDeletedInvoices] = useState([]);
    const [deletedQuotes, setDeletedQuotes] = useState([]);
    const [deletedExpenses, setDeletedExpenses] = useState([]);
    const [recurringTemplates, setRecurringTemplates] = useState([]);
    const [companyProfile, setCompanyProfile] = useState(INITIAL_COMPANY_PROFILE);
    const [invoiceCustomization, setInvoiceCustomization] = useState({
        primaryColor: '#3b82f6', secondaryColor: '#1e293b', fontFamily: 'Inter',
        template: 'classic', showLogo: true, showTax: true, showTotalInWords: false,
        notes: '', quoteValidityDays: 30
    });
    const [expenseCategories, setExpenseCategories] = useState([
        'spareParts', 'rent', 'marketing', 'software', 'insurance', 'materials', 'fuel', 'food', 'office', 'other'
    ]);
    const [loading, setLoading] = useState(true);
    // True once the users/{uid} profile snapshot has actually delivered a result
    // (document exists OR confirmed empty). Stays false while loading and when the
    // read fails, so callers can tell a real "brand new profile" apart from a
    // broken/unreachable data connection.
    const [profileReady, setProfileReady] = useState(false);
    const [profileError, setProfileError] = useState(false);

    useEffect(() => {
        if (!currentUser) {
            setInvoices([]); setQuotes([]); setExpenses([]); setRecurringTemplates([]);
            setDeletedInvoices([]); setDeletedQuotes([]); setDeletedExpenses([]);
            setCompanyProfile(INITIAL_COMPANY_PROFILE);
            setProfileReady(false);
            setProfileError(false);
            setLoading(false);
            return;
        }

        // Never keep the previous account's company/country details on screen
        // while Firestore loads the next user's profile.
        setCompanyProfile(INITIAL_COMPANY_PROFILE);
        setInvoiceCustomization({
            primaryColor: '#3b82f6', secondaryColor: '#1e293b', fontFamily: 'Inter',
            template: 'classic', showLogo: true, showTax: true, showTotalInWords: false,
            notes: '', quoteValidityDays: 30
        });
        setLoading(true);
        setProfileReady(false);
        setProfileError(false);

        // Defensive Listener Wrapper
        const safeListen = (refOrQuery, callback, contextName) => {
            return onSnapshot(refOrQuery, callback, (err) => {
                console.warn(`${contextName} listener error:`, err.code);
                if (contextName === 'Profile') {
                    // Profile could not be read. Do not treat this as a brand-new
                    // account — otherwise the onboarding wizard would auto-open and
                    // trap the user while their data connection is broken.
                    setProfileReady(false);
                    setProfileError(true);
                }
                // Silently handle permission-denied during auth transition
                if (err.code === 'permission-denied') setLoading(false);
            });
        };

        // 1. Profile & Settings
        const unsubProfile = safeListen(doc(db, 'users', currentUser.uid), (s) => {
            if (s.exists()) {
                const data = s.data();
                setCompanyProfile(prev => ({ 
                    ...prev, 
                    ...data,
                    companyEmail: data.companyEmail || data.email || currentUser.email || prev.companyEmail 
                }));
            } else {
                // If profile doesn't exist, at least set the email from auth
                setCompanyProfile(prev => ({ ...prev, companyEmail: currentUser.email || prev.companyEmail }));
            }
            setProfileReady(true);
            setProfileError(false);
            setLoading(false);
        }, "Profile");

        const unsubCustom = safeListen(doc(db, 'customizations', currentUser.uid), (s) => {
            if (s.exists()) {
                const data = s.data();
                setInvoiceCustomization(prev => ({ ...prev, ...data }));
                if (data.expenseCategories) setExpenseCategories(data.expenseCategories);
            }
        }, "Customization");

        // 2. Data Queries
        const qParams = where('userId', '==', currentUser.uid);
        
        const qInv = query(collection(db, 'invoices'), qParams);
        const qQuo = query(collection(db, 'quotes'), qParams);
        const qExp = query(collection(db, 'expenses'), qParams);
        const qRec = query(collection(db, 'recurring_templates'), qParams);

        const unsubInv = safeListen(qInv, (s) => {
            const all = s.docs.map(d => ({ id: d.id, ...d.data() }));
            const active = all.filter(d => !d.isDeleted);
            const deleted = all.filter(d => d.isDeleted);
            active.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
            setInvoices(active);
            setDeletedInvoices(deleted);
        }, "Invoices");

        const unsubQuo = safeListen(qQuo, (s) => {
            const all = s.docs.map(d => ({ id: d.id, ...d.data() }));
            setQuotes(all.filter(d => !d.isDeleted));
            setDeletedQuotes(all.filter(d => d.isDeleted));
        }, "Quotes");

        const unsubExp = safeListen(qExp, (s) => {
            const all = s.docs.map(d => ({ id: d.id, ...d.data() }));
            setExpenses(all.filter(d => !d.isDeleted));
            setDeletedExpenses(all.filter(d => d.isDeleted));
        }, "Expenses");

        const unsubRec = safeListen(qRec, (s) => setRecurringTemplates(s.docs.map(d => ({ id: d.id, ...d.data() }))), "Recurring");

        return () => {
            unsubProfile(); unsubCustom(); unsubInv(); unsubQuo(); unsubExp(); unsubRec();
        };
    }, [currentUser]);

    // Data Actions
    const saveInvoice = async (d) => {
        await checkInvoiceLimitFn();
        const payload = cleanData({ ...d, userId: currentUser.uid, createdAt: new Date().toISOString() });
        const ref = await addDoc(collection(db, 'invoices'), payload);
        return { id: ref.id, ...payload };
    };

    const deleteInvoice = async (id) => await updateDoc(doc(db, 'invoices', id), { isDeleted: true, deletedAt: new Date().toISOString() });
    const restoreInvoice = async (id) => await updateDoc(doc(db, 'invoices', id), { isDeleted: false, deletedAt: null });
    const deleteInvoicePermanently = async (id) => await deleteDoc(doc(db, 'invoices', id));

    const updateInvoice = async (id, d) => await updateDoc(doc(db, 'invoices', id), cleanData(d));
    const updateInvoiceStatus = async (id, s) => await updateDoc(doc(db, 'invoices', id), { status: s });

    const saveQuote = async (d) => {
        await checkInvoiceLimitFn();
        const payload = cleanData({ ...d, userId: currentUser.uid, createdAt: new Date().toISOString() });
        const ref = await addDoc(collection(db, 'quotes'), payload);
        return { id: ref.id, ...payload };
    };
    const deleteQuote = async (id) => await updateDoc(doc(db, 'quotes', id), { isDeleted: true, deletedAt: new Date().toISOString() });
    const restoreQuote = async (id) => await updateDoc(doc(db, 'quotes', id), { isDeleted: false, deletedAt: null });
    const deleteQuotePermanently = async (id) => await deleteDoc(doc(db, 'quotes', id));

    const saveExpense = async (d) => {
        const payload = cleanData({ ...d, userId: currentUser.uid, createdAt: new Date().toISOString() });
        await addDoc(collection(db, 'expenses'), payload);
    };
    const deleteExpense = async (id) => await updateDoc(doc(db, 'expenses', id), { isDeleted: true, deletedAt: new Date().toISOString() });
    const restoreExpense = async (id) => await updateDoc(doc(db, 'expenses', id), { isDeleted: false, deletedAt: null });
    const deleteExpensePermanently = async (id) => await deleteDoc(doc(db, 'expenses', id));

    const saveRecurringTemplate = async (d) => {
        const payload = cleanData({ ...d, userId: currentUser.uid, createdAt: new Date().toISOString(), active: true });
        await addDoc(collection(db, 'recurring_templates'), payload);
    };
    const updateRecurringTemplate = async (id, data) => {
        await updateDoc(doc(db, 'recurring_templates', id), cleanData({ ...data, updatedAt: new Date().toISOString() }));
    };
    const deleteRecurringTemplate = async (id) => await deleteDoc(doc(db, 'recurring_templates', id));

    // Recursively removes undefined values from data to prevent Firestore errors
    const cleanData = (obj) => {
        if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return obj;
        const clean = {};
        Object.keys(obj).forEach(key => {
            if (obj[key] !== undefined) {
                // Recursively clean nested objects (e.g. industryData)
                if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                    clean[key] = cleanData(obj[key]);
                } else if (Array.isArray(obj[key])) {
                    // Clean arrays of objects too (e.g. invoice items)
                    clean[key] = obj[key].map(item =>
                        (item !== null && typeof item === 'object') ? cleanData(item) : item
                    );
                } else {
                    clean[key] = obj[key];
                }
            }
        });
        return clean;
    };

    const updateProfile = async (d) => {
        if (!currentUser) throw new Error('Authentication required');
        const editableData = Object.fromEntries(
            COMPANY_PROFILE_EDITABLE_FIELDS
                .filter(field => d[field] !== undefined)
                .map(field => [field, d[field]])
        );
        const sanitizedData = cleanData(editableData);

        await setDoc(doc(db, 'users', currentUser.uid), sanitizedData, { merge: true });
    };

    const updateCustomization = async (d) => {
        if (!currentUser) return;
        const sanitizedData = cleanData(d);
        await setDoc(doc(db, 'customizations', currentUser.uid), sanitizedData, { merge: true });
    };

    const clearAllData = async () => {
        if (!currentUser) return;
        const colls = ['invoices', 'quotes', 'expenses', 'recurring_templates'];
        for (const c of colls) {
            const q = query(collection(db, c), where('userId', '==', currentUser.uid));
            const snap = await getDocs(q);
            const batch = writeBatch(db);
            snap.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
        }
    };

    const addExpenseCategory = async (cat) => {
        if (!cat) return;
        if (!expenseCategories.includes(cat)) {
            const newCategories = [...expenseCategories, cat];
            setExpenseCategories(newCategories);
            if (currentUser) {
                await setDoc(doc(db, 'customizations', currentUser.uid), { expenseCategories: newCategories }, { merge: true });
            }
        }
    };

    const exportToCSV = (data, filename) => {
        if (!data || data.length === 0) return;

        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(obj => {
            return Object.values(obj).map(val => {
                const str = String(val).replace(/"/g, '""');
                return `"${str}"`;
            }).join(',');
        });

        const csv = `${headers}\n${rows.join('\n')}`;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <InvoiceContext.Provider value={{ 
            invoices, quotes, expenses, recurringTemplates, companyProfile, invoiceCustomization, loading,
            profileReady, profileError,
            deletedInvoices, deletedQuotes, deletedExpenses,
            saveInvoice, deleteInvoice, restoreInvoice, deleteInvoicePermanently, updateInvoice, updateInvoiceStatus,
            saveQuote, deleteQuote, restoreQuote, deleteQuotePermanently, saveExpense, deleteExpense, restoreExpense, deleteExpensePermanently, saveRecurringTemplate, updateRecurringTemplate, deleteRecurringTemplate,
            updateProfile, updateCustomization,
            clearAllData,
            expenseCategories, addExpenseCategory, exportToCSV,
            CURRENCIES: [{ code: 'EUR', symbol: '€', label: 'Euro' }, { code: 'USD', symbol: '$', label: 'US Dollar' }, { code: 'TRY', symbol: '₺', label: 'Türk Lirası' }],
            STATUSES: { draft: { label: 'Entwurf', color: '#94a3b8' }, sent: { label: 'Gesendet', color: '#3b82f6' }, paid: { label: 'Bezahlt', color: '#10b981' }, overdue: { label: 'Überfällig', color: '#ef4444' } }
        }}>
            {children}
        </InvoiceContext.Provider>
    );
};

export const useInvoice = () => useContext(InvoiceContext);
