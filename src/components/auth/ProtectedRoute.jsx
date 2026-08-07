import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/authContextValue';

// Loading spinner component
const LoadingSpinner = () => (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#1E1F22" }}>
        <div className="flex flex-col items-center gap-6">
            <div className="relative">
                <div className="w-20 h-20 border-4 border-[#74CD25]/20 border-t-[#74CD25] rounded-full animate-pulse"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-8 h-8 bg-[#74CD25] rounded-lg animate-pulse" />
                </div>
            </div>
            <div className="flex flex-col items-center gap-1">
                <span className="text-white font-black text-2xl tracking-[0.2em] animate-pulse uppercase">Authenticating</span>
                <span className="text-gray-500 font-bold text-xs tracking-widest uppercase">Securing Connection...</span>
            </div>
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
