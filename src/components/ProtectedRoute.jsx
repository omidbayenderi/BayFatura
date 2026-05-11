import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingPage from './LoadingPage';

const ProtectedRoute = () => {
    const { currentUser, loading } = useAuth();

    if (loading) return <LoadingPage />;

    return currentUser ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
