import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { usePanel } from '../context/PanelContext';
import { db } from '../lib/firebase';
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
    Lock
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
    const [inviteData, setInviteData] = useState({ email: '', role: 'member' });
    const [isLoading, setIsLoading] = useState(true);
    const [teamMembers, setTeamMembers] = useState([]);

    useEffect(() => {
        if (!currentUser) return;

        const teamRef = collection(db, 'users', currentUser.uid, 'team');
        const q = query(teamRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
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
                addDoc(teamRef, ownerDoc);
            } else {
                setTeamMembers(members);
            }
            setIsLoading(false);
        }, (error) => {
            console.error('Team snapshot error:', error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    if (isLoading) {
        return <TeamSkeleton />;
    }

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        setIsInviting(true);
        const teamRef = collection(db, 'users', currentUser.uid, 'team');

        try {
            await addDoc(teamRef, {
                name: inviteData.email.split('@')[0],
                email: inviteData.email,
                role: inviteData.role,
                status: 'pending',
                invitedBy: currentUser.uid,
                invitedAt: new Date().toISOString(),
                joinedAt: null
            });
            showToast(t('inviteSent'));
            setShowInviteModal(false);
            setInviteData({ email: '', role: 'member' });
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
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

                {/* Team List */}
                <div className="table-scroll">
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
                            {filteredMembers.map((member) => (
                                <motion.tr
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    key={member.id}
                                >
                                    <td>
                                        <div className="member-info">
                                            <div className={`member-avatar-base ${member.role === 'owner' ? 'member-avatar-owner' : ''}`}>
                                                {member.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="member-name">{member.name}</div>
                                                <div className="member-email">{member.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={`role-badge-base role-badge-${member.role}`}>
                                            {roles[member.role].icon}
                                            {roles[member.role].label}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={`badge ${member.status === 'active' ? 'success' : 'info'}`}>
                                            {member.status === 'active' ? t('active') : t('pending')}
                                        </div>
                                    </td>
                                    <td className="joined-date">
                                        {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="td-right">
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
                            ))}
                        </tbody>
                    </table>
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
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Team;
