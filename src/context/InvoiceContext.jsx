import React, { createContext, useContext, useState, useEffect } from 'react';

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
    bic: '', // e.g. DEUTDEDB522
    paymentTerms: 'Zahlbar innerhalb von 14 Tagen ohne Abzug. \nZahlungsart: Überweisung / Bar',
    defaultCurrency: 'EUR',
    defaultTaxRate: 19,
    paypalMe: '', // e.g. https://paypal.me/user
    stripeLink: '', // e.g. https://buy.stripe.com/test

    // Premium Configuration
    plan: 'premium', // Default to premium for this demo
    industry: 'general', // Default to general
    logoDisplayMode: 'both', // 'logoOnly', 'nameOnly', 'both'
    stripeApiKey: '',
    stripeWebhookSecret: '',
    paypalClientId: '',
    paypalSecret: ''
};

export const InvoiceProvider = ({ children }) => {
    // State: Company Profile - Merge saved data with defaults for new fields
    const [companyProfile, setCompanyProfile] = useState(() => {
        const saved = localStorage.getItem('bay_profile');
        return saved ? { ...INITIAL_COMPANY_PROFILE, ...JSON.parse(saved) } : INITIAL_COMPANY_PROFILE;
    });

    // State: Invoice Archive
    const [invoices, setInvoices] = useState(() => {
        const saved = localStorage.getItem('bay_invoices');
        return saved ? JSON.parse(saved) : [];
    });

    // State: Quotes
    const [quotes, setQuotes] = useState(() => {
        const saved = localStorage.getItem('bay_quotes');
        return saved ? JSON.parse(saved) : [];
    });

    // State: Expenses
    const [expenses, setExpenses] = useState(() => {
        const saved = localStorage.getItem('bay_expenses');
        return saved ? JSON.parse(saved) : [];
    });

    // State: Recurring Invoice Templates
    const [recurringTemplates, setRecurringTemplates] = useState(() => {
        const saved = localStorage.getItem('bay_recurring');
        return saved ? JSON.parse(saved) : [];
    });

    // State: Expense Categories
    const [expenseCategories, setExpenseCategories] = useState(() => {
        const saved = localStorage.getItem('bay_expense_categories');
        const defaults = ['spareParts', 'rent', 'marketing', 'software', 'insurance', 'others'];
        return saved ? JSON.parse(saved) : defaults;
    });

    // State: Invoice Customization
    const [invoiceCustomization, setInvoiceCustomization] = useState(() => {
        const saved = localStorage.getItem('bay_invoice_customization');
        return saved ? JSON.parse(saved) : {
            primaryColor: '#8B5CF6',
            accentColor: '#6366F1',
            brandPalette: [], // Colors extracted from logo
            signatureUrl: null,
            footerText: '',
            quoteValidityDays: 30
        };
    });

    // State: Payment Reminders
    const [paymentReminders, setPaymentReminders] = useState(() => {
        const saved = localStorage.getItem('bay_payment_reminders');
        return saved ? JSON.parse(saved) : [];
    });

    // State: Employees / Users
    const [employees, setEmployees] = useState(() => {
        const saved = localStorage.getItem('bay_employees');
        return saved ? JSON.parse(saved) : [
            { id: 1, name: INITIAL_COMPANY_PROFILE.owner, email: INITIAL_COMPANY_PROFILE.email, role: 'Admin', sites: ['All Sites'], status: 'Active' },
            { id: 2, name: 'Ahmet Yılmaz', email: 'ahmet@firma.com', role: 'Site Lead', sites: ['Site A'], status: 'Active' },
            { id: 3, name: 'Mehmet Demir', email: 'mehmet@firma.com', role: 'Accountant', sites: ['HQ'], status: 'Active' }
        ];
    });

    // Save Profile
    useEffect(() => {
        localStorage.setItem('bay_profile', JSON.stringify(companyProfile));
    }, [companyProfile]);

    // Save Invoices
    useEffect(() => {
        localStorage.setItem('bay_invoices', JSON.stringify(invoices));
    }, [invoices]);

    // Save Quotes
    useEffect(() => {
        localStorage.setItem('bay_quotes', JSON.stringify(quotes));
    }, [quotes]);

    // Save Expenses
    useEffect(() => {
        localStorage.setItem('bay_expenses', JSON.stringify(expenses));
    }, [expenses]);

    // Save Recurring
    useEffect(() => {
        localStorage.setItem('bay_recurring', JSON.stringify(recurringTemplates));
    }, [recurringTemplates]);

    // Save Categories
    useEffect(() => {
        localStorage.setItem('bay_expense_categories', JSON.stringify(expenseCategories));
    }, [expenseCategories]);

    // Save Customization
    useEffect(() => {
        localStorage.setItem('bay_invoice_customization', JSON.stringify(invoiceCustomization));
    }, [invoiceCustomization]);

    // Save Payment Reminders
    useEffect(() => {
        localStorage.setItem('bay_payment_reminders', JSON.stringify(paymentReminders));
    }, [paymentReminders]);

    // Save Employees
    useEffect(() => {
        localStorage.setItem('bay_employees', JSON.stringify(employees));
    }, [employees]);

    // State: Messages
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem('bay_messages');
        return saved ? JSON.parse(saved) : [
            { id: 1, type: 'alert', title: 'Daily Report Missing', message: 'Şantiye Kuzey hasn\'t submitted today\'s report.', time: new Date().toISOString(), status: 'unread', sender: 'System', category: 'system' },
            { id: 2, type: 'message', title: 'New Feedback', message: 'Materials arrived on site.', time: new Date(Date.now() - 86400000).toISOString(), status: 'read', sender: 'Ahmet Yılmaz', category: 'internal' },
            { id: 3, type: 'message', title: 'Invoice Inquiry', message: 'Can you please send the invoice for last week\'s service?', time: new Date(Date.now() - 172800000).toISOString(), status: 'unread', sender: 'Müller Bau GmbH', category: 'customer' }
        ];
    });

    // Save Messages
    useEffect(() => {
        localStorage.setItem('bay_messages', JSON.stringify(messages));
    }, [messages]);

    const addExpenseCategory = (newCategory) => {
        if (!newCategory) return;
        if (!expenseCategories.includes(newCategory)) {
            setExpenseCategories(prev => [...prev, newCategory]);
        }
    };

    const deleteExpenseCategory = (cat) => {
        const nonDeletable = ['spareParts', 'rent', 'marketing', 'software', 'insurance', 'others'];
        if (nonDeletable.includes(cat)) return;
        setExpenseCategories(prev => prev.filter(c => c !== cat));
    };

    const saveInvoice = (invoiceData) => {
        const newInvoice = {
            id: Date.now(),
            createdAt: new Date().toISOString(),
            ...invoiceData
        };
        setInvoices(prev => [newInvoice, ...prev]);
        return newInvoice;
    };

    const deleteInvoice = (id) => {
        const idStr = String(id);
        setInvoices(prev => prev.filter(inv => String(inv.id) !== idStr));
        return true;
    };

    const saveQuote = (quoteData) => {
        const newQuote = {
            id: Date.now(),
            createdAt: new Date().toISOString(),
            ...quoteData
        };
        setQuotes(prev => [newQuote, ...prev]);
        return newQuote;
    };

    const deleteQuote = (id) => {
        const idStr = String(id);
        setQuotes(prev => prev.filter(q => String(q.id) !== idStr));
        return true;
    };

    const updateQuote = (id, newData) => {
        setQuotes(prev => prev.map(q =>
            String(q.id) === String(id) ? { ...q, ...newData, updatedAt: new Date().toISOString() } : q
        ));
    };

    const saveExpense = (expenseData) => {
        const newExpense = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            ...expenseData
        };
        setExpenses(prev => [newExpense, ...prev]);
    };

    const deleteExpense = (id) => {
        setExpenses(prev => prev.filter(exp => exp.id !== id));
    };

    const saveRecurringTemplate = (templateData) => {
        const newTemplate = {
            id: Date.now(),
            ...templateData,
            lastGenerated: null
        };
        setRecurringTemplates(prev => [newTemplate, ...prev]);
    };

    const deleteRecurringTemplate = (id) => {
        setRecurringTemplates(prev => prev.filter(t => t.id !== id));
    };

    const updateProfile = (newData) => {
        setCompanyProfile(prev => ({ ...prev, ...newData }));
    };

    const updateInvoiceStatus = (id, newStatus) => {
        setInvoices(prev => prev.map(inv =>
            String(inv.id) === String(id) ? { ...inv, status: newStatus } : inv
        ));
    };

    const updateInvoice = (id, newData) => {
        setInvoices(prev => prev.map(inv =>
            String(inv.id) === String(id) ? { ...inv, ...newData, updatedAt: new Date().toISOString() } : inv
        ));
    };

    // Customization Management
    const updateCustomization = (newData) => {
        setInvoiceCustomization(prev => ({ ...prev, ...newData }));
    };

    // Payment Reminders Management
    const addPaymentReminder = (reminderData) => {
        const newReminder = {
            id: Date.now(),
            createdAt: new Date().toISOString(),
            emailSent: false,
            ...reminderData
        };
        setPaymentReminders(prev => [newReminder, ...prev]);
    };

    const deletePaymentReminder = (id) => {
        setPaymentReminders(prev => prev.filter(r => r.id !== id));
    };

    // Employee Management
    const saveEmployee = (empData) => {
        const newEmployee = {
            id: Date.now(),
            createdAt: new Date().toISOString(),
            status: 'Active',
            ...empData
        };
        setEmployees(prev => [...prev, newEmployee]);
        return newEmployee;
    };

    const deleteEmployee = (id) => {
        setEmployees(prev => prev.filter(e => e.id !== id));
    };

    const updateEmployee = (id, newData) => {
        setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...newData } : e));
    };

    // Message Management
    const sendMessage = (msgData) => {
        const newMessage = {
            id: Date.now(),
            time: new Date().toISOString(),
            status: 'unread',
            type: 'message', // alert, warning, success, message
            ...msgData
        };
        setMessages(prev => [newMessage, ...prev]);
        return newMessage;
    };

    const markMessageAsRead = (id) => {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'read' } : m));
    };

    const deleteMessage = (id) => {
        setMessages(prev => prev.filter(m => m.id !== id));
    };

    // Export Helper
    const exportToCSV = (data, filename) => {
        if (!data || data.length === 0) return;

        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(obj => {
            return Object.values(obj).map(val => {
                const str = String(val).replace(/"/g, '""');
                return `"${str}"`;
            }).join(',');
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
        viewed: { label: 'Gesehen', color: '#8b5cf6' },
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
            paymentReminders,
            saveInvoice,
            deleteInvoice,
            saveQuote,
            deleteQuote,
            updateQuote,
            saveExpense,
            deleteExpense,
            saveRecurringTemplate,
            deleteRecurringTemplate,
            updateProfile,
            updateInvoiceStatus,
            updateInvoice,
            updateCustomization,
            addPaymentReminder,
            deletePaymentReminder,
            exportToCSV,
            expenseCategories,
            addExpenseCategory,
            deleteExpenseCategory,
            CURRENCIES,
            STATUSES,
            employees,
            saveEmployee,
            deleteEmployee,
            updateEmployee,
            messages,
            sendMessage,
            markMessageAsRead,
            deleteMessage
        }}>
            {children}
        </InvoiceContext.Provider>
    );
};

export const useInvoice = () => useContext(InvoiceContext);
