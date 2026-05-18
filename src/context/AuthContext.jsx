import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, isFirebaseConfigured, googleProvider, appleProvider } from '../lib/firebase';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signInWithCredential,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    OAuthProvider,
    signInAnonymously,
    updateProfile as firebaseUpdateProfile,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    deleteUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { isNativePlatform } from '../lib/platform';
import { nativeSignInWithGoogle, nativeSignInWithApple, isNativeAuthAvailable, NativeAuthError } from '../lib/nativeAuth';
import { setUserId as setCrashlyticsUserId } from '../lib/nativeCrashlytics';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const useFirebase = isFirebaseConfigured();

    useEffect(() => {
        if (!useFirebase) {
            setCurrentUser({ uid: 'demo-1', email: 'demo@bayfatura.com', role: 'admin', tenantId: 'demo-1', plan: 'elite' });
            setLoading(false);
            return;
        }

        // Handle redirect result (crucial for Safari & redirect flows)
        getRedirectResult(auth)
            .then((result) => {
                if (result?.user) {
                    console.log("Redirect login successful:", result.user.email);
                    // Force re-load user data after redirect
                    const userRef = doc(db, 'users', result.user.uid);
                    getDoc(userRef).then(userDoc => {
                        if (userDoc.exists()) {
                            setCurrentUser({ uid: result.user.uid, email: result.user.email, ...userDoc.data() });
                        }
                    });
                }
            })
            .catch((error) => {
                console.error("Redirect login callback error:", error);
            });
        
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userRef);
                    
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        let updates = {};
                        if (!data.role || !data.tenantId) {
                            updates = { ...updates, role: data.role || 'admin', tenantId: data.tenantId || user.uid };
                        }
                        if (!data.email && user.email) {
                            updates = { ...updates, email: user.email };
                        }
                        
                        if (Object.keys(updates).length > 0) {
                            await updateDoc(userRef, updates);
                            setCurrentUser({ uid: user.uid, ...data, ...updates });
                        } else {
                            setCurrentUser({ uid: user.uid, email: user.email, ...data });
                        }
                    } else {
                        const initialData = {
                            name: user.isAnonymous ? 'Demo User' : (user.displayName || 'User'),
                            email: user.email || 'guest@bayfatura.com',
                            plan: user.isAnonymous ? 'elite' : 'standard',
                            role: 'admin',
                            tenantId: user.uid,
                            createdAt: new Date().toISOString()
                        };
                        await setDoc(userRef, initialData);
                        setCurrentUser({ uid: user.uid, ...initialData });
                    }
                } catch (err) {
                    console.error("Auth sync error:", err);
                    // Minimal fail-safe user
                    setCurrentUser({ uid: user.uid, email: user.email || 'guest@bayfatura.com', role: 'admin', tenantId: user.uid, plan: user.isAnonymous ? 'elite' : 'standard' });
                }
                setCrashlyticsUserId(user.uid);
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, [useFirebase]);

    const login = async (e, p) => {
        try {
            await signInWithEmailAndPassword(auth, e, p);
            return { success: true };
        } catch (err) {
            const errCode = err?.code || '';
            const errMsg = err?.message || 'Login failed.';
            console.error("[Auth] Email login error:", { code: errCode, message: errMsg });
            // Platform-agnostic error messages
            if (errCode === 'auth/invalid-credential' || errCode === 'auth/user-not-found' || errCode === 'auth/wrong-password') {
                throw new Error('Invalid email or password.');
            }
            if (errCode === 'auth/too-many-requests') {
                throw new Error('Too many attempts. Please try again later.');
            }
            if (errCode === 'auth/user-disabled') {
                throw new Error('This account has been disabled.');
            }
            if (errCode === 'auth/invalid-email') {
                throw new Error('Invalid email address.');
            }
            if (errCode === 'auth/network-request-failed') {
                throw new Error('Network error. Check your connection.');
            }
            throw new Error(errMsg);
        }
    };
    
    const register = async (userData) => {
        try {
            const { user } = await import('firebase/auth').then(m => m.createUserWithEmailAndPassword(auth, userData.email, userData.password));
            
            const initialData = {
                name: userData.name || 'User',
                companyName: userData.companyName || '',
                email: user.email,
                plan: 'standard',
                role: 'admin',
                tenantId: user.uid,
                createdAt: new Date().toISOString()
            };
            
            await setDoc(doc(db, 'users', user.uid), initialData);
            await firebaseUpdateProfile(user, { displayName: userData.name });
            
            return { success: true };
        } catch (err) {
            console.error("Register error:", err);
            return { success: false, error: err.message };
        }
    };
    
    const logout = () => signOut(auth);
    const signInWithGoogle = async () => {
        try {
            const isNative = isNativeAuthAvailable();
            if (isNative) {
                try {
                    const result = await nativeSignInWithGoogle();
                    if (result?.credential?.idToken) {
                        const credential = GoogleAuthProvider.credential(result.credential.idToken);
                        await signInWithCredential(auth, credential);
                        return { success: true };
                    }
                } catch (nativeErr) {
                    if (nativeErr?.type === NativeAuthError.USER_CANCELLED) {
                        return { success: false, error: 'Sign in was cancelled.' };
                    }
                    if (nativeErr?.type === NativeAuthError.UNIMPLEMENTED) {
                        console.warn('[Auth] Native Google plugin unavailable, using web SDK directly');
                        const result = await signInWithPopup(auth, googleProvider);
                        return { success: true, user: result.user };
                    }
                    if (nativeErr?.type === NativeAuthError.CONFIG_ERROR || nativeErr?.type === NativeAuthError.PROVIDER_NOT_ENABLED) {
                        console.warn('[Auth] Native Google not configured, falling back to redirect:', nativeErr.message);
                    } else {
                        console.warn('[Auth] Native Google login failed, falling back to redirect:', nativeErr);
                    }
                }
                await signInWithRedirect(auth, googleProvider);
                return { success: true, redirecting: true };
            }
            const result = await signInWithPopup(auth, googleProvider);
            return { success: true, user: result.user };
        } catch (err) {
            const errMsg = err?.message || '';
            const errCode = err?.code || '';
            console.error("[Auth] Google login error:", { code: errCode, message: errMsg });
            if (errCode === 'auth/popup-closed-by-user') {
                return { success: false, error: 'Popup closed. Please allow popups and try again.' };
            }
            if (errMsg.includes('redirect_uri_mismatch')) {
                console.warn('[Auth] Redirect URI mismatch. Check Firebase Console > Authentication > Authorized domains');
                return { success: false, error: 'OAuth configuration error. Please contact support.' };
            }
            return { success: false, error: errMsg || 'Google sign-in failed.' };
        }
    };
    
    const signInWithApple = async () => {
        try {
            const isNative = isNativeAuthAvailable();
            if (isNative) {
                try {
                    const result = await nativeSignInWithApple();
                    if (result?.credential?.idToken) {
                        const credential = OAuthProvider.credential({
                            providerId: 'apple.com',
                            idToken: result.credential.idToken,
                            rawNonce: result.credential.secret,
                        });
                        await signInWithCredential(auth, credential);
                        return { success: true };
                    }
                } catch (nativeErr) {
                    if (nativeErr?.type === NativeAuthError.USER_CANCELLED) {
                        return { success: false, error: 'Sign in was cancelled.' };
                    }
                    if (nativeErr?.type === NativeAuthError.UNIMPLEMENTED) {
                        console.warn('[Auth] Native Apple plugin unavailable, using web SDK directly');
                        const result = await signInWithPopup(auth, appleProvider);
                        return { success: true, user: result.user };
                    }
                    if (nativeErr?.type === NativeAuthError.CONFIG_ERROR || nativeErr?.type === NativeAuthError.PROVIDER_NOT_ENABLED) {
                        console.warn('[Auth] Native Apple not configured, falling back to redirect:', nativeErr.message);
                    } else {
                        console.warn('[Auth] Native Apple login failed, falling back to redirect:', nativeErr);
                    }
                }
                await signInWithRedirect(auth, appleProvider);
                return { success: true, redirecting: true };
            }
            const result = await signInWithPopup(auth, appleProvider);
            return { success: true, user: result.user };
        } catch (err) {
            const errMsg = err?.message || '';
            const errCode = err?.code || '';
            console.error("[Auth] Apple login error:", { code: errCode, message: errMsg });
            if (errCode === 'auth/popup-closed-by-user') {
                return { success: false, error: 'Popup closed. Please allow popups and try again.' };
            }
            return { success: false, error: errMsg || 'Apple sign-in failed.' };
        }
    };
    const signInAsDemo = async () => {
        const demoEmail = import.meta.env.VITE_DEMO_EMAIL || 'demo@bayfatura.com';
        const demoPassword = import.meta.env.VITE_DEMO_PASSWORD || 'DemoPassword123!';
        try {
            await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
            return { success: true };
        } catch (err) {
            if (err.code === 'auth/user-not-found') {
                try {
                    const { user } = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
                    await setDoc(doc(db, 'users', user.uid), {
                        name: 'Demo Kullanıcı',
                        email: demoEmail,
                        plan: 'elite',
                        role: 'admin',
                        tenantId: user.uid,
                        createdAt: new Date().toISOString()
                    });
                    return { success: true };
                } catch (createErr) {
                    console.error("Demo account creation failed:", createErr);
                    return { success: false, error: "Demo hesabı oluşturulamadı: " + createErr.message };
                }
            }
            if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                console.error("Demo wrong password, attempting to re-create account");
                try {
                    const currentUser = auth.currentUser;
                    if (currentUser) {
                        await currentUser.delete();
                    }
                } catch (deleteErr) {
                    console.warn("Demo account cleanup skipped:", deleteErr?.message || deleteErr);
                }
                try {
                    const { user } = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
                    await setDoc(doc(db, 'users', user.uid), {
                        name: 'Demo Kullanıcı',
                        email: demoEmail,
                        plan: 'elite',
                        role: 'admin',
                        tenantId: user.uid,
                        createdAt: new Date().toISOString()
                    });
                    return { success: true };
                } catch (recreateErr) {
                    console.error("Demo account re-creation failed:", recreateErr);
                    return { success: false, error: "Demo hesabı şifresi değişmiş. Firebase Console'dan manuel olarak silin veya farklı bir email ile kaydolun." };
                }
            }
            console.error("Demo login failed:", err.code, err.message);
            return { success: false, error: "Demo giriş hatası: " + err.message };
        }
    };

    const updateUser = async (newData) => {
        if (!currentUser) return { success: false, error: 'No user' };
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            // We only update Firestore, Auth profile (displayName) can be synced too if needed
            await updateDoc(userRef, newData);
            
            if (newData.name) {
                await firebaseUpdateProfile(auth.currentUser, { displayName: newData.name });
            }
            
            setCurrentUser(prev => ({ ...prev, ...newData }));
            return { success: true };
        } catch (err) {
            console.error("Update user error:", err);
            return { success: false, error: err.message };
        }
    };

    const changePassword = async (currentPassword, newPassword) => {
        const user = auth.currentUser;
        if (!user) return { success: false, error: 'No user' };
        
        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            return { success: true };
        } catch (err) {
            console.error("Change password error:", err);
            return { success: false, error: err.message };
        }
    };

    const deleteAccount = async () => {
        const user = auth.currentUser;
        if (!user) return { success: false, error: 'No user' };

        try {
            // Delete Firestore data
            await deleteDoc(doc(db, 'users', user.uid));
            // In a real app, you'd delete all tenant data too, but here we just delete the user record
            
            await deleteUser(user);
            return { success: true };
        } catch (err) {
            console.error("Delete account error:", err);
            return { success: false, error: err.message };
        }
    };

    return (
        <AuthContext.Provider value={{
            currentUser, loading, login, register, logout, signInWithGoogle, signInWithApple, signInAsDemo,
            updateUser, changePassword, deleteAccount,
            isAuthenticated: !!currentUser,
            isPro: ['premium', 'elite', 'lifetime'].includes(currentUser?.plan)
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
