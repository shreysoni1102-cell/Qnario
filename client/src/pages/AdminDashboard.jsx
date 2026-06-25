import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Users, BookOpen, GraduationCap, Shield, Trash2, LogOut, RefreshCw, User } from 'lucide-react';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // all, teacher, student

    // Modal delete states
    const [showModal, setShowModal] = useState(false);
    const [targetUser, setTargetUser] = useState(null);

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/login?role=admin');
            return;
        }
        fetchUsers();
    }, [user, navigate]);

    const fetchUsers = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const res = await authAPI.getAllUsers();
            setUsersList(res.data.users || []);
        } catch (e) {
            console.error(e);
            setErrorMsg('Failed to load system users registry.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDelete = (usr) => {
        setTargetUser(usr);
        setShowModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!targetUser) return;
        try {
            await authAPI.deleteUser(targetUser._id);
            setSuccessMsg(`User ${targetUser.name} has been successfully deleted.`);
            setShowModal(false);
            setTargetUser(null);
            fetchUsers();
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (e) {
            console.error(e);
            setErrorMsg('Failed to delete user.');
            setShowModal(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/role-selection');
    };

    // Computations
    const totalUsers = usersList.length;
    const totalTeachers = usersList.filter(u => u.role === 'teacher').length;
    const totalStudents = usersList.filter(u => u.role === 'student').length;

    const filteredUsers = usersList.filter(u => {
        if (activeTab === 'teacher') return u.role === 'teacher';
        if (activeTab === 'student') return u.role === 'student';
        return true;
    });

    if (loading && usersList.length === 0) {
        return (
            <div className="admin-dashboard-loading">
                <p style={{ fontSize: '1.2rem', opacity: 0.8 }} className="fade-in">Loading System Registry...</p>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-wrapper">
            {/* Sidebar menu */}
            <aside className="admin-sidebar">
                <div className="admin-sidebar-logo">
                    <Shield size={24} style={{ color: '#4facfe' }} />
                    <span>QNARIO ADMIN</span>
                </div>
                <ul className="admin-sidebar-menu">
                    <li className={activeTab === 'all' ? 'active' : ''} onClick={() => setActiveTab('all')}>
                        <Users size={18} />
                        <span>All Users</span>
                    </li>
                    <li className={activeTab === 'teacher' ? 'active' : ''} onClick={() => setActiveTab('teacher')}>
                        <BookOpen size={18} />
                        <span>Teachers</span>
                    </li>
                    <li className={activeTab === 'student' ? 'active' : ''} onClick={() => setActiveTab('student')}>
                        <GraduationCap size={18} />
                        <span>Students</span>
                    </li>
                </ul>
                <button className="admin-logout-btn" onClick={() => navigate('/profile')} style={{ marginBottom: '10px', background: 'rgba(255, 255, 255, 0.05)' }}>
                    <User size={16} />
                    <span>My Profile</span>
                </button>
                <button className="admin-logout-btn" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Logout</span>
                </button>
            </aside>

            {/* Main Content Workspace */}
            <main className="admin-main-content">
                {/* Header */}
                <div className="admin-header">
                    <div>
                        <h1 className="admin-header-title">
                            System <span style={{ color: '#a855f7' }}>Dashboard</span>
                        </h1>
                        <p style={{ opacity: 0.6, fontSize: '0.9rem', marginTop: '4px' }}>Administrative Management Console</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button className="admin-refresh-btn" onClick={fetchUsers} title="Refresh Data">
                            <RefreshCw size={16} />
                        </button>
                        <div className="admin-profile-badge">
                            <p style={{ fontWeight: '700' }}>{user?.name || 'Administrator'}</p>
                            <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>System Administrator</span>
                        </div>
                    </div>
                </div>

                {/* Stats grids */}
                <div className="admin-stats-grid">
                    <div className="admin-stat-card">
                        <h3>Total Accounts</h3>
                        <div className="admin-stat-number" style={{ color: '#ffffff' }}>{totalUsers}</div>
                    </div>
                    <div className="admin-stat-card">
                        <h3>Teachers Registered</h3>
                        <div className="admin-stat-number" style={{ color: '#4facfe' }}>{totalTeachers}</div>
                    </div>
                    <div className="admin-stat-card">
                        <h3>Students Registered</h3>
                        <div className="admin-stat-number" style={{ color: '#a855f7' }}>{totalStudents}</div>
                    </div>
                </div>

                {/* Alert banners */}
                {successMsg && (
                    <div className="admin-alert-success fade-in">
                        {successMsg}
                    </div>
                )}
                {errorMsg && (
                    <div className="admin-alert-error fade-in">
                        {errorMsg}
                    </div>
                )}

                {/* User Table card */}
                <div className="admin-users-table-card">
                    <h2 className="admin-table-title">
                        {activeTab === 'all' ? 'All Registered Users' : activeTab === 'teacher' ? 'Registered Teachers' : 'Registered Students'}
                    </h2>
                    
                    {filteredUsers.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', opacity: 0.6 }}>No matching records found.</div>
                    ) : (
                        <div className="admin-table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Date Joined</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(usr => (
                                        <tr key={usr._id}>
                                            <td style={{ fontWeight: '600' }}>{usr.name}</td>
                                            <td>{usr.email}</td>
                                            <td>
                                                <span className={`admin-role-badge badge-${usr.role}`}>
                                                    {usr.role}
                                                </span>
                                            </td>
                                            <td style={{ opacity: 0.7 }}>
                                                {new Date(usr.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </td>
                                            <td>
                                                {usr._id !== user?.id ? (
                                                    <button className="admin-action-delete" onClick={() => handleOpenDelete(usr)}>
                                                        <Trash2 size={14} /> Delete
                                                    </button>
                                                ) : (
                                                    <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>Current User</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Modal delete popups */}
            {showModal && (
                <div className="admin-delete-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="admin-delete-modal-card" onClick={e => e.stopPropagation()}>
                        <h2>Confirm Delete Action</h2>
                        <p style={{ marginTop: '10px', fontSize: '0.95rem', lineHeight: '1.5' }}>
                            Are you sure you want to permanently delete user <strong style={{ color: '#f87171' }}>{targetUser?.name}</strong>?
                        </p>
                        <p style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '8px' }}>
                            This action deletes all attempt records, quiz transcripts, and profile schemas associated.
                        </p>
                        <div className="admin-modal-actions">
                            <button className="admin-modal-btn cancel" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="admin-modal-btn confirm" onClick={handleConfirmDelete}>Confirm Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
