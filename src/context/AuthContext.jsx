import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext();

// Fallback mock users for when Supabase is not configured
const MOCK_USERS = [
    { email: 'demo@bayrechnung.com', password: 'demo123', name: 'Demo User', plan: 'premium', companyName: 'Demo Company' }
];

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const useSupabase = isSupabaseConfigured();

    useEffect(() => {
        if (useSupabase) {
            // Get initial Supabase session
            supabase.auth.getSession().then(({ data: { session } }) => {
                setSession(session);
                if (session?.user) {
                    setCurrentUser({
                        id: session.user.id,
                        email: session.user.email,
                        name: session.user.user_metadata?.full_name || session.user.email,
                        plan: 'free', // Will be fetched from subscriptions table
                        companyName: session.user.user_metadata?.company_name
                    });
                }
                setLoading(false);
            });

            // Listen for auth changes
            const { data: { subscription } } = supabase.auth.onAuthStateChange(
                async (_event, session) => {
                    setSession(session);
                    if (session?.user) {
                        setCurrentUser({
                            id: session.user.id,
                            email: session.user.email,
                            name: session.user.user_metadata?.full_name || session.user.email,
                            plan: 'free',
                            companyName: session.user.user_metadata?.company_name
                        });
                    } else {
                        setCurrentUser(null);
                    }
                }
            );

            return () => subscription.unsubscribe();
        } else {
            // Fallback to localStorage
            const saved = localStorage.getItem('bay_current_user');
            setCurrentUser(saved ? JSON.parse(saved) : null);
            setLoading(false);
        }
    }, [useSupabase]);

    // Save to localStorage when using fallback mode
    useEffect(() => {
        if (!useSupabase) {
            if (currentUser) {
                localStorage.setItem('bay_current_user', JSON.stringify(currentUser));
            } else {
                localStorage.removeItem('bay_current_user');
            }
        }
    }, [currentUser, useSupabase]);

    const login = async (email, password) => {
        if (useSupabase) {
            // Supabase login
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                console.error('Login error:', error);
                return false;
            }

            return true;
        } else {
            // Fallback localStorage login
            const user = MOCK_USERS.find(u => u.email === email && u.password === password);
            const registeredUsers = JSON.parse(localStorage.getItem('bay_registered_users') || '[]');
            const registeredUser = registeredUsers.find(u => u.email === email && u.password === password);

            if (user || registeredUser) {
                const authenticatedUser = user || registeredUser;
                setCurrentUser({
                    email: authenticatedUser.email,
                    name: authenticatedUser.name,
                    plan: authenticatedUser.plan,
                    companyName: authenticatedUser.companyName
                });
                return true;
            }
            return false;
        }
    };

    const register = async (userData) => {
        const { email, password, name, companyName, plan, industry } = userData;

        if (useSupabase) {
            // Supabase registration
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                        company_name: companyName,
                        industry: industry || 'general'
                    }
                }
            });

            if (error) {
                console.error('Registration error:', error);
                return { success: false, error: error.message };
            }

            // User profile and subscription are auto-created via trigger
            return { success: true, data };
        } else {
            // Fallback localStorage registration
            const registeredUsers = JSON.parse(localStorage.getItem('bay_registered_users') || '[]');
            if (registeredUsers.find(u => u.email === email) || MOCK_USERS.find(u => u.email === email)) {
                return { success: false, error: 'Email already registered' };
            }

            const newUser = { email, password, name, companyName, plan: plan || 'standard', industry: industry || 'general' };
            registeredUsers.push(newUser);
            localStorage.setItem('bay_registered_users', JSON.stringify(registeredUsers));

            setCurrentUser({
                email: newUser.email,
                name: newUser.name,
                plan: newUser.plan,
                companyName: newUser.companyName
            });

            return { success: true };
        }
    };

    const logout = async () => {
        if (useSupabase) {
            await supabase.auth.signOut();
        } else {
            setCurrentUser(null);
        }
    };

    // Update user profile (for avatar, name, etc.)
    const updateUser = (updatedData) => {
        if (useSupabase) {
            // For Supabase, we'd update user metadata
            // For now, just update local state
            setCurrentUser(prev => ({ ...prev, ...updatedData }));
        } else {
            // Fallback: update in state and localStorage
            const updated = { ...currentUser, ...updatedData };
            setCurrentUser(updated);

            // Also update in registered users list
            const registeredUsers = JSON.parse(localStorage.getItem('bay_registered_users') || '[]');
            const idx = registeredUsers.findIndex(u => u.email === currentUser?.email);
            if (idx !== -1) {
                registeredUsers[idx] = { ...registeredUsers[idx], ...updatedData };
                localStorage.setItem('bay_registered_users', JSON.stringify(registeredUsers));
            }
        }
    };

    const isAuthenticated = !!currentUser;

    return (
        <AuthContext.Provider value={{
            currentUser,
            session,
            login,
            register,
            logout,
            updateUser,
            isAuthenticated,
            loading,
            useSupabase
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
