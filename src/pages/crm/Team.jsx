import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { usePanel } from '../../context/PanelContext';
import { db } from '../../lib/firebase';
import { sendInvitationEmail } from '../../lib/emailService';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    deleteDoc,
    updateDoc,
    doc
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    UserPlus,
    User,
    Mail,
    Shield,
    MoreHorizontal,
    Trash2,
    UserCheck,
    Check,
    X,
    ShieldCheck,
    ShieldAlert,
    Clock,
    Search,
    ChevronRight,
    Filter,
    Lock,
    Copy,
    Link as LinkIcon
} from 'lucide-react';

const TeamSkeleton = () => (
    <div className="team-page-container">
        <header className="page-header">
            <div>
                <div className="skeleton-text skeleton-text-lg" />
                <div className="skeleton-text skeleton-text-md" />
            </div>
            <div className="skeleton-button skeleton-btn" />
        </header>
        <div className="card card-no-padding">
            <div className="filter-bar">
                <div className="skeleton-input skeleton-input-lg" />
            </div>
            <div style={{ padding: '16px' }}>
                {[1,2,3].map(i => (
                    <div key={i} className="skeleton-row">
                        <div className="skeleton-avatar skeleton-avatar-sm" />
                        <div style={{ flex: 1 }}>
                            <div className="skeleton-text skeleton-text-sm-w" />
                            <div className="skeleton-text skeleton-text-xs-w" />
                        </div>
                        <div className="skeleton-badge" />
                        <div className="skeleton-badge skeleton-badge-sm" />
                        <div className="skeleton-text skeleton-text-xs" />
                        <div className="skeleton-icon" />
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const Team = () => {
    const { currentUser, isPro } = useAuth();
    const { t, appLanguage } = useLanguage();
    const { showToast } = usePanel();

    const [showInviteModal, setShowInviteModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [inviteData, setInviteData] = useState({ name: '', email: '', role: 'member' });
    const [manualInvite, setManualInvite] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [teamMembers, setTeamMembers] = useState([]);

    const buildInviteLink = (invitationId, email) => {
        if (!currentUser || !invitationId) return '';
        const baseUrl = window.location.origin;
        const params = new URLSearchParams({
            token: invitationId,
            tenant: currentUser.uid,
            email: email || ''
        });
        return `${baseUrl}/accept-invite?${params.toString()}`;
    };

    const copyInviteLink = async (link) => {
        if (!link) return false;
        try {
            await navigator.clipboard.writeText(link);
            showToast(t('inviteLinkCopied'), 'success');
            return true;
        } catch (error) {
            const textarea = document.createElement('textarea');
            textarea.value = link;
            textarea.setAttribute('readonly', '');
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const copied = document.execCommand('copy');
            document.body.removeChild(textarea);
            showToast(copied ? t('inviteLinkCopied') : t('inviteLinkCopyFailed'), copied ? 'success' : 'error');
            return copied;
        }
    };

    useEffect(() => {
        if (!currentUser) { setIsLoading(false); return; }

        const timeout = setTimeout(() => {
            setLoadError(true);
            setIsLoading(false);
        }, 15000);

        const teamRef = collection(db, 'users', currentUser.uid, 'team');
        const q = query(teamRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            clearTimeout(timeout);
            setLoadError(false);
            const members = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            }));

            if (members.length === 0) {
                const ownerDoc = {
                    name: currentUser.name || 'Admin',
                    email: currentUser.email || '',
                    role: 'owner',
                    status: 'active',
                    joinedAt: new Date().toISOString(),
                    createdBy: currentUser.uid
                };
                // Render the owner without creating duplicate records on page visits.
                setTeamMembers([{ id: currentUser.uid, ...ownerDoc }]);
            } else {
                setTeamMembers(members);
            }
            setIsLoading(false);
        }, (error) => {
            clearTimeout(timeout);
            setLoadError(true);
            console.error('Team snapshot error:', error);
            setIsLoading(false);
        });

        return () => { clearTimeout(timeout); unsubscribe(); };
    }, [currentUser]);

    if (isLoading) {
        return <TeamSkeleton />;
    }

    if (loadError) {
        return <div className="team-page-container"><div className="card" role="alert">
            <p>{appLanguage === 'tr' ? 'Ekip bilgileri yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.' : appLanguage === 'de' ? 'Teamdaten konnten nicht geladen werden. Bitte prüfen Sie Ihre Verbindung und versuchen Sie es erneut.' : 'Team data could not be loaded. Check your connection and try again.'}</p>
            <button onClick={() => window.location.reload()}>{appLanguage === 'tr' ? 'Tekrar dene' : appLanguage === 'de' ? 'Erneut versuchen' : 'Try again'}</button>
        </div></div>;
    }

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        setIsInviting(true);
        const teamRef = collection(db, 'users', currentUser.uid, 'team');
        const inviteeEmail = inviteData.email.trim();
        const inviteeName = inviteData.name.trim() || inviteeEmail.split('@')[0];
        setManualInvite(null);

        try {
            const docRef = await addDoc(teamRef, {
                name: inviteeName,
                email: inviteeEmail,
                role: inviteData.role,
                status: 'pending',
                invitedBy: currentUser.uid,
                invitedAt: new Date().toISOString(),
                joinedAt: null
            });

            try {
                await sendInvitationEmail({
                    inviteeEmail,
                    inviteeName,
                    role: inviteData.role,
                    invitedBy: currentUser.uid,
                    invitationId: docRef.id,
                    companyName: currentUser.companyName || currentUser.name || 'BayFatura',
                    senderName: currentUser.name || currentUser.email || 'Team Admin',
                });
            } catch (emailError) {
                console.error('Email send failed but Firestore doc created:', emailError);
                await updateDoc(docRef, {
                    status: 'email_failed',
                    emailError: emailError?.message || 'Email send failed',
                    emailFailedAt: new Date().toISOString(),
                    manualInviteLinkAvailable: true
                });
                const link = buildInviteLink(docRef.id, inviteeEmail);
                setManualInvite({
                    link,
                    email: inviteeEmail,
                    message: emailError?.message || t('inviteFailed')
                });
                showToast(t('inviteEmailFailedCopyLink'), 'info');
                return;
            }

            showToast(t('inviteSent'));
            setShowInviteModal(false);
            setInviteData({ name: '', email: '', role: 'member' });
        } catch (error) {
            showToast(t('inviteFailed'), 'error');
        } finally {
            setIsInviting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!currentUser) return;
        const member = teamMembers.find(m => m.id === id);
        if (member?.role === 'owner') return;

        try {
            await deleteDoc(doc(db, 'users', currentUser.uid, 'team', id));
            showToast(t('memberRemoved'), 'info');
        } catch (error) {
            showToast(t('removeFailed'), 'error');
        }
    };

    const handleRoleChange = async (id, newRole) => {
        if (!currentUser) return;
        try {
            await updateDoc(doc(db, 'users', currentUser.uid, 'team', id), { role: newRole });
            showToast(t('roleUpdated'), 'success');
        } catch (error) {
            showToast(t('updateFailed'), 'error');
        }
    };

    const roles = {
        owner: { label: t('roleOwner'), color: '#10b981', icon: <ShieldCheck size={16} /> },
        admin: { label: t('roleAdmin'), color: '#3b82f6', icon: <Shield size={16} /> },
        accountant: { label: t('roleAccountant'), color: '#f59e0b', icon: <UserCheck size={16} /> },
        member: { label: t('roleMember'), color: '#64748b', icon: <Clock size={16} /> }
    };

    const filteredMembers = teamMembers.filter(m =>
        String(m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(m.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getMemberStatus = (status) => {
        if (status === 'active') {
            return { className: 'success', label: t('active') };
        }

        if (status === 'email_failed') {
            return { className: 'danger', label: t('inviteFailed') };
        }

        return { className: 'info', label: t('pending') };
    };

    return (
        <div className="team-page-container">
            <header className="page-header">
                <div>
                    <h1>{t('teamManagement')}</h1>
                    <p>{t('teamDesc')}</p>
                </div>
                <button
                    className="primary-btn primary-btn-gap"
                    onClick={() => {
                        if (!isPro) {
                            showToast(t('unlockFeatureMsg'), "info");
                            return;
                        }
                        setManualInvite(null);
                        setShowInviteModal(true);
                    }}
                >
                    <UserPlus size={20} />
                    {t('inviteMember')}
                    {!isPro && <Lock size={14} className="lock-icon" />}
                </button>
            </header>

            <div className="card card-no-padding">
                {/* Filters & Search */}
                <div className="filter-bar">
                    <div className="search-container">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            className="form-input search-input"
                            placeholder={t('searchUsers')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Team List — Desktop */}
                <div className="table-scroll list-desktop-table">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>{t('member')}</th>
                                <th>{t('role')}</th>
                                <th>{t('status')}</th>
                                <th>{t('joined')}</th>
                                <th className="th-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMembers.map((member) => {
                                const memberName = member.name || member.email || '-';
                                const memberRole = roles[member.role] || roles.member;
                                const memberStatus = getMemberStatus(member.status);

                                return (
                                <motion.tr
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    key={member.id}
                                >
                                    <td>
                                        <div className="member-info">
                                            <div className={`member-avatar-base ${member.role === 'owner' ? 'member-avatar-owner' : ''}`}>
                                                {memberName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="member-name">{memberName}</div>
                                                <div className="member-email">{member.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={`role-badge-base role-badge-${member.role}`}>
                                            {memberRole.icon}
                                            {memberRole.label}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={`badge ${memberStatus.className}`}>
                                            {memberStatus.label}
                                        </div>
                                    </td>
                                    <td className="joined-date">
                                        {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="td-right">
                                        {(member.status === 'pending' || member.status === 'email_failed') && (
                                            <button
                                                className="icon-btn"
                                                title={t('copyInviteLink')}
                                                onClick={() => copyInviteLink(buildInviteLink(member.id, member.email))}
                                            >
                                                <Copy size={18} />
                                            </button>
                                        )}
                                        {member.role !== 'owner' && (
                                            <button
                                                className="icon-btn delete delete-btn-red"
                                                onClick={() => handleDelete(member.id)}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </td>
                                </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {/* Mobile cards */}
                <div className="list-mobile-cards">
                    {filteredMembers.length === 0 && (
                        <div className="lmc-empty">{t('nothingFound')}</div>
                    )}
                    {filteredMembers.map(member => {
                        const memberName = member.name || member.email || '-';
                        const memberRole = roles[member.role] || roles.member;
                        const memberStatus = getMemberStatus(member.status);
                        return (
                            <div key={member.id} className="lmc-row lmc-row-team">
                                <div className="lmc-top">
                                    <div className="member-info">
                                        <div className={`member-avatar-base ${member.role === 'owner' ? 'member-avatar-owner' : ''}`}>
                                            {memberName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="member-name">{memberName}</div>
                                            <div className="member-email">{member.email}</div>
                                        </div>
                                    </div>
                                    <div className="lmc-actions">
                                        {(member.status === 'pending' || member.status === 'email_failed') && (
                                            <button className="icon-btn" onClick={() => copyInviteLink(buildInviteLink(member.id, member.email))}><Copy size={18} /></button>
                                        )}
                                        {member.role !== 'owner' && (
                                            <button className="icon-btn delete delete-btn-red" onClick={() => handleDelete(member.id)}><Trash2 size={18} /></button>
                                        )}
                                    </div>
                                </div>
                                <div className="lmc-bottom">
                                    <div className={`role-badge-base role-badge-${member.role}`}>{memberRole.icon}{memberRole.label}</div>
                                    <div className={`badge ${memberStatus.className}`}>{memberStatus.label}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Invite Modal */}
            <AnimatePresence>
                {showInviteModal && (
                    <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="modal-content modal-content-sm"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header modal-header-centered">
                                <div className="modal-text-center">
                                    <div className="modal-icon-container">
                                        <UserPlus size={28} />
                                    </div>
                                    <h2 className="modal-title-lg">{t('inviteToTeam')}</h2>
                                    <p className="modal-desc">{t('inviteDesc')}</p>
                                </div>
                                <button className="modal-close modal-close-round" onClick={() => setShowInviteModal(false)}>
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleInvite} className="invite-form">
                                <div className="form-group form-group-mb-lg">
                                    <label className="form-label-bold">{t('fullName')}</label>
                                    <div className="input-container">
                                        <User size={18} className="input-icon" />
                                        <input
                                            type="text"
                                            className="form-input"
                                            required
                                            placeholder="Ahmet Yilmaz"
                                            value={inviteData.name}
                                            onChange={(e) => setInviteData({...inviteData, name: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="form-group form-group-mb-lg">
                                    <label className="form-label-bold">{t('emailAddress')}</label>
                                    <div className="input-container">
                                        <Mail size={18} className="input-icon" />
                                        <input
                                            type="email"
                                            className="form-input email-input"
                                            required
                                            placeholder="ornek@sirket.com"
                                            value={inviteData.email}
                                            onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label-bold">{t('role')}</label>
                                    <div className="role-cards-container">
                                        {[
                                            { id: 'admin', title: t('roleAdmin'), desc: t('roleAdminDesc'), icon: <Shield size={20} />, color: '#3b82f6' },
                                            { id: 'accountant', title: t('roleAccountant'), desc: t('roleAccDesc'), icon: <UserCheck size={20} />, color: '#f59e0b' },
                                            { id: 'member', title: t('roleMember'), desc: t('roleMemberDesc'), icon: <Users size={20} />, color: '#64748b' }
                                        ].map((r) => (
                                            <div
                                                key={r.id}
                                                className={`role-card-base ${inviteData.role === r.id ? `active role-card-${r.id}-active` : ''}`}
                                                onClick={() => setInviteData({...inviteData, role: r.id})}
                                            >
                                                <div className={`role-card-icon-base ${inviteData.role === r.id ? `role-card-icon-${r.id}-active` : ''}`}>
                                                    {r.icon}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div className={`role-card-title-base ${inviteData.role === r.id ? `role-card-title-${r.id}-active` : ''}`}>{r.title}</div>
                                                    <div className="role-card-desc">{r.desc}</div>
                                                </div>
                                                {inviteData.role === r.id && (
                                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                                        <Check size={20} color={r.color} />
                                                    </motion.div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="primary-btn submit-btn"
                                    disabled={isInviting}
                                >
                                    {isInviting ? (
                                        <div className="animate-spin loading-spinner" />
                                    ) : (
                                        <>
                                            <Mail size={20} />
                                            {t('sendInvite')}
                                        </>
                                    )}
                                </button>

                                {manualInvite && (
                                    <div className="manual-invite-panel">
                                        <div className="manual-invite-header">
                                            <LinkIcon size={18} />
                                            <div>
                                                <strong>{t('manualInviteTitle')}</strong>
                                                <p>{t('manualInviteDesc')}</p>
                                            </div>
                                        </div>
                                        <div className="manual-invite-link-row">
                                            <input
                                                className="form-input manual-invite-input"
                                                value={manualInvite.link}
                                                readOnly
                                                onFocus={(e) => e.target.select()}
                                            />
                                            <button
                                                type="button"
                                                className="secondary-btn manual-invite-copy-btn"
                                                onClick={() => copyInviteLink(manualInvite.link)}
                                            >
                                                <Copy size={16} />
                                                {t('copyInviteLink')}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Team;
