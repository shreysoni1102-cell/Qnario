import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { syllabusAPI } from '../services/api';
import { 
    ArrowLeft, Download, Edit3, Trash2, Save, HelpCircle, 
    Calendar, Award, Clock, FileText, Settings, BookOpen, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { jsPDF } from 'jspdf';

const PaperPreview = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [paper, setPaper] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Editing states
    const [editingIndex, setEditingIndex] = useState(null);
    const [editingText, setEditingText] = useState('');
    const [editingOptions, setEditingOptions] = useState([]);
    const [editingExplanation, setEditingExplanation] = useState('');

    useEffect(() => {
        if (id) {
            fetchPaperDetails();
        }
    }, [id]);

    const fetchPaperDetails = async () => {
        try {
            const res = await syllabusAPI.getPaperById(id);
            if (res.data.success) {
                setPaper(res.data.paper);
            } else {
                setErrorMsg('Failed to find paper record.');
            }
        } catch (e) {
            setErrorMsg(e.response?.data?.error || 'Failed to retrieve generated paper.');
        } finally {
            setLoading(false);
        }
    };

    const handleStartEdit = (idx, q) => {
        setEditingIndex(idx);
        setEditingText(q.text);
        setEditingOptions(q.options || []);
        setEditingExplanation(q.answer?.explanation || q.explanation || '');
    };

    const handleOptionTextChange = (optIdx, newText) => {
        const updated = [...editingOptions];
        updated[optIdx] = { ...updated[optIdx], text: newText };
        setEditingOptions(updated);
    };

    const handleSaveEdit = async (qNo) => {
        setErrorMsg('');
        try {
            const payload = {
                text: editingText,
                options: editingOptions,
                explanation: editingExplanation,
                answer: {
                    ...paper.questions[editingIndex].answer,
                    explanation: editingExplanation
                }
            };
            const res = await syllabusAPI.updateQuestion(id, qNo, payload);
            if (res.data.success) {
                const updatedQuestions = [...paper.questions];
                updatedQuestions[editingIndex] = {
                    ...updatedQuestions[editingIndex],
                    text: editingText,
                    options: editingOptions,
                    explanation: editingExplanation,
                    answer: {
                        ...updatedQuestions[editingIndex].answer,
                        explanation: editingExplanation
                    }
                };
                setPaper({ ...paper, questions: updatedQuestions });
                setEditingIndex(null);
                setSuccessMsg('Question manual corrections saved successfully!');
                setTimeout(() => setSuccessMsg(''), 3000);
            }
        } catch (e) {
            setErrorMsg('Failed to save manual edits to the database.');
        }
    };

    const handleRemoveQuestion = async (idx) => {
        const updatedQuestions = [...paper.questions];
        updatedQuestions.splice(idx, 1);
        
        // Re-number
        const renumbered = updatedQuestions.map((q, i) => ({
            ...q,
            questionNo: i + 1
        }));

        setPaper({ ...paper, questions: renumbered });
        setSuccessMsg('Question deleted locally.');
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const downloadPDF = () => {
        if (!paper) return;

        const doc = new jsPDF({ unit: 'pt', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const marginL = 40;
        const marginR = 40;
        const maxTextW = pageW - marginL - marginR; // ~515pt on A4
        let y = 50;

        const checkPage = (needed = 20) => {
            if (y + needed > 800) { doc.addPage(); y = 50; }
        };

        // ── Header ──────────────────────────────────────────
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        const titleLines = doc.splitTextToSize(`${paper.subject} Exam Paper`, maxTextW);
        doc.text(titleLines, marginL, y);
        y += titleLines.length * 24;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Class/Grade: ${paper.className || 'General'}   |   Date: ${new Date(paper.createdAt).toLocaleDateString()}`, marginL, y);
        y += 14;
        doc.text(`Duration: ${paper.duration || 180} Mins   |   Difficulty: ${paper.difficulty || 'Mix'}   |   Total Marks: ${paper.totalMarks || 100}`, marginL, y);
        y += 20;

        doc.setLineWidth(0.8);
        doc.setDrawColor(180, 180, 180);
        doc.line(marginL, y, pageW - marginR, y);
        y += 22;

        // ── Questions ────────────────────────────────────────
        paper.questions.forEach((q, idx) => {
            // Question text (bold, wrapped)
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            const qText = `${idx + 1}. ${q.text}`;
            const qLines = doc.splitTextToSize(qText, maxTextW);
            checkPage(qLines.length * 14 + 10);
            doc.text(qLines, marginL, y);
            y += qLines.length * 14 + 4;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10.5);

            // MCQ options (wrapped)
            if (q.type === 'MCQ' && Array.isArray(q.options)) {
                q.options.forEach((opt, i) => {
                    const label = opt.id || String.fromCharCode(65 + i);
                    const optText = `   ${label}. ${opt.text || opt}`;
                    const optLines = doc.splitTextToSize(optText, maxTextW - 20);
                    checkPage(optLines.length * 13 + 4);
                    doc.text(optLines, marginL + 10, y);
                    y += optLines.length * 13;
                });
            }

            // Answer line for descriptive questions
            if (['Descriptive', 'Short Answer', 'Long Answer'].includes(q.type)) {
                checkPage(36);
                doc.setDrawColor(160, 160, 160);
                doc.line(marginL + 10, y + 8, pageW - marginR, y + 8);
                y += 20;
                if (q.type === 'Long Answer') {
                    doc.line(marginL + 10, y + 8, pageW - marginR, y + 8);
                    y += 20;
                }
            }

            y += 12; // gap between questions
        });

        const filename = `${paper.subject}_Paper_${paper.id || id}.pdf`;
        doc.save(filename);
        setSuccessMsg('✅ PDF downloaded successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const downloadDOCX = () => {
        if (!paper) return;

        // Build a Word-compatible HTML document (opens perfectly in MS Word / LibreOffice)
        const dateStr = new Date(paper.createdAt).toLocaleDateString();
        const questions = paper.questions || [];

        let questionsHTML = '';
        questions.forEach((q, idx) => {
            questionsHTML += `
                <p style="margin-top:14pt; margin-bottom:4pt;">
                    <b>${idx + 1}. ${escapeHtml(q.text)}</b>
                    <span style="font-size:9pt; color:#555;"> [${q.marks || 1} mark${(q.marks || 1) > 1 ? 's' : ''}]</span>
                </p>`;

            if (q.type === 'MCQ' && Array.isArray(q.options)) {
                q.options.forEach(opt => {
                    const label = opt.id || '?';
                    questionsHTML += `<p style="margin:2pt 0 2pt 24pt;">${escapeHtml(label)}. ${escapeHtml(opt.text || opt)}</p>`;
                });
            }

            if (['Descriptive', 'Short Answer', 'Long Answer'].includes(q.type)) {
                questionsHTML += `<p style="margin:6pt 0; color:#888;">Answer: ___________________________________________________________</p>`;
                if (q.type === 'Long Answer') {
                    questionsHTML += `<p style="margin:2pt 0; color:#888;">___________________________________________________________</p>`;
                }
            }
        });

        const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; margin: 72pt; color: #111; }
  h1 { font-size: 18pt; margin-bottom: 6pt; }
  .meta { font-size: 10pt; color: #333; margin-bottom: 4pt; }
  hr { border: none; border-top: 1px solid #aaa; margin: 16pt 0; }
</style>
</head>
<body>
  <h1>${escapeHtml(paper.subject)} Exam Paper</h1>
  <p class="meta">Class/Grade: ${escapeHtml(paper.className || 'General')} &nbsp;|&nbsp; Date: ${dateStr}</p>
  <p class="meta">Duration: ${paper.duration || 180} Mins &nbsp;|&nbsp; Difficulty: ${escapeHtml(paper.difficulty || 'Mix')} &nbsp;|&nbsp; Total Marks: ${paper.totalMarks || 100}</p>
  <hr/>
  ${questionsHTML}
</body>
</html>`;

        const blob = new Blob([html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${paper.subject}_Paper_${paper.id || id}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setSuccessMsg('✅ Word document downloaded successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const escapeHtml = (str) => {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    };

    if (loading) {
        return (
            <div className="main-wrapper">
                <p style={{ fontSize: '1.2rem', opacity: 0.8 }} className="fade-in">Loading exam paper layout details...</p>
            </div>
        );
    }

    if (errorMsg && !paper) {
        return (
            <div style={{ padding: '30px 20px', maxWidth: '800px', margin: '0 auto', textAlign: 'center', minHeight: '100vh' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '20px', borderRadius: '12px', color: '#fca5a5', marginBottom: '20px' }}>
                    <AlertTriangle size={32} style={{ margin: '0 auto 10px' }} />
                    <p>{errorMsg}</p>
                </div>
                <button onClick={() => navigate('/teacher/dashboard')} className="btn btn-secondary">
                    ← Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div style={{ padding: '30px 20px', maxWidth: '1000px', margin: '0 auto', minHeight: '100vh', color: '#fff' }}>
            
            {/* Header / Nav area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
                <div>
                    <button 
                        onClick={() => navigate('/teacher/dashboard')}
                        style={{
                            background: 'transparent', border: 'none', color: '#4facfe', cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem',
                            fontWeight: '700', marginBottom: '8px'
                        }}
                    >
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>
                    <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.8rem', fontWeight: '800' }}>
                        Paper Preview & Edit
                    </h1>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button 
                        onClick={downloadPDF}
                        className="btn btn-primary"
                        style={{ width: 'auto', padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem' }}
                    >
                        <Download size={15} /> Download PDF
                    </button>
                    <button 
                        onClick={downloadDOCX}
                        style={{ 
                            width: 'auto', padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: '8px',
                            background: 'rgba(79, 172, 254, 0.12)', border: '1px solid rgba(79, 172, 254, 0.35)',
                            color: '#4facfe', borderRadius: '12px', cursor: 'pointer', fontWeight: '700',
                            fontSize: '0.88rem', transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,172,254,0.22)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(79,172,254,0.12)'}
                    >
                        <FileText size={15} /> Download Word
                    </button>
                </div>
            </div>

            {/* Notifications */}
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

            {paper && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    
                    {/* Paper metadata overview */}
                    <div style={{ 
                        background: 'rgba(255, 255, 255, 0.03)', 
                        backdropFilter: 'blur(20px)', 
                        border: '1px solid rgba(255, 255, 255, 0.08)', 
                        borderRadius: '20px', 
                        padding: '24px' 
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                            <span style={{ fontSize: '0.72rem', padding: '4px 10px', background: 'rgba(102, 126, 234, 0.15)', color: '#c4b5fd', borderRadius: '4px', fontWeight: 'bold' }}>
                                {paper.paperType || 'Standard Exam'}
                            </span>
                            <span style={{ opacity: 0.5, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Calendar size={14} /> Created: {new Date(paper.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.4rem', fontWeight: '800', color: '#4facfe', marginBottom: '16px' }}>
                            {paper.subject} ({paper.className || 'General'})
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Award size={16} style={{ color: '#a78bfa' }} />
                                <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Total Marks: <strong>{paper.totalMarks || 100}</strong></span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Clock size={16} style={{ color: '#a78bfa' }} />
                                <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Duration: <strong>{paper.duration || 180} mins</strong></span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Settings size={16} style={{ color: '#a78bfa' }} />
                                <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Difficulty: <strong>{paper.difficulty || 'Mix'}</strong></span>
                            </div>
                        </div>
                    </div>

                    {/* Question items list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {paper.questions.map((q, idx) => {
                            const correctOptionVal = (q.correctAnswer || q.answer?.correctOption || '').toString().toUpperCase().charAt(0);
                            
                            return (
                                <div 
                                    key={q.questionNo} 
                                    style={{ 
                                        background: 'rgba(255, 255, 255, 0.03)', 
                                        border: '1px solid rgba(255, 255, 255, 0.08)', 
                                        borderRadius: '16px', 
                                        padding: '24px' 
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '0.72rem', padding: '3px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontWeight: 'bold', color: 'rgba(255,255,255,0.6)' }}>
                                                {q.section || `Question ${q.questionNo}`}
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
                                        <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>
                                            {q.marks || 1} mark{(q.marks || 1) > 1 ? 's' : ''}
                                        </span>
                                    </div>

                                    {editingIndex === idx ? (
                                        /* Edit view details */
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.6)' }}>QUESTION TEXT</label>
                                                <textarea
                                                    style={{ 
                                                        width: '100%', padding: '12px 16px', borderRadius: '10px', 
                                                        border: '1px solid rgba(255,255,255,0.2)', 
                                                        background: 'rgba(255,255,255,0.05)', color: '#fff', 
                                                        fontSize: '0.95rem', outline: 'none', resize: 'vertical' 
                                                    }}
                                                    rows={3}
                                                    value={editingText}
                                                    onChange={(e) => setEditingText(e.target.value)}
                                                />
                                            </div>

                                            {/* MCQ option edits */}
                                            {editingOptions && editingOptions.length > 0 && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.6)' }}>MCQ OPTIONS</label>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                        {editingOptions.map((opt, oIdx) => (
                                                            <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <span style={{ fontWeight: 'bold', color: '#667eea' }}>{opt.id}.</span>
                                                                <input 
                                                                    type="text" 
                                                                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                                                                    value={opt.text}
                                                                    onChange={(e) => handleOptionTextChange(oIdx, e.target.value)}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.6)' }}>EXPLANATION</label>
                                                <textarea
                                                    style={{ 
                                                        width: '100%', padding: '10px 14px', borderRadius: '8px', 
                                                        border: '1px solid rgba(255,255,255,0.12)', 
                                                        background: 'rgba(255,255,255,0.05)', color: '#fff', 
                                                        fontSize: '0.85rem', outline: 'none', resize: 'vertical' 
                                                    }}
                                                    rows={2}
                                                    value={editingExplanation}
                                                    onChange={(e) => setEditingExplanation(e.target.value)}
                                                />
                                            </div>

                                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
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
                                                    Save Corrections <Save size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Static view details */
                                        <div>
                                            <p style={{ fontSize: '1.05rem', fontWeight: '600', lineHeight: '1.5', marginBottom: '16px' }}>
                                                Q{q.questionNo}. {q.text}
                                            </p>

                                            {/* Choice render */}
                                            {q.options && q.options.length > 0 && (
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                                                    {q.options.map(opt => {
                                                        const optId = (opt.id || '').toString().toUpperCase().charAt(0);
                                                        const isCorrect = correctOptionVal && optId === correctOptionVal;
                                                        return (
                                                            <div 
                                                                key={opt.id}
                                                                style={{
                                                                    padding: '10px 14px',
                                                                    background: isCorrect ? 'rgba(16, 185, 129, 0.12)' : 'rgba(0,0,0,0.12)',
                                                                    border: isCorrect ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255,255,255,0.06)',
                                                                    borderRadius: '8px',
                                                                    fontSize: '0.88rem',
                                                                    color: isCorrect ? '#6ee7b7' : 'rgba(255,255,255,0.9)'
                                                                }}
                                                            >
                                                                <span style={{ fontWeight: 'bold', color: isCorrect ? '#10b981' : '#667eea', marginRight: '6px' }}>{opt.id}.</span> {opt.text}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Concept Key */}
                                            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', padding: '14px', borderRadius: '10px', marginBottom: '18px' }}>
                                                <div style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                    <HelpCircle size={14} /> Explanatory Concept Key (Correct Choice: {correctOptionVal || 'N/A'})
                                                </div>
                                                <p style={{ fontSize: '0.82rem', opacity: 0.7, lineHeight: '1.5' }}>
                                                    {q.answer?.explanation || q.explanation || 'No concept explanation cached.'}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '14px', justifyContent: 'flex-end' }}>
                                                <button 
                                                    onClick={() => handleStartEdit(idx, q)}
                                                    style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#4facfe', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                >
                                                    <Edit3 size={12} /> Edit
                                                </button>
                                                <button 
                                                    onClick={() => handleRemoveQuestion(idx)}
                                                    style={{ padding: '6px 14px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                >
                                                    <Trash2 size={12} /> Remove
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaperPreview;
