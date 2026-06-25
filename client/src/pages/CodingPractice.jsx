import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { codingAPI } from '../services/api';
import {
    Code2, Bug, Cpu, Brain, Play, ChevronRight, ChevronLeft,
    CheckCircle2, XCircle, Home, RotateCcw, Trophy, Zap, AlertTriangle,
    Terminal, BookOpen, Layers
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const LANGUAGES = ['Python', 'JavaScript', 'Java', 'C++', 'C'];

const MODES = [
    {
        id: 'CodeFill',
        icon: Code2,
        label: 'Code Fill',
        desc: 'Fill in the missing parts of a code snippet',
        color: '#667eea',
        gradient: 'linear-gradient(135deg, #667eea, #764ba2)'
    },
    {
        id: 'Debugging',
        icon: Bug,
        label: 'Debug Challenge',
        desc: 'Find and fix the bug in the given code',
        color: '#f59e0b',
        gradient: 'linear-gradient(135deg, #f59e0b, #d97706)'
    },
    {
        id: 'TraceOutput',
        icon: Terminal,
        label: 'Trace Output',
        desc: 'Predict what the code will print',
        color: '#10b981',
        gradient: 'linear-gradient(135deg, #10b981, #047857)'
    },
    {
        id: 'ConceptMCQ',
        icon: Brain,
        label: 'Concept MCQ',
        desc: 'DSA & language concepts, complexity, patterns',
        color: '#4facfe',
        gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)'
    },
];

const DSA_TOPICS = [
    { label: 'Arrays', icon: '📊' },
    { label: 'Strings', icon: '🔤' },
    { label: 'Linked List', icon: '🔗' },
    { label: 'Stacks & Queues', icon: '🗂️' },
    { label: 'Trees', icon: '🌳' },
    { label: 'Graphs', icon: '🕸️' },
    { label: 'Dynamic Programming', icon: '🧮' },
    { label: 'Recursion', icon: '🔄' },
    { label: 'Sorting & Searching', icon: '🔍' },
    { label: 'Heaps & HashMaps', icon: '🗃️' },
    { label: 'Bit Manipulation', icon: '⚙️' },
    { label: 'Two Pointers', icon: '👆' },
];

const LANG_TOPICS = {
    Python: ['List Comprehensions', 'Generators & Iterators', 'Decorators', 'OOP in Python', 'Exception Handling'],
    JavaScript: ['Closures', 'Promises & Async/Await', 'Prototypes', 'Event Loop', 'Destructuring'],
    Java: ['OOP & Inheritance', 'Collections Framework', 'Generics', 'Exception Handling', 'Multithreading'],
    'C++': ['Pointers & References', 'STL Containers', 'Memory Management', 'Templates', 'RAII'],
    C: ['Pointers & Arrays', 'Structs & Unions', 'Dynamic Memory', 'File I/O', 'Bitwise Operations'],
};

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

// ─── Code renderer with blank inputs ─────────────────────────────────────────

const CodeWithBlanks = ({ code, blanks, userBlanks, onBlankChange, submitted, correctBlanks }) => {
    const parts = code.split('___BLANK___');
    return (
        <pre style={{
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            padding: '20px 24px',
            fontFamily: '"Fira Code", "Cascadia Code", "Courier New", monospace',
            fontSize: '0.88rem',
            lineHeight: '1.8',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            color: '#e2e8f0',
        }}>
            {parts.map((part, i) => (
                <React.Fragment key={i}>
                    <span style={{ color: '#a5f3fc' }}>{part}</span>
                    {i < blanks.length && (
                        submitted ? (
                            <span style={{
                                display: 'inline-block',
                                minWidth: '80px',
                                padding: '2px 8px',
                                background: (userBlanks[i] || '').trim().toLowerCase() === (correctBlanks[i] || '').trim().toLowerCase()
                                    ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                                border: `1px solid ${(userBlanks[i] || '').trim().toLowerCase() === (correctBlanks[i] || '').trim().toLowerCase()
                                    ? '#10b981' : '#ef4444'}`,
                                borderRadius: '4px',
                                color: '#fff',
                                fontFamily: 'inherit',
                                fontSize: 'inherit',
                                verticalAlign: 'middle',
                                margin: '0 4px',
                            }}>
                                {userBlanks[i] || '(empty)'}
                                {(userBlanks[i] || '').trim().toLowerCase() !== (correctBlanks[i] || '').trim().toLowerCase() && (
                                    <span style={{ color: '#10b981', marginLeft: '6px' }}>→ {correctBlanks[i]}</span>
                                )}
                            </span>
                        ) : (
                            <input
                                type="text"
                                value={userBlanks[i] || ''}
                                onChange={e => onBlankChange(i, e.target.value)}
                                placeholder={`blank ${i + 1}`}
                                style={{
                                    display: 'inline-block',
                                    minWidth: '100px',
                                    width: `${Math.max(100, ((userBlanks[i] || '').length + 4) * 9)}px`,
                                    padding: '2px 8px',
                                    background: 'rgba(102,126,234,0.15)',
                                    border: '1px dashed #667eea',
                                    borderRadius: '4px',
                                    color: '#fff',
                                    fontFamily: 'inherit',
                                    fontSize: 'inherit',
                                    outline: 'none',
                                    verticalAlign: 'middle',
                                    margin: '0 4px',
                                    transition: 'border-color 0.2s ease',
                                }}
                                onFocus={e => e.target.style.borderColor = '#4facfe'}
                                onBlur={e => e.target.style.borderColor = '#667eea'}
                            />
                        )
                    )}
                </React.Fragment>
            ))}
        </pre>
    );
};

// ─── Code block (read-only, syntax coloured) ─────────────────────────────────

const CodeBlock = ({ code, highlightLine }) => (
    <pre style={{
        background: 'rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px',
        padding: '20px 24px',
        fontFamily: '"Fira Code", "Cascadia Code", "Courier New", monospace',
        fontSize: '0.88rem',
        lineHeight: '1.8',
        overflowX: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        color: '#e2e8f0',
    }}>
        {code.split('\n').map((line, i) => (
            <div key={i} style={{
                background: highlightLine && i + 1 === highlightLine
                    ? 'rgba(239,68,68,0.15)' : 'transparent',
                borderLeft: highlightLine && i + 1 === highlightLine
                    ? '3px solid #ef4444' : '3px solid transparent',
                paddingLeft: '8px',
                marginLeft: '-8px',
            }}>
                <span style={{ color: '#64748b', marginRight: '16px', userSelect: 'none', fontSize: '0.78rem' }}>
                    {String(i + 1).padStart(2, ' ')}
                </span>
                <span style={{ color: '#a5f3fc' }}>{line}</span>
            </div>
        ))}
    </pre>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const CodingPractice = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Setup state
    const [phase, setPhase] = useState('setup');   // setup | loading | quiz | result
    const [selectedMode, setSelectedMode] = useState(null);
    const [selectedLang, setSelectedLang] = useState('Python');
    const [selectedTopic, setSelectedTopic] = useState('Arrays');
    const [selectedDiff, setSelectedDiff] = useState('Medium');
    const [questionCount, setQuestionCount] = useState(5);

    // Quiz state
    const [questions, setQuestions] = useState([]);
    const [paperId, setPaperId] = useState('');
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState({});      // { questionNo: optionLetter }
    const [blankAnswers, setBlankAnswers] = useState({});  // { questionNo: [str, str, ...] }

    // Result state
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const allTopics = selectedMode?.id === 'ConceptMCQ'
        ? (LANG_TOPICS[selectedLang] || DSA_TOPICS.map(t => t.label))
        : DSA_TOPICS.map(t => t.label);

    // ─── Handlers ────────────────────────────────────────────────────────────

    const handleStart = async () => {
        if (!selectedMode) return;
        setPhase('loading');
        setError('');
        try {
            const res = await codingAPI.getCodingPractice({
                language: selectedLang,
                topic: selectedTopic,
                difficulty: selectedDiff,
                count: questionCount,
                question_type: selectedMode.id,
            });
            if (res.data.success) {
                setQuestions(res.data.questions);
                setPaperId(res.data.paperId);
                setCurrentIdx(0);
                setAnswers({});
                setBlankAnswers({});
                setPhase('quiz');
            } else {
                setError(res.data.error || 'Failed to generate questions.');
                setPhase('setup');
            }
        } catch (e) {
            setError(e.response?.data?.error || 'AI service unavailable. Please try again.');
            setPhase('setup');
        }
    };

    const handleOptionSelect = (qNo, optId) => {
        setAnswers(prev => ({ ...prev, [qNo]: optId }));
    };

    const handleBlankChange = (qNo, blankIdx, value) => {
        setBlankAnswers(prev => {
            const existing = [...(prev[qNo] || [])];
            existing[blankIdx] = value;
            return { ...prev, [qNo]: existing };
        });
    };

    const handleSubmit = async () => {
        setPhase('loading');
        try {
            const answerPayload = questions.map((q, idx) => ({
                questionNo: q.questionNo || idx + 1,
                answer: answers[q.questionNo || idx + 1] || '',
                blanks: blankAnswers[q.questionNo || idx + 1] || [],
            }));

            const res = await codingAPI.submitCodingAnswers({
                paperId,
                studentEmail: user.email,
                studentName: user.name,
                answers: answerPayload,
            });

            if (res.data.success) {
                setResult(res.data);
                setPhase('result');
            } else {
                setError(res.data.error || 'Submission failed.');
                setPhase('quiz');
            }
        } catch (e) {
            setError('Submission failed. Please try again.');
            setPhase('quiz');
        }
    };

    const handleRetry = () => {
        setPhase('setup');
        setResult(null);
        setError('');
    };

    // ─── Render: Setup ────────────────────────────────────────────────────────

    if (phase === 'setup') {
        return (
            <div style={{ padding: '30px 20px', maxWidth: '1000px', margin: '0 auto', minHeight: '100vh' }}>
                {/* Header */}
                <div style={{ marginBottom: '36px' }}>
                    <button onClick={() => navigate('/student/dashboard')} className="btn btn-secondary"
                        style={{ width: 'auto', padding: '8px 16px', fontSize: '0.85rem', marginBottom: '20px' }}>
                        <Home size={14} /> Dashboard
                    </button>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#10b981', fontWeight: 'bold' }}>
                        AI Coding Suite
                    </span>
                    <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '2rem', fontWeight: '800', marginTop: '6px' }}>
                        💻 Coding Practice
                    </h1>
                    <p style={{ opacity: 0.6, marginTop: '6px' }}>
                        Code Fill · Debug Challenges · Trace Output · DSA Concepts
                    </p>
                </div>

                {error && (
                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '10px', padding: '14px 18px', marginBottom: '24px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <AlertTriangle size={18} color="#ef4444" />
                        <span style={{ fontSize: '0.9rem', color: '#fca5a5' }}>{error}</span>
                    </div>
                )}

                {/* Step 1: Mode */}
                <div className="glass-card-wide" style={{ padding: '28px', marginBottom: '20px' }}>
                    <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1rem', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Layers size={18} color="#667eea" /> Step 1 — Choose Practice Mode
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
                        {MODES.map(m => {
                            const Icon = m.icon;
                            const active = selectedMode?.id === m.id;
                            return (
                                <div key={m.id} onClick={() => setSelectedMode(m)}
                                    style={{
                                        padding: '20px',
                                        borderRadius: '12px',
                                        border: `2px solid ${active ? m.color : 'rgba(255,255,255,0.06)'}`,
                                        background: active ? `${m.color}18` : 'rgba(255,255,255,0.02)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = `${m.color}60`; }}
                                    onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: m.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                                        <Icon size={20} color="white" />
                                    </div>
                                    <div style={{ fontFamily: 'Space Grotesk', fontWeight: '700', marginBottom: '4px' }}>{m.label}</div>
                                    <div style={{ fontSize: '0.78rem', opacity: 0.55, lineHeight: '1.4' }}>{m.desc}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Step 2: Language + Config */}
                <div className="glass-card-wide" style={{ padding: '28px', marginBottom: '20px' }}>
                    <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1rem', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Code2 size={18} color="#4facfe" /> Step 2 — Language & Settings
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '18px' }}>
                        {LANGUAGES.map(lang => (
                            <button key={lang} onClick={() => { setSelectedLang(lang); setSelectedTopic(allTopics[0]); }}
                                style={{
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    border: `2px solid ${selectedLang === lang ? '#4facfe' : 'rgba(255,255,255,0.08)'}`,
                                    background: selectedLang === lang ? 'rgba(79,172,254,0.12)' : 'rgba(255,255,255,0.02)',
                                    color: selectedLang === lang ? '#4facfe' : 'rgba(255,255,255,0.7)',
                                    fontWeight: '600',
                                    fontFamily: 'Space Grotesk',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}>{lang}</button>
                        ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        <div>
                            <label style={{ fontSize: '0.8rem', opacity: 0.6, display: 'block', marginBottom: '6px' }}>Difficulty</label>
                            <select className="form-select" value={selectedDiff} onChange={e => setSelectedDiff(e.target.value)}>
                                {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', opacity: 0.6, display: 'block', marginBottom: '6px' }}>Questions</label>
                            <select className="form-select" value={questionCount} onChange={e => setQuestionCount(parseInt(e.target.value))}>
                                {[3, 5, 8, 10].map(n => <option key={n} value={n}>{n} questions</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Step 3: Topic */}
                <div className="glass-card-wide" style={{ padding: '28px', marginBottom: '28px' }}>
                    <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1rem', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BookOpen size={18} color="#10b981" /> Step 3 — Choose Topic
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '10px' }}>
                        {(selectedMode?.id === 'ConceptMCQ' ? LANG_TOPICS[selectedLang] || [] : DSA_TOPICS.map(t => t.label + ' ' + (DSA_TOPICS.find(d => d.label + ' ' + d.icon === t.label + ' ' + t.icon)?.icon || ''))).map((t, i) => {
                            const dsaTopic = DSA_TOPICS[i];
                            const topicLabel = selectedMode?.id === 'ConceptMCQ' ? t : dsaTopic?.label || t;
                            const topicIcon = selectedMode?.id === 'ConceptMCQ' ? '💡' : dsaTopic?.icon || '📌';
                            const active = selectedTopic === topicLabel;
                            return (
                                <button key={topicLabel} onClick={() => setSelectedTopic(topicLabel)}
                                    style={{
                                        padding: '12px 14px',
                                        borderRadius: '10px',
                                        border: `2px solid ${active ? '#10b981' : 'rgba(255,255,255,0.06)'}`,
                                        background: active ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.02)',
                                        color: active ? '#10b981' : 'rgba(255,255,255,0.7)',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        fontWeight: active ? '700' : '500',
                                        fontSize: '0.85rem',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                    }}>
                                    <span>{topicIcon}</span> {topicLabel}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Launch */}
                <button onClick={handleStart} disabled={!selectedMode} className="btn btn-primary"
                    style={{ maxWidth: '320px', padding: '16px 30px', fontSize: '1rem', background: selectedMode?.gradient || 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                    <Play size={18} /> Start {selectedMode?.label || 'Practice'}
                </button>
            </div>
        );
    }

    // ─── Render: Loading ──────────────────────────────────────────────────────

    if (phase === 'loading') {
        const mode = MODES.find(m => m.id === selectedMode?.id);
        return (
            <div className="main-wrapper">
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '60px', height: '60px', border: '3px solid rgba(255,255,255,0.1)', borderTop: `3px solid ${mode?.color || '#667eea'}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 24px' }} />
                    <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.3rem', marginBottom: '8px' }}>
                        Generating {selectedMode?.label} questions...
                    </h3>
                    <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>
                        {selectedLang} · {selectedTopic} · {selectedDiff}
                    </p>
                </div>
            </div>
        );
    }

    // ─── Render: Quiz ─────────────────────────────────────────────────────────

    if (phase === 'quiz') {
        const q = questions[currentIdx];
        if (!q) return null;
        const qNo = q.questionNo || currentIdx + 1;
        const mode = MODES.find(m => m.id === q.type) || MODES.find(m => m.id === selectedMode?.id);
        const blankCount = (q.code || '').split('___BLANK___').length - 1;
        const answeredCount = questions.filter((qq, i) => {
            const qn = qq.questionNo || i + 1;
            return qq.type === 'CodeFill'
                ? (blankAnswers[qn] || []).some(b => b?.trim())
                : answers[qn];
        }).length;

        return (
            <div style={{ padding: '24px 20px', maxWidth: '1100px', margin: '0 auto', minHeight: '100vh' }}>
                {/* Header bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: mode?.color || '#667eea', fontWeight: 'bold' }}>
                            {mode?.label} · {selectedLang} · {selectedDiff}
                        </span>
                        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '1.6rem', fontWeight: '800', marginTop: '4px' }}>
                            {selectedTopic}
                        </h1>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.82rem', opacity: 0.6 }}>
                            {answeredCount}/{questions.length} answered
                        </span>
                    </div>
                </div>

                <div className="responsive-coding-grid">
                    {/* Navigator */}
                    <div className="glass-card-wide" style={{ padding: '18px', height: 'fit-content' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Navigator</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '14px' }}>
                            {questions.map((qq, i) => {
                                const qn = qq.questionNo || i + 1;
                                const answered = qq.type === 'CodeFill'
                                    ? (blankAnswers[qn] || []).some(b => b?.trim())
                                    : !!answers[qn];
                                const isActive = i === currentIdx;
                                return (
                                    <button key={i} onClick={() => setCurrentIdx(i)}
                                        style={{
                                            aspectRatio: '1',
                                            borderRadius: '6px',
                                            background: isActive ? mode?.gradient || 'linear-gradient(135deg, #667eea, #764ba2)'
                                                : answered ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            border: answered && !isActive ? '1px solid #10b981' : '1px solid transparent',
                                        }}>
                                        {i + 1}
                                    </button>
                                );
                            })}
                        </div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.5, lineHeight: '1.8' }}>
                            <div>● Mode: {mode?.label}</div>
                            <div>● Lang: {selectedLang}</div>
                            <div>● Diff: {selectedDiff}</div>
                        </div>
                    </div>

                    {/* Question card */}
                    <div className="glass-card-wide" style={{ padding: '30px' }}>
                        {/* Question header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ padding: '4px 10px', background: `${mode?.color || '#667eea'}20`, borderRadius: '6px', fontSize: '0.78rem', color: mode?.color || '#667eea', fontWeight: 'bold' }}>
                                    Q{currentIdx + 1} of {questions.length}
                                </span>
                                <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', opacity: 0.7 }}>
                                    {q.language || selectedLang}
                                </span>
                                <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', opacity: 0.7 }}>
                                    {q.topic || selectedTopic}
                                </span>
                            </div>
                            <span style={{ opacity: 0.45, fontSize: '0.8rem' }}>{q.difficulty || selectedDiff}</span>
                        </div>

                        {/* Instruction / question text */}
                        <p style={{ fontSize: '1.05rem', fontWeight: '600', lineHeight: '1.6', marginBottom: '20px' }}>
                            {q.instruction || q.text || `Question ${currentIdx + 1}`}
                        </p>

                        {/* ── CodeFill renderer ── */}
                        {q.type === 'CodeFill' && q.code && (
                            <div style={{ marginBottom: '20px' }}>
                                <CodeWithBlanks
                                    code={q.code}
                                    blanks={Array(blankCount).fill('')}
                                    userBlanks={blankAnswers[qNo] || []}
                                    onBlankChange={(i, val) => handleBlankChange(qNo, i, val)}
                                    submitted={false}
                                    correctBlanks={q.blanks || []}
                                />
                                <p style={{ fontSize: '0.78rem', opacity: 0.45, marginTop: '8px' }}>
                                    💡 {blankCount} blank{blankCount !== 1 ? 's' : ''} to fill · Type directly in the highlighted inputs inside the code
                                </p>
                            </div>
                        )}

                        {/* ── Debugging renderer ── */}
                        {q.type === 'Debugging' && (q.buggyCode || q.code) && (
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ fontSize: '0.78rem', opacity: 0.5, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Bug size={13} /> Buggy code — line {q.bugLine} is suspicious
                                </div>
                                <CodeBlock code={q.buggyCode || q.code} highlightLine={q.bugLine} />
                            </div>
                        )}

                        {/* ── TraceOutput / ConceptMCQ code block ── */}
                        {(q.type === 'TraceOutput' || q.type === 'ConceptMCQ') && q.code && (
                            <div style={{ marginBottom: '20px' }}>
                                <CodeBlock code={q.code} />
                            </div>
                        )}

                        {/* Options (Debugging / TraceOutput / ConceptMCQ) */}
                        {q.type !== 'CodeFill' && q.options && q.options.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                                {q.options.map(opt => {
                                    const selected = answers[qNo] === opt.id;
                                    return (
                                        <div key={opt.id} onClick={() => handleOptionSelect(qNo, opt.id)}
                                            style={{
                                                padding: '14px 18px',
                                                borderRadius: '10px',
                                                border: `1px solid ${selected ? (mode?.color || '#667eea') : 'rgba(255,255,255,0.07)'}`,
                                                background: selected ? `${mode?.color || '#667eea'}18` : 'rgba(255,255,255,0.02)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                transition: 'all 0.18s ease',
                                            }}
                                            onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                                            onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}>
                                            <span style={{
                                                width: '28px', height: '28px', borderRadius: '6px',
                                                background: selected ? (mode?.gradient || 'linear-gradient(135deg, #667eea, #764ba2)') : 'rgba(255,255,255,0.06)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: '700', fontSize: '0.85rem', color: selected ? 'white' : 'rgba(255,255,255,0.6)',
                                                flexShrink: 0,
                                            }}>{opt.id}</span>
                                            <span style={{ fontSize: '0.92rem', fontWeight: selected ? '600' : '400', fontFamily: opt.text?.includes('\n') ? 'monospace' : 'inherit' }}>
                                                {opt.text}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Navigation */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                            <button onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                                className="btn btn-secondary" disabled={currentIdx === 0}
                                style={{ width: 'auto', padding: '10px 18px' }}>
                                <ChevronLeft size={16} /> Prev
                            </button>
                            {currentIdx < questions.length - 1 ? (
                                <button onClick={() => setCurrentIdx(prev => prev + 1)}
                                    className="btn btn-secondary" style={{ width: 'auto', padding: '10px 18px' }}>
                                    Next <ChevronRight size={16} />
                                </button>
                            ) : (
                                <button onClick={handleSubmit} className="btn btn-primary"
                                    style={{ width: 'auto', padding: '12px 28px', background: 'linear-gradient(135deg, #10b981, #047857)' }}>
                                    <CheckCircle2 size={16} /> Submit
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Render: Result ───────────────────────────────────────────────────────

    if (phase === 'result' && result) {
        const pct = parseFloat(result.percentage);
        const scoreColor = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';

        return (
            <div style={{ padding: '30px 20px', maxWidth: '1000px', margin: '0 auto' }} className="fade-in">
                {/* Score card */}
                <div className="glass-card-wide" style={{ textAlign: 'center', padding: '48px 30px', marginBottom: '28px' }}>
                    <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: `${scoreColor}18`, border: `3px solid ${scoreColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <Trophy size={34} color={scoreColor} />
                    </div>
                    <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.8rem', marginBottom: '6px' }}>
                        {pct >= 80 ? '🎉 Excellent!' : pct >= 50 ? '👍 Good effort!' : '💪 Keep practicing!'}
                    </h2>
                    <p style={{ opacity: 0.6, marginBottom: '30px' }}>
                        {selectedMode?.label} · {selectedLang} · {selectedTopic}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', marginBottom: '30px' }}>
                        <div>
                            <div style={{ fontSize: '2.8rem', fontWeight: '800', fontFamily: 'Space Grotesk', color: scoreColor }}>
                                {result.totalScore}
                            </div>
                            <div style={{ opacity: 0.4, fontSize: '0.85rem' }}>/ {result.totalMarks} Correct</div>
                        </div>
                        <div style={{ width: '1px', background: 'var(--border)' }} />
                        <div>
                            <div style={{ fontSize: '2.8rem', fontWeight: '800', fontFamily: 'Space Grotesk', color: '#4facfe' }}>
                                {pct}%
                            </div>
                            <div style={{ opacity: 0.4, fontSize: '0.85rem' }}>Accuracy</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button onClick={() => navigate('/student/dashboard')} className="btn btn-secondary" style={{ width: 'auto', padding: '12px 22px' }}>
                            <Home size={15} /> Dashboard
                        </button>
                        <button onClick={handleRetry} className="btn btn-primary" style={{ width: 'auto', padding: '12px 22px' }}>
                            <RotateCcw size={15} /> Try Again
                        </button>
                    </div>
                </div>

                {/* Question review */}
                <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#4facfe' }}>
                    <Zap size={20} /> Detailed Review
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {questions.map((q, idx) => {
                        const qNo = q.questionNo || idx + 1;
                        const detail = result.detailed?.find(d => d.questionNo === qNo);
                        const isCorrect = detail?.isCorrect ?? false;
                        const mode = MODES.find(m => m.id === q.type);

                        return (
                            <div key={qNo} className="glass-card-wide" style={{
                                padding: '28px',
                                borderLeft: `4px solid ${isCorrect ? '#10b981' : '#ef4444'}`
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '0.78rem', fontWeight: 'bold', opacity: 0.5 }}>Q{qNo} · {q.type}</span>
                                        <span style={{ fontSize: '0.72rem', padding: '2px 8px', background: `${mode?.color || '#667eea'}18`, borderRadius: '4px', color: mode?.color || '#667eea', fontWeight: 'bold' }}>
                                            {q.language || selectedLang}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '700', color: isCorrect ? '#34d399' : '#f87171' }}>
                                        {isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                        {isCorrect ? 'Correct' : 'Incorrect'}
                                    </div>
                                </div>

                                <p style={{ fontSize: '0.97rem', fontWeight: '600', marginBottom: '16px', lineHeight: '1.5' }}>
                                    {q.instruction || q.text}
                                </p>

                                {/* Code review */}
                                {q.type === 'CodeFill' && q.code && (
                                    <CodeWithBlanks
                                        code={q.code}
                                        blanks={q.blanks || []}
                                        userBlanks={blankAnswers[qNo] || []}
                                        submitted={true}
                                        correctBlanks={q.blanks || []}
                                    />
                                )}
                                {q.type === 'Debugging' && (q.buggyCode || q.code) && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 'bold', marginBottom: '6px' }}>❌ Buggy Code</div>
                                            <CodeBlock code={q.buggyCode || q.code} highlightLine={q.bugLine} />
                                        </div>
                                        {q.fixedCode && (
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold', marginBottom: '6px' }}>✅ Fixed Code</div>
                                                <CodeBlock code={q.fixedCode} />
                                            </div>
                                        )}
                                    </div>
                                )}
                                {(q.type === 'TraceOutput' || q.type === 'ConceptMCQ') && q.code && (
                                    <div style={{ marginBottom: '12px' }}>
                                        <CodeBlock code={q.code} />
                                    </div>
                                )}

                                {/* Options review */}
                                {q.type !== 'CodeFill' && q.options && q.options.length > 0 && (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                                        {q.options.map(opt => {
                                            const studentPick = answers[qNo] === opt.id;
                                            const isRight = opt.id === (detail?.correctAnswer || q.correctOption);
                                            return (
                                                <div key={opt.id} style={{
                                                    padding: '10px 14px',
                                                    borderRadius: '8px',
                                                    border: `1px solid ${isRight ? '#10b981' : studentPick && !isCorrect ? '#ef4444' : 'rgba(255,255,255,0.06)'}`,
                                                    background: isRight ? 'rgba(16,185,129,0.1)' : studentPick && !isCorrect ? 'rgba(239,68,68,0.08)' : 'rgba(0,0,0,0.1)',
                                                    fontSize: '0.85rem',
                                                }}>
                                                    <span style={{ fontWeight: 'bold', marginRight: '4px' }}>{opt.id}.</span> {opt.text}
                                                    {isRight && <span style={{ color: '#10b981', fontWeight: 'bold', marginLeft: '6px', fontSize: '0.75rem' }}>✓</span>}
                                                    {studentPick && !isRight && <span style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '6px', fontSize: '0.75rem' }}>✗</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Explanation */}
                                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px 18px' }}>
                                    <p style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#4facfe', marginBottom: '4px' }}>
                                        💡 Explanation {detail?.correctAnswer ? `(Correct: Option ${detail.correctAnswer})` : ''}
                                    </p>
                                    <p style={{ fontSize: '0.85rem', opacity: 0.7, lineHeight: '1.5' }}>
                                        {detail?.explanation || q.explanation || 'Review the topic for more detail.'}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return null;
};

export default CodingPractice;
