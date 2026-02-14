import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Check, CreditCard, Shield, Zap, FileText, Download } from 'lucide-react';

const SubscriptionManagement = () => {
    const { t } = useLanguage();

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
                    {t('subscription_title') || 'Abonelik ve Ödemeler'}
                </h1>
                <p style={{ color: '#64748b' }}>
                    {t('subscription_desc') || 'Mevcut planınızı ve faturalarınızı yönetin.'}
                </p>
            </div>

            {/* Current Plan Card */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', borderRadius: '16px', padding: '32px', color: 'white', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px' }}>
                                <Zap size={24} color="white" />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>{t('current_plan') || 'Mevcut Plan'}</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Premium Plan</div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                                <span style={{ fontSize: '2.5rem', fontWeight: '800' }}>€29</span>
                                <span style={{ paddingBottom: '8px', opacity: 0.8 }}>/ {t('month') || 'ay'}</span>
                            </div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '8px' }}>
                                {t('renewal_date') || 'Yenileme Tarihi'}: 15 Mart 2026
                            </div>
                        </div>

                        <button style={{
                            background: 'white',
                            color: '#4f46e5',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '0.95rem'
                        }}>
                            {t('manage_subscription') || 'Aboneliği Yönet'}
                        </button>
                    </div>

                    {/* Decorative Circle */}
                    <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                </div>

                {/* Usage Stats */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '24px', color: '#1e293b' }}>{t('usage_limits') || 'Kullanım Limitleri'}</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                                <span style={{ color: '#64748b' }}>Faturalar</span>
                                <span style={{ fontWeight: '600', color: '#1e293b' }}>124 / Sınırsız</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: '15%', height: '100%', background: '#10b981', borderRadius: '4px' }} />
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                                <span style={{ color: '#64748b' }}>Kullanıcılar</span>
                                <span style={{ fontWeight: '600', color: '#1e293b' }}>8 / 20</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: '40%', height: '100%', background: '#3b82f6', borderRadius: '4px' }} />
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                                <span style={{ color: '#64748b' }}>Depolama</span>
                                <span style={{ fontWeight: '600', color: '#1e293b' }}>2.4 GB / 10 GB</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: '24%', height: '100%', background: '#f59e0b', borderRadius: '4px' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Billing History */}
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0, color: '#1e293b' }}>{t('billing_history') || 'Fatura Geçmişi'}</h3>
                    <button style={{ color: '#4f46e5', background: 'none', border: 'none', fontWeight: '500', cursor: 'pointer' }}>
                        {t('view_all') || 'Tümünü Gör'}
                    </button>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                            <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Tarih</th>
                            <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Tutar</th>
                            <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Durum</th>
                            <th style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Fatura</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            { date: '15 Şub 2026', amount: '€29.00', status: 'Ödendi' },
                            { date: '15 Oca 2026', amount: '€29.00', status: 'Ödendi' },
                            { date: '15 Ara 2025', amount: '€29.00', status: 'Ödendi' },
                        ].map((invoice, i) => (
                            <tr key={i} style={{ borderTop: i > 0 ? '1px solid #f1f5f9' : 'none' }}>
                                <td style={{ padding: '16px 24px', color: '#1e293b' }}>{invoice.date}</td>
                                <td style={{ padding: '16px 24px', fontWeight: '500', color: '#1e293b' }}>{invoice.amount}</td>
                                <td style={{ padding: '16px 24px' }}>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        background: '#dcfce7',
                                        color: '#166534'
                                    }}>
                                        {invoice.status}
                                    </span>
                                </td>
                                <td style={{ padding: '16px 24px' }}>
                                    <button style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        background: 'transparent',
                                        border: '1px solid #e2e8f0',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        color: '#64748b',
                                        fontSize: '0.85rem'
                                    }}>
                                        <Download size={14} /> PDF
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '32px', padding: '24px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <Shield color="#64748b" />
                    <div>
                        <h4 style={{ margin: '0 0 8px', color: '#1e293b' }}>{t('security_note') || 'Güvenli Ödeme'}</h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
                            Tüm ödemeler Stripe/PayPal altyapısı ile şifreli olarak gerçekleştirilmektedir. Kredi kartı bilgileriniz sunucularımızda saklanmaz.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionManagement;
