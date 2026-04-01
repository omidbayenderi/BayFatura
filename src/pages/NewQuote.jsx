import React, { useState, useRef } from 'react';
import { useInvoice } from '../context/InvoiceContext';
import InvoicePaper from '../components/InvoicePaper';
import { Save, Printer, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getIndustryFields } from '../config/industryFields';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const NewQuote = () => {
    const { companyProfile, saveQuote } = useInvoice();
    const { t, appLanguage } = useLanguage();
    const navigate = useNavigate();
    const invoiceRef = useRef();

    // Get industry-specific fields configuration
    const industryConfig = getIndustryFields(companyProfile.industry || 'general');

    // Local state - industryData stores dynamic fields based on selected industry
    const [invoiceData, setInvoiceData] = useState({
        recipientName: '',
        recipientStreet: '',
        recipientHouseNum: '',
        recipientZip: '',
        recipientCity: '',
        // Format: AN-YYYY-XXXX (AN for "Angebot" or something similar)
        invoiceNumber: 'AN-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 1000)).padStart(4, '0'),
        date: new Date().toISOString().split('T')[0],
        currency: companyProfile.defaultCurrency || 'EUR',
        taxRate: companyProfile.defaultTaxRate || 19,
        status: 'draft',
        items: [{ description: '', quantity: 1, price: 0 }],
        footerNote: 'Gerne erwarten wir Ihre Auftragserteilung.',
        industryData: {}, // Dynamic fields based on industry
        type: 'quote' // Explicitly set type to quote
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setInvoiceData(prev => ({ ...prev, [name]: value }));
    };

    // Handler for industry-specific fields
    const handleIndustryFieldChange = (fieldName, value) => {
        setInvoiceData(prev => ({
            ...prev,
            industryData: { ...prev.industryData, [fieldName]: value }
        }));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...invoiceData.items];
        newItems[index][field] = field === 'description' ? value : value;
        setInvoiceData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setInvoiceData(prev => ({
            ...prev,
            items: [...prev.items, { description: '', quantity: 1, price: 0 }]
        }));
    };

    const deleteItem = (index) => {
        setInvoiceData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    // Merge Profile + Invoice Data for the Paper
    const fullData = {
        // Map Context Profile to Paper Props
        logo: companyProfile.logo,
        senderCompany: companyProfile.companyName,
        senderStreet: companyProfile.street,
        senderHouseNum: companyProfile.houseNum,
        senderZip: companyProfile.zip,
        senderCity: companyProfile.city,
        senderPhone: companyProfile.phone,
        senderEmail: companyProfile.email,
        senderTaxId: companyProfile.taxId,
        senderVatId: companyProfile.vatId,
        senderBank: companyProfile.bankName,
        senderIban: companyProfile.iban,
        senderBic: companyProfile.bic,
        paypalMe: companyProfile.paypalMe,
        stripeLink: companyProfile.stripeLink,
        industry: companyProfile.industry || 'automotive',
        logoDisplayMode: companyProfile.logoDisplayMode || 'both',

        // Footer Data from Profile
        footerPayment: `Bank: ${companyProfile.bankName}\\nIBAN: ${companyProfile.iban}\\n${companyProfile.paymentTerms}`,

        // Quote Specifics
        ...invoiceData,
        // Flatten industryData for paper
        ...invoiceData.industryData
    };

    // Calculate totals for UI
    const calculateTotals = () => {
        const subtotal = invoiceData.items.reduce((sum, item) => sum + (parseFloat(item.quantity || 0) * parseFloat(item.price || 0)), 0);
        const tax = subtotal * (parseFloat(invoiceData.taxRate || 0) / 100);
        const total = subtotal + tax;
        return { subtotal, tax, total };
    };
    const totals = calculateTotals();

    const handleSaveAndPrint = async () => {
        // 1. Save to Quotes List
        const newQuote = saveQuote({
            ...invoiceData,
            ...totals,
            senderSnapshot: companyProfile
        });

        // 2. Navigate to Quote View with autoprint
        if (newQuote && newQuote.id) {
            navigate(`/quote/${newQuote.id}?autoprint=true`);
        } else {
            navigate('/quotes');
        }
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <h1>{t('newQuote')}</h1>
                <div className="actions">
                    <button className="primary-btn" onClick={handleSaveAndPrint}>
                        <Printer size={20} />
                        {t('saveAndPrint')}
                    </button>
                </div>
            </header>

            <div className="editor-layout">
                {/* Linke Seite: Eingabeformular */}
                <div className="input-section">

                    <div className="card">
                        <h3>{t('customerInfo')}</h3>
                        <div className="form-group">
                            <label>{t('customer')}</label>
                            <input className="form-input" name="recipientName" value={invoiceData.recipientName} onChange={handleChange} placeholder="e.g. Max Mustermann" />
                        </div>
                        <div className="form-row">
                            <div className="form-group" style={{ flex: 2 }}>
                                <label>{t('street')}</label>
                                <input className="form-input" name="recipientStreet" value={invoiceData.recipientStreet} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>{t('houseNum')}</label>
                                <input className="form-input" name="recipientHouseNum" value={invoiceData.recipientHouseNum} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('zip')}</label>
                                <input className="form-input" name="recipientZip" value={invoiceData.recipientZip} onChange={handleChange} />
                            </div>
                            <div className="form-group" style={{ flex: 2 }}>
                                <label>{t('city')}</label>
                                <input className="form-input" name="recipientCity" value={invoiceData.recipientCity} onChange={handleChange} />
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3>{industryConfig.icon} {appLanguage === 'tr' ? industryConfig.sectionTitleTR : industryConfig.sectionTitle}</h3>

                        {/* Dynamic Industry-Specific Fields */}
                        <div className="form-row">
                            {industryConfig.fields.slice(0, 2).map(field => (
                                <div className="form-group" key={field.name}>
                                    <label>{appLanguage === 'tr' ? field.labelTR : field.label}</label>
                                    <input
                                        type={field.type}
                                        className="form-input"
                                        value={invoiceData.industryData[field.name] || ''}
                                        onChange={(e) => handleIndustryFieldChange(field.name, e.target.value)}
                                        placeholder={field.placeholder}
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="form-row">
                            {industryConfig.fields.slice(2, 4).map(field => (
                                <div className="form-group" key={field.name}>
                                    <label>{appLanguage === 'tr' ? field.labelTR : field.label}</label>
                                    <input
                                        type={field.type}
                                        className="form-input"
                                        value={invoiceData.industryData[field.name] || ''}
                                        onChange={(e) => handleIndustryFieldChange(field.name, e.target.value)}
                                        placeholder={field.placeholder}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Standard Invoice Fields */}
                        <div className="form-row" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                            <div className="form-group">
                                <label>{t('quoteNumber')}</label>
                                <input className="form-input" name="invoiceNumber" value={invoiceData.invoiceNumber} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>{t('date')}</label>
                                <input type="date" className="form-input" name="date" value={invoiceData.date} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('currency')}</label>
                                <select className="form-input" name="currency" value={invoiceData.currency} onChange={handleChange}>
                                    <option value="EUR">Euro (€)</option>
                                    <option value="USD">US Dollar ($)</option>
                                    <option value="TRY">Türk Lirası (₺)</option>
                                    <option value="GBP">British Pound (£)</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('taxRate')} (MwSt %)</label>
                                <input type="number" className="form-input" name="taxRate" value={invoiceData.taxRate} onChange={handleChange} />
                            </div>
                        </div>
                    </div>

                    <div className="card full-width">
                        <div className="card-header">
                            <h3>{companyProfile.industry === 'general' ? t('genericService') : t('items')}</h3>
                        </div>
                        <table className="items-editor-table">
                            <thead>
                                <tr>
                                    <th>{t('description')}</th>
                                    <th style={{ width: '80px' }}>{t('quantity')}</th>
                                    <th style={{ width: '100px' }}>{t('price')} ({invoiceData.currency === 'TRY' ? '₺' : invoiceData.currency === 'USD' ? '$' : invoiceData.currency === 'GBP' ? '£' : '€'})</th>
                                    <th style={{ width: '40px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoiceData.items.map((item, index) => (
                                    <tr key={index}>
                                        <td>
                                            <input className="form-input" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} />
                                        </td>
                                        <td>
                                            <input type="number" className="form-input" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} />
                                        </td>
                                        <td>
                                            <input type="number" className="form-input" value={item.price} onChange={(e) => handleItemChange(index, 'price', e.target.value)} />
                                        </td>
                                        <td>
                                            <button className="icon-btn delete" onClick={() => deleteItem(index)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button className="secondary-btn w-full mt-2" onClick={addItem}>
                            <Plus size={16} /> {t('addRow')}
                        </button>

                        <div className="mini-totals">
                            <div className="row"><span>{t('subtotal')}:</span> <span>{totals.subtotal.toFixed(2)} {invoiceData.currency === 'TRY' ? '₺' : invoiceData.currency === 'USD' ? '$' : invoiceData.currency === 'GBP' ? '£' : '€'}</span></div>
                            <div className="row"><span>{t('tax')} ({invoiceData.taxRate}%):</span> <span>{totals.tax.toFixed(2)} {invoiceData.currency === 'TRY' ? '₺' : invoiceData.currency === 'USD' ? '$' : invoiceData.currency === 'GBP' ? '£' : '€'}</span></div>
                            <div className="row total"><span>{t('total')}:</span> <span>{totals.total.toFixed(2)} {invoiceData.currency === 'TRY' ? '₺' : invoiceData.currency === 'USD' ? '$' : invoiceData.currency === 'GBP' ? '£' : '€'}</span></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden Print Area */}
            <div className="hidden-print-container">
                <InvoicePaper
                    data={fullData}
                    totals={totals}
                    ref={invoiceRef}
                />
            </div>
        </div>
    );
};

export default NewQuote;
