import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Use relative base URL — Vite dev proxy forwards /api → localhost:3000
// This works correctly from ANY network IP (localhost, 192.168.x.x, 10.x.x.x, mobile, tunnel)
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';
axios.defaults.withCredentials = true; // allow cookies

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || '');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            localStorage.setItem('token', token);
            fetchProfile();
        } else {
            delete axios.defaults.headers.common['Authorization'];
            localStorage.removeItem('token');
            setUser(null);
            setLoading(false);
        }
    }, [token]);

    const fetchProfile = async () => {
        try {
            const res = await axios.get('/api/auth/profile');
            setUser(res.data);
        } catch (err) {
            console.error('Failed to load user profile:', err);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password, expectedRole) => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.post('/api/auth/login', { email, password, expectedRole });
            if (res.data.success) {
                setToken(res.data.token);
                setUser(res.data.user);
                return { success: true, user: res.data.user };
            }
            return { success: false, error: 'Login failed' };
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Invalid email or password.';
            setError(errMsg);
            return { success: false, error: errMsg };
        } finally {
            setLoading(false);
        }
    };

    const sendSignupOTP = async (name, email, password, role) => {
        setError('');
        try {
            const res = await axios.post('/api/auth/send-signup-otp', { name, email, password, role });
            if (res.data.success) {
                return { success: true, message: res.data.message };
            }
            return { success: false, error: 'Failed to send verification code.' };
        } catch (err) {
            const errMsg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to send verification code.';
            setError(errMsg);
            return { success: false, error: errMsg };
        }
    };

    const signup = async (name, email, password, role, otp) => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.post('/api/auth/signup', { name, email, password, role, otp });
            if (res.data.success) {
                setToken(res.data.token);
                setUser(res.data.user);
                return { success: true, user: res.data.user };
            }
            return { success: false, error: 'Registration failed' };
        } catch (err) {
            const errMsg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed.';
            setError(errMsg);
            return { success: false, error: errMsg };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await axios.post('/api/auth/logout');
        } catch (e) {
            console.warn('Silent logout warning:', e);
        }
        setToken('');
        setUser(null);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, error, login, sendSignupOTP, signup, logout, fetchProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
