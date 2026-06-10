import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setErrorMsg('');

        if (!token) {
            setErrorMsg('Invalid or missing password reset token. Please request a new link.');
            return;
        }

        if (newPassword.length < 6) {
            setErrorMsg('Password must be at least 6 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMsg('Passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            const res = await authAPI.resetPassword(token, newPassword);
            if (res.data.success) {
                setMessage(res.data.message || 'Password updated successfully.');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setErrorMsg(res.data.message || 'Failed to reset password. Please try again.');
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'An error occurred. The link may have expired or is invalid.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="main-wrapper">
            <div className="brand-header fade-in">
                <h1 className="brand-title" style={{ fontSize: '2.5rem', cursor: 'pointer' }} onClick={() => navigate('/')}>Qnario</h1>
                <p className="brand-subtitle">Reset Password</p>
            </div>

            <div className="glass-container fade-in" style={{ animationDelay: '0.1s' }}>
                <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.4rem', textAlign: 'center', marginBottom: '8px' }}>
                    Create New Password
                </h2>
                <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '25px' }}>
                    Please enter and confirm your new access credentials.
                </p>

                {message ? (
                    <div style={{ textAlign: 'center', padding: '10px 0' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '15px', borderRadius: '8px', fontSize: '0.9rem', color: '#34d399', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                            <CheckCircle size={20} />
                            <span>{message}</span>
                        </div>
                        <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', width: '100%' }}>
                            Proceed to Login
                        </Link>
                    </div>
                ) : (
                    <>
                        {errorMsg && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px 14px', borderRadius: '8px', fontSize: '0.85rem', color: '#f87171', marginBottom: '20px' }}>
                                {errorMsg}
                            </div>
                        )}

                        {!token && (
                            <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '12px 14px', borderRadius: '8px', fontSize: '0.85rem', color: '#fbbf24', marginBottom: '20px', textAlign: 'center' }}>
                                Warning: No reset token detected in the URL.
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }}><Lock size={18} /></span>
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        className="form-input" 
                                        style={{ paddingLeft: '45px', paddingRight: '45px' }}
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        style={{ position: 'absolute', right: '16px', top: '15px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Confirm New Password</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }}><Lock size={18} /></span>
                                    <input 
                                        type={showConfirmPassword ? "text" : "password"} 
                                        className="form-input" 
                                        style={{ paddingLeft: '45px', paddingRight: '45px' }}
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        style={{ position: 'absolute', right: '16px', top: '15px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className="btn btn-primary" 
                                disabled={loading}
                                style={{ marginTop: '10px' }}
                            >
                                {loading ? (
                                    <>Updating Password... <RefreshCw size={18} className="spin" /></>
                                ) : (
                                    <>Reset Password <Lock size={18} /></>
                                )}
                            </button>
                        </form>
                    </>
                )}

                <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem' }}>
                    <Link to="/login" style={{ color: '#4facfe', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <ArrowLeft size={16} /> Return to Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
