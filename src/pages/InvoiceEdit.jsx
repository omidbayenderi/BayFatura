import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInvoice } from '../context/InvoiceContext';
import InvoicePaper from '../components/InvoicePaper';
import { Printer, ArrowLeft, Plus, Trash2, Car, HardHat, Utensils, HeartPulse, Monitor, ShoppingCart, Wrench, BarChart3, BookOpen, Briefcase } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getIndustryFields } from '../config/industryFields';

const INDUSTRY_ICONS = {
    Car, HardHat, Utensils, HeartPulse, Monitor, ShoppingCart, Wrench, BarChart3, BookOpen, Briefcase
};

const InvoiceEdit = ({ type = 'invoice' }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { invoices, quotes, companyProfile, updateInvoice } = useInvoice();
    const { t, appLanguage, invoiceLanguage } = useLanguage();
    const invoiceRef = useRef();

    const industryConfig = getIndustryFields(companyProfile.industry || 'general');
    const IndustryIcon = INDUSTRY_ICONS[industryConfig.icon] || Briefcase;

    const list = type === 'quote' ? quotes : invoices;
    const existingInvoice = list.find(inv => inv.id === Number(id) || inv.id === id);

    const [invoiceData, setInvoiceData] = useState({
        recipientName: '',
        recipientStreet: '',
        recipientHouseNum: '',
        recipientZip: '',
        recipientCity: '',
        invoiceNumber: '',
        date: '',
        currency: 'EUR',
        taxRate: 19,
        status: 'draft',
        items: [{ description: '', quantity: 1, price: 0 }],
        footerNote: '',
        paymentTerms: '',
        industryData: {} // Dynamic fields based on industry
    });

    useEffect(() => {
        if (existingInvoice) {
            setInvoiceData({
                recipientName: existingInvoice.recipientName || '',
                recipientStreet: existingInvoice.recipientStreet || '',
                recipientHouseNum: existingInvoice.recipientHouseNum || '',
                recipientZip: existingInvoice.recipientZip || '',
                recipientCity: existingInvoice.recipientCity || '',
                invoiceNumber: existingInvoice.invoiceNumber || '',
                date: existingInvoice.date || '',
                currency: existingInvoice.currency || 'EUR',
                taxRate: existingInvoice.taxRate || 19,
                status: existingInvoice.status || 'draft',
                items: existingInvoice.items || [{ description: '', quantity: 1, price: 0 }],
                footerNote: existingInvoice.footerNote !== undefined ? existingInvoice.footerNote : '',
                paymentTerms: existingInvoice.paymentTerms || companyProfile.paymentTerms || '',
                industryData: existingInvoice.industryData || {}
            });
        }
    }, [existingInvoice, type]);

    if (!existingInvoice) {
        return (
            <div className="page-container">
                <div className="empty-state">
                    <h2>{type === 'quote' ? t('quoteNotFound') : t('invoiceNotFound')}</h2>
                    <button className="primary-btn" onClick={() => navigate(type === 'quote' ? '/quotes' : '/archive')}>
                        {type === 'quote' ? t('backToQuotes') : t('backToArchive')}
                    </button>
                </div>
            </div>
        );
    }

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
        newItems[index][field] = value;
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

    const calculateTotals = () => {
        const subtotal = invoiceData.items.reduce((sum, item) => sum + (parseFloat(item.quantity || 0) * parseFloat(item.price || 0)), 0);
        const tax = subtotal * (parseFloat(invoiceData.taxRate || 0) / 100);
        const total = subtotal + tax;
        return { subtotal, tax, total };
    };
    const totals = calculateTotals();

    // FIX: updateQuote does not exist — both invoice and quote updates use updateInvoice logic.
    // FIX: await the async update before navigating to avoid race condition.
    const handleSave = async () => {
        try {
            await updateInvoice(existingInvoice.id, {
                ...invoiceData,
                ...totals,
                senderSnapshot: companyProfile,
                language: invoiceData.language || invoiceLanguage
            });
            navigate(`/${type}/${existingInvoice.id}?autoprint=true`);
        } catch (err) {
            console.error('Save failed:', err);
        }
    };

    const fullData = {
        logo: companyProfile.logo,
        signatureUrl: companyProfile.signatureUrl || '',
        stampUrl: companyProfile.stampUrl || '',
        senderCompany: companyProfile.companyName,
        senderStreet: companyProfile.street,
        senderHouseNum: companyProfile.houseNum,
        senderZip: companyProfile.zip,
        senderCity: companyProfile.city,
        senderPhone: companyProfile.companyPhone,
        senderEmail: companyProfile.companyEmail,
        senderTaxId: companyProfile.taxId,
        senderVatId: companyProfile.vatId,
        senderBank: companyProfile.bankName,
        senderIban: companyProfile.iban,
        senderBic: companyProfile.bic,
        paypalMe: companyProfile.paypalMe,
        stripeLink: companyProfile.stripeLink,
        industry: companyProfile.industry || 'general',
        logoDisplayMode: companyProfile.logoDisplayMode || 'both',
        paymentTerms: invoiceData.paymentTerms,
        footerPayment: `Bank: ${companyProfile.bankName}\nIBAN: ${companyProfile.iban}\n${invoiceData.paymentTerms}`,
        ...invoiceData,
        ...invoiceData.industryData
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button className="icon-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft />
                    </button>
                    <div>
                        <h1>{type === 'quote' ? t('editQuote') : t('editInvoice')}</h1>
                        <p>{invoiceData.invoiceNumber}</p>
                    </div>
                </div>
                <div className="actions">
                    <button className="primary-btn" onClick={handleSave}>
                        <Printer size={20} />
                        {t('saveAndPrint')}
                    </button>
                </div>
            </header>

            <div className="editor-layout">
                <div className="input-section">
                    <div className="card">
                        <h3>{t('customerInfo')}</h3>
                        <div className="form-group">
                            <label>{t('customer')}</label>
                            <input className="form-input" name="recipientName" value={invoiceData.recipientName} onChange={handleChange} />
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
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <IndustryIcon size={18} color="var(--primary)" />
                            {t((companyProfile.industry || 'general') + 'SectionTitle')}
                        </h3>

                        {/* Dynamic Industry-Specific Fields */}
                        <div className="form-row">
                            {industryConfig.fields.slice(0, 2).map(field => (
                                <div className="form-group" key={field.name}>
                                    <label>{t(field.name + 'Label')}</label>
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
                                    <label>{t(field.name + 'Label')}</label>
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
                                <label>{t('invoiceNumber')}</label>
                                <input className="form-input" name="invoiceNumber" value={invoiceData.invoiceNumber} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>{t('date')}</label>
                                <input type="date" className="form-input" name="date" value={invoiceData.date} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('status')}</label>
                                <select className="form-input" name="status" value={invoiceData.status} onChange={handleChange}>
                                    <option value="draft">{t('draft')}</option>
                                    <option value="sent">{t('sent')}</option>
                                    <option value="paid">{t('paid')}</option>
                                    <option value="partial">{t('partial')}</option>
                                    <option value="overdue">{t('overdue')}</option>
                                </select>
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
                                    <th style={{ width: '100px' }}>{t('price')}</th>
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

                    <div className="card full-width">
                            <h3>{t('paymentTerms')}</h3>
                        <div className="form-group">
                            <label>{t('extraNote')}</label>
                            <input 
                                className="form-input" 
                                name="footerNote" 
                                value={invoiceData.footerNote} 
                                onChange={handleChange}
                                placeholder="e.g. Vielen Dank für Ihren Auftrag!"
                                style={{ marginBottom: '12px' }}
                            />
                            
                            <label>{t('paymentTerms')}</label>
                            <textarea 
                                className="form-input" 
                                name="paymentTerms" 
                                value={invoiceData.paymentTerms} 
                                onChange={handleChange}
                                rows="3"
                                placeholder={t('paymentTerms')}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="hidden-print-container">
                <InvoicePaper data={fullData} totals={totals} ref={invoiceRef} />
            </div>
        </div>
    );
};

export default InvoiceEdit;
