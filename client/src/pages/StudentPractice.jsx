import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { examAPI, examRoomAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import { 
    ArrowLeft, ArrowRight, CheckCircle2, HelpCircle, AlertTriangle, 
    BookMarked, Clock, Check, X, Award, ChevronRight, Home 
} from 'lucide-react';

const StudentPractice = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    // Parse queries
    const queryParams = new URLSearchParams(location.search);
    const subject = queryParams.get('subject') || 'Physics';
    const difficulty = queryParams.get('difficulty') || 'Medium';
    const count = parseInt(queryParams.get('count') || '10');
    const topic = queryParams.get('topic') || '';
    const focus = queryParams.get('focus') || 'mixed';

    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState([]);
    const [paperId, setPaperId] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { questionId: answerId }
    
    // Status states
    const [submitted, setSubmitted] = useState(false);
    const [gradingResult, setGradingResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchPracticeTest();
    }, [user]);

    const fetchPracticeTest = async () => {
        try {
            const res = await examAPI.getPracticeTest({
                exam: 'JEE Main', // General applicable query fallback
                subject,
                difficulty,
                count,
                topic,
                focus
            });
            
            if (res.data.questions && res.data.questions.length > 0) {
                setQuestions(res.data.questions);
                setPaperId(res.data.paperId || res.data.testId || '');
            } else {
                setErrorMsg('No practice questions available for this configuration. Try another subject.');
            }
        } catch (e) {
            console.error(e);
            setErrorMsg('Failed to initialize AI question templates. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectOption = (qId, optionId) => {
        if (submitted) return;
        setAnswers(prev => ({
            ...prev,
            [qId]: optionId
        }));
    };

    const handleSubmit = async () => {
        // Build answer payload
        const formattedAnswers = questions.map((q, idx) => ({
            questionNo: idx + 1,
            questionId: q._id,
            answer: answers[q._id] || ''
        }));

        setLoading(true);
        try {
            const res = await examRoomAPI.submitPractice({
                paperId: paperId || questions[0]._id, // Reference paper
                studentEmail: user.email,
                studentName: user.name,
                answers: formattedAnswers
            });

            if (res.data.success) {
                setGradingResult(res.data);
                setSubmitted(true);
                // Trigger score celebration confetti!
                confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 }
                });
            }
        } catch (e) {
            console.error(e);
            setErrorMsg('Failed to evaluate practice answers.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="main-wrapper">
                <p style={{ fontSize: '1.2rem', opacity: 0.8 }} className="fade-in">Assembling practice test paper...</p>
            </div>
        );
    }

    if (errorMsg) {
        return (
            <div className="main-wrapper">
                <div className="glass-container fade-in" style={{ textAlign: 'center' }}>
                    <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 20px' }} />
                    <h2 style={{ fontFamily: 'Space Grotesk', marginBottom: '10px' }}>Initialisation Failed</h2>
                    <p style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: '24px' }}>{errorMsg}</p>
                    <button onClick={() => navigate('/student/dashboard')} className="btn btn-primary">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];
    const answeredCount = Object.keys(answers).length;

    return (
        <div style={{ padding: '30px 20px', maxWidth: '1100px', margin: '0 auto', minHeight: '100vh' }}>
            
            {/* Header section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#10b981', fontWeight: 'bold' }}>
                        AI Practice Suite ({difficulty})
                    </span>
                    <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '1.8rem', fontWeight: '800', marginTop: '4px' }}>
                        {subject}
                    </h1>
                </div>
                {!submitted && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.05)', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <Clock size={16} />
                        <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Practice Mode</span>
                    </div>
                )}
            </div>

            {/* Layout Grid */}
            {!submitted ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '25px' }}>
                    
                    {/* Left Navigation Sidebar */}
                    <div className="glass-card-wide" style={{ padding: '20px', height: 'fit-content' }}>
                        <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1rem', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
                            Navigator
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '20px' }}>
                            {questions.map((q, idx) => (
                                <button
                                    key={q._id}
                                    onClick={() => setCurrentIndex(idx)}
                                    style={{
                                        aspectRatio: '1',
                                        borderRadius: '6px',
                                        background: currentIndex === idx 
                                            ? 'linear-gradient(135deg, #667eea, #764ba2)' 
                                            : answers[q._id] 
                                                ? 'rgba(16, 185, 129, 0.15)' 
                                                : 'rgba(255, 255, 255, 0.05)',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: '0.9rem',
                                        cursor: 'pointer',
                                        border: answers[q._id] && currentIndex !== idx ? '1px solid #10b981' : '1px solid transparent',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.6, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <p>● Answered: {answeredCount} / {questions.length}</p>
                            <p>● Remaining: {questions.length - answeredCount}</p>
                        </div>
                    </div>

                    {/* Right Question Board */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="glass-card-wide" style={{ padding: '35px', minHeight: '320px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '10px' }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <span style={{ padding: '4px 10px', background: 'rgba(102, 126, 234, 0.15)', borderRadius: '6px', fontSize: '0.8rem', color: '#667eea', fontWeight: 'bold' }}>
                                        Question {currentIndex + 1} of {questions.length}
                                    </span>
                                    {currentQuestion.chapter && (
                                        <span style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(102, 126, 234, 0.15)', borderRadius: '6px', fontWeight: 'bold', color: '#c4b5fd' }}>
                                            📖 {currentQuestion.chapter}
                                        </span>
                                    )}
                                    {currentQuestion.topic && (
                                        <span style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(16, 185, 129, 0.12)', borderRadius: '6px', fontWeight: 'bold', color: '#6ee7b7' }}>
                                            🎯 {currentQuestion.topic}
                                        </span>
                                    )}
                                </div>
                                <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>
                                    {currentQuestion.marks} Mark(s)
                                </span>
                            </div>

                            <p style={{ fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '35px', fontWeight: '500' }}>
                                {currentQuestion.text}
                            </p>

                            {/* Option selections */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {currentQuestion.options && currentQuestion.options.length > 0 ? (
                                    currentQuestion.options.map((opt) => (
                                        <div 
                                            key={opt.id}
                                            onClick={() => handleSelectOption(currentQuestion._id, opt.id)}
                                            style={{
                                                padding: '16px 20px',
                                                background: answers[currentQuestion._id] === opt.id 
                                                    ? 'rgba(102, 126, 234, 0.1)' 
                                                    : 'rgba(255,255,255,0.02)',
                                                border: answers[currentQuestion._id] === opt.id 
                                                    ? '1px solid #667eea' 
                                                    : '1px solid var(--border)',
                                                borderRadius: '10px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '15px',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (answers[currentQuestion._id] !== opt.id) {
                                                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (answers[currentQuestion._id] !== opt.id) {
                                                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                                }
                                            }}
                                        >
                                            <div style={{
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '50%',
                                                border: answers[currentQuestion._id] === opt.id ? '6px solid #667eea' : '2px solid rgba(255,255,255,0.2)',
                                                background: answers[currentQuestion._id] === opt.id ? 'white' : 'transparent',
                                                transition: 'all 0.15s ease'
                                            }} />
                                            <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                                                <span style={{ color: '#4facfe', fontWeight: '700', marginRight: '6px' }}>{opt.id}.</span> {opt.text}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="form-group">
                                        <textarea
                                            className="form-input"
                                            rows={5}
                                            placeholder="Write your answer explanation here..."
                                            value={answers[currentQuestion._id] || ''}
                                            onChange={(e) => handleSelectOption(currentQuestion._id, e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Navigation Footer */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button
                                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                                className="btn btn-secondary"
                                style={{ width: 'auto', padding: '12px 20px' }}
                                disabled={currentIndex === 0}
                            >
                                <ArrowLeft size={16} /> Previous
                            </button>

                            {currentIndex < questions.length - 1 ? (
                                <button
                                    onClick={() => setCurrentIndex(prev => prev + 1)}
                                    className="btn btn-secondary"
                                    style={{ width: 'auto', padding: '12px 20px' }}
                                >
                                    Next <ArrowRight size={16} />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    className="btn btn-primary"
                                    style={{ width: 'auto', padding: '12px 30px', background: 'linear-gradient(135deg, #10b981, #047857)' }}
                                >
                                    Submit Test <CheckCircle2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* Post-Submission Score & Result Review Board */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }} className="fade-in">
                    
                    {/* Score Summary panel */}
                    <div className="glass-card-wide" style={{ textAlign: 'center', padding: '50px 30px' }}>
                        <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', color: '#10b981', marginBottom: '20px' }}>
                            <Award size={48} />
                        </div>
                        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.8rem', marginBottom: '8px' }}>
                            Practice Completed!
                        </h2>
                        <p style={{ opacity: 0.7, fontSize: '0.95rem', marginBottom: '30px' }}>
                            Excellent effort. Review your topic analytics and correct keys below.
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '40px' }}>
                            <div>
                                <span style={{ fontSize: '2.5rem', fontWeight: '800', fontFamily: 'Space Grotesk', color: '#10b981' }}>
                                    {gradingResult?.totalScore || 0}
                                </span>
                                <span style={{ opacity: 0.5, fontSize: '1.2rem', fontWeight: '500' }}> / {gradingResult?.totalMarks || 0}</span>
                                <p style={{ fontSize: '0.8rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>Marks Scored</p>
                            </div>
                            <div style={{ width: '1px', background: 'var(--border)' }} />
                            <div>
                                <span style={{ fontSize: '2.5rem', fontWeight: '800', fontFamily: 'Space Grotesk', color: '#4facfe' }}>
                                    {gradingResult?.percentage || 0}%
                                </span>
                                <p style={{ fontSize: '0.8rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>Test Accuracy</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                            <button onClick={() => navigate('/student/dashboard')} className="btn btn-secondary" style={{ width: 'auto', padding: '12px 24px' }}>
                                <Home size={16} /> Dashboard Home
                            </button>
                        </div>
                    </div>

                    {/* Question-by-Question detailed review list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#4facfe' }}>
                            <BookMarked size={22} /> Answer Key & Explanations
                        </h3>

                        {questions.map((q, idx) => {
                            const studentAns = answers[q._id] || 'Unanswered';
                            const detailedEntry = gradingResult?.detailed?.find(d => d.questionNo === idx + 1);
                            const isCorrect = detailedEntry?.isCorrect ?? false;
                            // Correct answer letter from server grading result (most reliable source)
                            const correctAnswerLetter = detailedEntry?.correctAnswer || q.answer?.correctOption || null;
                            const explanationText = detailedEntry?.explanation || q.answer?.explanation || 'Refer to syllabus materials for detailed conceptual steps.';
                            
                            return (
                                <div 
                                    key={q._id}
                                    className="glass-card-wide"
                                    style={{
                                        padding: '30px',
                                        borderLeft: isCorrect ? '4px solid #10b981' : '4px solid #ef4444'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                                                QUESTION {idx + 1} ({q.difficulty})
                                            </span>
                                            {q.chapter && (
                                                <span style={{ fontSize: '0.72rem', padding: '3px 8px', background: 'rgba(102, 126, 234, 0.15)', borderRadius: '4px', fontWeight: 'bold', color: '#c4b5fd' }}>
                                                    📖 {q.chapter}
                                                </span>
                                            )}
                                            {q.topic && (
                                                <span style={{ fontSize: '0.72rem', padding: '3px 8px', background: 'rgba(16, 185, 129, 0.12)', borderRadius: '4px', fontWeight: 'bold', color: '#6ee7b7' }}>
                                                    🎯 {q.topic}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600', color: isCorrect ? '#34d399' : '#f87171' }}>
                                            {isCorrect ? <Check size={16} /> : <X size={16} />}
                                            {isCorrect ? 'Correct' : 'Incorrect'}
                                        </div>
                                    </div>

                                    <p style={{ fontSize: '1rem', fontWeight: '500', lineHeight: '1.5', marginBottom: '20px' }}>
                                        {q.text}
                                    </p>

                                    {/* Display choices */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                                        {q.options && q.options.map(opt => {
                                            const isSelected = opt.id === studentAns;
                                            const isCorrectChoice = opt.id === correctAnswerLetter;
                                            
                                            return (
                                                <div 
                                                    key={opt.id}
                                                    style={{
                                                        padding: '10px 14px',
                                                        background: isCorrectChoice 
                                                            ? 'rgba(16, 185, 129, 0.15)' 
                                                            : isSelected && !isCorrect
                                                                ? 'rgba(239, 68, 68, 0.1)' 
                                                                : 'rgba(0,0,0,0.1)',
                                                        border: isCorrectChoice 
                                                            ? '2px solid #10b981' 
                                                            : isSelected && !isCorrect
                                                                ? '1px solid #ef4444' 
                                                                : '1px solid rgba(255,255,255,0.04)',
                                                        borderRadius: '6px',
                                                        fontSize: '0.85rem'
                                                    }}
                                                >
                                                    <span style={{ fontWeight: 'bold', marginRight: '4px' }}>{opt.id}.</span> {opt.text}
                                                    {isCorrectChoice && (
                                                        <span style={{ marginLeft: '8px', color: '#10b981', fontWeight: 'bold', fontSize: '0.75rem' }}>✓ Correct</span>
                                                    )}
                                                    {isSelected && !isCorrect && isCorrectChoice === false && (
                                                        <span style={{ marginLeft: '8px', color: '#ef4444', fontWeight: 'bold', fontSize: '0.75rem' }}>✗ Your Answer</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* AI Explanatory note */}
                                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', padding: '15px 20px', borderRadius: '8px' }}>
                                        <p style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#4facfe', marginBottom: '4px' }}>
                                            AI Explanation (Correct Answer: {correctAnswerLetter ? `Option ${correctAnswerLetter}` : 'N/A'})
                                        </p>
                                        <p style={{ fontSize: '0.85rem', opacity: 0.7, lineHeight: '1.4' }}>
                                            {explanationText}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentPractice;
