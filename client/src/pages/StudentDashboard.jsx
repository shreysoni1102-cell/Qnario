import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { examAPI, examRoomAPI } from '../services/api';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';
import { 
    LogOut, BookOpen, Award, CheckCircle, ShieldAlert, Sparkles, 
    ArrowRight, BookMarked, History, PlayCircle, Trophy, HelpCircle
} from 'lucide-react';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [stats, setStats] = useState(null);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [roomCode, setRoomCode] = useState('');
    const [joinError, setJoinError] = useState('');

    // Practice Config states
    const [practiceSubject, setPracticeSubject] = useState('Physics');
    const [practiceDifficulty, setPracticeDifficulty] = useState('Medium');
    const [practiceCount, setPracticeCount] = useState(10);
    const [practiceGenerating, setPracticeGenerating] = useState(false);
    const [chartType, setChartType] = useState('performance');
    const [practiceTopic, setPracticeTopic] = useState('');
    const [practiceFocus, setPracticeFocus] = useState('mixed');

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchDashboardData();
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            const statsRes = await examAPI.getStudentDashboard(user.id || user.email);
            setStats(statsRes.data);

            const resultsRes = await examAPI.getStudentResults(user.id || user.email);
            setResults(resultsRes.data);
        } catch (e) {
            console.error('Failed to load dashboard metrics:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRoom = async (e) => {
        e.preventDefault();
        setJoinError('');
        const trimmedCode = roomCode.trim().toUpperCase();

        if (trimmedCode.length !== 6) {
            setJoinError('Room code must be exactly 6 letters.');
            return;
        }

        try {
            const res = await examRoomAPI.getRoomInfo(trimmedCode);
            if (res.data.success) {
                // Redirect to active secure exam room
                navigate(`/student/exam/${trimmedCode}`);
            }
        } catch (err) {
            setJoinError(err.response?.data?.error || 'Invalid or closed exam room code.');
        }
    };

    const handleStartPractice = async () => {
        setPracticeGenerating(true);
        try {
            navigate(`/student/practice?subject=${encodeURIComponent(practiceSubject)}&difficulty=${practiceDifficulty}&count=${practiceCount}&topic=${encodeURIComponent(practiceTopic)}&focus=${practiceFocus}`);
        } catch (e) {
            console.error(e);
        } finally {
            setPracticeGenerating(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    if (loading) {
        return (
            <div className="main-wrapper">
                <p style={{ fontSize: '1.2rem', opacity: 0.8 }} className="fade-in">Loading Qnario dashboard variables...</p>
            </div>
        );
    }

    // Chart metrics calculations - empty by default to prevent seed leakages for fresh accounts
    const performanceHistory = results.length > 0 
        ? [...results].reverse().map((r, idx) => ({ name: `Exam ${idx + 1}`, score: parseFloat(r.percentage) }))
        : [];

    const subjectAccuracies = stats?.allSubjects?.length > 0
        ? stats.allSubjects.map(s => ({ name: s.subject, score: Math.round(s.accuracy) }))
        : [];

    const colors = ['#667eea', '#764ba2', '#4facfe', '#10b981', '#f59e0b', '#ef4444'];

    return (
        <div style={{ padding: '30px 20px', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh' }}>
            
            {/* Header section with branding & user profile quick stats */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.06), rgba(118, 75, 162, 0.06))',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '24px',
                padding: '30px 40px',
                marginBottom: '40px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px',
                position: 'relative',
                overflow: 'hidden'
            }} className="fade-in">
                {/* Visual accent backdrop glow */}
                <div style={{
                    position: 'absolute',
                    top: '-50px',
                    right: '-50px',
                    width: '180px',
                    height: '180px',
                    background: 'radial-gradient(circle, rgba(79, 172, 254, 0.12) 0%, transparent 70%)',
                    pointerEvents: 'none'
                }} />
                
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <span style={{ padding: '4px 10px', background: 'rgba(102, 126, 234, 0.12)', border: '1px solid rgba(102, 126, 234, 0.25)', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 'bold', color: '#a5b4fc', letterSpacing: '0.5px' }}>
                            STUDENT PORTAL
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 'bold', color: '#fbbf24' }}>
                            {stats?.totalExams > 0 ? `🔥 5-Day Study Streak` : `🌱 0-Day Study Streak`}
                        </span>
                    </div>
                    <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '2rem', fontWeight: '800', marginBottom: '4px', letterSpacing: '-0.5px' }}>
                        Welcome back, <span style={{ background: 'linear-gradient(135deg, #667eea, #4facfe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '800' }}>{user.name}</span>!
                    </h1>
                    <p style={{ opacity: 0.7, fontSize: '0.85rem', lineHeight: '1.5' }}>
                        {stats?.totalExams === 0 
                            ? "🚀 Welcome to Qnario! Get started by launching an AI Practice Quiz or joining a secure exam room above."
                            : stats?.averageScore >= 75 
                                ? "✨ Outstanding accuracy! Ready to crush another live exam or customized practice round today?"
                                : "📊 Great job working on your concepts. Consistent daily practice is the key to locking high scores!"
                        }
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <button 
                        onClick={handleLogout}
                        className="btn btn-secondary"
                        style={{ width: 'auto', padding: '12px 20px', borderRadius: '12px', fontSize: '0.85rem' }}
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </div>

            {/* Dashboard statistical grid with custom glow drops */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '35px' }}>
                
                <div 
                    className="glass-card-wide" 
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '20px',
                        border: '1px solid rgba(102, 126, 234, 0.15)',
                        boxShadow: '0 10px 30px -10px rgba(102, 126, 234, 0.2)',
                        transition: 'transform 0.2s ease',
                        cursor: 'default'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <div style={{ padding: '12px', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '12px', color: '#667eea', animation: 'pulse 2s infinite' }}>
                        <Trophy size={28} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Total Exams</h3>
                        <p style={{ fontSize: '1.6rem', fontWeight: '800', fontFamily: 'Space Grotesk' }}>{stats?.totalExams || 0}</p>
                    </div>
                </div>

                <div 
                    className="glass-card-wide" 
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '20px',
                        border: '1px solid rgba(16, 185, 129, 0.15)',
                        boxShadow: '0 10px 30px -10px rgba(16, 185, 129, 0.2)',
                        transition: 'transform 0.2s ease',
                        cursor: 'default'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: '#10b981' }}>
                        <Award size={28} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Average Accuracy</h3>
                        <p style={{ fontSize: '1.6rem', fontWeight: '800', fontFamily: 'Space Grotesk', color: '#34d399' }}>{stats?.averageScore || 0}%</p>
                    </div>
                </div>

                <div 
                    className="glass-card-wide" 
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '20px',
                        border: '1px solid rgba(79, 172, 254, 0.15)',
                        boxShadow: '0 10px 30px -10px rgba(79, 172, 254, 0.2)',
                        transition: 'transform 0.2s ease',
                        cursor: 'default'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <div style={{ padding: '12px', background: 'rgba(79, 172, 254, 0.1)', borderRadius: '12px', color: '#4facfe' }}>
                        <Sparkles size={28} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Strong Subject</h3>
                        <p style={{ fontSize: '1.25rem', fontWeight: '800', color: '#38bdf8' }}>{stats?.totalExams > 0 ? (stats?.strongSubjects?.[0] || 'N/A') : 'N/A'}</p>
                    </div>
                </div>

                <div 
                    className="glass-card-wide" 
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '20px',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        boxShadow: '0 10px 30px -10px rgba(239, 68, 68, 0.2)',
                        transition: 'transform 0.2s ease',
                        cursor: 'default'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', color: '#ef4444' }}>
                        <ShieldAlert size={28} style={{ animation: 'bounce 2s infinite' }} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '2px', letterSpacing: '0.5px' }}>Attention Needed</h3>
                        <p style={{ fontSize: '1.2rem', fontWeight: '800', color: '#f87171', margin: 0 }}>
                            {stats?.totalExams > 0 ? (stats?.weakSubjects?.[0] || 'N/A') : 'N/A'}
                        </p>
                        <span 
                            onClick={() => {
                                setPracticeSubject(stats?.totalExams > 0 ? (stats?.weakSubjects?.[0] || 'Chemistry') : 'Chemistry');
                                const practiceEl = document.getElementById('ai-practice-section');
                                if (practiceEl) practiceEl.scrollIntoView({ behavior: 'smooth' });
                            }}
                            style={{ fontSize: '0.72rem', color: '#fca5a5', textDecoration: 'underline', cursor: 'pointer', fontWeight: '600', opacity: 0.85 }}
                        >
                            Configure AI Fix
                        </span>
                    </div>
                </div>
            </div>

            {/* Layout middle grids */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '25px', marginBottom: '35px' }}>
                
                {/* Recharts Analytics Panel with Dual Switched tab selectors */}
                <div className="glass-card-wide" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.15rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                            <BookMarked size={20} color="#667eea" /> Learning Progress Metrics
                        </h2>
                        
                        {/* Tab selectors */}
                        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <button 
                                onClick={() => setChartType('performance')}
                                style={{
                                    padding: '6px 12px',
                                    background: chartType === 'performance' ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: '0.72rem',
                                    fontWeight: '700',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    transition: 'all 0.25s ease'
                                }}
                            >
                                Exam Curve
                            </button>
                            <button 
                                onClick={() => setChartType('subjects')}
                                style={{
                                    padding: '6px 12px',
                                    background: chartType === 'subjects' ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: '0.72rem',
                                    fontWeight: '700',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    transition: 'all 0.25s ease'
                                }}
                            >
                                Subject Strengths
                            </button>
                        </div>
                    </div>
                    
                    {results.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '240px', opacity: 0.5, textAlign: 'center' }}>
                            <HelpCircle size={40} style={{ marginBottom: '10px', color: '#667eea', animation: 'pulse 2s infinite' }} />
                            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1rem', fontWeight: 'bold', marginBottom: '6px' }}>
                                No Progress Curves Available
                            </h3>
                            <p style={{ fontSize: '0.8rem', maxWidth: '340px', lineHeight: '1.5' }}>
                                Complete your first live supervisor exam or dynamic AI practice quiz to start plotting your metrics!
                            </p>
                        </div>
                    ) : (
                        <div style={{ width: '100%', height: '240px', marginTop: '10px' }}>
                            <ResponsiveContainer>
                                {chartType === 'performance' ? (
                                    <AreaChart data={performanceHistory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#667eea" stopOpacity={0.45}/>
                                                <stop offset="95%" stopColor="#667eea" stopOpacity={0.0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                                        <YAxis stroke="rgba(255,255,255,0.4)" domain={[0, 100]} fontSize={11} />
                                        <Tooltip contentStyle={{ background: '#0d112b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white' }} />
                                        <Area type="monotone" dataKey="score" stroke="#667eea" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                                    </AreaChart>
                                ) : (
                                    <BarChart data={subjectAccuracies} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                                        <YAxis stroke="rgba(255,255,255,0.4)" domain={[0, 100]} fontSize={11} />
                                        <Tooltip contentStyle={{ background: '#0d112b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white' }} />
                                        <Bar dataKey="score" radius={[8, 8, 0, 0]} maxBarSize={45}>
                                            {subjectAccuracies.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Keypad style security join room portal */}
                <div 
                    className="glass-card-wide" 
                    style={{ 
                        padding: '24px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center',
                        border: '1px solid rgba(79, 172, 254, 0.15)',
                        boxShadow: '0 10px 30px -10px rgba(79, 172, 254, 0.15)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <div style={{ padding: '8px', background: 'rgba(79, 172, 254, 0.1)', borderRadius: '8px', color: '#4facfe' }}>
                            <PlayCircle size={20} />
                        </div>
                        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.15rem', fontWeight: '700', color: '#4facfe', margin: 0 }}>
                            Join Exam Room
                        </h2>
                    </div>
                    <p style={{ opacity: 0.6, fontSize: '0.8rem', lineHeight: '1.4', marginBottom: '20px' }}>
                        Enter the secure 6-digit room code provided by your supervisor to unlock your proctored assessment.
                    </p>

                    {joinError && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '10px 12px', borderRadius: '8px', fontSize: '0.8rem', color: '#f87171', marginBottom: '14px', animation: 'shake 0.3s ease' }}>
                            {joinError}
                        </div>
                    )}

                    <form onSubmit={handleJoinRoom}>
                        <div className="form-group" style={{ marginBottom: '18px' }}>
                            <input 
                                type="text"
                                className="form-input"
                                placeholder="• • • • • •"
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value)}
                                style={{ 
                                    textAlign: 'center', 
                                    letterSpacing: '8px', 
                                    fontWeight: '800', 
                                    fontSize: '1.3rem', 
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    fontFamily: 'Space Grotesk, sans-serif'
                                }}
                                maxLength={6}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ padding: '12px', background: 'linear-gradient(135deg, #4facfe, #00f2fe)', color: '#050c26', fontWeight: 'bold' }}>
                            Validate & Unlock Paper <ArrowRight size={16} />
                        </button>
                    </form>
                </div>
            </div>

            {/* Bottom grids: practice tests & historical list */}
            <div id="ai-practice-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                
                {/* AI Practice generating config with Personalized AI launcher recommendation */}
                <div className="glass-card-wide" style={{ padding: '24px', position: 'relative' }}>
                    <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.15rem', fontWeight: '700', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={20} color="#10b981" /> AI Practice Generator
                    </h2>
                    
                    {/* Personalized AI Recommended quick-launcher */}
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(79, 172, 254, 0.08))',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        padding: '14px 18px',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <span style={{ fontSize: '0.65rem', background: '#10b981', color: '#052e16', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                AI Recommended
                            </span>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: '700', marginTop: '4px' }}>
                                {stats?.totalExams > 0 
                                    ? `Weak Area Quick-Fix (${stats?.weakSubjects?.[0] || 'Chemistry'})`
                                    : "Diagnostic Practice Test"
                                }
                            </h4>
                        </div>
                        <button 
                            onClick={() => {
                                const targetSub = stats?.totalExams > 0 ? (stats?.weakSubjects?.[0] || 'Chemistry') : 'General Science';
                                navigate(`/student/practice?subject=${targetSub}&difficulty=Medium&count=10`);
                            }}
                            className="btn btn-primary"
                            style={{ width: 'auto', padding: '8px 14px', fontSize: '0.75rem', borderRadius: '8px', background: 'linear-gradient(135deg, #10b981, #059669)' }}
                        >
                            Quick Launch
                        </button>
                    </div>
                    
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label className="form-label">Subject</label>
                        <input 
                            type="text"
                            className="form-input"
                            placeholder="e.g. Physics, Data Structures, Quantum Mechanics"
                            value={practiceSubject}
                            onChange={(e) => setPracticeSubject(e.target.value)}
                            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
                            required
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label className="form-label">Focus Chapter / Sub-Topic (Optional)</label>
                        <input 
                            type="text"
                            className="form-input"
                            placeholder="e.g. Thermodynamics, Kinematics, Algebra"
                            value={practiceTopic}
                            onChange={(e) => setPracticeTopic(e.target.value)}
                            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label className="form-label">Question Style Focus</label>
                        <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                            {['mixed', 'conceptual', 'numerical'].map((focusItem) => (
                                <button
                                    key={focusItem}
                                    type="button"
                                    onClick={() => setPracticeFocus(focusItem)}
                                    style={{
                                        flex: 1,
                                        padding: '10px 0',
                                        background: practiceFocus === focusItem ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '0.72rem',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        textTransform: 'capitalize'
                                    }}
                                >
                                    {focusItem}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }} className="form-group">
                        <div>
                            <label className="form-label">Difficulty</label>
                            <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                {['Easy', 'Medium', 'Hard'].map((diff) => (
                                    <button
                                        key={diff}
                                        type="button"
                                        onClick={() => setPracticeDifficulty(diff)}
                                        style={{
                                            flex: 1,
                                            padding: '8px 0',
                                            background: practiceDifficulty === diff ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
                                            border: 'none',
                                            borderRadius: '6px',
                                            color: 'white',
                                            fontSize: '0.72rem',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        {diff}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="form-label">Question Count</label>
                            <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                {[5, 10, 15, 20].map((num) => (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => setPracticeCount(num)}
                                        style={{
                                            flex: 1,
                                            padding: '8px 0',
                                            background: practiceCount === num ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
                                            border: 'none',
                                            borderRadius: '6px',
                                            color: 'white',
                                            fontSize: '0.72rem',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        {num}Q
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleStartPractice}
                        className="btn btn-secondary" 
                        style={{ border: '1px solid #10b981', color: '#10b981', background: 'rgba(16, 185, 129, 0.05)', fontWeight: '700', padding: '12px' }}
                        disabled={practiceGenerating}
                    >
                        {practiceGenerating ? 'Initializing...' : 'Launch Custom Practice'}
                        <PlayCircle size={18} />
                    </button>
                </div>

                {/* Exam history review list */}
                <div className="glass-card-wide" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.15rem', fontWeight: '700', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <History size={20} color="#f59e0b" /> Performance Logs
                    </h2>

                    <div style={{ flex: 1, overflowY: 'auto', maxHeight: '280px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {results.length === 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '180px', opacity: 0.5 }}>
                                <HelpCircle size={32} style={{ marginBottom: '8px' }} />
                                <p style={{ fontSize: '0.85rem' }}>No exam results found. Take your first test!</p>
                            </div>
                        ) : (
                            results.map((res) => (
                                <div 
                                    key={res._id || res.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        border: '1px solid var(--border)',
                                        padding: '14px 18px',
                                        borderRadius: '12px',
                                        transition: 'background 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                                >
                                    <div>
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '4px' }}>
                                            {res.examName || 'Live Proctor Exam'}
                                        </h4>
                                        <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                                            {new Date(res.completedAt || res.submittedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ 
                                                fontSize: '1rem', 
                                                fontWeight: '800', 
                                                color: parseFloat(res.percentage) >= 50 ? '#10b981' : '#ef4444' 
                                            }}>
                                                {res.percentage}%
                                            </span>
                                            <p style={{ fontSize: '0.68rem', opacity: 0.5, margin: 0 }}>Accuracy</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
