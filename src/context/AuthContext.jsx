import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, db, getDb, getDbIdForCountry, isFirebaseConfigured, googleProvider, microsoftProvider } from '../lib/firebase';
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
    signInAnonymously,
    updateProfile as firebaseUpdateProfile,
    updatePassword,
    sendPasswordResetEmail,
    fetchSignInMethodsForEmail,
    EmailAuthProvider,
    reauthenticateWithCredential,
    deleteUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { isNativePlatform } from '../lib/platform';
import { nativeSignInWithGoogle, isNativeAuthAvailable, NativeAuthError } from '../lib/nativeAuth';
import { setUserId as setCrashlyticsUserId } from '../lib/nativeCrashlytics';
import { saveAuthRedirectError } from '../lib/authRedirect';
import { getSocialAuthErrorMessage, isExpectedSocialAuthSetupError } from '../lib/authErrors';
import { shouldUseRedirectForWebAuth } from '../lib/webAuthFlow';

const AuthContext = createContext();

const getCachedUserDb = (uid) => {
    if (typeof window === 'undefined' || !uid) return null;
    return localStorage.getItem(`bayfatura_user_db_${uid}`);
};

const cacheUserDb = (uid, dbId) => {
    if (typeof window === 'undefined' || !uid || !dbId) return;
    localStorage.setItem(`bayfatura_user_db_${uid}`, dbId);
};

const shouldFallbackToRedirect = (err) => {
    const code = err?.code || '';
    return [
        'auth/cancelled-popup-request',
        'auth/operation-not-supported-in-this-environment',
        'auth/popup-blocked',
        'auth/popup-closed-by-user',
        'auth/web-storage-unsupported',
    ].includes(code);
};

const signInWithWebProvider = async (provider, label) => {
    try {
        if (shouldUseRedirectForWebAuth()) {
            console.info(`[Auth] ${label} using redirect login for Safari/WebKit compatibility.`);
            await signInWithRedirect(auth, provider);
            return { success: true, redirecting: true };
        }

        const result = await signInWithPopup(auth, provider);
        return { success: true, user: result.user };
    } catch (popupErr) {
        const code = popupErr?.code || '';
        if (!isExpectedSocialAuthSetupError(popupErr)) {
            console.warn(`[Auth] ${label} popup login failed:`, { code, message: popupErr?.message });
        }

        if (!shouldFallbackToRedirect(popupErr)) {
            throw popupErr;
        }

        await signInWithRedirect(auth, provider);
        return { success: true, redirecting: true };
    }
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const useFirebase = isFirebaseConfigured();

    const syncFirebaseUser = useCallback(async (user) => {
        if (!user) {
            setCurrentUser(null);
            return null;
        }

        try {
            // First read from global DB to discover which DB this user belongs to
            const globalUserRef = doc(db, 'users', user.uid);
            const globalUserDoc = await getDoc(globalUserRef);
            const assignedDbId = globalUserDoc.exists()
                ? globalUserDoc.data()?._db || null
                : getCachedUserDb(user.uid);
            if (assignedDbId) {
                cacheUserDb(user.uid, assignedDbId);
            }
            const userDb = getDb(assignedDbId);
            const userRef = assignedDbId ? doc(userDb, 'users', user.uid) : globalUserRef;
            const userDoc = assignedDbId ? await getDoc(userRef) : globalUserDoc;

            if (userDoc.exists()) {
                const data = userDoc.data();
                let updates = {};
                if (!data.email && user.email) {
                    updates = { ...updates, email: user.email };
                }

                // Süreli verilen Elite plan dolmuşsa otomatik düşür
                if (
                    data.subscriptionType === 'granted' &&
                    data.planExpiresAt &&
                    new Date(data.planExpiresAt) < new Date()
                ) {
                    updates = {
                        ...updates,
                        plan: 'standard',
                        subscriptionType: null,
                        planExpiresAt: null,
                        planDowngradedAt: new Date().toISOString(),
                    };
                }

                // Firebase Auth is the authority for the sign-in address. A
                // stale profile document must never replace it in the UI.
                const appUser = { uid: user.uid, ...data, ...updates, email: user.email || data.email };
                if (Object.keys(updates).length > 0) {
                    await updateDoc(userRef, updates);
                }
                setCurrentUser(appUser);
                return appUser;
            }

            const initialData = {
                name: user.isAnonymous ? 'Demo User' : (user.displayName || 'User'),
                email: user.email || 'guest@bayfatura.com',
                plan: 'standard',
                role: user.email === 'omidbayenderi@gmail.com' ? 'admin' : 'owner',
                tenantId: user.uid,
                createdAt: new Date().toISOString(),
                _db: '(default)'
            };
            await setDoc(userRef, initialData);
            cacheUserDb(user.uid, initialData._db);
            const appUser = { uid: user.uid, ...initialData };
            setCurrentUser(appUser);
            return appUser;
        } catch (err) {
            console.error("Auth sync error:", err);
            const fallbackUser = {
                uid: user.uid,
                email: user.email || 'guest@bayfatura.com',
                name: user.displayName || 'User',
                photoURL: user.photoURL || '',
                role: user.email === 'omidbayenderi@gmail.com' ? 'admin' : 'owner',
                tenantId: user.uid,
                plan: 'standard',
                _db: getCachedUserDb(user.uid) || '(default)'
            };
            setCurrentUser(fallbackUser);
            return fallbackUser;
        } finally {
            setCrashlyticsUserId(user.uid);
        }
    }, []);

    useEffect(() => {
        if (!useFirebase) {
            setCurrentUser({ uid: 'demo-1', email: 'demo@bayfatura.com', role: 'admin', tenantId: 'demo-1', plan: 'elite' });
            setLoading(false);
            return;
        }

        // Handle redirect result (crucial for Safari & redirect flows)
        getRedirectResult(auth)
            .then(async (result) => {
                if (result?.user) {
                    console.log("Redirect login successful:", result.user.email);
                    await syncFirebaseUser(result.user);
                }
            })
            .catch((error) => {
                console.error("Redirect login callback error:", error);
                saveAuthRedirectError(error);
            });
        
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                await syncFirebaseUser(user);
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, [syncFirebaseUser, useFirebase]);

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

    const resetPassword = async (email) => {
        const cleanEmail = String(email || '').trim();
        if (!cleanEmail) {
            return { success: false, error: 'Email address is required.' };
        }

        try {
            const signInMethods = await fetchSignInMethodsForEmail(auth, cleanEmail);
            if (signInMethods.length > 0 && !signInMethods.includes('password')) {
                return { success: false, messageKey: 'resetPasswordSocialOnly' };
            }
            if (signInMethods.length === 0) {
                return { success: false, messageKey: 'resetPasswordNoPasswordAccount' };
            }

            await sendPasswordResetEmail(auth, cleanEmail);
            return { success: true };
        } catch (err) {
            const errCode = err?.code || '';
            const errMsg = err?.message || 'Password reset failed.';
            console.error("[Auth] Password reset error:", { code: errCode, message: errMsg });

            if (errCode === 'auth/user-not-found') {
                return { success: false, messageKey: 'resetPasswordNoPasswordAccount' };
            }
            if (errCode === 'auth/invalid-email') {
                return { success: false, error: 'Invalid email address.' };
            }
            if (errCode === 'auth/too-many-requests') {
                return { success: false, error: 'Too many attempts. Please try again later.' };
            }
            if (errCode === 'auth/network-request-failed') {
                return { success: false, error: 'Network error. Check your connection.' };
            }
            return { success: false, error: errMsg };
        }
    };
    
    const register = async (userData) => {
        try {
            const { user } = await import('firebase/auth').then(m => m.createUserWithEmailAndPassword(auth, userData.email, userData.password));
            
            const userCountry = userData.country || '';
            const assignedDbId = getDbIdForCountry(userCountry);
            const userDb = getDb(assignedDbId);

            const initialData = {
                name: userData.name || 'User',
                companyName: userData.companyName || '',
                email: user.email,
                country: userCountry,
                plan: 'standard',
                role: 'admin',
                tenantId: user.uid,
                createdAt: new Date().toISOString(),
                // DB assignment — never changes after registration
                _db: assignedDbId,
            };

            // Write to assigned DB (eu or global)
            await setDoc(doc(userDb, 'users', user.uid), initialData);
            cacheUserDb(user.uid, assignedDbId);
            // Also write a routing pointer in global DB if user is EU
            if (assignedDbId !== '(default)') {
                await setDoc(doc(db, 'users', user.uid), { _db: assignedDbId, _routingOnly: true });
            }
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
                    if (nativeErr?.type === NativeAuthError.NO_CREDENTIALS) {
                        return { success: false, error: 'No Google account is available on this Android device. Please add a Google account in the emulator/device settings and try again.' };
                    }
                    if (nativeErr?.type === NativeAuthError.CONFIG_ERROR || nativeErr?.type === NativeAuthError.PROVIDER_NOT_ENABLED) {
                        console.warn('[Auth] Native Google not configured:', nativeErr.message);
                        return { success: false, error: 'Google sign-in is not configured for this Android build yet. Please check Firebase SHA-1/SHA-256 and google-services.json.' };
                    }
                    if (
                        nativeErr?.code === 'auth/invalid-credential'
                        || nativeErr?.message?.includes('audience')
                        || nativeErr?.message?.includes('different project')
                    ) {
                        console.warn('[Auth] Native Google project mismatch:', nativeErr.message);
                        return { success: false, error: 'Google sign-in is not configured for this Android build yet. Please rebuild Android with the matching Firebase environment.' };
                    }
                    if (nativeErr?.type === NativeAuthError.UNIMPLEMENTED) {
                        console.warn('[Auth] Native Google plugin unavailable:', nativeErr.message);
                        return { success: false, error: 'Google sign-in is not available in this Android build yet.' };
                    } else {
                        console.warn('[Auth] Native Google login failed:', nativeErr);
                        return { success: false, error: nativeErr?.message || 'Google sign-in failed on Android.' };
                    }
                }
                return { success: false, error: 'Google sign-in did not return a valid credential.' };
            }

            const result = await signInWithWebProvider(googleProvider, 'Google');
            if (result?.user) {
                const appUser = await syncFirebaseUser(result.user);
                return { ...result, appUser };
            }
            return result;
        } catch (err) {
            const errMsg = err?.message || '';
            const errCode = err?.code || '';
            if (isExpectedSocialAuthSetupError(err)) {
                console.info("[Auth] Google login provider is not enabled:", { code: errCode });
            } else {
                console.error("[Auth] Google login error:", { code: errCode, message: errMsg });
            }
            if (errMsg.includes('redirect_uri_mismatch')) {
                console.warn('[Auth] Redirect URI mismatch. Check Firebase Console > Authentication > Authorized domains');
            }
            return { success: false, error: getSocialAuthErrorMessage('Google', err) };
        }
    };
    
    const signInWithMicrosoft = async () => {
        try {
            const isNative = isNativeAuthAvailable();
            if (isNative) {
                return { success: false, error: 'Microsoft sign-in is available on the web build first. Please use Google or email/password on Android for now.' };
            }

            const result = await signInWithWebProvider(microsoftProvider, 'Microsoft');
            if (result?.user) {
                const appUser = await syncFirebaseUser(result.user);
                return { ...result, appUser };
            }
            return result;
        } catch (err) {
            const errMsg = err?.message || '';
            const errCode = err?.code || '';
            if (isExpectedSocialAuthSetupError(err)) {
                console.info("[Auth] Microsoft login provider is not enabled:", { code: errCode });
            } else {
                console.error("[Auth] Microsoft login error:", { code: errCode, message: errMsg });
            }
            return { success: false, error: getSocialAuthErrorMessage('Microsoft', err) };
        }
    };
    const signInAsDemo = async () => {
        try {
            const { user } = await signInAnonymously(auth);
            await setDoc(doc(db, 'users', user.uid), {
                name: 'Demo User',
                email: 'demo@bayfatura.com',
                plan: 'standard',
                role: 'admin',
                tenantId: user.uid,
                createdAt: new Date().toISOString(),
                _db: '(default)'
            });
            cacheUserDb(user.uid, '(default)');
            return { success: true };
        } catch (err) {
            console.error("Demo login failed:", err.code, err.message);
            return { success: false, error: "Demo login failed. Please try again." };
        }
    };

    const updateUser = async (newData) => {
        if (!currentUser) return { success: false, error: 'No user' };
        try {
            const userDb = getDb(currentUser._db);
            const userRef = doc(userDb, 'users', currentUser.uid);
            const allowedData = {
                name: newData.name || '',
                companyName: newData.companyName || currentUser.companyName || '',
                email: auth.currentUser?.email || currentUser.email || '',
                avatar: newData.avatar || currentUser.avatar || '',
                phone: newData.phone || currentUser.phone || '',
                address: newData.address || currentUser.address || '',
                city: newData.city || currentUser.city || '',
                country: newData.country || currentUser.country || '',
                language: newData.language || currentUser.language || '',
                stripePublicKey: newData.stripePublicKey || '',
                paypalClientId: newData.paypalClientId || ''
            };

            await setDoc(userRef, allowedData, { merge: true });
            
            if (allowedData.name) {
                await firebaseUpdateProfile(auth.currentUser, { displayName: allowedData.name });
            }
            
            setCurrentUser(prev => ({ ...prev, ...allowedData }));
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
            // Delete user doc first (while still authenticated — rules require auth.uid == userId)
            // onUserDeleted Cloud Function handles cascade deletion of all other collections
            const userDb = getDb(currentUser?._db);
            await deleteDoc(doc(userDb, 'users', user.uid));
            if (currentUser?._db && currentUser._db !== '(default)') {
                await deleteDoc(doc(db, 'users', user.uid));
            }
            
            await deleteUser(user);
            return { success: true };
        } catch (err) {
            console.error("Delete account error:", err);
            return { success: false, error: err.message };
        }
    };

    return (
        <AuthContext.Provider value={{
            currentUser, loading, login, register, logout, signInWithGoogle, signInWithMicrosoft, signInAsDemo,
            resetPassword, updateUser, changePassword, deleteAccount,
            isAuthenticated: !!currentUser,
            isPro: ['premium', 'elite'].includes(currentUser?.plan)
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
