import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/authContextValue';

// Loading spinner component
const LoadingSpinner = () => (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#1E1F22" }}>
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#74CD25] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-white text-lg">Loading...</span>
        </div>
    </div>
);

// Protected Route - requires authentication
export const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useContext(AuthContext);
    const location = useLocation();

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!isAuthenticated) {
        // Redirect to login with return path
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

// Public Route - redirects to home if already authenticated (for login/register pages)
export const PublicRoute = ({ children }) => {
    const { isAuthenticated, loading } = useContext(AuthContext);
    const location = useLocation();

    if (loading) {
        return <LoadingSpinner />;
    }

    if (isAuthenticated) {
        // Redirect to intended destination or home
        const from = location.state?.from?.pathname || '/';
        return <Navigate to={from} replace />;
    }

    return children;
};

export default ProtectedRoute;
