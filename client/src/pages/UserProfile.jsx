import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI, examAPI, syllabusAPI } from '../services/api';
import { 
    User, Mail, Calendar, Trash2, ArrowLeft, ShieldAlert, 
    BookOpen, Award, CheckCircle, FileText, BarChart2, Key, HelpCircle
} from 'lucide-react';

const UserProfile = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // Stats states
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);

    // Modal & Delete confirmation states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [confirmEmail, setConfirmEmail] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchRoleSpecificStats();
    }, [user]);

    const fetchRoleSpecificStats = async () => {
        try {
            setStatsLoading(true);
            if (user.role === 'student') {
                const res = await examAPI.getStudentDashboard(user.id || user._id || user.email);
                setStats({
                    totalExams: res.data.totalExams || 0,
                    averageScore: res.data.averageScore || 0,
                    averageAccuracy: res.data.averageAccuracy || 0
                });
            } else if (user.role === 'teacher') {
                const sylRes = await syllabusAPI.listSyllabi(user.email);
                const paperRes = await syllabusAPI.listPapers(user.email);
                setStats({
                    totalSyllabi: sylRes.data.syllabi?.length || 0,
                    totalPapers: paperRes.data.papers?.length || 0
                });
            }
        } catch (e) {
            console.error('Failed to load profile metrics:', e);
        } finally {
            setStatsLoading(false);
        }
    };

    const handleBackToDashboard = () => {
        if (user?.role === 'admin') navigate('/admin/dashboard');
        else if (user?.role === 'teacher') navigate('/teacher/dashboard');
        else navigate('/student/dashboard');
    };

    const handleDeleteAccount = async (e) => {
        e.preventDefault();
        if (confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
            setDeleteError('Email confirmation does not match your account email.');
            return;
        }

        setDeleting(true);
        setDeleteError('');
        try {
            const res = await authAPI.deleteOwnAccount();
            if (res.data.success) {
                // Log out locally and redirect
                await logout();
                navigate('/');
                alert('Your account has been deleted successfully.');
            } else {
                setDeleteError(res.data.message || 'Failed to delete account.');
            }
        } catch (err) {
            console.error('Account deletion failure:', err);
            setDeleteError(err.response?.data?.message || 'Server error occurred during account deletion.');
        } finally {
            setDeleting(false);
        }
    };

    if (!user) return null;

    const formattedJoinDate = user.createdAt 
        ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'N/A';

    return (
        <div style={{ padding: '30px 20px', maxWidth: '800px', margin: '0 auto', minHeight: '100vh' }}>
            
            {/* Navigation Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }} className="fade-in">
                <button 
                    onClick={handleBackToDashboard}
                    className="btn btn-secondary"
                    style={{ width: 'auto', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '10px' }}
                >
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>
                <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>
                    My Account Profile
                </h2>
            </div>

            {/* Profile Overview Card */}
            <div className="glass-card-wide fade-in" style={{ padding: '30px', marginBottom: '25px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: '-30px', top: '-30px', width: '160px', height: '160px', background: 'radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '25px', alignItems: 'center' }}>
                    {/* User Avatar */}
                    <div style={{ 
                        width: '80px', 
                        height: '80px', 
                        borderRadius: '24px', 
                        background: 'linear-gradient(135deg, #667eea, #764ba2)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'white',
                        fontFamily: 'Space Grotesk',
                        fontSize: '2.2rem',
                        fontWeight: '800',
                        boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
                    }}>
                        {user.name ? user.name[0].toUpperCase() : 'U'}
                    </div>

                    {/* User Text Information */}
                    <div style={{ flex: 1, minWidth: '220px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>
                                {user.name}
                            </h3>
                            <span style={{ 
                                padding: '3px 10px', 
                                background: user.role === 'teacher' ? 'rgba(16, 185, 129, 0.12)' : user.role === 'admin' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(102, 126, 234, 0.12)', 
                                border: `1px solid ${user.role === 'teacher' ? 'rgba(16, 185, 129, 0.25)' : user.role === 'admin' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(102, 126, 234, 0.25)'}`,
                                borderRadius: '100px', 
                                fontSize: '0.7rem', 
                                fontWeight: 'bold', 
                                color: user.role === 'teacher' ? '#34d399' : user.role === 'admin' ? '#f87171' : '#a5b4fc', 
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px' 
                            }}>
                                {user.role}
                            </span>
                        </div>
                        <p style={{ opacity: 0.6, fontSize: '0.9rem', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Mail size={14} /> {user.email}
                        </p>
                        <p style={{ opacity: 0.5, fontSize: '0.8rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={14} /> Registered: {formattedJoinDate}
                        </p>
                    </div>
                </div>
            </div>

            {/* Statistics Section (Role-Specific) */}
            {user.role !== 'admin' && (
                <div className="fade-in" style={{ marginBottom: '25px' }}>
                    <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.1rem', marginBottom: '15px', opacity: 0.8 }}>
                        Account Performance Metrics
                    </h3>

                    {statsLoading ? (
                        <div className="glass-card-wide" style={{ padding: '24px', textAlign: 'center' }}>
                            <p style={{ opacity: 0.6, fontSize: '0.9rem', margin: 0 }}>Loading performance stats...</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                            {user.role === 'student' ? (
                                <>
                                    <div className="glass-card-wide" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
                                        <div style={{ padding: '10px', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '10px', color: '#667eea' }}>
                                            <BookOpen size={22} />
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '0 0 2px 0' }}>Exams Attempted</h4>
                                            <p style={{ fontSize: '1.3rem', fontWeight: '700', fontFamily: 'Space Grotesk', margin: 0 }}>{stats?.totalExams}</p>
                                        </div>
                                    </div>
                                    <div className="glass-card-wide" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
                                        <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px', color: '#10b981' }}>
                                            <CheckCircle size={22} />
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '0 0 2px 0' }}>Avg accuracy</h4>
                                            <p style={{ fontSize: '1.3rem', fontWeight: '700', fontFamily: 'Space Grotesk', margin: 0 }}>{stats?.averageAccuracy}%</p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="glass-card-wide" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
                                        <div style={{ padding: '10px', background: 'rgba(79, 172, 254, 0.1)', borderRadius: '10px', color: '#4facfe' }}>
                                            <FileText size={22} />
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '0 0 2px 0' }}>Syllabi Uploaded</h4>
                                            <p style={{ fontSize: '1.3rem', fontWeight: '700', fontFamily: 'Space Grotesk', margin: 0 }}>{stats?.totalSyllabi}</p>
                                        </div>
                                    </div>
                                    <div className="glass-card-wide" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
                                        <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px', color: '#10b981' }}>
                                            <Award size={22} />
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '0 0 2px 0' }}>Papers Generated</h4>
                                            <p style={{ fontSize: '1.3rem', fontWeight: '700', fontFamily: 'Space Grotesk', margin: 0 }}>{stats?.totalPapers}</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Security & Actions section */}
            <div className="glass-card-wide fade-in" style={{ padding: '24px', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.1rem', margin: '0 0 10px 0', color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldAlert size={18} /> Danger Zone
                </h3>
                <p style={{ opacity: 0.7, fontSize: '0.85rem', lineHeight: '1.5', margin: '0 0 20px 0' }}>
                    Once you delete your account, there is no going back. All of your personal registries, exam scores, AI blueprints, and syllabus papers associated with this profile will be permanently deleted from the Qnario databases.
                </p>

                <button 
                    onClick={() => { setShowDeleteModal(true); setConfirmEmail(''); setDeleteError(''); }}
                    className="btn btn-danger"
                    style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px' }}
                >
                    <Trash2 size={16} /> Delete Account permanently
                </button>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
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
                    <div className="glass-container" style={{ maxWidth: '480px', position: 'relative', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                        <button 
                            onClick={() => setShowDeleteModal(false)}
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
                            disabled={deleting}
                        >
                            ✕
                        </button>

                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', color: '#ef4444', marginBottom: '16px' }}>
                                <ShieldAlert size={32} />
                            </div>
                            <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.3rem', marginBottom: '8px', color: '#f87171' }}>
                                Delete Account Permanently
                            </h3>
                            <p style={{ opacity: 0.7, fontSize: '0.82rem', lineHeight: '1.5' }}>
                                This action is irreversible. Please confirm you want to delete the account for <strong style={{ color: 'white' }}>{user.email}</strong>.
                            </p>
                        </div>

                        <form onSubmit={handleDeleteAccount} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div className="form-group" style={{ textAlign: 'left' }}>
                                <label className="form-label" style={{ fontSize: '0.78rem' }}>
                                    Type your email to confirm deletion:
                                </label>
                                <input 
                                    type="email"
                                    className="form-input"
                                    placeholder={user.email}
                                    value={confirmEmail}
                                    onChange={(e) => setConfirmEmail(e.target.value)}
                                    required
                                    disabled={deleting}
                                    style={{ background: 'rgba(0,0,0,0.2)' }}
                                />
                            </div>

                            {deleteError && (
                                <p style={{ fontSize: '0.78rem', color: '#ef4444', margin: 0, textAlign: 'left', background: 'rgba(239,68,68,0.08)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)' }}>
                                    ⚠️ {deleteError}
                                </p>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                                <button 
                                    type="button"
                                    onClick={() => setShowDeleteModal(false)}
                                    className="btn btn-secondary"
                                    disabled={deleting}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="btn btn-danger"
                                    disabled={deleting || confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                >
                                    {deleting ? 'Deleting...' : 'Delete permanently'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default UserProfile;
