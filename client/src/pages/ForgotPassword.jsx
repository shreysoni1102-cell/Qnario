import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Mail, ArrowLeft, Send } from 'lucide-react';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setErrorMsg('');

        try {
            const res = await authAPI.forgotPassword(email);
            if (res.data.success) {
                setMessage(res.data.message || 'Reset link sent. Check your inbox.');
            } else {
                setErrorMsg(res.data.message || 'Failed to request reset. Try again.');
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Error occurred. Please verify your connection.');
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
                    Recover Credentials
                </h2>
                <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '25px' }}>
                    Enter your email to receive a password reset link.
                </p>

                {message && (
                    <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '12px 14px', borderRadius: '8px', fontSize: '0.85rem', color: '#34d399', marginBottom: '20px' }}>
                        {message}
                    </div>
                )}

                {errorMsg && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px 14px', borderRadius: '8px', fontSize: '0.85rem', color: '#f87171', marginBottom: '20px' }}>
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }}><Mail size={18} /></span>
                            <input 
                                type="email" 
                                className="form-input" 
                                style={{ paddingLeft: '45px' }}
                                placeholder="name@domain.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="btn btn-primary" 
                        disabled={loading}
                        style={{ marginTop: '10px' }}
                    >
                        {loading ? 'Sending...' : 'Request Reset Link'}
                        <Send size={18} />
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem' }}>
                    <Link to="/login" style={{ color: '#4facfe', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <ArrowLeft size={16} /> Back to Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
