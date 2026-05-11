import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { usePanel } from '../context/PanelContext';
import { ArrowLeft, Camera, User, Mail, Shield, Key, Save, Check, Globe, CreditCard, AlertTriangle, Trash2 } from 'lucide-react';

const ProfileSettings = () => {
    const navigate = useNavigate();
    const { currentUser, updateUser, changePassword, deleteAccount } = useAuth();
    const { t } = useLanguage();
    const { showToast } = usePanel();

    const [deleteInputName, setDeleteInputName] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    const translateRole = (role) => {
        if (!role) return '';
        switch(role) {
            case 'Administrator': return t('roleAdministrator');
            case 'Manager': return t('roleManager');
            case 'Accountant': return t('roleAccountant');
            case 'Employee': return t('roleEmployee');
            default: return role;
        }
    };

    const [formData, setFormData] = useState({
        name: currentUser?.name || '',
        email: currentUser?.email || '',
        role: currentUser?.role || 'Administrator',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        stripePublicKey: currentUser?.stripePublicKey || '',
        stripeSecretKey: currentUser?.stripeSecretKey || '',
        paypalClientId: currentUser?.paypalClientId || ''
    });

    React.useEffect(() => {
        if (currentUser && !isInitialized) {
            setFormData({
                name: currentUser.name || '',
                email: currentUser.email || '',
                role: currentUser.role || 'Administrator',
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
                stripePublicKey: currentUser.stripePublicKey || '',
                stripeSecretKey: currentUser.stripeSecretKey || '',
                paypalClientId: currentUser.paypalClientId || ''
            });
            setIsInitialized(true);
        }
    }, [currentUser, isInitialized]);

    const [saved, setSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                if (updateUser) {
                    setIsLoading(true);
                    await updateUser({ ...currentUser, avatar: reader.result });
                    setIsLoading(false);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdatePassword = async () => {
        if (!formData.newPassword) {
            return showToast(t('passwordEnterNew'), 'info');
        }
        if (!formData.currentPassword) {
            return showToast(t('passwordEnterCurrent'), 'info');
        }
        if (formData.newPassword !== formData.confirmPassword) {
            return showToast(t('passwordsDoNotMatch'), 'error');
        }

        setIsLoading(true);
        const pwResult = await changePassword(formData.currentPassword, formData.newPassword);
        setIsLoading(false);

        if (pwResult.success) {
            showToast(t('passwordUpdated'), 'success');
            setFormData(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            }));
        } else {
            showToast(pwResult.error, 'error');
        }
    };

    const handleSave = async () => {
        if (updateUser) {
            setIsLoading(true);
            
            const result = await updateUser({
                ...currentUser,
                name: formData.name,
                email: formData.email,
                role: formData.role,
                stripePublicKey: formData.stripePublicKey,
                stripeSecretKey: formData.stripeSecretKey,
                paypalClientId: formData.paypalClientId
            });
            setIsLoading(false);

            if (result.success) {
                showToast(t('saveSuccessful'), 'success');
            } else {
                showToast(result.error || t('saveFailed'), 'error');
            }
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteInputName !== currentUser?.name) {
            return alert(t('confirmNamePrompt'));
        }
        
        setIsDeleting(true);
        const result = await deleteAccount();
        if (result.success) {
            // Context will nullify currentUser, which usually redirects to /landing
            navigate('/');
        } else {
            alert(result.error);
            setIsDeleting(false);
        }
    };

    if (!currentUser || !isInitialized) {
        return (
            <div className="page-container">
                <header className="page-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '6px' }}></div>
                        <div>
                            <div className="skeleton skeleton-text" style={{ width: '200px', height: '28px', marginBottom: '8px' }}></div>
                            <div className="skeleton skeleton-text skeleton-text-short" style={{ width: '150px' }}></div>
                        </div>
                    </div>
                    <div className="skeleton skeleton-button"></div>
                </header>
                <div className="settings-grid">
                    <div className="settings-card card skeleton-profile-card">
                        <div className="skeleton skeleton-avatar"></div>
                        <div className="skeleton skeleton-text" style={{ width: '150px', height: '20px' }}></div>
                        <div className="skeleton skeleton-text skeleton-text-short" style={{ width: '200px' }}></div>
                        <div className="skeleton" style={{ width: '100px', height: '24px', borderRadius: '20px' }}></div>
                    </div>
                    <div className="settings-card card skeleton-settings-card">
                        <div className="skeleton skeleton-text" style={{ width: '180px', height: '22px', marginBottom: '20px' }}></div>
                        <div className="skeleton skeleton-input"></div>
                        <div className="skeleton skeleton-input"></div>
                        <div className="skeleton skeleton-input"></div>
                    </div>
                    <div className="settings-card card skeleton-settings-card">
                        <div className="skeleton skeleton-text" style={{ width: '150px', height: '22px', marginBottom: '20px' }}></div>
                        <div className="skeleton skeleton-input"></div>
                        <div className="skeleton skeleton-input"></div>
                        <div className="skeleton skeleton-input"></div>
                        <div className="skeleton skeleton-button" style={{ width: '100%', marginTop: '16px' }}></div>
                    </div>
                    <div className="settings-card card skeleton-settings-card" style={{ border: '1px solid #fca5a5', background: '#fef2f2' }}>
                        <div className="skeleton skeleton-text" style={{ width: '220px', height: '22px', marginBottom: '20px' }}></div>
                        <div className="skeleton skeleton-text" style={{ width: '90%', height: '16px', marginBottom: '16px' }}></div>
                        <div className="skeleton skeleton-input" style={{ borderColor: '#fca5a5' }}></div>
                        <div className="skeleton skeleton-button" style={{ width: '100%', marginTop: '16px' }}></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <header className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button className="icon-btn" onClick={() => navigate('/settings')}>
                        <ArrowLeft />
                    </button>
                    <div>
                        <h1>{t('profileSettings')}</h1>
                        <p>{t('backToSettings')}</p>
                    </div>
                </div>
                <button
                    className="primary-btn"
                    onClick={handleSave}
                    disabled={isLoading}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '140px', justifyContent: 'center' }}
                >
                    {isLoading ? <span className="spinner" style={{ width: '18px', height: '18px' }}></span> : (saved ? <Check size={20} /> : <Save size={20} />)}
                    {saved ? t('saved') : t('saveChanges')}
                </button>
            </header>

            <div className="settings-grid">
                {/* Profile Picture Card */}
                <div className="settings-card card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
                        <div style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '48px',
                            fontWeight: '700',
                            color: 'white',
                            margin: '0 auto',
                            overflow: 'hidden',
                            border: '4px solid #e2e8f0'
                        }}>
                            {currentUser?.avatar || currentUser?.photoURL ? (
                                <img src={currentUser.avatar || currentUser.photoURL} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                currentUser?.name?.charAt(0) || 'U'
                            )}
                        </div>
                        <label style={{
                            position: 'absolute',
                            bottom: '4px',
                            right: 'calc(50% - 60px)',
                            width: '36px',
                            height: '36px',
                            background: 'var(--primary)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                            border: '3px solid white'
                        }}>
                            <Camera size={16} color="white" />
                            <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                        </label>
                    </div>
                    <h3 style={{ margin: '0 0 4px 0' }}>{currentUser?.name || 'User'}</h3>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>{currentUser?.email}</p>
                    <span style={{
                        display: 'inline-block',
                        marginTop: '12px',
                        padding: '4px 12px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500'
                    }}>
                        {translateRole(currentUser?.role || 'Administrator')}
                    </span>
                </div>

                {/* Personal Information */}
                <div className="settings-card card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                        <User size={22} color="var(--primary)" />
                        <h3 style={{ margin: 0 }}>{t('personalInfo')}</h3>
                    </div>

                    <div className="form-group">
                        <label>{t('fullName')}</label>
                        <input
                            type="text"
                            className="form-input"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Max Mustermann"
                        />
                    </div>

                    <div className="form-group">
                        <label>{t('email')}</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="email"
                                className="form-input"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                style={{ paddingLeft: '40px' }}
                                placeholder="email@example.com"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>{t('role')}</label>
                        <div style={{ position: 'relative' }}>
                            <Shield size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <select
                                className="form-input"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                style={{ paddingLeft: '40px' }}
                            >
                                <option value="Administrator">{translateRole('Administrator')}</option>
                                <option value="Manager">{translateRole('Manager')}</option>
                                <option value="Accountant">{translateRole('Accountant')}</option>
                                <option value="Employee">{translateRole('Employee')}</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Security */}
                <div className="settings-card card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                        <Key size={22} color="var(--primary)" />
                        <h3 style={{ margin: 0 }}>{t('security')}</h3>
                    </div>

                    <div className="form-group">
                        <label>{t('currentPassword')}</label>
                        <input
                            type="password"
                            className="form-input"
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleChange}
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="form-group">
                        <label>{t('newPassword')}</label>
                        <input
                            type="password"
                            className="form-input"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="form-group">
                        <label>{t('confirmPassword')}</label>
                        <input
                            type="password"
                            className="form-input"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        className="secondary-btn"
                        onClick={handleUpdatePassword}
                        disabled={isLoading}
                        style={{ 
                            width: '100%', 
                            marginTop: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            background: 'var(--primary)',
                            color: 'white'
                        }}
                    >
                        <Key size={18} />
                        {t('updatePassword')}
                    </button>
                </div>

                {/* Account Deletion (Danger Zone) */}
                <div className="settings-card card" style={{ border: '1px solid #fca5a5', background: '#fef2f2' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', color: '#ef4444' }}>
                        <AlertTriangle size={22} />
                        <h3 style={{ margin: 0 }}>{t('deleteAccount')} ({t('dangerZone')})</h3>
                    </div>

                    <p style={{ fontSize: '0.9rem', color: '#7f1d1d', marginBottom: '16px', lineHeight: '1.5' }}>
                        {t('deleteAccountWarning')}
                    </p>

                    <div className="form-group">
                        <label style={{ color: '#991b1b', fontWeight: 'bold' }}>
                            {t('confirmNameLabel')}{' '}
                            <span style={{ userSelect: 'none', background: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>({currentUser?.name})</span>
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            value={deleteInputName}
                            onChange={(e) => setDeleteInputName(e.target.value)}
                            placeholder={currentUser?.name || ''}
                            style={{ borderColor: '#fca5a5' }}
                        />
                    </div>

                    <button
                        className="danger-btn"
                        onClick={handleDeleteAccount}
                        disabled={isDeleting || deleteInputName !== currentUser?.name}
                        style={{ 
                            width: '100%', 
                            marginTop: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            background: (deleteInputName === currentUser?.name) ? '#ef4444' : '#f87171',
                            color: 'white',
                            cursor: (deleteInputName === currentUser?.name && !isDeleting) ? 'pointer' : 'not-allowed',
                            border: 'none',
                            padding: '12px',
                            borderRadius: '8px',
                            fontWeight: 'bold'
                        }}
                    >
                        {isDeleting ? <span className="animate-spin" style={{ width: '18px', height: '18px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} /> : <Trash2 size={18} />}
                        {isDeleting ? t('deleting') : t('deleteAccount')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettings;
