import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { syllabusAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
    Upload, FileText, Settings, Sparkles, CheckCircle2, 
    ArrowLeft, ArrowRight, Plus, Trash2, Edit3, Save, AlertTriangle,
    BookOpen, Layers, CheckSquare, List, Calendar, HelpCircle, Eye
} from 'lucide-react';

const SyllabusUpload = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // 4-Step Stepper matching legacy flow: 
    // 1 - UPLOAD, 2 - REVIEW (Extracted Syllabus), 3 - PATTERN (Blueprint), 4 - QUESTIONS (Draft list)
    const [step, setStep] = useState(1);
    
    // Step 1: Upload states (optional file, text inputs)
    const [file, setFile] = useState(null);
    const [subjectName, setSubjectName] = useState('');
    const [className, setClassName] = useState('');
    const [syllabusId, setSyllabusId] = useState('');
    const [extractedData, setExtractedData] = useState(null);
    const [isScanning, setIsScanning] = useState(false);

    // Step 2: Syllabus tree states
    const [openUnitIdx, setOpenUnitIdx] = useState(0);
    // selectedTopics: { [unitIndex]: Set<topicString> }
    const [selectedTopics, setSelectedTopics] = useState({});

    // Step 3: Blueprint / Pattern states
    const [paperType, setPaperType] = useState('Mixed');
    const [totalMarks, setTotalMarks] = useState(100);
    const [duration, setDuration] = useState(180);
    const [difficulty, setDifficulty] = useState('Mix');
    const [bloomsLevel, setBloomsLevel] = useState('Mixed');
    const [language, setLanguage] = useState('English');
    const [sections, setSections] = useState([
        { id: 1, name: 'Section A', type: 'MCQ', count: 10, marksEach: 1 },
        { id: 2, name: 'Section B', type: 'Short Answer', count: 5, marksEach: 4 },
        { id: 3, name: 'Section C', type: 'Long Answer', count: 4, marksEach: 15 }
    ]);
    const [selectedChapters, setSelectedChapters] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);

    // Step 4: Draft Paper states
    const [paperId, setPaperId] = useState('');
    const [questions, setQuestions] = useState([]);
    const [editingIndex, setEditingIndex] = useState(null);
    const [editingText, setEditingText] = useState('');

    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
        }
    };

    const handleRemoveFile = (e) => {
        e.stopPropagation();
        setFile(null);
        document.getElementById('syllabus-file-input').value = '';
    };

    // Step 1 submit: Upload and call FastAPI extractor
    const handleUploadSyllabus = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setIsScanning(true);

        const formData = new FormData();
        if (file) {
            formData.append('syllabusFile', file);
        }
        formData.append('teacherEmail', user.email);
        formData.append('subject', subjectName || 'General');
        formData.append('className', className || 'N/A');

        try {
            const res = await syllabusAPI.uploadSyllabus(formData);
            if (res.data.success) {
                setSyllabusId(res.data.syllabusId);
                setExtractedData(res.data.extracted);
                
                // Prefill selected chapters with all extracted ones
                const chapters = (res.data.extracted.units || []).flatMap(u => 
                    (u.chapters || []).map(c => c.chapterName || c.chapter)
                );
                setSelectedChapters(chapters);

                // Prefill selectedTopics: all topics selected for every unit
                const topicsMap = {};
                (res.data.extracted.units || []).forEach((u, ui) => {
                    const allTopics = (u.chapters || []).flatMap(c => c.topics || []);
                    topicsMap[ui] = new Set(allTopics);
                });
                setSelectedTopics(topicsMap);

                setSuccessMsg('Syllabus processed successfully!');
                setStep(2);
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.error || 'Syllabus scan failed. Check backend status.');
        } finally {
            setIsScanning(false);
        }
    };

    const handleAddSection = () => {
        const nextId = sections.length > 0 ? Math.max(...sections.map(s => s.id)) + 1 : 1;
        setSections([
            ...sections,
            { id: nextId, name: `Section ${String.fromCharCode(65 + sections.length)}`, type: 'Short Answer', count: 5, marksEach: 3 }
        ]);
    };

    const handleRemoveSection = (id) => {
        if (sections.length > 1) {
            setSections(sections.filter(s => s.id !== id));
        }
    };

    const handleUpdateSection = (id, key, val) => {
        setSections(sections.map(s => s.id === id ? { ...s, [key]: val } : s));
    };

    const handleToggleChapter = (chName) => {
        setSelectedChapters(prev => 
            prev.includes(chName) ? prev.filter(c => c !== chName) : [...prev, chName]
        );
    };

    const handleSelectAllChapters = () => {
        const allChs = (extractedData?.units || []).flatMap(u => 
            (u.chapters || []).map(c => c.chapterName || c.chapter)
        );
        setSelectedChapters(allChs);
    };

    const handleClearAllChapters = () => {
        setSelectedChapters([]);
    };

    // Per-unit topic selection helpers
    const handleToggleTopic = (unitIdx, topic) => {
        setSelectedTopics(prev => {
            const current = new Set(prev[unitIdx] || []);
            if (current.has(topic)) current.delete(topic);
            else current.add(topic);
            return { ...prev, [unitIdx]: current };
        });
    };

    const handleSelectAllTopicsInUnit = (unitIdx, allTopics, checked) => {
        setSelectedTopics(prev => ({
            ...prev,
            [unitIdx]: checked ? new Set(allTopics) : new Set()
        }));
    };

    const getUnitTopicCount = (unitIdx) => {
        return selectedTopics[unitIdx] ? selectedTopics[unitIdx].size : 0;
    };

    // Step 3 submit: Generate paper from syllabus + pattern
    const handleGeneratePaper = async () => {
        setErrorMsg('');
        if (selectedChapters.length === 0) {
            setErrorMsg('Select at least one chapter to generate questions.');
            return;
        }

        setIsGenerating(true);

        const payload = {
            paperType,
            totalMarks,
            duration,
            difficulty,
            bloomsLevel,
            language,
            sections: sections.map(s => ({ name: s.name, type: s.type, count: s.count, marksEach: s.marksEach })),
            selectedChapters
        };

        try {
            const res = await syllabusAPI.generatePaper(syllabusId, payload);
            if (res.data.success) {
                setPaperId(res.data.paperId);
                setQuestions(res.data.questions);
                setStep(4);
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.error || 'Question generation failed.');
        } finally {
            setIsGenerating(false);
        }
    };

    // Step 4 edit question text
    const handleStartEdit = (idx, text) => {
        setEditingIndex(idx);
        setEditingText(text);
    };

    const handleSaveEdit = async (qNo) => {
        try {
            const res = await syllabusAPI.updateQuestion(paperId, qNo, { text: editingText });
            if (res.data.success) {
                setQuestions(questions.map(q => q.questionNo === qNo ? { ...q, text: editingText } : q));
                setEditingIndex(null);
                setSuccessMsg('Question updated successfully.');
                setTimeout(() => setSuccessMsg(''), 3000);
            }
        } catch (e) {
            setErrorMsg('Failed to update question.');
        }
    };

    const handleRegenQuestion = (idx) => {
        setQuestions(prev => {
            const list = [...prev];
            list.splice(idx, 1);
            // Re-order numbers
            return list.map((q, i) => ({ ...q, questionNo: i + 1 }));
        });
        setSuccessMsg('Question removed. Trigger regenerate all to retrieve new ones.');
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const handleRemoveQuestion = (idx) => {
        setQuestions(prev => {
            const list = [...prev];
            list.splice(idx, 1);
            return list.map((q, i) => ({ ...q, questionNo: i + 1 }));
        });
        setSuccessMsg('Question deleted.');
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const handleFinalise = () => {
        setSuccessMsg('Paper finalised! Saving...');
        setTimeout(() => {
            navigate('/teacher/dashboard');
        }, 1500);
    };

    // Calculate Question Types statistics
    const totalQCount = questions.length;
    const computedTotalMarks = questions.reduce((acc, q) => acc + (q.marks || 0), 0);
    const questionTypesCount = {};
    questions.forEach(q => {
        questionTypesCount[q.type] = (questionTypesCount[q.type] || 0) + 1;
    });

    return (
        <div style={{ padding: '30px 20px', maxWidth: '1100px', margin: '0 auto', minHeight: '100vh', color: '#fff' }}>
            
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
                <div>
                    <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '2rem', fontWeight: '800', background: 'linear-gradient(135deg,#a78bfa,#4facfe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        📄 Syllabus Scanner
                    </h1>
                    <p style={{ opacity: 0.7, fontSize: '0.95rem', marginTop: '4px' }}>
                        Upload your syllabus, let AI scan it, define custom paper blueprint & generate questions instantly.
                    </p>
                </div>
                {!isScanning && !isGenerating && (
                    <button 
                        onClick={() => navigate('/teacher/dashboard')}
                        style={{
                            padding: '10px 18px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: 'white',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            transition: '0.2s'
                        }}
                    >
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>
                )}
            </div>

            {/* Stepper (Steps 1 to 4) */}
            {!isScanning && !isGenerating && (
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    marginBottom: '40px', 
                    background: 'rgba(255, 255, 255, 0.02)', 
                    padding: '16px 24px', 
                    borderRadius: '16px', 
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', opacity: step === 1 ? 1 : 0.6 }}>
                        <div style={{
                            width: '38px', height: '38px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: step === 1 ? 'linear-gradient(135deg,#667eea,#4facfe)' : 'rgba(255,255,255,0.05)',
                            border: step === 1 ? 'none' : '2px solid rgba(255,255,255,0.15)',
                            fontWeight: '700', color: '#fff', fontSize: '0.9rem'
                        }}>1</div>
                        <span style={{ fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.5px' }}>UPLOAD</span>
                    </div>

                    <div style={{ width: '80px', height: '2px', background: step > 1 ? 'linear-gradient(90deg,#10b981,#34d399)' : 'rgba(255,255,255,0.08)', margin: '0 10px', marginBottom: '22px' }} />

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', opacity: step === 2 ? 1 : 0.6 }}>
                        <div style={{
                            width: '38px', height: '38px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: step === 2 ? 'linear-gradient(135deg,#667eea,#4facfe)' : step > 2 ? 'linear-gradient(135deg,#10b981,#34d399)' : 'rgba(255,255,255,0.05)',
                            border: step >= 2 ? 'none' : '2px solid rgba(255,255,255,0.15)',
                            fontWeight: '700', color: '#fff', fontSize: '0.9rem'
                        }}>2</div>
                        <span style={{ fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.5px' }}>REVIEW</span>
                    </div>

                    <div style={{ width: '80px', height: '2px', background: step > 2 ? 'linear-gradient(90deg,#10b981,#34d399)' : 'rgba(255,255,255,0.08)', margin: '0 10px', marginBottom: '22px' }} />

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', opacity: step === 3 ? 1 : 0.6 }}>
                        <div style={{
                            width: '38px', height: '38px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: step === 3 ? 'linear-gradient(135deg,#667eea,#4facfe)' : step > 3 ? 'linear-gradient(135deg,#10b981,#34d399)' : 'rgba(255,255,255,0.05)',
                            border: step >= 3 ? 'none' : '2px solid rgba(255,255,255,0.15)',
                            fontWeight: '700', color: '#fff', fontSize: '0.9rem'
                        }}>3</div>
                        <span style={{ fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.5px' }}>PATTERN</span>
                    </div>

                    <div style={{ width: '80px', height: '2px', background: step > 3 ? 'linear-gradient(90deg,#10b981,#34d399)' : 'rgba(255,255,255,0.08)', margin: '0 10px', marginBottom: '22px' }} />

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', opacity: step === 4 ? 1 : 0.6 }}>
                        <div style={{
                            width: '38px', height: '38px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: step === 4 ? 'linear-gradient(135deg,#667eea,#4facfe)' : 'rgba(255,255,255,0.05)',
                            border: step === 4 ? 'none' : '2px solid rgba(255,255,255,0.15)',
                            fontWeight: '700', color: '#fff', fontSize: '0.9rem'
                        }}>4</div>
                        <span style={{ fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.5px' }}>QUESTIONS</span>
                    </div>
                </div>
            )}

            {/* Notifications Display */}
            {errorMsg && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '14px', borderRadius: '12px', fontSize: '0.85rem', color: '#f87171', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertTriangle size={20} /> {errorMsg}
                </div>
            )}
            {successMsg && (
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '14px', borderRadius: '12px', fontSize: '0.85rem', color: '#34d399', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={20} /> {successMsg}
                </div>
            )}

            {/* ACTIVE AI RUNNING PLOT FOR SCANNING */}
            {isScanning && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', textAlign: 'center' }}>
                    <div style={{ width: '60px', height: '60px', border: '4px solid rgba(102, 126, 234, 0.1)', borderTop: '4px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px' }} />
                    <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.4rem', fontWeight: 'bold' }}>AI is Scanning Your Syllabus...</h3>
                    <p style={{ opacity: 0.6, fontSize: '0.9rem', maxWidth: '400px', margin: '8px auto 0', lineHeight: '1.5' }}>
                        Gemini is parsing the syllabus file, extracting units, chapters, and topics. This can take up to 20 seconds.
                    </p>
                </div>
            )}

            {/* ACTIVE AI RUNNING PLOT FOR QUESTION GENERATION */}
            {isGenerating && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', textAlign: 'center' }}>
                    <div style={{ width: '60px', height: '60px', border: '4px solid rgba(16, 185, 129, 0.1)', borderTop: '4px solid #10b981', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px' }} />
                    <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.4rem', fontWeight: 'bold', color: '#10b981' }}>Generating Questions via Gemini AI...</h3>
                    <p style={{ opacity: 0.6, fontSize: '0.9rem', maxWidth: '450px', margin: '8px auto 0', lineHeight: '1.5' }}>
                        Distributed generator is active, writing standard questions proportional to chosen units. This can take 30–60 seconds.
                    </p>
                </div>
            )}

            {/* STEP 1: UPLOAD WORKSPACE */}
            {!isScanning && !isGenerating && step === 1 && (
                <div style={{ 
                    background: 'rgba(255, 255, 255, 0.03)', 
                    backdropFilter: 'blur(20px)', 
                    border: '1px solid rgba(255, 255, 255, 0.08)', 
                    borderRadius: '20px', 
                    padding: '36px' 
                }} className="fade-in">
                    <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '6px' }}>Upload Your Syllabus</h2>
                    <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.88rem', marginBottom: '24px' }}>
                        Supports PDF, Word Documents (DOCX), or plain text. File is optional — AI will generate fallback topics if left blank.
                    </p>

                    <form onSubmit={handleUploadSyllabus}>
                        
                        {/* Drag & Drop File Zone */}
                        <div style={{
                            border: '2px dashed rgba(102, 126, 234, 0.4)',
                            borderRadius: '16px',
                            padding: '50px 30px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            background: 'rgba(102, 126, 234, 0.03)',
                            transition: 'all 0.3s ease',
                            marginBottom: '30px'
                        }}
                        onClick={() => document.getElementById('syllabus-file-input').click()}
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#667eea'; }}
                        onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.4)'; }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.4)';
                            if (e.dataTransfer.files.length) setFile(e.dataTransfer.files[0]);
                        }}
                        >
                            <input 
                                type="file" 
                                id="syllabus-file-input" 
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                                accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
                            />
                            
                            <div style={{ color: '#667eea', marginBottom: '14px', fontSize: '2.5rem' }}>
                                <Upload size={38} style={{ margin: '0 auto', opacity: 0.8 }} />
                            </div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '6px' }}>
                                {file ? file.name : 'Drag & Drop or Click to Select File'}
                            </h3>
                            <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.82rem' }}>
                                Pure text PDF, Word (DOCX) or Images up to 10MB
                            </p>
                            
                            {file && (
                                <button 
                                    onClick={handleRemoveFile}
                                    style={{
                                        marginTop: '15px',
                                        padding: '5px 12px',
                                        background: 'rgba(239,68,68,0.15)',
                                        border: '1px solid rgba(239,68,68,0.3)',
                                        color: '#fca5a5',
                                        borderRadius: '20px',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem',
                                        fontWeight: '600'
                                    }}
                                >
                                    Remove Selected File
                                </button>
                            )}
                        </div>

                        {/* Metadata input fields (Free text inputs as requested by user) */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.6)', letterSpacing: '0.5px' }}>SUBJECT TITLE</label>
                                <input 
                                    type="text" 
                                    style={{
                                        width: '100%', padding: '12px 16px', borderRadius: '10px',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        background: 'rgba(255, 255, 255, 0.05)', color: '#fff',
                                        fontSize: '0.95rem', outline: 'none'
                                    }}
                                    placeholder="e.g. Physics, Data Structures, English..." 
                                    value={subjectName}
                                    onChange={(e) => setSubjectName(e.target.value)}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.6)', letterSpacing: '0.5px' }}>CLASS / STANDARD / GRADE</label>
                                <input 
                                    type="text" 
                                    style={{
                                        width: '100%', padding: '12px 16px', borderRadius: '10px',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        background: 'rgba(255, 255, 255, 0.05)', color: '#fff',
                                        fontSize: '0.95rem', outline: 'none'
                                    }}
                                    placeholder="e.g. Grade 12, UG Sem 2..." 
                                    value={className}
                                    onChange={(e) => setClassName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
                            <button 
                                type="submit" 
                                style={{
                                    padding: '12px 28px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #667eea, #4facfe)',
                                    color: '#fff',
                                    fontWeight: '700',
                                    fontSize: '0.95rem',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
                                }}
                            >
                                🔍 Scan Syllabus <ArrowRight size={18} />
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* STEP 2: REVIEW EXTRACTED SYLLABUS TREE */}
            {!isScanning && !isGenerating && step === 2 && extractedData && (
                <div style={{ 
                    background: 'rgba(255, 255, 255, 0.03)', 
                    backdropFilter: 'blur(20px)', 
                    border: '1px solid rgba(255, 255, 255, 0.08)', 
                    borderRadius: '20px', 
                    padding: '36px' 
                }} className="fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                        <div>
                            <h2 style={{ fontSize: '1.3rem', fontWeight: '700' }}>Extracted Syllabus</h2>
                            <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.88rem', marginTop: '4px' }}>
                                Confirm the curriculum topics extracted by Gemini AI before setting blueprint details.
                            </p>
                        </div>
                        <span style={{ 
                            padding: '6px 16px', borderRadius: '20px', 
                            background: 'rgba(102, 126, 234, 0.15)', 
                            border: '1px solid rgba(102, 126, 234, 0.35)', 
                            fontSize: '0.82rem', fontWeight: '700', color: '#a78bfa' 
                        }}>
                            {(extractedData.units || []).length} Units Extracted
                        </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', marginBottom: '16px' }}>EXTRACTED TOPICS</div>
                    
                    {/* Interactive Accordion Syllabus tree */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '30px' }}>
                        {(extractedData.units || []).length === 0 ? (
                            <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '30px' }}>
                                No units were detected. Proceed to generate general topics.
                            </p>
                        ) : (
                            (extractedData.units || []).map((u, ui) => {
                                const isOpen = openUnitIdx === ui;
                                return (
                                    <div 
                                        key={ui} 
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.02)',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            borderRadius: '12px',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <div 
                                            onClick={() => setOpenUnitIdx(isOpen ? -1 : ui)}
                                            style={{
                                                padding: '14px 20px',
                                                fontWeight: '700',
                                                fontSize: '1rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                background: isOpen ? 'rgba(102, 126, 234, 0.1)' : 'rgba(255,255,255,0.02)',
                                                borderBottom: isOpen ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Layers size={18} style={{ color: '#4facfe' }} /> {u.unit || u.unitName || `Unit ${ui + 1}`}
                                            </span>
                                            <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {(u.chapters || []).flatMap(c => c.topics || []).length} topics {isOpen ? '▴' : '▾'}
                                            </span>
                                        </div>
                                        
                                        {isOpen && (() => {
                                            const allTopicsInUnit = (u.chapters || []).flatMap(c => c.topics || []);
                                            const selSet = selectedTopics[ui] || new Set();
                                            const allSelected = allTopicsInUnit.length > 0 && allTopicsInUnit.every(t => selSet.has(t));
                                            return (
                                                <div style={{ padding: '16px 20px', background: 'rgba(0,0,0,0.1)' }} className="fade-in">
                                                    {/* Top-left: Select All checkbox */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none', fontSize: '0.82rem', fontWeight: '700', color: 'rgba(255,255,255,0.7)' }}
                                                            onClick={e => e.stopPropagation()}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={allSelected}
                                                                onChange={(e) => { e.stopPropagation(); handleSelectAllTopicsInUnit(ui, allTopicsInUnit, e.target.checked); }}
                                                                style={{ width: '16px', height: '16px', accentColor: '#667eea', cursor: 'pointer' }}
                                                            />
                                                            Select All Topics in this Unit
                                                        </label>
                                                    </div>

                                                    {/* Chapters and their topics */}
                                                    {(u.chapters || []).map((c, ci) => (
                                                        <div 
                                                            key={ci} 
                                                            style={{
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                padding: '12px 14px',
                                                                borderRadius: '8px',
                                                                marginBottom: ci < (u.chapters || []).length - 1 ? '10px' : '0',
                                                                background: 'rgba(255, 255, 255, 0.02)'
                                                            }}
                                                        >
                                                            <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#4facfe', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <BookOpen size={14} /> {c.chapterName || c.chapter}
                                                            </div>
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                                {(c.topics || []).map((t, ti) => {
                                                                    const isTopicSelected = selSet.has(t);
                                                                    return (
                                                                        <span 
                                                                            key={ti}
                                                                            onClick={(e) => { e.stopPropagation(); handleToggleTopic(ui, t); }}
                                                                            style={{
                                                                                padding: '4px 12px',
                                                                                borderRadius: '20px',
                                                                                background: isTopicSelected ? 'rgba(102, 126, 234, 0.25)' : 'rgba(255,255,255,0.04)',
                                                                                border: isTopicSelected ? '1px solid #667eea' : '1px solid rgba(102, 126, 234, 0.2)',
                                                                                fontSize: '0.75rem',
                                                                                color: isTopicSelected ? '#c4b5fd' : 'rgba(255, 255, 255, 0.55)',
                                                                                cursor: 'pointer',
                                                                                userSelect: 'none',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: '5px',
                                                                                transition: 'all 0.18s ease',
                                                                                fontWeight: isTopicSelected ? '600' : '400'
                                                                            }}
                                                                        >
                                                                            {isTopicSelected && <span style={{ fontSize: '0.6rem', color: '#a78bfa' }}>✓</span>}
                                                                            {t}
                                                                        </span>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Bottom-right: selected count */}
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                                        <span style={{
                                                            padding: '4px 14px',
                                                            borderRadius: '20px',
                                                            background: selSet.size > 0 ? 'rgba(102, 126, 234, 0.18)' : 'rgba(255,255,255,0.05)',
                                                            border: selSet.size > 0 ? '1px solid rgba(102, 126, 234, 0.4)' : '1px solid rgba(255,255,255,0.1)',
                                                            fontSize: '0.78rem',
                                                            fontWeight: '700',
                                                            color: selSet.size > 0 ? '#a78bfa' : 'rgba(255,255,255,0.4)'
                                                        }}>
                                                            {selSet.size} / {allTopicsInUnit.length} topics selected
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
                        <button 
                            onClick={() => setStep(1)}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '8px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                color: '#fff',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            ← Re-upload
                        </button>
                        <button 
                            onClick={() => setStep(3)}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #10b981, #34d399)',
                                color: '#fff',
                                fontWeight: '700',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.25)'
                            }}
                        >
                            ✅ Confirm & Set Blueprint →
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 3: PAPER PATTERN / BLUEPRINT SETUP */}
            {!isScanning && !isGenerating && step === 3 && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    
                    {/* General blueprint details */}
                    <div style={{ 
                        background: 'rgba(255, 255, 255, 0.03)', 
                        backdropFilter: 'blur(20px)', 
                        border: '1px solid rgba(255, 255, 255, 0.08)', 
                        borderRadius: '20px', 
                        padding: '30px' 
                    }}>
                        <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.2rem', marginBottom: '20px', color: '#4facfe', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Settings size={20} /> Step 3.1: Exam Paper Blueprint
                        </h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255,255,0.6)' }}>PAPER TYPE</label>
                                <select 
                                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
                                    value={paperType} 
                                    onChange={(e) => setPaperType(e.target.value)}
                                >
                                    <option value="Mixed" style={{ background: '#1a1f3e' }}>Mixed (MCQ + Descriptive)</option>
                                    <option value="MCQ" style={{ background: '#1a1f3e' }}>MCQ Only</option>
                                    <option value="Descriptive" style={{ background: '#1a1f3e' }}>Descriptive Only</option>
                                    <option value="Short" style={{ background: '#1a1f3e' }}>Short Answer Only</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255,255,0.6)' }}>TOTAL MARKS</label>
                                <input 
                                    type="number" 
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
                                    value={totalMarks} 
                                    onChange={(e) => setTotalMarks(parseInt(e.target.value) || 0)} 
                                    required 
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255,255,0.6)' }}>DIFFICULTY</label>
                                <select 
                                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
                                    value={difficulty} 
                                    onChange={(e) => setDifficulty(e.target.value)}
                                >
                                    <option value="Mix" style={{ background: '#1a1f3e' }}>Mix (Easy + Medium + Hard)</option>
                                    <option value="Easy" style={{ background: '#1a1f3e' }}>Easy</option>
                                    <option value="Medium" style={{ background: '#1a1f3e' }}>Medium</option>
                                    <option value="Hard" style={{ background: '#1a1f3e' }}>Hard</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255,255,0.6)' }}>EXAM DURATION (Minutes)</label>
                                <input 
                                    type="number" 
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
                                    value={duration} 
                                    onChange={(e) => setDuration(parseInt(e.target.value) || 0)} 
                                    required 
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255,255,0.6)' }}>BLOOM'S TAXONOMY LEVEL</label>
                                <select 
                                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
                                    value={bloomsLevel} 
                                    onChange={(e) => setBloomsLevel(e.target.value)}
                                >
                                    <option value="Mixed" style={{ background: '#1a1f3e' }}>Mixed (All Levels)</option>
                                    <option value="Remember" style={{ background: '#1a1f3e' }}>Remember</option>
                                    <option value="Understand" style={{ background: '#1a1f3e' }}>Understand</option>
                                    <option value="Apply" style={{ background: '#1a1f3e' }}>Apply</option>
                                    <option value="Analyze" style={{ background: '#1a1f3e' }}>Analyze</option>
                                    <option value="Evaluate" style={{ background: '#1a1f3e' }}>Evaluate</option>
                                    <option value="Create" style={{ background: '#1a1f3e' }}>Create</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255,255,0.6)' }}>LANGUAGE</label>
                                <select 
                                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
                                    value={language} 
                                    onChange={(e) => setLanguage(e.target.value)}
                                >
                                    <option value="English" style={{ background: '#1a1f3e' }}>English</option>
                                    <option value="Hindi" style={{ background: '#1a1f3e' }}>Hindi</option>
                                    <option value="Spanish" style={{ background: '#1a1f3e' }}>Spanish</option>
                                    <option value="French" style={{ background: '#1a1f3e' }}>French</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Chapter filter selection checklist */}
                    {extractedData && (
                        <div style={{ 
                            background: 'rgba(255, 255, 255, 0.03)', 
                            backdropFilter: 'blur(20px)', 
                            border: '1px solid rgba(255, 255, 255, 0.08)', 
                            borderRadius: '20px', 
                            padding: '30px' 
                        }}>
                            <div style={{ display: 'flex', justifyContext: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                                <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.2rem', color: '#4facfe' }}>
                                    Step 3.2: Select Chapters to Include ({selectedChapters.length} Selected)
                                </h3>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button 
                                        onClick={handleSelectAllChapters}
                                        style={{ padding: '5px 12px', borderRadius: '6px', background: 'rgba(102, 126, 234, 0.15)', border: '1px solid rgba(102,126,234,0.3)', color: '#a78bfa', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                                    >
                                        Select All
                                    </button>
                                    <button 
                                        onClick={handleClearAllChapters}
                                        style={{ padding: '5px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                                    >
                                        Clear All
                                    </button>
                                </div>
                            </div>
                            <p style={{ opacity: 0.6, fontSize: '0.85rem', marginBottom: '20px' }}>
                                Check the box next to textbook chapters you wish to generate exam questions from.
                            </p>
                            
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {(extractedData.units || []).flatMap(u => (u.chapters || []).map((c, ci) => {
                                    const chName = c.chapterName || c.chapter;
                                    const isChecked = selectedChapters.includes(chName);
                                    
                                    return (
                                        <div 
                                            key={chName}
                                            onClick={() => handleToggleChapter(chName)}
                                            style={{
                                                padding: '8px 14px',
                                                background: isChecked ? 'rgba(102, 126, 234, 0.15)' : 'rgba(255,255,255,0.03)',
                                                border: isChecked ? '1px solid #667eea' : '1px solid rgba(255,255,255,0.08)',
                                                borderRadius: '20px',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                fontWeight: isChecked ? '600' : '500',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                transition: 'all 0.2s ease',
                                                userSelect: 'none'
                                            }}
                                        >
                                            <input 
                                                type="checkbox" 
                                                checked={isChecked}
                                                onChange={() => {}}
                                                style={{ width: '15px', height: '15px', accentColor: '#667eea', pointerEvents: 'none' }}
                                            />
                                            {chName}
                                        </div>
                                    );
                                }))}
                            </div>
                        </div>
                    )}

                    {/* Section allocation blueprint builder */}
                    <div style={{ 
                        background: 'rgba(255, 255, 255, 0.03)', 
                        backdropFilter: 'blur(20px)', 
                        border: '1px solid rgba(255, 255, 255, 0.08)', 
                        borderRadius: '20px', 
                        padding: '30px' 
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.2rem', color: '#4facfe' }}>
                                Step 3.3: Section Marks Allocation
                            </h3>
                            <button 
                                onClick={handleAddSection}
                                style={{
                                    padding: '6px 12px',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    border: '1px solid rgba(16, 185, 129, 0.4)',
                                    color: '#10b981',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold'
                                }}
                            >
                                <Plus size={14} /> Add Section
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                            {sections.map((sec) => (
                                <div 
                                    key={sec.id}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr auto',
                                        gap: '15px',
                                        alignItems: 'center',
                                        background: 'rgba(0,0,0,0.15)',
                                        padding: '16px',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(255, 255, 255, 0.08)'
                                    }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>SECTION NAME</label>
                                        <input 
                                            type="text" 
                                            style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                                            value={sec.name} 
                                            onChange={(e) => handleUpdateSection(sec.id, 'name', e.target.value)} 
                                            placeholder="Section Name"
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>QUESTION TYPE</label>
                                        <select 
                                            style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                                            value={sec.type}
                                            onChange={(e) => handleUpdateSection(sec.id, 'type', e.target.value)}
                                        >
                                            <option value="MCQ" style={{ background: '#1a1f3e' }}>Multiple Choice (MCQ)</option>
                                            <option value="Short Answer" style={{ background: '#1a1f3e' }}>Short Answer</option>
                                            <option value="Long Answer" style={{ background: '#1a1f3e' }}>Long Answer</option>
                                            <option value="Fill in Blank" style={{ background: '#1a1f3e' }}>One-word Answer</option>
                                            <option value="Case Study" style={{ background: '#1a1f3e' }}>Case Study</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>COUNT</label>
                                        <input 
                                            type="number" 
                                            style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                                            value={sec.count} 
                                            onChange={(e) => handleUpdateSection(sec.id, 'count', parseInt(e.target.value) || 0)} 
                                            placeholder="Count"
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>MARKS EACH</label>
                                        <input 
                                            type="number" 
                                            style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                                            value={sec.marksEach} 
                                            onChange={(e) => handleUpdateSection(sec.id, 'marksEach', parseInt(e.target.value) || 0)} 
                                            placeholder="Marks"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => handleRemoveSection(sec.id)}
                                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px', alignSelf: 'flex-end', marginBottom: '8px' }}
                                        disabled={sections.length <= 1}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
                            <button 
                                onClick={() => setStep(2)}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    color: '#fff',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                ← Re-evaluate Topics
                            </button>
                            <button 
                                onClick={handleGeneratePaper} 
                                style={{
                                    padding: '12px 28px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #667eea, #4facfe)',
                                    color: '#fff',
                                    fontWeight: '700',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
                                }}
                            >
                                Trigger AI Generator Pipeline <Sparkles size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 4: DRAFT PAPER GENERATION REVIEWS & EDIT PANEL */}
            {!isScanning && !isGenerating && step === 4 && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    
                    {/* Draft compilation banner */}
                    <div style={{ 
                        background: 'rgba(16, 185, 129, 0.05)', 
                        border: '1px solid #10b981', 
                        padding: '24px', 
                        borderRadius: '20px',
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '20px'
                    }}>
                        <div>
                            <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.25rem', color: '#10b981', fontWeight: 'bold' }}>
                                Paper Compiled Successfully!
                            </h3>
                            <p style={{ opacity: 0.7, fontSize: '0.85rem', marginTop: '2px' }}>
                                AI compiled all sections. Total questions: {totalQCount}. You can edit or regenerate items.
                            </p>
                        </div>
                        <button 
                            onClick={handleFinalise}
                            style={{ 
                                width: 'auto', 
                                padding: '12px 28px', 
                                background: 'linear-gradient(135deg, #10b981, #047857)',
                                border: 'none',
                                color: 'white',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontWeight: '700',
                                fontSize: '0.9rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)'
                            }}
                        >
                            Complete & Save Draft <CheckCircle2 size={18} />
                        </button>
                    </div>

                    {/* Stats summary bar */}
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1', minWidth: '130px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800', background: 'linear-gradient(135deg,#a78bfa,#4facfe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                {totalQCount}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px', fontWeight: '600' }}>Total Questions</div>
                        </div>
                        <div style={{ flex: '1', minWidth: '130px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800', background: 'linear-gradient(135deg,#a78bfa,#4facfe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                {computedTotalMarks}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px', fontWeight: '600' }}>Total Marks</div>
                        </div>
                        {Object.entries(questionTypesCount).map(([type, count]) => (
                            <div key={type} style={{ flex: '1', minWidth: '130px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#a78bfa' }}>
                                    {count}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px', fontWeight: '600' }}>{type}s</div>
                            </div>
                        ))}
                    </div>

                    {/* Question Card Lists */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {questions.length === 0 ? (
                            <p style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                                No questions are current loaded. Try regenerating.
                            </p>
                        ) : (
                            questions.map((q, idx) => {
                                const diffClass = q.difficulty === 'Easy' ? 'rgba(16,185,129,0.15)' : q.difficulty === 'Hard' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)';
                                const diffColor = q.difficulty === 'Easy' ? '#6ee7b7' : q.difficulty === 'Hard' ? '#fca5a5' : '#fcd34d';
                                const diffBorder = q.difficulty === 'Easy' ? 'rgba(16,185,129,0.25)' : q.difficulty === 'Hard' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)';

                                const correctOptionVal = (q.correctAnswer || q.answer?.correctOption || '').toString().toUpperCase().charAt(0);

                                return (
                                    <div 
                                        key={q.questionNo} 
                                        style={{ 
                                            background: 'rgba(255, 255, 255, 0.03)', 
                                            border: '1px solid rgba(255, 255, 255, 0.08)', 
                                            borderRadius: '16px', 
                                            padding: '28px',
                                            transition: 'all 0.25s ease'
                                        }}
                                    >
                                        {/* Badges metadata bar */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
                                            {q.section && (
                                                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700', background: 'rgba(102,126,234,0.15)', color: '#c4b5fd', border: '1px solid rgba(102,126,234,0.3)' }}>
                                                    📋 {q.section}
                                                </span>
                                            )}
                                            <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700', background: 'rgba(79,172,254,0.12)', color: '#7dd3fc', border: '1px solid rgba(79,172,254,0.3)' }}>
                                                {q.type || 'MCQ'}
                                            </span>
                                            <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700', background: diffClass, color: diffColor, border: '1px solid ' + diffBorder }}>
                                                {q.difficulty || 'Medium'}
                                            </span>
                                            <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.12)' }}>
                                                ⭐ {q.marks || 1} mark{(q.marks || 1) > 1 ? 's' : ''}
                                            </span>
                                            {bloomsLevel !== 'Mixed' && bloomsLevel && (
                                                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700', background: 'rgba(251,191,36,0.12)', color: '#fcd34d', border: '1px solid rgba(251,191,36,0.25)' }}>
                                                    🧠 {bloomsLevel}
                                                </span>
                                            )}
                                        </div>

                                        {editingIndex === idx ? (
                                            /* Active edit block */
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '15px' }}>
                                                <textarea
                                                    style={{ 
                                                        width: '100%', padding: '12px 16px', borderRadius: '10px', 
                                                        border: '1px solid rgba(255,255,255,0.2)', 
                                                        background: 'rgba(255,255,255,0.05)', color: '#fff', 
                                                        fontSize: '0.95rem', outline: 'none', resize: 'vertical' 
                                                    }}
                                                    rows={4}
                                                    value={editingText}
                                                    onChange={(e) => setEditingText(e.target.value)}
                                                />
                                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                                    <button 
                                                        onClick={() => setEditingIndex(null)} 
                                                        style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button 
                                                        onClick={() => handleSaveEdit(q.questionNo)} 
                                                        style={{ padding: '8px 16px', background: 'linear-gradient(135deg,#667eea,#4facfe)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                                    >
                                                        Save <Save size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            /* Static preview block */
                                            <div>
                                                <p style={{ fontSize: '1.05rem', fontWeight: '600', lineHeight: '1.5', marginBottom: '20px' }}>
                                                    Q{q.questionNo}. {q.text}
                                                </p>
                                            </div>
                                        )}

                                        {/* Option choices highlighted green for correct choice */}
                                        {q.options && q.options.length > 0 && (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                                                {q.options.map(opt => {
                                                    const optId = (opt.id || '').toString().toUpperCase().charAt(0);
                                                    const isCorrect = correctOptionVal && optId === correctOptionVal;
                                                    
                                                    return (
                                                        <div 
                                                            key={opt.id}
                                                            style={{
                                                                padding: '12px 16px',
                                                                background: isCorrect ? 'rgba(16, 185, 129, 0.12)' : 'rgba(0,0,0,0.15)',
                                                                border: isCorrect ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255,255,255,0.06)',
                                                                borderRadius: '8px',
                                                                fontSize: '0.88rem',
                                                                color: isCorrect ? '#6ee7b7' : 'rgba(255,255,255,0.9)',
                                                                fontWeight: isCorrect ? '600' : 'normal'
                                                            }}
                                                        >
                                                            <span style={{ fontWeight: 'bold', color: isCorrect ? '#10b981' : '#667eea', marginRight: '6px' }}>{opt.id}.</span> {opt.text}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Concept Explanations */}
                                        <div style={{ 
                                            background: 'rgba(255,255,255,0.02)', 
                                            border: '1px solid rgba(255,255,255,0.06)', 
                                            padding: '16px', 
                                            borderRadius: '10px',
                                            marginBottom: '20px' 
                                        }}>
                                            <div style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                <HelpCircle size={14} /> Explanatory Concept Key (Correct: {correctOptionVal || 'N/A'})
                                            </div>
                                            <p style={{ fontSize: '0.82rem', opacity: 0.75, lineHeight: '1.5' }}>
                                                {q.answer?.explanation || q.explanation || 'No concept explanation cached.'}
                                            </p>
                                        </div>

                                        {/* Action buttons (Edit/Regen/Delete) */}
                                        {editingIndex !== idx && (
                                            <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', justifyContent: 'flex-end' }}>
                                                <button 
                                                    onClick={() => handleStartEdit(idx, q.text)}
                                                    style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#4facfe', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                >
                                                    <Edit3 size={12} /> Edit
                                                </button>
                                                <button 
                                                    onClick={() => handleRegenQuestion(idx)}
                                                    style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#a78bfa', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                >
                                                    🔄 Regenerate
                                                </button>
                                                <button 
                                                    onClick={() => handleRemoveQuestion(idx)}
                                                    style={{ padding: '6px 14px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                >
                                                    <Trash2 size={12} /> Remove
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SyllabusUpload;
