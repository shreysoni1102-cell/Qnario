import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { examRoomAPI } from '../services/api';
import { 
    Monitor, Play, Square, ShieldAlert, CheckCircle, 
    ArrowLeft, HelpCircle, Send, MessageSquare, AlertTriangle, Users,
    Clock, Unlock, Bell
} from 'lucide-react';

const LiveMonitor = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const socket = useSocket();

    const [roomInfo, setRoomInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    // Live Socket States
    const [students, setStudents] = useState({}); // { email: { socketId, name, email, progress, answered, status } }
    const [anomalies, setAnomalies] = useState([]); // [{ name, type, time }]
    const [doubts, setDoubts] = useState([]); // [{ name, message, time }]
    const [unlockRequests, setUnlockRequests] = useState([]); // [{ socketId, name, reason, time }]
    const [examStarted, setExamStarted] = useState(false);
    const [replyMsg, setReplyMsg] = useState('');

    // Teacher countdown timer state
    const [timeLeft, setTimeLeft] = useState(0); // seconds
    const [examStartTime, setExamStartTime] = useState(null);
    const [examDuration, setExamDuration] = useState(0); // minutes
    const timerRef = useRef(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchRoomData();
    }, [user, code]);

    const fetchRoomData = async () => {
        try {
            const res = await examRoomAPI.getRoomInfo(code);
            setRoomInfo(res.data);

            const dur = res.data.duration || 60; // fallback 60 min
            setExamDuration(dur);

            const alreadyStarted = res.data.started;
            setExamStarted(alreadyStarted);

            // If exam was already started before teacher re-joined, calc remaining time
            if (alreadyStarted && res.data.startTime) {
                const startMs = new Date(res.data.startTime).getTime();
                if (!isNaN(startMs)) {
                    const elapsed = Math.round((Date.now() - startMs) / 1000);
                    const remaining = Math.max(0, dur * 60 - elapsed);
                    setTimeLeft(remaining);
                    setExamStartTime(new Date(res.data.startTime));
                } else {
                    // startTime is present but unparseable — just show full duration
                    setTimeLeft(dur * 60);
                }
            } else {
                setTimeLeft(dur * 60);
            }
        } catch (e) {
            console.error(e);
            setErrorMsg('Invalid exam room code.');
        } finally {
            setLoading(false);
        }
    };

    // Start the countdown timer once examStarted is true AND timeLeft is a valid positive number
    const timerStartedRef = useRef(false);

    useEffect(() => {
        // Reset when exam is not started
        if (!examStarted) {
            timerStartedRef.current = false;
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        // Wait until we have a valid positive timeLeft before starting
        if (timeLeft <= 0 || isNaN(timeLeft)) return;

        // Only start the interval once per exam session
        if (timerStartedRef.current) return;
        timerStartedRef.current = true;

        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [examStarted, timeLeft]);

    // Socket listeners registration
    useEffect(() => {
        if (!socket) return;

        // 1. Join room as teacher
        socket.emit('teacher_join', { roomCode: code });

        // 2. Student Joins
        socket.on('student_joined', ({ socketId, name, email }) => {
            setStudents(prev => ({
                ...prev,
                [email]: { socketId, name, email, progress: prev[email]?.progress || 0, answered: prev[email]?.answered || 0, status: 'active' }
            }));
        });

        // 3. Student Progress Updates
        socket.on('progress_update', ({ socketId, email, answered, total, progress }) => {
            setStudents(prev => {
                if (!prev[email]) return prev;
                return {
                    ...prev,
                    [email]: {
                        ...prev[email],
                        socketId,
                        progress,
                        answered
                    }
                };
            });
        });

        // 4. Anomaly Warning signals
        socket.on('anomaly_alert', ({ studentName, studentEmail, type, time }) => {
            setAnomalies(prev => [
                { name: studentName, type, time },
                ...prev
            ]);
            
            // Set student state to warning alert
            setStudents(prev => {
                const targetEmail = studentEmail || Object.keys(prev).find(e => prev[e].name === studentName);
                if (!targetEmail || !prev[targetEmail]) return prev;
                return {
                    ...prev,
                    [targetEmail]: {
                        ...prev[targetEmail],
                        status: 'warning'
                    }
                };
            });
        });

        // 5. Student Doubt messages
        socket.on('doubt_received', ({ studentName, message, time }) => {
            setDoubts(prev => [
                { name: studentName, message, time },
                ...prev
            ]);
        });

        // 6. Student Submits Exam
        socket.on('student_submitted', ({ studentEmail, studentName, percentage }) => {
            setStudents(prev => {
                if (!prev[studentEmail]) return prev;
                return {
                    ...prev,
                    [studentEmail]: {
                        ...prev[studentEmail],
                        status: 'submitted',
                        score: percentage
                    }
                };
            });
        });

        // 7. Student leaves or disconnects
        socket.on('student_left', ({ socketId, email, name }) => {
            setStudents(prev => {
                const targetEmail = email || Object.keys(prev).find(e => prev[e].socketId === socketId);
                if (!targetEmail || !prev[targetEmail]) return prev;
                return {
                    ...prev,
                    [targetEmail]: {
                        ...prev[targetEmail],
                        status: 'disconnected'
                    }
                };
            });
        });

        // 8. Student locked and requesting unlock
        socket.on('unlock_request', ({ socketId, studentEmail, studentName, reason, time }) => {
            setUnlockRequests(prev => {
                // Avoid duplicates
                const exists = prev.find(r => r.socketId === socketId);
                if (exists) return prev;
                return [
                    { socketId, name: studentName, reason, time },
                    ...prev
                ];
            });
            // Also mark student as locked
            setStudents(prev => {
                const targetEmail = studentEmail || Object.keys(prev).find(e => prev[e].socketId === socketId);
                if (!targetEmail || !prev[targetEmail]) return prev;
                return {
                    ...prev,
                    [targetEmail]: {
                        ...prev[targetEmail],
                        status: 'locked'
                    }
                };
            });
        });

        // 9. Exam started event (for synced timer)
        socket.on('exam_started', ({ startTime, duration }) => {
            setExamStarted(true);
            setExamStartTime(new Date(startTime));
            setExamDuration(duration);
            setTimeLeft(duration * 60);
        });

        return () => {
            socket.off('student_joined');
            socket.off('progress_update');
            socket.off('anomaly_alert');
            socket.off('doubt_received');
            socket.off('student_submitted');
            socket.off('student_left');
            socket.off('unlock_request');
            socket.off('exam_started');
        };
    }, [socket, code]);

    const handleStartExam = () => {
        if (socket) {
            // Set timeLeft immediately from the known duration so the timer is available
            // right when examStarted flips to true (avoids NaN race condition)
            const durationSecs = examDuration * 60 || 60 * 60;
            setTimeLeft(durationSecs);
            socket.emit('start_exam', { roomCode: code });
            setExamStarted(true);
        }
    };

    const handleForceEndExam = () => {
        if (confirm('Are you sure you want to force-end the exam? This will auto-submit all student answers and close the room.') && socket) {
            socket.emit('end_exam', { roomCode: code });
            setExamStarted(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const handleSendReply = (e) => {
        e.preventDefault();
        if (!replyMsg.trim() || !socket) return;

        socket.emit('teacher_reply', { roomCode: code, message: replyMsg });
        setReplyMsg('');
    };

    // Unlock a specific student after their lock request
    const handleUnlockStudent = (req) => {
        if (!socket) return;
        socket.emit('unlock_student', { roomCode: code, targetSocketId: req.socketId });
        // Remove from unlock requests list
        setUnlockRequests(prev => prev.filter(r => r.socketId !== req.socketId));
        // Update student status back to active
        setStudents(prev => {
            const targetEmail = Object.keys(prev).find(e => prev[e].socketId === req.socketId);
            if (!targetEmail || !prev[targetEmail]) return prev;
            return {
                ...prev,
                [targetEmail]: {
                    ...prev[targetEmail],
                    status: 'active'
                }
            };
        });
    };

    const formatTime = (seconds) => {
        // Guard against NaN/null/undefined/negative
        if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
        const totalSecs = Math.floor(seconds);
        const h = Math.floor(totalSecs / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        const s = totalSecs % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="main-wrapper">
                <p style={{ fontSize: '1.2rem', opacity: 0.8 }} className="fade-in">Connecting to real-time proctor stream...</p>
            </div>
        );
    }

    if (errorMsg) {
        return (
            <div className="main-wrapper">
                <div className="glass-container fade-in" style={{ textAlign: 'center' }}>
                    <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 20px' }} />
                    <h2 style={{ fontFamily: 'Space Grotesk', marginBottom: '10px' }}>Access Denied</h2>
                    <p style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: '24px' }}>{errorMsg}</p>
                    <button onClick={() => navigate('/teacher/dashboard')} className="btn btn-primary">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const studentList = Object.entries(students);

    return (
        <div style={{ padding: '30px 20px', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh' }}>
            
            {/* Unlock Request Notification Banner */}
            {unlockRequests.length > 0 && (
                <div style={{
                    marginBottom: '20px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                }} className="fade-in">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Bell size={18} color="#fbbf24" />
                        <span style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '0.95rem' }}>
                            Student Unlock Requests ({unlockRequests.length})
                        </span>
                    </div>
                    {unlockRequests.map((req, idx) => (
                        <div key={idx} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'rgba(0,0,0,0.2)',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            border: '1px solid rgba(245, 158, 11, 0.2)'
                        }}>
                            <div>
                                <strong style={{ color: 'white', fontSize: '0.9rem' }}>{req.name}</strong>
                                <p style={{ fontSize: '0.75rem', opacity: 0.6, margin: '2px 0 0', color: '#fbbf24' }}>
                                    {req.reason} — Locked at {req.time}
                                </p>
                            </div>
                            <button
                                onClick={() => handleUnlockStudent(req)}
                                style={{
                                    padding: '8px 20px',
                                    background: 'linear-gradient(135deg, #10b981, #047857)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'opacity 0.2s ease'
                                }}
                                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                            >
                                <Unlock size={14} /> Unlock Student
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Header controllers */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
                <div>
                    <span style={{ fontSize: '0.75rem', color: '#667eea', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                        Live Proctoring Hub (Room: {code})
                    </span>
                    <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.8rem', fontWeight: '800' }}>
                        {roomInfo?.subject} ({roomInfo?.className || 'General'})
                    </h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Countdown Timer — shown when exam is running and time > 0 */}
                    {examStarted && timeLeft > 0 && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: timeLeft <= 120 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                            border: `1px solid ${timeLeft <= 120 ? 'rgba(239, 68, 68, 0.5)' : 'rgba(16, 185, 129, 0.3)'}`,
                            padding: '10px 20px',
                            borderRadius: '10px',
                            color: timeLeft <= 120 ? '#f87171' : '#34d399',
                            transition: 'all 0.5s ease'
                        }}>
                            <Clock size={18} />
                            <span style={{
                                fontFamily: 'Space Grotesk',
                                fontSize: '1.4rem',
                                fontWeight: '800',
                                letterSpacing: '2px',
                                animation: timeLeft <= 60 ? 'pulse 1s infinite' : 'none'
                            }}>
                                {formatTime(timeLeft)}
                            </span>
                        </div>
                    )}

                    {/* Time's Up badge when exam timer expires */}
                    {examStarted && timeLeft === 0 && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.5)',
                            padding: '10px 20px',
                            borderRadius: '10px',
                            color: '#f87171',
                            fontWeight: 'bold'
                        }}>
                            <Clock size={18} />
                            <span style={{ fontFamily: 'Space Grotesk', fontSize: '1.1rem', fontWeight: '800' }}>Time's Up!</span>
                        </div>
                    )}

                    {!examStarted ? (
                        <button 
                            onClick={handleStartExam}
                            className="btn btn-primary"
                            style={{ width: 'auto', padding: '12px 24px', background: 'linear-gradient(135deg, #10b981, #047857)' }}
                        >
                            <Play size={16} /> Start Live Exam ({examDuration} min)
                        </button>
                    ) : (
                        <button 
                            onClick={handleForceEndExam}
                            className="btn btn-danger"
                            style={{ width: 'auto', padding: '12px 24px' }}
                        >
                            <Square size={16} /> Force End Exam
                        </button>
                    )}
                    <button 
                        onClick={() => navigate('/teacher/dashboard')}
                        className="btn btn-secondary"
                        style={{ width: 'auto', padding: '12px 20px' }}
                    >
                        <ArrowLeft size={16} /> Return Home
                    </button>
                </div>
            </div>

            {/* Layout middle segments */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '25px', marginBottom: '30px' }}>
                
                {/* Active Students logs list */}
                <div className="glass-card-wide" style={{ padding: '24px', minHeight: '400px' }}>
                    <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={18} color="#667eea" /> Connected Students ({studentList.length})
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {studentList.length === 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '250px', opacity: 0.4 }}>
                                <Users size={36} style={{ marginBottom: '10px' }} />
                                <p style={{ fontSize: '0.85rem' }}>Waiting for students to join using code...</p>
                            </div>
                        ) : (
                            studentList.map(([email, s]) => (
                                <div 
                                    key={email}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1.5fr 2fr 1fr',
                                        alignItems: 'center',
                                        background: s.status === 'locked' ? 'rgba(245, 158, 11, 0.06)' : 'rgba(0,0,0,0.15)',
                                        border: s.status === 'locked' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border)',
                                        padding: '16px 20px',
                                        borderRadius: '10px',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    <div>
                                        <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>{s.name}</h4>
                                        <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{s.email}</span>
                                    </div>
                                    
                                    {/* Progress ratio bars */}
                                    <div style={{ padding: '0 20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px', opacity: 0.7 }}>
                                            <span>Progress</span>
                                            <span>{s.progress}% ({s.answered} Answered)</span>
                                        </div>
                                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: `${s.progress}%`, height: '100%', background: 'linear-gradient(90deg, #667eea, #4facfe)', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                                        </div>
                                    </div>

                                    {/* Connection status badges */}
                                    <div style={{ textAlign: 'right' }}>
                                        {s.status === 'submitted' ? (
                                            <span style={{ fontSize: '0.8rem', padding: '4px 8px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderRadius: '6px', fontWeight: 'bold' }}>
                                                Submitted ({s.score}%)
                                            </span>
                                        ) : s.status === 'locked' ? (
                                            <span style={{ fontSize: '0.8rem', padding: '4px 8px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', borderRadius: '6px', fontWeight: 'bold', animation: 'pulse 1.2s infinite' }}>
                                                🔒 Locked
                                            </span>
                                        ) : s.status === 'warning' ? (
                                            <span style={{ fontSize: '0.8rem', padding: '4px 8px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderRadius: '6px', fontWeight: 'bold', animation: 'pulse 1s infinite' }}>
                                                ⚠️ Violation
                                            </span>
                                        ) : s.status === 'disconnected' ? (
                                            <span style={{ fontSize: '0.8rem', padding: '4px 8px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', borderRadius: '6px' }}>
                                                Disconnected
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: '0.8rem', padding: '4px 8px', background: 'rgba(102, 126, 234, 0.15)', color: '#a5b4fc', borderRadius: '6px', fontWeight: 'bold' }}>
                                                Answering
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right sidebar: Real-time Proctor log */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                    
                    {/* Anomaly Log Feed */}
                    <div className="glass-card-wide" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', height: '300px' }}>
                        <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1rem', marginBottom: '15px', color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <ShieldAlert size={16} /> Proctor Shield Feed
                        </h3>

                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {anomalies.length === 0 ? (
                                <p style={{ fontSize: '0.75rem', opacity: 0.5, textAlign: 'center', margin: 'auto' }}>No cheat warnings flagged yet.</p>
                            ) : (
                                anomalies.map((anom, idx) => (
                                    <div 
                                        key={idx}
                                        style={{
                                            background: 'rgba(239, 68, 68, 0.08)',
                                            border: '1px solid rgba(239, 68, 68, 0.2)',
                                            padding: '10px 14px',
                                            borderRadius: '8px',
                                            fontSize: '0.75rem',
                                            lineHeight: '1.4'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <strong style={{ color: '#f87171' }}>{anom.name}</strong>
                                            <span style={{ opacity: 0.5 }}>{anom.time}</span>
                                        </div>
                                        <p style={{ opacity: 0.8 }}>Type: {anom.type}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Student Doubts box */}
                    <div className="glass-card-wide" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', height: '240px' }}>
                        <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1rem', marginBottom: '15px', color: '#4facfe', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MessageSquare size={16} /> Live Doubt Solver
                        </h3>

                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                            {doubts.length === 0 ? (
                                <p style={{ fontSize: '0.75rem', opacity: 0.5, textAlign: 'center', margin: 'auto' }}>No doubt streams active.</p>
                            ) : (
                                doubts.map((d, idx) => (
                                    <div 
                                        key={idx}
                                        style={{
                                            background: 'rgba(79, 172, 254, 0.08)',
                                            border: '1px solid rgba(79, 172, 254, 0.2)',
                                            padding: '10px 14px',
                                            borderRadius: '8px',
                                            fontSize: '0.75rem',
                                            lineHeight: '1.4'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <strong style={{ color: '#4facfe' }}>{d.name}</strong>
                                            <span style={{ opacity: 0.5 }}>{d.time}</span>
                                        </div>
                                        <p style={{ opacity: 0.8 }}>"{d.message}"</p>
                                    </div>
                                ))
                            )}
                        </div>

                        <form onSubmit={handleSendReply} style={{ display: 'flex', gap: '8px' }}>
                            <input 
                                type="text"
                                className="form-input"
                                style={{ padding: '10px 12px', fontSize: '0.8rem' }}
                                placeholder="Reply to room doubts..."
                                value={replyMsg}
                                onChange={(e) => setReplyMsg(e.target.value)}
                            />
                            <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '10px 14px' }}>
                                <Send size={14} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveMonitor;
