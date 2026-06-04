import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './RoleSelection.css';

const RoleSelection = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [letters, setLetters] = useState([]);
    const [books, setBooks] = useState([]);

    useEffect(() => {
        // If user already authenticated, redirect
        if (user) {
            if (user.role === 'admin') navigate('/admin/dashboard');
            else if (user.role === 'teacher') navigate('/teacher/dashboard');
            else navigate('/student/dashboard');
        }
    }, [user, navigate]);

    useEffect(() => {
        // Ambient falling books and floating letters generator
        const letterChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const bookEmojis = ["📘", "📒", "📕", "📚", "✏️", "🖊️"];

        const tempLetters = Array.from({ length: 15 }).map((_, idx) => ({
            id: idx,
            char: letterChars[Math.floor(Math.random() * letterChars.length)],
            left: `${Math.random() * 95}%`,
            fontSize: `${14 + Math.random() * 25}px`,
            delay: `${Math.random() * 8}s`,
            duration: `${10 + Math.random() * 10}s`
        }));
        setLetters(tempLetters);

        const tempBooks = Array.from({ length: 12 }).map((_, idx) => ({
            id: idx,
            emoji: bookEmojis[Math.floor(Math.random() * bookEmojis.length)],
            left: `${Math.random() * 95}%`,
            fontSize: `${18 + Math.random() * 20}px`,
            delay: `${Math.random() * 10}s`,
            duration: `${8 + Math.random() * 12}s`
        }));
        setBooks(tempBooks);
    }, []);

    const handleRoleSelect = (role) => {
        navigate(`/login?role=${role}`);
    };

    return (
        <div className="role-page-wrapper">
            {/* Ambient Elements */}
            <div className="floating-letters-container">
                {letters.map((l) => (
                    <span 
                        key={l.id} 
                        style={{ 
                            left: l.left, 
                            animationDelay: l.delay, 
                            animationDuration: l.duration,
                            fontSize: l.fontSize
                        }}
                    >
                        {l.char}
                    </span>
                ))}
            </div>

            <div className="falling-books-container">
                {books.map((b) => (
                    <span 
                        key={b.id} 
                        style={{ 
                            left: b.left, 
                            animationDelay: b.delay, 
                            animationDuration: b.duration,
                            fontSize: b.fontSize
                        }}
                    >
                        {b.emoji}
                    </span>
                ))}
            </div>

            {/* Glowing Mesh Backdrop */}
            <div className="bg-mesh-wrapper">
                <div className="mesh-gradient"></div>
                <div className="mesh-grid"></div>
                <div className="mesh-glow orb1"></div>
                <div className="mesh-glow orb2"></div>
            </div>

            {/* Navbar */}
            <nav className="role-navbar">
                <div className="role-logo" onClick={() => navigate('/')}>QNARIO</div>
                <button className="role-nav-btn" onClick={() => navigate('/')}>Home</button>
            </nav>

            {/* Main Selection Area */}
            <div className="role-main-section">
                <div className="brand-header-crest">
                    <div className="brand-logo-outer">
                        <div className="brand-logo-inner">Q</div>
                    </div>
                    <h1 className="brand-title-text">QNARIO</h1>
                    <p className="brand-subtitle-text">
                        Intelligent Question Paper Generation System
                    </p>
                </div>
                
                <div className="role-cards-grid">
                    {/* Teacher Card */}
                    <div className="role-selection-card teacher-border" onClick={() => handleRoleSelect('teacher')}>
                        <div className="role-selection-icon">👨‍🏫</div>
                        <h2 className="role-selection-title">Teacher</h2>
                        <p className="role-selection-subtitle">Create and manage question papers</p>
                    </div>

                    {/* Student Card */}
                    <div className="role-selection-card student-border" onClick={() => handleRoleSelect('student')}>
                        <div className="role-selection-icon">🎓</div>
                        <h2 className="role-selection-title">Student</h2>
                        <p className="role-selection-subtitle">Attempt exams and view performance</p>
                    </div>

                    {/* Admin Card */}
                    <div className="role-selection-card admin-border" onClick={() => handleRoleSelect('admin')}>
                        <div className="role-selection-icon">⚙️</div>
                        <h2 className="role-selection-title">Admin</h2>
                        <p className="role-selection-subtitle">View all user details & manage system</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoleSelection;
