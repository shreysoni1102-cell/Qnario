import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { syllabusAPI, examRoomAPI } from '../services/api';
import { 
    LogOut, BookOpen, Sparkles, Monitor, PlusCircle, 
    FileText, Calendar, CheckCircle, Copy, Check, ArrowRight, Play, Eye, Users
} from 'lucide-react';

const TeacherDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [papers, setPapers] = useState([]);
    const [syllabi, setSyllabi] = useState([]);
    const [loading, setLoading] = useState(true);

    // Live Room Creation states
    const [createdCode, setCreatedCode] = useState('');
    const [activePaper, setActivePaper] = useState(null);
    const [roomDuration, setRoomDuration] = useState(60);
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [copied, setCopied] = useState(false);
    const [roomLoading, setRoomLoading] = useState(false);

    // Exam Room Reports states
    const [reports, setReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [activeTab, setActiveTab] = useState('papers'); // 'papers' or 'reports'

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchTeacherData();
    }, [user]);

    const fetchTeacherData = async () => {
        try {
            const paperRes = await syllabusAPI.listPapers(user.email);
            setPapers(paperRes.data.papers || []);

            const sylRes = await syllabusAPI.listSyllabi(user.email);
            setSyllabi(sylRes.data.syllabi || []);

            const reportsRes = await examRoomAPI.getTeacherReports(user.email);
            if (reportsRes.data.success) {
                setReports(reportsRes.data.rooms || []);
            }
        } catch (e) {
            console.error('Failed to load teacher stats:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRoom = async (paper) => {
        setActivePaper(paper);
        setCreatedCode('');
        setShowRoomModal(true);
    };

    const submitCreateRoom = async () => {
        if (!activePaper) return;
        setRoomLoading(true);
        try {
            const res = await examRoomAPI.createRoom({
                paperId: activePaper.id,
                teacherEmail: user.email,
                duration: roomDuration
            });
            if (res.data.success) {
                setCreatedCode(res.data.roomCode);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setRoomLoading(false);
        }
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(createdCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    if (loading) {
        return (
            <div className="main-wrapper">
                <p style={{ fontSize: '1.2rem', opacity: 0.8 }} className="fade-in">Loading teacher dashboard records...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '30px 20px', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh' }}>
            
            {/* Modal for creating a live room code */}
            {showRoomModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9999,
                    background: 'rgba(10, 14, 39, 0.85)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }} className="fade-in">
                    <div className="glass-container" style={{ maxWidth: '480px', position: 'relative' }}>
                        <button 
                            onClick={() => setShowRoomModal(false)}
                            style={{
                                position: 'absolute',
                                right: '20px',
                                top: '20px',
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                fontSize: '1.2rem',
                                cursor: 'pointer',
                                opacity: 0.7
                            }}
                        >
                            ✕
                        </button>

                        {!createdCode ? (
                            <div>
                                <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.3rem', marginBottom: '10px', color: '#4facfe' }}>
                                    Initialize Exam Room
                                </h3>
                                <p style={{ opacity: 0.7, fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '24px' }}>
                                    Generate a unique access room code for: <strong style={{ color: 'white' }}>{activePaper?.subject} ({activePaper?.className})</strong>
                                </p>

                                <div className="form-group">
                                    <label className="form-label">Exam Duration (Minutes)</label>
                                    <input 
                                        type="number"
                                        className="form-input"
                                        value={roomDuration}
                                        onChange={(e) => setRoomDuration(parseInt(e.target.value))}
                                        min={10}
                                        max={300}
                                        required
                                    />
                                </div>

                                <button 
                                    onClick={submitCreateRoom}
                                    className="btn btn-primary"
                                    disabled={roomLoading}
                                >
                                    {roomLoading ? 'Allocating...' : 'Generate 6-Digit Code'}
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', color: '#10b981', marginBottom: '16px' }}>
                                    <CheckCircle size={32} />
                                </div>
                                <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.3rem', marginBottom: '8px' }}>
                                    Exam Room Active
                                </h3>
                                <p style={{ opacity: 0.7, fontSize: '0.8rem', marginBottom: '25px' }}>
                                    Share the code below with your students to let them connect.
                                </p>

                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    gap: '12px', 
                                    background: 'rgba(0,0,0,0.3)', 
                                    padding: '16px', 
                                    borderRadius: '10px', 
                                    border: '1px solid var(--border)', 
                                    marginBottom: '30px' 
                                }}>
                                    <span style={{ fontSize: '2rem', fontWeight: 'bold', letterSpacing: '4px', color: '#10b981', fontFamily: 'Space Grotesk' }}>
                                        {createdCode}
                                    </span>
                                    <button 
                                        onClick={handleCopyCode}
                                        style={{ background: 'transparent', border: 'none', color: '#4facfe', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                    >
                                        {copied ? <Check size={20} color="#10b981" /> : <Copy size={20} />}
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <button 
                                        onClick={() => setShowRoomModal(false)}
                                        className="btn btn-secondary"
                                    >
                                        Close
                                    </button>
                                    <button 
                                        onClick={() => navigate(`/teacher/monitor/${createdCode}`)}
                                        className="btn btn-primary"
                                        style={{ background: 'linear-gradient(135deg, #10b981, #047857)' }}
                                    >
                                        Monitor Live <Monitor size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Upper Navigation panel */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '2rem', fontWeight: '800' }}>Qnario</h1>
                    <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Welcome back, <span style={{ color: '#667eea', fontWeight: '600' }}>{user.name}</span>! (Teacher)</p>
                </div>
                <button 
                    onClick={handleLogout}
                    style={{
                        padding: '10px 16px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border)',
                        color: 'white',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.9rem',
                        transition: 'all 0.25s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                >
                    <LogOut size={16} /> Logout
                </button>
            </div>

            {/* Stat Cards Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <div className="glass-card-wide" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ padding: '12px', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '12px', color: '#667eea' }}>
                        <BookOpen size={28} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Syllabi Processed</h3>
                        <p style={{ fontSize: '1.6rem', fontWeight: '700', fontFamily: 'Space Grotesk' }}>{syllabi.length}</p>
                    </div>
                </div>

                <div className="glass-card-wide" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: '#10b981' }}>
                        <FileText size={28} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Exam Papers Generated</h3>
                        <p style={{ fontSize: '1.6rem', fontWeight: '700', fontFamily: 'Space Grotesk' }}>{papers.length}</p>
                    </div>
                </div>

                {/* Direct quick uploads */}
                <div 
                    className="glass-card-wide" 
                    onClick={() => navigate('/teacher/syllabus/upload')}
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '20px', 
                        cursor: 'pointer',
                        background: 'rgba(102, 126, 234, 0.08)',
                        border: '1px dashed rgba(102, 126, 234, 0.4)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.08)';
                    }}
                >
                    <div style={{ padding: '12px', background: 'rgba(102, 126, 234, 0.15)', borderRadius: '50%', color: '#667eea' }}>
                        <PlusCircle size={28} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '4px', color: '#4facfe' }}>Upload Syllabus</h3>
                        <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>Let AI parse chapters and generate questions</p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation selectors */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
                <button
                    onClick={() => setActiveTab('papers')}
                    style={{
                        padding: '10px 20px',
                        background: activeTab === 'papers' ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent',
                        border: activeTab === 'papers' ? 'none' : '1px solid var(--border)',
                        color: 'white',
                        fontWeight: '700',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontSize: '0.9rem'
                    }}
                >
                    Generated Papers ({papers.length})
                </button>
                <button
                    onClick={() => setActiveTab('reports')}
                    style={{
                        padding: '10px 20px',
                        background: activeTab === 'reports' ? 'linear-gradient(135deg, #10b981, #047857)' : 'transparent',
                        border: activeTab === 'reports' ? 'none' : '1px solid var(--border)',
                        color: 'white',
                        fontWeight: '700',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontSize: '0.9rem'
                    }}
                >
                    Reports & Exam Rooms ({reports.length})
                </button>
            </div>

            {activeTab === 'papers' ? (
                /* Generated Paper List */
                <div className="glass-card-wide" style={{ padding: '25px' }}>
                    <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={20} color="#667eea" /> Generated Exam Papers
                    </h2>

                    {papers.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '220px', opacity: 0.5 }}>
                            <BookOpen size={48} style={{ marginBottom: '12px' }} />
                            <h3 style={{ fontSize: '1.1rem', fontFamily: 'Space Grotesk', marginBottom: '6px' }}>No Exam Papers Generated Yet</h3>
                            <p style={{ fontSize: '0.8rem', textAlign: 'center', maxWidth: '300px' }}>Upload a syllabus PDF or DOCX first to let Gemini generate academic test papers.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                            {papers.map((paper) => (
                                <div 
                                    key={paper.id}
                                    style={{
                                        background: 'rgba(0, 0, 0, 0.2)',
                                        border: '1px solid var(--border)',
                                        padding: '24px',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        height: '200px',
                                        transition: 'all 0.25s ease'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                                >
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                            <span style={{ fontSize: '0.7rem', padding: '3px 8px', background: 'rgba(79, 172, 254, 0.15)', color: '#4facfe', borderRadius: '4px', fontWeight: 'bold' }}>
                                                {paper.paperType || 'Standard Paper'}
                                            </span>
                                            <span style={{ opacity: 0.5, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Calendar size={12} /> {new Date(paper.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h4 style={{ fontFamily: 'Space Grotesk', fontSize: '1.1rem', fontWeight: '700', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {paper.subject}
                                        </h4>
                                        <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '15px' }}>
                                            Class: {paper.className || 'General'} | Marks: {paper.totalMarks}
                                        </p>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px' }}>
                                        <button 
                                            onClick={() => handleCreateRoom(paper)}
                                            className="btn btn-primary"
                                            style={{ padding: '10px 16px', fontSize: '0.85rem' }}
                                        >
                                            Create Live Code <Play size={14} />
                                        </button>
                                        <button 
                                            onClick={() => navigate(`/teacher/paper/${paper.id}`)}
                                            style={{
                                                padding: '10px',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid var(--border)',
                                                color: 'white',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            title="View/Edit questions"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* Reports & Room History tab view */
                <div className="glass-card-wide" style={{ padding: '25px' }}>
                    <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Monitor size={20} color="#10b981" /> Exam Room History & Reports
                    </h2>

                    {reports.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '220px', opacity: 0.5 }}>
                            <Monitor size={48} style={{ marginBottom: '12px' }} />
                            <h3 style={{ fontSize: '1.1rem', fontFamily: 'Space Grotesk', marginBottom: '6px' }}>No Exam Rooms Found</h3>
                            <p style={{ fontSize: '0.8rem', textAlign: 'center', maxWidth: '300px' }}>Exams that are created will appear here to group and show student scores.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                            {reports.map((report) => (
                                <div 
                                    key={report.roomCode}
                                    style={{
                                        background: 'rgba(0, 0, 0, 0.2)',
                                        border: '1px solid var(--border)',
                                        padding: '24px',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        minHeight: '220px',
                                        transition: 'all 0.25s ease'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                                >
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                            <span style={{ fontSize: '0.75rem', padding: '3px 8px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderRadius: '4px', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '1px' }}>
                                                ROOM CODE: {report.roomCode}
                                            </span>
                                            <span style={{ opacity: 0.5, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Calendar size={12} /> {new Date(report.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h4 style={{ fontFamily: 'Space Grotesk', fontSize: '1.15rem', fontWeight: '700', marginBottom: '6px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {report.examName}
                                        </h4>
                                        <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '12px' }}>
                                            Class: {report.className} | Duration: {report.duration} Mins
                                        </p>

                                        <div style={{ display: 'flex', gap: '20px', marginBottom: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                                            <div>
                                                <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#38bdf8' }}>{report.studentCount}</span>
                                                <p style={{ fontSize: '0.65rem', opacity: 0.5, margin: 0, textTransform: 'uppercase' }}>Submissions</p>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#34d399' }}>{report.averageScore}%</span>
                                                <p style={{ fontSize: '0.65rem', opacity: 0.5, margin: 0, textTransform: 'uppercase' }}>Avg Accuracy</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px' }}>
                                        <button 
                                            onClick={() => setSelectedReport(report)}
                                            className="btn btn-secondary"
                                            style={{ padding: '10px 16px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                        >
                                            <Eye size={14} /> Student Scores
                                        </button>
                                        <button 
                                            onClick={() => navigate(`/teacher/monitor/${report.roomCode}`)}
                                            className="btn btn-primary"
                                            style={{ padding: '10px 16px', fontSize: '0.85rem', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
                                        >
                                            Re-Monitor
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Detailed Student Scores Modal */}
            {selectedReport && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9999,
                    background: 'rgba(10, 14, 39, 0.85)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }} className="fade-in">
                    <div className="glass-container" style={{ maxWidth: '640px', width: '100%', position: 'relative', padding: '30px' }}>
                        <button 
                            onClick={() => setSelectedReport(null)}
                            style={{
                                position: 'absolute',
                                right: '20px',
                                top: '20px',
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                fontSize: '1.2rem',
                                cursor: 'pointer',
                                opacity: 0.7
                            }}
                        >
                            ✕
                        </button>

                        <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.4rem', marginBottom: '4px', color: '#10b981' }}>
                            Student Scores & Performances
                        </h3>
                        <p style={{ opacity: 0.7, fontSize: '0.85rem', marginBottom: '20px' }}>
                            Room Code: <strong style={{ color: 'white', fontFamily: 'monospace' }}>{selectedReport.roomCode}</strong> &nbsp;|&nbsp; 
                            Exam: <strong style={{ color: 'white' }}>{selectedReport.examName}</strong>
                        </p>

                        <div style={{ maxHeight: '350px', overflowY: 'auto', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '5px' }}>
                            {selectedReport.results.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
                                    <Users size={32} style={{ margin: '0 auto 8px' }} />
                                    <p style={{ fontSize: '0.9rem' }}>No student submission logs recorded for this room.</p>
                                </div>
                            ) : (
                                selectedReport.results.map((res) => (
                                    <div 
                                        key={res.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            background: 'rgba(255, 255, 255, 0.02)',
                                            border: '1px solid var(--border)',
                                            padding: '14px 18px',
                                            borderRadius: '10px'
                                        }}
                                    >
                                        <div>
                                            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'white', margin: '0 0 2px' }}>{res.studentName}</h4>
                                            <p style={{ fontSize: '0.72rem', opacity: 0.5, margin: 0 }}>{res.studentEmail}</p>
                                            <p style={{ fontSize: '0.65rem', opacity: 0.4, margin: '4px 0 0' }}>
                                                Submitted: {new Date(res.submittedAt).toLocaleString()}
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ 
                                                fontSize: '1.1rem', 
                                                fontWeight: '800', 
                                                color: parseFloat(res.percentage) >= 50 ? '#34d399' : '#f87171' 
                                            }}>
                                                {res.percentage}%
                                            </span>
                                            <p style={{ fontSize: '0.65rem', opacity: 0.5, margin: 0 }}>Score: {res.totalScore}/{res.totalMarks}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button 
                                onClick={() => setSelectedReport(null)}
                                className="btn btn-secondary"
                                style={{ width: 'auto', padding: '10px 24px' }}
                            >
                                Close Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherDashboard;
