import { useEffect, useState, useCallback } from "react";
import Cookies from "js-cookie";
import api from "../services/api";
import { AuthContext } from "./authContextValue";

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(!!Cookies.get('token'));
    const [user, setUser] = useState(() => {
        const storedUser = Cookies.get('user');
        if (storedUser) {
            try {
                return JSON.parse(storedUser);
            } catch {
                return null;
            }
        }
        return null;
    });
    const [loading, setLoading] = useState(true);

    // Logout function
    const logout = useCallback(() => {
        Cookies.remove('token');
        Cookies.remove('user');
        setUser(null);
        setIsAuthenticated(false);
    }, []);

    // Verify token and fetch user data on mount
    useEffect(() => {
        const verifyAuth = async () => {
            const token = Cookies.get('token');
            if (token) {
                try {
                    const response = await api.get('/me', {
                        headers: { Authorization: token }
                    });
                    if (response.data.success) {
                        setUser(response.data.data);
                        setIsAuthenticated(true);
                        Cookies.set('user', JSON.stringify(response.data.data));
                    } else {
                        logout();
                    }
                } catch (error) {
                    console.error('Auth verification failed:', error);
                    // Token expired or invalid, logout
                    logout();
                }
            }
            setLoading(false);
        };

        verifyAuth();
    }, [logout]);

    // Handle storage events for multi-tab sync
    useEffect(() => {
        const handleTokenChange = () => {
            const token = Cookies.get('token');
            setIsAuthenticated(!!token);
            if (!token) {
                setUser(null);
            }
        };

        window.addEventListener('storage', handleTokenChange);

        return () => {
            window.removeEventListener('storage', handleTokenChange);
        };
    }, []);

    // Login function
    const login = useCallback(async (email, password) => {
        const response = await api.post('/login', { email, password });

        if (response.data.success) {
            const { token, user } = response.data.data;
            Cookies.set('token', token);
            Cookies.set('user', JSON.stringify(user));
            setUser(user);
            setIsAuthenticated(true);
            return { success: true };
        }
        return { success: false, message: response.data.message };
    }, []);

    // Update user profile
    const updateUser = useCallback((updatedUser) => {
        setUser(updatedUser);
        Cookies.set('user', JSON.stringify(updatedUser));
    }, []);

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            setIsAuthenticated,
            user,
            setUser: updateUser,
            login,
            logout,
            loading
        }}>
            {children}
        </AuthContext.Provider>
    );
};
