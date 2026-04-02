import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, isFirebaseConfigured, googleProvider, appleProvider } from '../lib/firebase';
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut,
    signInWithPopup,
    sendPasswordResetEmail,
    updateProfile as firebaseUpdateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const AuthContext = createContext();

// Fallback mock users for when Firebase is not configured
const MOCK_USERS = [
    { email: 'demo@bayfatura.com', password: 'demo123', name: 'Demo User', plan: 'premium', companyName: 'Demo Company' }
];

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const useFirebase = isFirebaseConfigured();

    useEffect(() => {
        if (useFirebase) {
            const unsubscribe = onAuthStateChanged(auth, async (user) => {
                if (user) {
                    try {
                        const userDoc = await getDoc(doc(db, 'users', user.uid));
                        if (userDoc.exists()) {
                            setCurrentUser({
                                uid: user.uid,
                                email: user.email,
                                avatar: user.photoURL,
                                ...userDoc.data()
                            });
                        } else {
                            // If user exists in Auth but not in Firestore (e.g. first social login)
                            const initialData = {
                                name: user.displayName || 'Unnamed User',
                                plan: 'standard',
                                industry: 'general',
                                createdAt: new Date().toISOString()
                            };
                            await setDoc(doc(db, 'users', user.uid), initialData);
                            setCurrentUser({ uid: user.uid, email: user.email, ...initialData });
                        }
                    } catch (error) {
                        console.error("Error fetching user data:", error);
                    }
                } else {
                    setCurrentUser(null);
                }
                setLoading(false);
            });
            return unsubscribe;
        } else {
            const defaultUser = {
                id: 'admin-123',
                email: 'admin@bayfatura.com',
                name: 'BayFatura Admin',
                plan: 'premium',
                companyName: 'BayFatura Construction'
            };
            setCurrentUser(defaultUser);
            setLoading(false);
        }
    }, [useFirebase]);

    const login = async (email, password) => {
        if (useFirebase) {
            await signInWithEmailAndPassword(auth, email, password);
            return true;
        } else {
            const user = MOCK_USERS.find(u => u.email === email && u.password === password);
            if (user) {
                setCurrentUser(user);
                return true;
            }
            return false;
        }
    };

    const register = async (userData) => {
        const { email, password, name, companyName, plan, industry } = userData;
        if (useFirebase) {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await firebaseUpdateProfile(user, { displayName: name });
            await setDoc(doc(db, 'users', user.uid), {
                name,
                companyName,
                plan: plan || 'standard',
                industry: industry || 'general',
                createdAt: new Date().toISOString()
            });
            return { success: true };
        } else {
            return { success: true }; // Mock success
        }
    };

    const signInWithGoogle = async () => {
        if (useFirebase) {
            try {
                await signInWithPopup(auth, googleProvider);
                return { success: true };
            } catch (error) {
                console.error("Google sign in error:", error);
                return { success: false, error: error.message };
            }
        }
    };

    const signInWithApple = async () => {
        if (useFirebase) {
            try {
                await signInWithPopup(auth, appleProvider);
                return { success: true };
            } catch (error) {
                console.error("Apple sign in error:", error);
                return { success: false, error: error.message };
            }
        }
    };

    const resetPassword = async (email) => {
        if (useFirebase) {
            await sendPasswordResetEmail(auth, email);
        }
    };

    const logout = async () => {
        if (useFirebase) {
            await signOut(auth);
        } else {
            setCurrentUser(null);
        }
    };

    const updateUser = async (updatedData) => {
        if (useFirebase && auth.currentUser) {
            await updateDoc(doc(db, 'users', auth.currentUser.uid), updatedData);
            if (updatedData.name) {
                await firebaseUpdateProfile(auth.currentUser, { displayName: updatedData.name });
            }
            setCurrentUser(prev => ({ ...prev, ...updatedData }));
            return { success: true };
        }
    };

    const isAuthenticated = !!currentUser;

    return (
        <AuthContext.Provider value={{
            currentUser,
            login,
            register,
            logout,
            updateUser,
            isAuthenticated,
            loading,
            useFirebase,
            signInWithGoogle,
            signInWithApple,
            resetPassword
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
