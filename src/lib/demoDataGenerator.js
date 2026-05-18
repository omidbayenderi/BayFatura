// src/lib/demoDataGenerator.js

const CUSTOMERS = [
    "TechNova Solutions", 
    "Global Industries AG", 
    "Stark Logistics", 
    "Acme Corp", 
    "Wayne Enterprises", 
    "Umbrella Logistics"
];

const EXPENSE_VENDORS = ["Amazon AWS", "Adobe Cloud", "Office Depot", "Google Workspace", "Apple Store", "Shell Gas Station"];
const EXPENSE_CATEGORIES = ['spareParts', 'rent', 'marketing', 'software', 'insurance', 'others'];

const INVOICE_ITEMS = [
    { description: "Frontend Development (40 Hours)", price: 3500 },
    { description: "UI/UX Design Concept", price: 1800 },
    { description: "Server Maintenance & Hosting", price: 450 },
    { description: "Logistics API Integration", price: 2100 },
    { description: "Consulting Service", price: 900 },
];

const getRandomDate = (start, end) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
};

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const generateDemoData = async (saveInvoice, saveExpense, saveQuote, saveRecurringTemplate) => {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    
    // 1. Generate Invoices
    for (let i = 0; i < 15; i++) {
        const item = getRandomItem(INVOICE_ITEMS);
        const qty = Math.floor(Math.random() * 2) + 1;
        const subtotal = item.price * qty;
        const tax = subtotal * 0.19;
        const total = subtotal + tax;
        
        let status = 'paid';
        const rand = Math.random();
        // Give a realistic mix of statuses
        if (rand > 0.8) status = 'draft';
        else if (rand > 0.6) status = 'sent';
        else if (rand > 0.5) status = 'overdue';

        await saveInvoice({
            invoiceNumber: `${today.getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')}`,
            recipientName: getRandomItem(CUSTOMERS),
            recipientStreet: "Musterstraße " + Math.floor(Math.random() * 100),
            recipientCity: getRandomItem(["Berlin", "München", "Hamburg", "Frankfurt", "Köln"]),
            recipientZip: String(Math.floor(Math.random() * 90000) + 10000),
            date: getRandomDate(sixMonthsAgo, today),
            status: status,
            currency: 'EUR',
            taxRate: 19,
            items: [{ description: item.description, quantity: qty, price: item.price }],
            subtotal,
            tax,
            total
        });
    }

    // 2. Generate Expenses
    for (let i = 0; i < 10; i++) {
        const isTaxed = Math.random() > 0.2;
        const amount = Math.floor(Math.random() * 800) + 50;
        
        await saveExpense({
            description: "Monthly Service " + (i + 1),
            vendor: getRandomItem(EXPENSE_VENDORS),
            category: getRandomItem(EXPENSE_CATEGORIES),
            amount: amount,
            taxRate: isTaxed ? 19 : 0,
            date: getRandomDate(sixMonthsAgo, today),
            hasReceipt: Math.random() > 0.5
        });
    }

    // 3. Generate Quotes (Optional, but adds to the feel)
    for (let i = 0; i < 3; i++) {
        const item = getRandomItem(INVOICE_ITEMS);
        const qty = Math.floor(Math.random() * 3) + 1;
        await saveQuote({
            quoteNumber: `ANGB-${today.getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`,
            recipientName: getRandomItem(CUSTOMERS),
            date: getRandomDate(sixMonthsAgo, today),
            status: Math.random() > 0.5 ? 'accepted' : 'pending',
            currency: 'EUR',
            taxRate: 19,
            items: [{ description: item.description, quantity: qty, price: item.price }],
            subtotal: item.price * qty,
            tax: (item.price * qty) * 0.19,
            total: (item.price * qty) * 1.19
        });
    }
    // 4. Generate Recurring Templates
    if (saveRecurringTemplate) {
        const freqData = [
            { freq: 'monthly', desc: 'Premium Cloud Hosting & Support', currency: 'EUR' },
            { freq: 'quarterly', desc: 'Wartungsvertrag Quartal', currency: 'EUR' },
            { freq: 'yearly', desc: 'Annual License Renewal', currency: 'USD' },
        ];
        for (const fd of freqData) {
            const today = new Date();
            const nextDate = new Date(today);
            switch (fd.freq) {
                case 'monthly': nextDate.setDate(nextDate.getDate() + 7); break;
                case 'quarterly': nextDate.setMonth(nextDate.getMonth() + 1); break;
                case 'yearly': nextDate.setMonth(nextDate.getMonth() + 2); break;
            }
            await saveRecurringTemplate({
                recipientName: getRandomItem(CUSTOMERS),
                amount: Math.floor(Math.random() * 500) + 99,
                frequency: fd.freq,
                description: fd.desc,
                currency: fd.currency,
                active: true,
                nextInvoiceDate: nextDate.toISOString().split('T')[0],
            });
        }
    }
    
    return true;
};
