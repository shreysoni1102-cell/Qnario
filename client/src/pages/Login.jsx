import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, ArrowRight, BookOpen, GraduationCap, ShieldCheck, RefreshCw } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, sendSignupOTP, signup, user } = useAuth();

    // Parse default role from url query param e.g. /login?role=student
    const queryParams = new URLSearchParams(location.search);
    const initialRole = queryParams.get('role') || 'student';

    // Form fields
    const [isSignup, setIsSignup] = useState(false);
    const [role, setRole] = useState(initialRole);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // OTP flow states
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpTimer, setOtpTimer] = useState(0); // countdown seconds
    const timerRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [infoMsg, setInfoMsg] = useState('');

    useEffect(() => {
        if (user) {
            if (user.role === 'admin') navigate('/admin/dashboard');
            else if (user.role === 'teacher') navigate('/teacher/dashboard');
            else navigate('/student/dashboard');
        }
    }, [user, navigate]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    const startOtpTimer = () => {
        setOtpTimer(600); // 10 min = 600 sec
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setOtpTimer(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const formatTimer = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const resetSignupFlow = () => {
        setOtpSent(false);
        setOtp('');
        setOtpTimer(0);
        if (timerRef.current) clearInterval(timerRef.current);
        setErrorMsg('');
        setInfoMsg('');
    };

    // Step A: Send OTP
    const handleSendOTP = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setInfoMsg('');
        setLoading(true);

        const res = await sendSignupOTP(name, email, password, role);
        setLoading(false);

        if (res.success) {
            setOtpSent(true);
            startOtpTimer();
            setInfoMsg(`A 6-digit code has been sent to ${email}`);
        } else {
            setErrorMsg(res.error || 'Failed to send verification code.');
        }
    };

    // Step B: Verify OTP + Create Account
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        if (!otp || otp.length < 6) {
            setErrorMsg('Please enter the complete 6-digit code.');
            return;
        }
        setLoading(true);
        const res = await signup(name, email, password, role, otp);
        setLoading(false);

        if (res.success) {
            if (role === 'admin') navigate('/admin/dashboard');
            else if (role === 'teacher') navigate('/teacher/dashboard');
            else navigate('/student/dashboard');
        } else {
            setErrorMsg(res.error || 'Verification failed.');
        }
    };

    // Login submit
    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setLoading(true);
        const res = await login(email, password, role);
        setLoading(false);
        if (res.success) {
            if (res.user.role === 'admin') navigate('/admin/dashboard');
            else if (res.user.role === 'teacher') navigate('/teacher/dashboard');
            else navigate('/student/dashboard');
        } else {
            setErrorMsg(res.error || 'Authentication failed.');
        }
    };

    const switchToLogin = () => {
        setIsSignup(false);
        resetSignupFlow();
        setName('');
        setEmail('');
        setPassword('');
        setErrorMsg('');
    };

    const switchToSignup = () => {
        setIsSignup(true);
        setErrorMsg('');
    };

    // OTP digit input helpers — allow only numbers, max 6 chars
    const handleOtpChange = (val) => {
        const digits = val.replace(/\D/g, '').slice(0, 6);
        setOtp(digits);
    };

    return (
        <div className="main-wrapper">
            <div className="brand-header fade-in">
                <h1 className="brand-title" style={{ fontSize: '2.5rem', cursor: 'pointer' }} onClick={() => navigate('/')}>Qnario</h1>
                <p className="brand-subtitle">{role === 'teacher' ? 'Teacher Portal' : role === 'admin' ? 'Admin Portal' : 'Student Center'}</p>
            </div>

            <div className="glass-container fade-in" style={{ animationDelay: '0.1s' }}>
                
                {/* Title */}
                <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.5rem', textAlign: 'center', marginBottom: '8px' }}>
                    {!isSignup ? 'Welcome Back' : otpSent ? 'Check Your Email' : 'Create Account'}
                </h2>
                <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '25px' }}>
                    {!isSignup
                        ? 'Sign in to access your dashboard'
                        : otpSent
                            ? `Enter the 6-digit code sent to ${email}`
                            : 'Join Qnario to get started'}
                </p>

                {/* Error / Info Messages */}
                {errorMsg && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px 14px', borderRadius: '8px', fontSize: '0.85rem', color: '#f87171', marginBottom: '20px' }}>
                        {errorMsg}
                    </div>
                )}
                {infoMsg && !errorMsg && (
                    <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '12px 14px', borderRadius: '8px', fontSize: '0.85rem', color: '#34d399', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldCheck size={16} /> {infoMsg}
                    </div>
                )}

                {/* ===== LOGIN FORM ===== */}
                {!isSignup && (
                    <form onSubmit={handleLogin}>
                        {/* Role Selection for Login */}
                        <div className="form-group">
                            <label className="form-label">Portal Role</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', background: 'rgba(0, 0, 0, 0.25)', padding: '5px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                {[
                                    { val: 'student', label: 'Student', Icon: GraduationCap },
                                    { val: 'teacher', label: 'Teacher', Icon: BookOpen },
                                    { val: 'admin', label: 'Admin', Icon: Lock }
                                ].map(({ val, label, Icon }) => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => setRole(val)}
                                        style={{
                                            padding: '8px 4px',
                                            border: 'none',
                                            borderRadius: '6px',
                                            background: role === val ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent',
                                            color: 'white',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '4px',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <Icon size={14} /> {label}
                                    </button>
                                ))}
                            </div>
                        </div>

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

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }}><Lock size={18} /></span>
                                <input
                                    type="password"
                                    className="form-input"
                                    style={{ paddingLeft: '45px' }}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '10px' }}>
                            {loading ? 'Signing In...' : 'Sign In'}
                            <ArrowRight size={18} />
                        </button>
                    </form>
                )}

                {/* ===== SIGNUP STEP A: Details Form ===== */}
                {isSignup && !otpSent && (
                    <form onSubmit={handleSendOTP}>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }}><User size={18} /></span>
                                <input
                                    type="text"
                                    className="form-input"
                                    style={{ paddingLeft: '45px' }}
                                    placeholder="Enter your full name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

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

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }}><Lock size={18} /></span>
                                <input
                                    type="password"
                                    className="form-input"
                                    style={{ paddingLeft: '45px' }}
                                    placeholder="Min. 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    minLength={6}
                                    required
                                />
                            </div>
                        </div>

                        {/* Role Selection */}
                        <div className="form-group">
                            <label className="form-label">Account Role</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', background: 'rgba(0, 0, 0, 0.25)', padding: '5px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                {[
                                    { val: 'student', label: 'Student', Icon: GraduationCap },
                                    { val: 'teacher', label: 'Teacher', Icon: BookOpen },
                                    { val: 'admin', label: 'Admin', Icon: Lock }
                                ].map(({ val, label, Icon }) => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => setRole(val)}
                                        style={{
                                            padding: '8px 4px',
                                            border: 'none',
                                            borderRadius: '6px',
                                            background: role === val ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent',
                                            color: 'white',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '4px',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <Icon size={14} /> {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '10px' }}>
                            {loading ? 'Sending Code...' : (
                                <><Mail size={16} /> Send Verification Code</>
                            )}
                        </button>
                    </form>
                )}

                {/* ===== SIGNUP STEP B: OTP Verification ===== */}
                {isSignup && otpSent && (
                    <form onSubmit={handleVerifyOTP}>
                        {/* Email icon badge */}
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, rgba(102,126,234,0.2), rgba(118,75,162,0.2))',
                                border: '2px solid rgba(102, 126, 234, 0.4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 12px'
                            }}>
                                <ShieldCheck size={28} style={{ color: '#a78bfa' }} />
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Code sent to <strong style={{ color: '#fff' }}>{email}</strong></p>
                        </div>

                        {/* 6-Digit OTP Input */}
                        <div className="form-group">
                            <label className="form-label" style={{ textAlign: 'center', display: 'block', letterSpacing: '2px' }}>VERIFICATION CODE</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                className="form-input"
                                style={{
                                    textAlign: 'center',
                                    fontSize: '2rem',
                                    fontWeight: '800',
                                    letterSpacing: '12px',
                                    fontFamily: 'monospace',
                                    background: 'rgba(102, 126, 234, 0.08)',
                                    border: '2px solid rgba(102, 126, 234, 0.35)',
                                    borderRadius: '12px',
                                    padding: '16px 20px',
                                    color: '#ffffff'
                                }}
                                placeholder="------"
                                value={otp}
                                onChange={(e) => handleOtpChange(e.target.value)}
                                maxLength={6}
                                autoFocus
                                required
                            />
                        </div>

                        {/* Timer */}
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            {otpTimer > 0 ? (
                                <span style={{ fontSize: '0.82rem', color: otpTimer < 60 ? '#f59e0b' : 'var(--text-muted)' }}>
                                    ⏱ Code expires in <strong>{formatTimer(otpTimer)}</strong>
                                </span>
                            ) : (
                                <span style={{ fontSize: '0.82rem', color: '#f87171' }}>
                                    Code expired.
                                </span>
                            )}
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading || otp.length < 6} style={{ marginTop: '4px' }}>
                            {loading ? 'Verifying...' : (
                                <><ShieldCheck size={16} /> Verify &amp; Create Account</>
                            )}
                        </button>

                        {/* Resend + Change Email */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '18px', fontSize: '0.82rem' }}>
                            <button
                                type="button"
                                disabled={loading}
                                onClick={handleSendOTP}
                                style={{ background: 'none', border: 'none', color: '#4facfe', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600', fontSize: '0.82rem' }}
                            >
                                <RefreshCw size={13} /> Resend Code
                            </button>
                            <button
                                type="button"
                                onClick={resetSignupFlow}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem' }}
                            >
                                ← Change Email
                            </button>
                        </div>
                    </form>
                )}

                {/* Switch Login/Signup */}
                <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {isSignup ? (
                        <span>Already have an account?{' '}
                            <span onClick={switchToLogin} style={{ color: '#4facfe', cursor: 'pointer', fontWeight: '500' }}>Sign In</span>
                        </span>
                    ) : (
                        <span>Don't have an account yet?{' '}
                            <span onClick={switchToSignup} style={{ color: '#4facfe', cursor: 'pointer', fontWeight: '500' }}>Register</span>
                        </span>
                    )}
                </div>

                {!isSignup && (
                    <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.8rem' }}>
                        <Link to="/forgot-password" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Forgot Password?</Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
