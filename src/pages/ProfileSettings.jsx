import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ArrowLeft, Camera, User, Mail, Shield, Key, Save, Check } from 'lucide-react';

const ProfileSettings = () => {
    const navigate = useNavigate();
    const { currentUser, updateUser } = useAuth();
    const { appLanguage } = useLanguage();

    const [formData, setFormData] = useState({
        name: currentUser?.name || '',
        email: currentUser?.email || '',
        role: currentUser?.role || 'Administrator',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [saved, setSaved] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (updateUser) {
                    updateUser({ ...currentUser, avatar: reader.result });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        if (updateUser) {
            updateUser({
                ...currentUser,
                name: formData.name,
                email: formData.email,
                role: formData.role
            });
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const t = {
        de: {
            profileSettings: 'Profil bearbeiten',
            back: 'Zurück zu Einstellungen',
            personalInfo: 'Persönliche Informationen',
            fullName: 'Vollständiger Name',
            email: 'E-Mail-Adresse',
            role: 'Rolle',
            changeAvatar: 'Profilbild ändern',
            security: 'Sicherheit',
            currentPassword: 'Aktuelles Passwort',
            newPassword: 'Neues Passwort',
            confirmPassword: 'Passwort bestätigen',
            saveChanges: 'Änderungen speichern',
            saved: 'Gespeichert!'
        },
        tr: {
            profileSettings: 'Profil Düzenle',
            back: 'Ayarlara Geri Dön',
            personalInfo: 'Kişisel Bilgiler',
            fullName: 'Tam Ad',
            email: 'E-posta Adresi',
            role: 'Rol',
            changeAvatar: 'Profil Resmini Değiştir',
            security: 'Güvenlik',
            currentPassword: 'Mevcut Şifre',
            newPassword: 'Yeni Şifre',
            confirmPassword: 'Şifreyi Onayla',
            saveChanges: 'Değişiklikleri Kaydet',
            saved: 'Kaydedildi!'
        }
    };

    const text = t[appLanguage] || t.de;

    return (
        <div className="page-container">
            <header className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button className="icon-btn" onClick={() => navigate('/settings')}>
                        <ArrowLeft />
                    </button>
                    <div>
                        <h1>{text.profileSettings}</h1>
                        <p>{text.back}</p>
                    </div>
                </div>
                <button
                    className="primary-btn"
                    onClick={handleSave}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    {saved ? <Check size={20} /> : <Save size={20} />}
                    {saved ? text.saved : text.saveChanges}
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
                            {currentUser?.avatar ? (
                                <img src={currentUser.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                        {currentUser?.role || 'Administrator'}
                    </span>
                </div>

                {/* Personal Information */}
                <div className="settings-card card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                        <User size={22} color="var(--primary)" />
                        <h3 style={{ margin: 0 }}>{text.personalInfo}</h3>
                    </div>

                    <div className="form-group">
                        <label>{text.fullName}</label>
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
                        <label>{text.email}</label>
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
                        <label>{text.role}</label>
                        <div style={{ position: 'relative' }}>
                            <Shield size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <select
                                className="form-input"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                style={{ paddingLeft: '40px' }}
                            >
                                <option value="Administrator">Administrator</option>
                                <option value="Manager">Manager</option>
                                <option value="Accountant">Accountant</option>
                                <option value="Employee">Employee</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Security */}
                <div className="settings-card card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                        <Key size={22} color="var(--primary)" />
                        <h3 style={{ margin: 0 }}>{text.security}</h3>
                    </div>

                    <div className="form-group">
                        <label>{text.currentPassword}</label>
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
                        <label>{text.newPassword}</label>
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
                        <label>{text.confirmPassword}</label>
                        <input
                            type="password"
                            className="form-input"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="••••••••"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettings;
