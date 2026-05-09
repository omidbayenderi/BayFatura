import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import '../index.css';
import InvoiceEditor from './InvoiceEditor';
import InvoicePaper from './InvoicePaper';

const InvoiceForm = () => {
    const invoiceRef = useRef();

    // Initial state setup
    const [formData, setFormData] = useState({
        // Sender (Werkstatt)
        senderCompany: 'SH Autoservice',
        senderStreet: 'Schillerstraße',
        senderHouseNum: '2',
        senderZip: '37269',
        senderCity: 'Eschwege',
        senderPhone: '+49 (0) 176 841 500 97',
        senderEmail: 'shautoservice.2025@gmail.com',
        senderTaxId: '123/456/7890', // Steuernummer
        senderVatId: 'DE123456789',   // USt-IdNr

        // Recipient (Kunde)
        recipientName: 'Max Mustermann',
        recipientStreet: 'Musterstraße',
        recipientHouseNum: '1',
        recipientZip: '12345',
        recipientCity: 'Musterstadt',
        recipientTaxId: '', // Optional default
        recipientVatId: '', // Optional default

        // Invoice Meta
        invoiceNumber: '2025-0001',
        date: new Date().toISOString().split('T')[0],

        // Vehicle
        vehicle: 'VW Golf VII',
        plate: 'F-XY 123',
        km: '125000',

        // Items
        items: [
            { description: 'Service / Ersatzteil', quantity: 1, price: 0 },
        ],

        // Footer
        footerPayment: 'Zahlungsbedingungen:\nZahlbar innerhalb von 14 Tagen ohne Abzug auf folgendes Konto:\nIBAN: DE73 5227 0024 0859 6561 00\nBank: Deutsche Bank\nZahlungsart: Bar',
        footerNote: 'Hinweis:\nVielen Dank für den Auftrag und das entgegengebrachte Vertrauen.'
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = field === 'description' ? value : (field === 'price' || field === 'quantity' ? value : value);
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleAddItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { description: '', quantity: 1, price: 0 }]
        }));
    };

    const handleDeleteItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const calculateTotals = () => {
        const subtotal = formData.items.reduce((sum, item) => {
            const q = parseFloat(item.quantity) || 0;
            const p = parseFloat(item.price) || 0;
            return sum + (q * p);
        }, 0);
        const taxRate = 0.19;
        const tax = subtotal * taxRate;
        const total = subtotal + tax;
        return { subtotal, tax, total };
    };

    const totals = calculateTotals();

    const handleDownloadPdf = async () => {
        const element = invoiceRef.current;
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(element, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Rechnung_${formData.invoiceNumber}.pdf`);
    };

    return (
        <div className="app-container">
            <div className="dashboard-grid">
                {/* Editor UI (Visible) */}
                <InvoiceEditor
                    data={formData}
                    onChange={handleInputChange}
                    onItemChange={handleItemChange}
                    onAddItem={handleAddItem}
                    onDeleteItem={handleDeleteItem}
                    onPdf={handleDownloadPdf}
                    totals={totals}
                />

                {/* Future: Right column could be a live min-preview or helper actions */}
            </div>

            {/* Hidden Paper (For PDF Generation) */}
            <div className="hidden-print-container">
                <InvoicePaper
                    ref={invoiceRef}
                    data={formData}
                    totals={totals}
                />
            </div>
        </div>
    );
};

export default InvoiceForm;
