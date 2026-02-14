import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { CreditCard, Key, Smartphone, Globe, Check, AlertCircle, Copy, Eye, EyeOff } from 'lucide-react';

const IntegrationSettings = () => {
    const { t } = useLanguage();
    const [showKey, setShowKey] = useState({});

    const toggleKey = (id) => {
        setShowKey(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Kopyalandı!');
    };

    const integrations = [
        {
            id: 'stripe',
            name: 'Stripe Payments',
            desc: 'Kredi kartı ödemelerini al.',
            status: 'active',
            icon: CreditCard,
            color: '#635bff',
            fields: [
                { label: 'Publishable Key', value: 'pk_test_51M...' },
                { label: 'Secret Key', value: 'sk_test_51M...', secured: true }
            ]
        },
        {
            id: 'paypal',
            name: 'PayPal Business',
            desc: 'PayPal ile ödeme kabul et.',
            status: 'inactive',
            icon: Globe,
            color: '#003087',
            fields: [
                { label: 'Client ID', value: '' },
                { label: 'Secret', value: '', secured: true }
            ]
        },
        {
            id: 'whatsapp',
            name: 'WhatsApp Business API',
            desc: 'Otomatik bildirimler gönder.',
            status: 'setup_required',
            icon: Smartphone,
            color: '#25D366',
            fields: [
                { label: 'Phone Number ID', value: '' },
                { label: 'Access Token', value: '', secured: true }
            ]
        }
    ];

    return (
        <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
                    {t('integration_hub') || 'Entegrasyon Merkezi'}
                </h1>
                <p style={{ color: '#64748b' }}>
                    {t('integration_desc') || '3. parti uygulamaları ve API anahtarlarını yönetin.'}
                </p>
            </div>

            <div style={{ display: 'grid', gap: '24px' }}>
                {integrations.map(integration => (
                    <div key={integration.id} style={{
                        background: 'white',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        overflow: 'hidden'
                    }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '10px',
                                    background: `${integration.color}15`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: integration.color
                                }}>
                                    <integration.icon size={24} />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>{integration.name}</h3>
                                        {integration.status === 'active' && (
                                            <span style={{ fontSize: '0.7rem', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>AKTİF</span>
                                        )}
                                        {integration.status === 'inactive' && (
                                            <span style={{ fontSize: '0.7rem', background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>PASİF</span>
                                        )}
                                    </div>
                                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>{integration.desc}</p>
                                </div>
                            </div>

                            <label className="switch">
                                <input type="checkbox" checked={integration.status === 'active'} readOnly />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        <div style={{ padding: '24px', background: '#f8fafc' }}>
                            {integration.fields.map((field, idx) => (
                                <div key={idx} style={{ marginBottom: idx === integration.fields.length - 1 ? 0 : '16px' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>
                                        {field.label}
                                    </label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <div style={{ position: 'relative', flex: 1 }}>
                                            <input
                                                type={field.secured && !showKey[`${integration.id}-${idx}`] ? "password" : "text"}
                                                value={field.value}
                                                readOnly
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #cbd5e1',
                                                    background: 'white',
                                                    color: '#334155',
                                                    fontFamily: 'monospace'
                                                }}
                                            />
                                        </div>
                                        {field.secured && (
                                            <button
                                                onClick={() => toggleKey(`${integration.id}-${idx}`)}
                                                style={{ padding: '10px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', color: '#64748b' }}
                                            >
                                                {showKey[`${integration.id}-${idx}`] ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => copyToClipboard(field.value)}
                                            style={{ padding: '10px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', color: '#64748b' }}
                                        >
                                            <Copy size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default IntegrationSettings;
