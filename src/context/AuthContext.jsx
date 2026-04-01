import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext();

// Fallback mock users for when Supabase is not configured
const MOCK_USERS = [
    { email: 'demo@bayfatura.com', password: 'demo123', name: 'Demo User', plan: 'premium', companyName: 'Demo Company' }
];

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const useSupabase = isSupabaseConfigured();

    useEffect(() => {
        // Instant login with default admin user
        const defaultUser = {
            id: 'admin-123',
            email: 'admin@bayfatura.com',
            name: 'BayFatura Admin',
            plan: 'premium',
            companyName: 'BayFatura Construction'
        };
        setCurrentUser(defaultUser);
        setLoading(false);
    }, []);

    // No need to save to localStorage as we have a default user
    useEffect(() => {
        // Placeholder for consistency
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
    const updateUser = async (updatedData) => {
        if (useSupabase) {
            try {
                const { data, error } = await supabase.auth.updateUser({
                    data: {
                        full_name: updatedData.name,
                        avatar: updatedData.avatar,
                        company_name: updatedData.companyName,
                        role: updatedData.role
                    }
                });

                if (error) throw error;

                setCurrentUser(prev => ({
                    ...prev,
                    ...updatedData,
                    name: data.user.user_metadata?.full_name || updatedData.name,
                    avatar: data.user.user_metadata?.avatar || updatedData.avatar
                }));
                return { success: true };
            } catch (error) {
                console.error('Error updating user profile:', error);
                return { success: false, error: error.message };
            }
        } else {
            // Fallback: update in state and localStorage
            const updated = { ...currentUser, ...updatedData };
            setCurrentUser(updated);

            // Also update in registered users list
            const registeredUsers = JSON.parse(localStorage.getItem('bay_registered_users') || '[]');
            // Try to find by id first (if we add it), otherwise by email
            const identifier = currentUser?.id || currentUser?.email;
            const idx = registeredUsers.findIndex(u => (u.id && u.id === identifier) || u.email === currentUser?.email);

            if (idx !== -1) {
                registeredUsers[idx] = { ...registeredUsers[idx], ...updatedData };
                localStorage.setItem('bay_registered_users', JSON.stringify(registeredUsers));
            }
            return { success: true };
        }
    };

    const isAuthenticated = true; // Always authenticated

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
