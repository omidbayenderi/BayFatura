import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
    const { currentUser, loading } = useAuth();

    if (loading) return null; // Or a loading spinner

    return currentUser ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
