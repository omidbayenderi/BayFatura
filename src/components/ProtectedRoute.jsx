import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingPage from './LoadingPage';
import { auth, isFirebaseConfigured } from '../lib/firebase';

const ProtectedRoute = () => {
    const { currentUser, loading } = useAuth();

    if (loading) return <LoadingPage />;
    if (!currentUser && isFirebaseConfigured() && auth.currentUser) return <LoadingPage />;

    return currentUser ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
