import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AlertCircle, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SUPER_ADMIN_EMAIL = 'omidbayenderi@gmail.com';

/**
 * A deliberately separate entry point for the operational control centre.
 * Authentication remains Firebase Authentication; this screen never handles a
 * password itself. The email check is repeated by Firestore rules and callable
 * functions, so bypassing this page cannot grant privileges.
 */
const SuperAdminLogin = () => {
    const { currentUser, loading, signInWithGoogle, logout } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [working, setWorking] = useState(false);

    const currentEmail = String(currentUser?.email || '').toLowerCase();
    const isOwner = currentEmail === SUPER_ADMIN_EMAIL;

    useEffect(() => {
        if (isOwner) navigate('/dcc-portal', { replace: true });
    }, [isOwner, navigate]);

    const signIn = async () => {
        setError('');
        setWorking(true);
        try {
            const result = await signInWithGoogle();
            if (result?.redirecting) return;
            const email = String(result?.user?.email || result?.appUser?.email || '').toLowerCase();
            if (result?.success && email === SUPER_ADMIN_EMAIL) {
                navigate('/dcc-portal', { replace: true });
                return;
            }
            if (result?.success) {
                await logout();
                setError('Bu hesap Super Admin için yetkili değil. Yalnızca omidbayenderi@gmail.com kullanılabilir.');
                return;
            }
            setError(result?.error || 'Giriş tamamlanamadı.');
        } catch (err) {
            setError(err?.message || 'Giriş tamamlanamadı.');
        } finally {
            setWorking(false);
        }
    };

    if (!loading && isOwner) return <Navigate to="/dcc-portal" replace />;

    return (
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at top, #123126 0%, #050807 55%)', color: '#fff', padding: 24 }}>
            <section style={{ width: '100%', maxWidth: 460, background: 'rgba(10,18,14,.94)', border: '1px solid #24543f', borderRadius: 24, padding: 36, boxShadow: '0 24px 80px rgba(0,0,0,.5)' }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, display: 'grid', placeItems: 'center', background: '#10b98122', color: '#34d399', marginBottom: 20 }}><ShieldCheck size={28} /></div>
                <p style={{ color: '#6ee7b7', fontWeight: 700, letterSpacing: '.12em', fontSize: 12, margin: 0 }}>BAYFATURA · SECURE OPERATIONS</p>
                <h1 style={{ fontSize: 30, margin: '10px 0' }}>Super Admin</h1>
                <p style={{ color: '#a7b7ad', lineHeight: 1.55, marginBottom: 26 }}>DCC; kullanıcı, üyelik ve içerik operasyonları için ayrılmıştır.</p>
                {currentUser && !isOwner && <div style={{ background: '#7f1d1d55', border: '1px solid #ef4444', padding: 14, borderRadius: 12, color: '#fecaca', marginBottom: 18 }}>Aktif hesap: {currentUser.email}<br />Bu hesap yetkili değildir.</div>}
                {error && <div role="alert" style={{ display: 'flex', gap: 10, background: '#7f1d1d55', border: '1px solid #ef4444', padding: 14, borderRadius: 12, color: '#fecaca', marginBottom: 18 }}><AlertCircle size={19} />{error}</div>}
                <button onClick={signIn} disabled={working || loading} style={{ width: '100%', border: 0, borderRadius: 12, padding: '14px 18px', background: '#10b981', color: '#042f20', fontWeight: 800, cursor: 'pointer', opacity: working || loading ? .7 : 1 }}>
                    <LockKeyhole size={17} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                    {working ? 'Doğrulanıyor…' : 'Google ile Super Admin girişi'}
                </button>
                <p style={{ color: '#6b7b70', fontSize: 12, lineHeight: 1.5, marginTop: 18 }}>Yalnızca <strong>omidbayenderi@gmail.com</strong> ile doğrulanmış giriş kabul edilir. Bu kontrol, sunucu ve Firestore kurallarında da zorunludur.</p>
            </section>
        </main>
    );
};

export default SuperAdminLogin;
