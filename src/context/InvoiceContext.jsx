import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { 
    collection, 
    addDoc, 
    deleteDoc, 
    doc, 
    onSnapshot, 
    query, 
    where, 
    orderBy,
    updateDoc,
    setDoc,
    getDoc
} from 'firebase/firestore';

const InvoiceContext = createContext();

const INITIAL_COMPANY_PROFILE = {
    logo: null,
    companyName: 'SH Bau & Construction',
    owner: 'Omid Bayenderi',
    street: 'Schillerstraße',
    houseNum: '2',
    zip: '37269',
    city: 'Eschwege',
    phone: '+49 (0) 176 841 500 97',
    email: 'shbau.2026@gmail.com',
    taxId: '123/456/7890',
    vatId: 'DE123456789',
    bankName: 'Deutsche Bank',
    iban: 'DE73 5227 0024 0859 6561 00',
    bic: '',
    paymentTerms: 'Zahlbar innerhalb von 14 Tagen ohne Abzug. \nZahlungsart: Überweisung / Bar',
    defaultCurrency: 'EUR',
    defaultTaxRate: 19,
    paypalMe: '',
    stripeLink: '',
    plan: 'premium',
    industry: 'automotive',
    logoDisplayMode: 'both'
};

export const InvoiceProvider = ({ children }) => {
    const [companyProfile, setCompanyProfile] = useState(INITIAL_COMPANY_PROFILE);
    const [invoices, setInvoices] = useState([]);
    const [quotes, setQuotes] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [recurringTemplates, setRecurringTemplates] = useState([]);
    const [expenseCategories, setExpenseCategories] = useState(['spareParts', 'rent', 'marketing', 'software', 'insurance', 'others']);
    const [invoiceCustomization, setInvoiceCustomization] = useState({
        primaryColor: '#8B5CF6',
        accentColor: '#6366F1',
        brandPalette: [],
        signatureUrl: null,
        footerText: '',
        quoteValidityDays: 30
    });
    const [employees, setEmployees] = useState([]);
    const [messages, setMessages] = useState([]);

    // 1. Sync Profile & Customization from Firestore
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        const profileUnsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
            if (snapshot.exists()) {
                setCompanyProfile(prev => ({ ...prev, ...snapshot.data() }));
            } else {
                // Initialize profile if not exists
                setDoc(doc(db, 'users', user.uid), INITIAL_COMPANY_PROFILE);
            }
        });

        const customizationUnsubscribe = onSnapshot(doc(db, 'customizations', user.uid), (snapshot) => {
            if (snapshot.exists()) {
                setInvoiceCustomization(prev => ({ ...prev, ...snapshot.data() }));
            }
        });

        return () => {
            profileUnsubscribe();
            customizationUnsubscribe();
        };
    }, [auth.currentUser]);

    // 2. Sync Invoices from Firestore
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
            setInvoices([]);
            return;
        }

        const q = query(
            collection(db, 'invoices'), 
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setInvoices(data);
        });

        return unsubscribe;
    }, [auth.currentUser]);

    // 3. Sync Quotes from Firestore
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
            setQuotes([]);
            return;
        }

        const q = query(
            collection(db, 'quotes'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setQuotes(data);
        });

        return unsubscribe;
    }, [auth.currentUser]);

    // 4. Sync Expenses from Firestore
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
            setExpenses([]);
            return;
        }

        const q = query(
            collection(db, 'expenses'),
            where('userId', '==', user.uid),
            orderBy('date', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setExpenses(data);
        });

        return unsubscribe;
    }, [auth.currentUser]);

    // Actions
    const saveInvoice = async (invoiceData) => {
        const user = auth.currentUser;
        if (!user) return;

        const newInvoice = {
            ...invoiceData,
            userId: user.uid,
            createdAt: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, 'invoices'), newInvoice);
        return { id: docRef.id, ...newInvoice };
    };

    const deleteInvoice = async (id) => {
        await deleteDoc(doc(db, 'invoices', id));
    };

    const saveQuote = async (quoteData) => {
        const user = auth.currentUser;
        if (!user) return;

        const newQuote = {
            ...quoteData,
            userId: user.uid,
            createdAt: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, 'quotes'), newQuote);
        return { id: docRef.id, ...newQuote };
    };

    const deleteQuote = async (id) => {
        await deleteDoc(doc(db, 'quotes', id));
    };

    const updateQuote = async (id, newData) => {
        await updateDoc(doc(db, 'quotes', id), newData);
    };

    const saveExpense = async (expenseData) => {
        const user = auth.currentUser;
        if (!user) return;

        await addDoc(collection(db, 'expenses'), {
            ...expenseData,
            userId: user.uid,
            date: expenseData.date || new Date().toISOString().split('T')[0]
        });
    };

    const deleteExpense = async (id) => {
        await deleteDoc(doc(db, 'expenses', id));
    };

    const updateProfile = async (newData) => {
        const user = auth.currentUser;
        if (!user) return;
        await updateDoc(doc(db, 'users', user.uid), newData);
    };

    const updateCustomization = async (newData) => {
        const user = auth.currentUser;
        if (!user) return;
        
        const docRef = doc(db, 'customizations', user.uid);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
            await updateDoc(docRef, newData);
        } else {
            await setDoc(docRef, newData);
        }
    };

    const updateInvoice = async (id, newData) => {
        await updateDoc(doc(db, 'invoices', id), newData);
    };

    const updateInvoiceStatus = async (id, newStatus) => {
        await updateDoc(doc(db, 'invoices', id), { status: newStatus });
    };

    const CURRENCIES = [
        { code: 'EUR', symbol: '€', label: 'Euro' },
        { code: 'USD', symbol: '$', label: 'US Dollar' },
        { code: 'TRY', symbol: '₺', label: 'Türk Lirası' },
        { code: 'GBP', symbol: '£', label: 'British Pound' }
    ];

    const STATUSES = {
        draft: { label: 'Entwurf', color: '#94a3b8' },
        sent: { label: 'Gesendet', color: '#3b82f6' },
        paid: { label: 'Bezahlt', color: '#10b981' },
        partial: { label: 'Teilweise', color: '#f59e0b' },
        overdue: { label: 'Überfällig', color: '#ef4444' }
    };

    return (
        <InvoiceContext.Provider value={{
            companyProfile,
            invoices,
            quotes,
            expenses,
            recurringTemplates,
            invoiceCustomization,
            saveInvoice,
            deleteInvoice,
            saveQuote,
            deleteQuote,
            updateQuote,
            saveExpense,
            deleteExpense,
            updateProfile,
            updateInvoiceStatus,
            updateInvoice,
            updateCustomization,
            expenseCategories,
            CURRENCIES,
            STATUSES,
            employees,
            messages
        }}>
            {children}
        </InvoiceContext.Provider>
    );
};

export const useInvoice = () => useContext(InvoiceContext);
