import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, isFirebaseConfigured, googleProvider, appleProvider } from '../lib/firebase';
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    signOut,
    signInWithPopup,
    getRedirectResult,
    signInAnonymously,
    updateProfile as firebaseUpdateProfile,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    deleteUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

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
            console.error("Login error:", err);
            throw err; // Re-throw to be caught by the page components
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
            const result = await signInWithPopup(auth, googleProvider);
            return { success: true, user: result.user };
        } catch (err) {
            console.error("Google login error:", err);
            // Handle redirect_uri_mismatch and other OAuth errors
            if (err.code === 'auth/popup-closed-by-user') {
                return { success: false, error: 'Popup closed. Please allow popups and try again.' };
            }
            if (err.message?.includes('redirect_uri_mismatch')) {
                console.warn('Redirect URI mismatch. Check Firebase Console > Authentication > Authorized domains');
                return { success: false, error: 'OAuth configuration error. Please contact support.' };
            }
            return { success: false, error: err.message };
        }
    };
    
    const signInWithApple = async () => {
        try {
            const result = await signInWithPopup(auth, appleProvider);
            return { success: true, user: result.user };
        } catch (err) {
            console.error("Apple login error:", err);
            if (err.code === 'auth/popup-closed-by-user') {
                return { success: false, error: 'Popup closed. Please allow popups and try again.' };
            }
            return { success: false, error: err.message };
        }
    };
    const signInAsDemo = async () => {
        try {
            const demoEmail = 'demo@bayfatura.com';
            const demoPassword = 'DemoPassword123!'; // Bu hesabı Firebase Console'dan oluşturmalısınız
            await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
            return { success: true };
        } catch (err) {
            console.error("Demo login failed. Make sure demo@bayfatura.com exists in Firebase Auth:", err.message);
            return { success: false, error: "Demo account is currently undergoing maintenance." };
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
