import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useProctoring } from '../hooks/useProctoring';
import { examRoomAPI } from '../services/api';
import confetti from 'canvas-confetti';
import { 
    ShieldAlert, AlertOctagon, Clock, HelpCircle, 
    ArrowLeft, ArrowRight, CheckCircle2, Lock, Home, Sparkles 
} from 'lucide-react';

const ExamRoom = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const socket = useSocket();

    const [roomInfo, setRoomInfo] = useState(null);
    const [paper, setPaper] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    
    // Exam Taking states
    const [enteredRoom, setEnteredRoom] = useState(false);
    const [examStarted, setExamStarted] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { questionNo: letter }
    const [timeLeft, setTimeLeft] = useState(0); // in seconds

    // Post-Submit states
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState(null);

    const answersRef = useRef(answers);
    answersRef.current = answers;

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchRoomData();
    }, [user, code]);

    const fetchRoomData = async () => {
        try {
            const infoRes = await examRoomAPI.getRoomInfo(code);
            setRoomInfo(infoRes.data);
            setTimeLeft(infoRes.data.duration * 60);
        } catch (e) {
            console.error(e);
            setErrorMsg('Invalid exam room code or room has been closed.');
        } finally {
            setLoading(false);
        }
    };

    // Submitting live exam answers
    const handleSubmitExam = async (isForced = false) => {
        setLoading(true);
        // Build answer arrays
        const payloadAnswers = Object.entries(answersRef.current).map(([qNo, ans]) => ({
            questionNo: parseInt(qNo),
            answer: ans
        }));

        try {
            const res = await examRoomAPI.submitRoomAnswers(code, {
                studentEmail: user.email,
                studentName: user.name,
                answers: payloadAnswers
            });

            if (res.data.success) {
                setResult(res.data);
                setSubmitted(true);
                // Exit fullscreen gracefully
                if (document.fullscreenElement) {
                    document.exitFullscreen().catch(e => console.warn(e));
                }
                confetti({
                    particleCount: 200,
                    spread: 90,
                    origin: { y: 0.55 }
                });
            }
        } catch (e) {
            console.error(e);
            if (!isForced) setErrorMsg('Failed to submit exam paper.');
        } finally {
            setLoading(false);
        }
    };

    // Proctoring integrations
    const { 
        anomalyCount,
        tabSwitchCount,
        isFullscreen, 
        isLocked,
        isUnlockRequested,
        warningMsg, 
        enterFullscreen,
        requestTeacherUnlock,
        maxViolations,
        maxTabSwitches
    } = useProctoring(code, socket, () => {
        // Force submit callback when violations exceed limits
        handleSubmitExam(true);
    }, enteredRoom && examStarted);

    const handleEnterExamMode = async () => {
        try {
            // 1. Fetch paper details
            const paperRes = await examRoomAPI.getRoomPaper(code);
            setPaper(paperRes.data.paper);
            
            // 2. Request Fullscreen locks
            enterFullscreen();
            setEnteredRoom(true);

            // 3. Emit join events to server socket
            if (socket) {
                socket.emit('student_join', {
                    roomCode: code,
                    studentName: user.name,
                    studentEmail: user.email
                });
            }
        } catch (e) {
            console.error(e);
            setErrorMsg('Failed to initialize exam paper credentials.');
        }
    };

    // Handle Active WebSocket room notifications
    useEffect(() => {
        if (!socket || !enteredRoom) return;

        socket.on('exam_started', ({ startTime, duration }) => {
            setExamStarted(true);
            setTimeLeft(duration * 60);
        });

        socket.on('force_end_exam', () => {
            console.warn('⚠️ [Socket] Exam has been force ended by teacher.');
            handleSubmitExam(true);
        });

        socket.on('joined_ok', ({ duration, started, startTime }) => {
            setExamStarted(started);
            if (started && startTime) {
                const elapsed = Math.round((new Date().getTime() - new Date(startTime).getTime()) / 1000);
                setTimeLeft(Math.max(0, duration * 60 - elapsed));
            }
        });

        return () => {
            socket.off('exam_started');
            socket.off('force_end_exam');
            socket.off('joined_ok');
        };
    }, [socket, enteredRoom]);

    // Timer Countdown Interval — keeps ticking even when locked (isLocked removed from guard)
    useEffect(() => {
        if (!examStarted || submitted) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleSubmitExam(true); // Auto submit on timer exhaust
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [examStarted, submitted]);

    // Broadcast answering progress to monitor
    const handleSelectOption = (qNo, optionId) => {
        if (submitted || isLocked || !examStarted) return;
        
        const newAnswers = {
            ...answers,
            [qNo]: optionId
        };
        setAnswers(newAnswers);

        // Notify socket progress updates
        if (socket) {
            socket.emit('student_progress', {
                roomCode: code,
                answered: Object.keys(newAnswers).length,
                total: paper?.questions?.length || 0
            });
        }
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="main-wrapper">
                <p style={{ fontSize: '1.2rem', opacity: 0.8 }} className="fade-in">Connecting to secure exam room...</p>
            </div>
        );
    }

    if (errorMsg && !enteredRoom) {
        return (
            <div className="main-wrapper">
                <div className="glass-container fade-in" style={{ textAlign: 'center' }}>
                    <AlertOctagon size={48} color="#ef4444" style={{ margin: '0 auto 20px' }} />
                    <h2 style={{ fontFamily: 'Space Grotesk', marginBottom: '10px' }}>Entry Denied</h2>
                    <p style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: '24px' }}>{errorMsg}</p>
                    <button onClick={() => navigate('/student/dashboard')} className="btn btn-primary">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', width: '100%' }}>
            
            {/* Proctor Lock overlay — tab switches → request teacher unlock */}
            {isLocked && (
                <div className="proctor-locked-overlay">
                    <Lock size={64} color="#ef4444" style={{ marginBottom: '20px', animation: 'pulse 1.5s infinite' }} />
                    <h1 style={{ fontFamily: 'Space Grotesk', color: '#ef4444', fontSize: '2rem', marginBottom: '10px' }}>
                        EXAM LOCKED
                    </h1>
                    <p style={{ opacity: 0.85, maxWidth: '520px', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '10px' }}>
                        You have switched tabs too many times ({tabSwitchCount}/{maxTabSwitches}). Your exam access has been temporarily locked by the proctoring system.
                    </p>
                    <p style={{ opacity: 0.65, maxWidth: '480px', fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '20px' }}>
                        To continue, click the button below to send an unlock request to your teacher. Your exam will resume once they approve.
                    </p>
                    {/* Live countdown while locked */}
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        padding: '10px 20px',
                        borderRadius: '10px',
                        marginBottom: '24px',
                        color: '#f87171'
                    }}>
                        <Clock size={16} />
                        <span style={{ fontFamily: 'Space Grotesk', fontWeight: 'bold', fontSize: '1.1rem' }}>
                            {formatTime(timeLeft)}
                        </span>
                        <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>remaining</span>
                    </div>
                    {!isUnlockRequested ? (
                        <button
                            onClick={requestTeacherUnlock}
                            className="btn btn-primary"
                            style={{
                                width: 'auto',
                                padding: '14px 32px',
                                fontSize: '1rem',
                                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                border: 'none',
                                marginBottom: '16px'
                            }}
                        >
                            🔔 Request Teacher to Unlock Exam
                        </button>
                    ) : (
                        <div style={{
                            padding: '16px 28px',
                            background: 'rgba(245, 158, 11, 0.1)',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            borderRadius: '10px',
                            marginBottom: '16px',
                            color: '#fbbf24',
                            fontWeight: 'bold',
                            fontSize: '0.95rem'
                        }}>
                            ⏳ Waiting for teacher to unlock your exam...
                        </div>
                    )}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', opacity: 0.6 }}>Attempt ID: {code} | Proctor Shield 2.0</span>
                </div>
            )}

            {/* Warning banners */}
            {warningMsg && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 99999,
                    background: 'rgba(239, 68, 68, 0.95)',
                    border: '1px solid #ef4444',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    animation: 'shake 0.4s ease'
                }}>
                    <ShieldAlert size={20} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{warningMsg}</span>
                </div>
            )}

            {/* Exited Fullscreen Cover screens */}
            {enteredRoom && examStarted && !isFullscreen && !isLocked && !submitted && (
                <div className="proctor-locked-overlay" style={{ background: 'rgba(10, 14, 39, 0.98)' }}>
                    <ShieldAlert size={64} color="#ef4444" style={{ marginBottom: '20px' }} />
                    <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '1.8rem', color: '#f87171', marginBottom: '10px' }}>
                        Fullscreen Enforcement Required
                    </h1>
                    <p style={{ opacity: 0.7, maxWidth: '480px', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '30px' }}>
                        Exiting fullscreen violates proctoring guidelines. This count was reported. Keeping exam mode full screen is mandatory to resume questions.
                    </p>
                    <button onClick={enterFullscreen} className="btn btn-primary" style={{ width: 'auto', padding: '14px 30px' }}>
                        Re-enter Full Screen Mode
                    </button>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '20px' }}>
                        Violation counter: {anomalyCount} / {maxViolations}
                    </span>
                </div>
            )}

            {/* 1. Pre-entry Gate page */}
            {!enteredRoom && !submitted && (
                <div className="main-wrapper">
                    <div className="glass-container fade-in" style={{ maxWidth: '550px' }}>
                        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.5rem', marginBottom: '10px', textAlign: 'center', color: '#4facfe' }}>
                            Secure Exam Verification
                        </h2>
                        <p style={{ textAlign: 'center', opacity: 0.7, fontSize: '0.85rem', marginBottom: '30px', lineHeight: '1.5' }}>
                            You are entering the proctored exam room. Complete anti-cheat guidelines are enforced.
                        </p>

                        <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', padding: '20px', borderRadius: '10px', marginBottom: '30px', fontSize: '0.85rem', lineHeight: '1.6' }}>
                            <p style={{ fontWeight: 'bold', color: '#ef4444', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Lock size={16} /> Proctoring Policy Rules:
                            </p>
                            <ul style={{ paddingLeft: '15px', display: 'flex', flexDirection: 'column', gap: '6px', opacity: 0.8 }}>
                                <li>You must remain in <strong>Full Screen</strong> mode at all times.</li>
                                <li>Switching browser tabs is allowed a maximum of <strong>{maxTabSwitches} times</strong>.</li>
                                <li>On the 6th tab switch, your exam will be <strong>locked</strong> and you must request your teacher to unlock it.</li>
                                <li>Shortcut keys (F5, F12, developer settings) are locked.</li>
                                <li>All violations are instantly reported to your teacher in real-time.</li>
                            </ul>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', background: 'rgba(255, 255, 255, 0.02)', padding: '15px', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '30px' }}>
                            <div>
                                <span style={{ fontSize: '0.75rem', opacity: 0.5, uppercase: 'true' }}>Exam Name</span>
                                <p style={{ fontWeight: 'bold', marginTop: '3px' }}>{roomInfo?.subject}</p>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.75rem', opacity: 0.5, uppercase: 'true' }}>Time Allotted</span>
                                <p style={{ fontWeight: 'bold', marginTop: '3px' }}>{roomInfo?.duration} Minutes</p>
                            </div>
                        </div>

                        <button onClick={handleEnterExamMode} className="btn btn-primary">
                            Enter Fullscreen & Unlock Exam Mode
                        </button>
                    </div>
                </div>
            )}

            {/* 2. Active Exam board */}
            {enteredRoom && !submitted && (
                <div style={{ padding: '30px 20px', maxWidth: '1100px', margin: '0 auto' }} className="fade-in">
                    
                    {/* Header with active timers */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid var(--border)', paddingBottom: '15px' }}>
                        <div>
                            <span style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                Proctor Shield Active | Violations: {anomalyCount} | Tab Switches: {tabSwitchCount}/{maxTabSwitches}
                            </span>
                            <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.5rem', fontWeight: '800' }}>
                                {roomInfo?.subject}
                            </h2>
                        </div>
                        {examStarted ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: timeLeft <= 60 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)', border: `1px solid ${timeLeft <= 60 ? 'rgba(239, 68, 68, 0.6)' : 'rgba(239, 68, 68, 0.3)'}`, padding: '10px 20px', borderRadius: '10px', color: '#f87171', transition: 'all 0.5s ease' }}>
                                <Clock size={18} />
                                <span style={{ fontFamily: 'Space Grotesk', fontSize: '1.2rem', fontWeight: 'bold', animation: timeLeft <= 60 ? 'pulse 1s infinite' : 'none' }}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '10px 20px', borderRadius: '10px', color: '#fbbf24' }}>
                                <Lock size={16} />
                                <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Waiting for teacher...</span>
                            </div>
                        )}
                    </div>

                    {!examStarted ? (
                        /* Pre-exam wait rooms */
                        <div className="glass-card-wide" style={{ textAlign: 'center', padding: '80px 20px' }}>
                            <Lock size={48} color="#fbbf24" style={{ margin: '0 auto 20px' }} />
                            <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.4rem', marginBottom: '8px' }}>
                                Waiting for Teacher to Launch Exam
                            </h3>
                            <p style={{ opacity: 0.6, maxWidth: '450px', margin: '0 auto', fontSize: '0.85rem', lineHeight: '1.6' }}>
                                You have successfully joined the exam room lobby. The timer, questions, and automated proctoring shield (tab-switch detection, fullscreen checks, key locks) will activate automatically once the teacher initiates the start signal.
                            </p>
                        </div>
                    ) : (
                        /* Active Test taker panel */
                        <div className="exam-taking-container">
                            {/* Left panel navigations */}
                            <div className="exam-nav-sidebar">
                                <h4 className="exam-nav-title">
                                    Exam Sheet Navigator
                                </h4>
                                <div className="exam-nav-grid">
                                    {paper?.questions?.map((q, idx) => {
                                        const isCurrent = currentIndex === idx;
                                        const isAnswered = !!answers[q.questionNo];
                                        return (
                                            <button
                                                key={q.questionNo}
                                                onClick={() => setCurrentIndex(idx)}
                                                className="exam-nav-btn"
                                                style={{
                                                    background: isCurrent 
                                                        ? 'linear-gradient(135deg, #667eea, #764ba2)' 
                                                        : isAnswered 
                                                            ? 'rgba(16, 185, 129, 0.15)' 
                                                            : 'rgba(255, 255, 255, 0.03)',
                                                    color: 'white',
                                                    border: isAnswered && !isCurrent ? '1px solid #10b981' : '1px solid transparent',
                                                }}
                                            >
                                                {idx + 1}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Main Active Question card */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="question-card-frame">
                                    <div className="question-header">
                                        <span className="question-badge">
                                            Question {currentIndex + 1} of {paper?.questions?.length}
                                        </span>
                                        <span className="marks-badge">
                                            {paper?.questions?.[currentIndex]?.marks} Marks
                                        </span>
                                    </div>

                                    <p className="question-text-frame">
                                        {paper?.questions?.[currentIndex]?.text}
                                    </p>

                                    {/* Choices rendering */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                        {paper?.questions?.[currentIndex]?.options?.map((opt) => {
                                            const isSelected = answers[paper.questions[currentIndex].questionNo] === opt.id;
                                            return (
                                                <div 
                                                    key={opt.id}
                                                    onClick={() => handleSelectOption(paper.questions[currentIndex].questionNo, opt.id)}
                                                    className={`option-row-frame ${isSelected ? 'option-row-frame-selected' : ''}`}
                                                >
                                                    <div className="option-index-capsule">
                                                        {opt.id}
                                                    </div>
                                                    <span className="option-text">
                                                        {opt.text}
                                                    </span>
                                                    <div className="option-custom-bullet">
                                                        <div className="option-custom-bullet-dot" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Active Footer control keys */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <button
                                        onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                                        className="btn btn-secondary"
                                        style={{ width: 'auto', padding: '12px 24px' }}
                                        disabled={currentIndex === 0}
                                    >
                                        <ArrowLeft size={16} /> Previous
                                    </button>

                                    {currentIndex < (paper?.questions?.length || 0) - 1 ? (
                                        <button
                                            onClick={() => setCurrentIndex(prev => prev + 1)}
                                            className="btn btn-secondary"
                                            style={{ width: 'auto', padding: '12px 24px' }}
                                        >
                                            Next <ArrowRight size={16} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleSubmitExam(false)}
                                            className="btn btn-primary"
                                            style={{ width: 'auto', padding: '12px 30px', background: 'linear-gradient(135deg, #10b981, #047857)' }}
                                        >
                                            Submit Exam Paper <CheckCircle2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 3. Post-Submit completion board */}
            {submitted && (
                <div className="main-wrapper fade-in">
                    <div className="glass-container" style={{ textAlign: 'center', padding: '50px 30px', maxWidth: '550px' }}>
                        <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', color: '#10b981', marginBottom: '20px' }}>
                            <CheckCircle2 size={48} />
                        </div>
                        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.8rem', marginBottom: '10px' }}>
                            Exam Submitted Successfully
                        </h2>
                        <p style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: '35px', lineHeight: '1.5' }}>
                            Your answers have been graded and recorded. Teacher will release details soon.
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginBottom: '40px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                            <div>
                                <span style={{ fontSize: '0.75rem', opacity: 0.5, textTransform: 'uppercase' }}>Marks Scored</span>
                                <p style={{ fontSize: '1.8rem', fontWeight: 'bold', fontFamily: 'Space Grotesk', color: '#10b981', marginTop: '4px' }}>
                                    {result?.totalScore || 0}
                                </p>
                            </div>
                            <div style={{ width: '1px', background: 'var(--border)' }} />
                            <div>
                                <span style={{ fontSize: '0.75rem', opacity: 0.5, textTransform: 'uppercase' }}>Total Marks</span>
                                <p style={{ fontSize: '1.8rem', fontWeight: 'bold', fontFamily: 'Space Grotesk', marginTop: '4px' }}>
                                    {result?.totalMarks || 0}
                                </p>
                            </div>
                            <div style={{ width: '1px', background: 'var(--border)' }} />
                            <div>
                                <span style={{ fontSize: '0.75rem', opacity: 0.5, textTransform: 'uppercase' }}>Accuracy</span>
                                <p style={{ fontSize: '1.8rem', fontWeight: 'bold', fontFamily: 'Space Grotesk', color: '#4facfe', marginTop: '4px' }}>
                                    {result?.percentage || 0}%
                                </p>
                            </div>
                        </div>

                        <button onClick={() => navigate('/student/dashboard')} className="btn btn-secondary">
                            <Home size={16} /> Return to Dashboard Home
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExamRoom;
