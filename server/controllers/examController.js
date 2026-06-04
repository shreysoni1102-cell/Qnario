const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const axios = require('axios');
const mammoth = require('mammoth');
const pdfModule = require('pdf-parse');

const Exam = require('../models/Exam');
const Question = require('../models/Question');
const StudentAttempt = require('../models/StudentAttempt');
const StudentResult = require('../models/StudentResult');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const GeneratedQuestion = require('../models/GeneratedQuestion');
const User = require('../models/User');

// Configuration URL for Python microservice
const AI_MICROSERVICE_URL = process.env.AI_MICROSERVICE_URL || 'http://ai-service:5000';

/**
 * 1. Fetch all active exams.
 */
const getExams = async (req, res) => {
    try {
        const exams = await Exam.find({ isActive: true })
            .select('name code description examDetails subjects');
        return res.json(exams);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

/**
 * 2. Fetch specific exam details.
 */
const getExamById = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.examId).populate('subjects.subjectId');
        if (!exam) return res.status(404).json({ error: 'Exam not found' });
        return res.json(exam);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

/**
 * 3. Fetch subjects for an exam.
 */
const getExamSubjects = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.examId);
        if (!exam) return res.status(404).json({ error: 'Exam not found' });
        const subjects = await Subject.find({
            _id: { $in: exam.subjects.map(s => s.subjectId) }
        }).select('name code description');
        return res.json(subjects);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

/**
 * 4. Get active questions with query parameters.
 */
const getQuestions = async (req, res) => {
    try {
        const { exam, subject, difficulty, topic, limit = 10, skip = 0 } = req.query;
        const filter = { isActive: true };

        if (exam) filter.examName = exam;
        if (subject) filter.subjectName = subject;
        if (difficulty) filter.difficulty = difficulty;
        if (topic) filter.topicName = topic;

        const questions = await Question.find(filter)
            .select('_id text type options difficulty marks topicName subjectName')
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await Question.countDocuments(filter);

        return res.json({
            total,
            count: questions.length,
            questions
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

/**
 * 5. Get a single question with correct answers (post-exam).
 */
const getQuestionById = async (req, res) => {
    try {
        const question = await Question.findById(req.params.questionId);
        if (!question) return res.status(404).json({ error: 'Question not found' });
        return res.json(question);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

/**
 * 6. Get a question preview (stripped answers).
 */
const getQuestionPreview = async (req, res) => {
    try {
        const question = await Question.findById(req.params.questionId)
            .select('-answer.correctOption -answer.explanation -answer.solutionSteps');
        if (!question) return res.status(404).json({ error: 'Question not found' });
        return res.json(question);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

/**
 * 7. Create a new question manually (Teachers/Admins).
 */
const createQuestion = async (req, res) => {
    try {
        const newQuestion = new Question({
            ...req.body,
            createdBy: req.user.userId,
            createdAt: new Date()
        });
        await newQuestion.save();
        return res.status(201).json(newQuestion);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

/**
 * 8. Submit an attempt to a single question.
 */
const submitAttempt = async (req, res) => {
    try {
        const { studentId, examId, questionId, selectedAnswer } = req.body;

        const question = await Question.findById(questionId);
        if (!question) return res.status(404).json({ error: 'Question not found.' });

        const isCorrect = selectedAnswer === question.answer.correctOption;
        let marksObtained = isCorrect ? question.marks : 0;

        // Verify exam negative marking rules
        const exam = await Exam.findById(examId);
        if (exam && !isCorrect && exam.examDetails?.negativeMarking) {
            const percentage = exam.examDetails.negativeMarkPercentage || 0.25;
            marksObtained = -question.marks * percentage;
        }

        const attempt = new StudentAttempt({
            studentId,
            examId,
            questionId,
            questionText: question.text,
            selectedAnswer,
            isCorrect,
            marksObtained,
            startTime: new Date(),
            endTime: new Date()
        });

        await attempt.save();

        // Increment query metrics
        await Question.findByIdAndUpdate(questionId, {
            $inc: {
                totalAttempts: 1,
                correctAttempts: isCorrect ? 1 : 0
            }
        });

        return res.json({
            isCorrect,
            marksObtained,
            correctAnswer: question.answer.correctOption,
            explanation: question.answer.explanation
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

/**
 * 9. Retrieve attempt logs for a student.
 */
const getStudentAttempts = async (req, res) => {
    try {
        const { examId } = req.query;
        const filter = { studentId: req.params.studentId };
        if (examId) filter.examId = examId;

        const attempts = await StudentAttempt.find(filter)
            .populate('questionId', 'text options answer')
            .sort({ createdAt: -1 });

        return res.json(attempts);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

/**
 * 10. Generate full result based on individual attempts.
 */
const generateResult = async (req, res) => {
    try {
        const { studentId, examId } = req.body;

        const attempts = await StudentAttempt.find({ studentId, examId }).populate('questionId');
        if (attempts.length === 0) {
            return res.status(400).json({ error: 'No attempts found for this exam.' });
        }

        let totalMarks = 0;
        let obtainedMarks = 0;
        const subjectPerformance = {};
        const difficultyPerformance = {
            easy: { attempted: 0, correct: 0, accuracy: 0 },
            medium: { attempted: 0, correct: 0, accuracy: 0 },
            hard: { attempted: 0, correct: 0, accuracy: 0 }
        };

        attempts.forEach(attempt => {
            const q = attempt.questionId;
            if (q) {
                totalMarks += q.marks || 1;
                obtainedMarks += attempt.marksObtained;

                // Subject Performance calculations
                const subName = q.subjectName || 'General';
                if (!subjectPerformance[subName]) {
                    subjectPerformance[subName] = {
                        totalQuestions: 0,
                        correctAnswers: 0,
                        wrongAnswers: 0,
                        unattempted: 0,
                        marksObtained: 0
                    };
                }
                subjectPerformance[subName].totalQuestions++;
                if (attempt.isCorrect) {
                    subjectPerformance[subName].correctAnswers++;
                } else {
                    subjectPerformance[subName].wrongAnswers++;
                }
                subjectPerformance[subName].marksObtained += attempt.marksObtained;

                // Difficulty performance calculations
                const diff = (q.difficulty || 'medium').toLowerCase();
                if (difficultyPerformance[diff]) {
                    difficultyPerformance[diff].attempted++;
                    if (attempt.isCorrect) {
                        difficultyPerformance[diff].correct++;
                    }
                }
            }
        });

        // Compute accuracies
        Object.keys(difficultyPerformance).forEach(key => {
            const item = difficultyPerformance[key];
            item.accuracy = item.attempted > 0 ? (item.correct / item.attempted) * 100 : 0;
        });

        const subjectWise = Object.entries(subjectPerformance).map(([name, data]) => ({
            subjectName: name,
            totalQuestions: data.totalQuestions,
            correctAnswers: data.correctAnswers,
            wrongAnswers: data.wrongAnswers,
            unattempted: data.unattempted,
            marksObtained: data.marksObtained,
            successRate: data.totalQuestions > 0 ? (data.correctAnswers / data.totalQuestions) * 100 : 0
        }));

        const result = new StudentResult({
            studentId,
            examId,
            totalMarks,
            marksObtained: obtainedMarks,
            percentage: totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0,
            subjectWisePerformance: subjectWise,
            difficultyWisePerformance: difficultyPerformance,
            status: 'Completed',
            completedAt: new Date()
        });

        await result.save();

        return res.json({
            resultId: result._id,
            marksObtained: obtainedMarks,
            totalMarks,
            percentage: result.percentage,
            subjectPerformance: result.subjectWisePerformance
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

/**
 * 11. Retrieve single exam result.
 */
const getResultById = async (req, res) => {
    try {
        const result = await StudentResult.findById(req.params.resultId);
        if (!result) return res.status(404).json({ error: 'Result not found.' });
        return res.json(result);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

/**
 * 12. Fetch results for a student.
 */
const getStudentResults = async (req, res) => {
    try {
        let studentEmail = req.params.studentId;
        let studentObjId = null;

        if (mongoose.Types.ObjectId.isValid(req.params.studentId)) {
            studentObjId = req.params.studentId;
            const userObj = await User.findById(studentObjId);
            if (userObj) {
                studentEmail = userObj.email;
            }
        } else {
            const userObj = await User.findOne({ email: req.params.studentId });
            if (userObj) {
                studentObjId = userObj._id;
            }
        }

        const dbResults = studentObjId 
            ? await StudentResult.find({ studentId: studentObjId }).sort({ completedAt: -1 })
            : [];

        const fallbackResultsFile = path.join(__dirname, '..', 'results.json');
        const localResults = readLocalData(fallbackResultsFile);
        
        const studentLocalResults = localResults.filter(r => 
            String(r.studentEmail).toLowerCase() === String(studentEmail).toLowerCase()
        ).map(r => ({
            _id: r.id,
            id: r.id,
            studentId: studentObjId,
            studentName: r.studentName,
            examName: r.roomCode === 'PRACTICE' ? 'AI Practice Quiz' : `Live Room: ${r.roomCode}`,
            totalMarks: r.totalMarks,
            marksObtained: r.totalScore,
            percentage: parseFloat(r.percentage) || 0,
            completedAt: r.submittedAt,
            submittedAt: r.submittedAt,
            subjectWisePerformance: Object.entries(r.chapterStats || {}).map(([ch, stat]) => ({
                subjectName: ch,
                totalQuestions: stat.total,
                correctAnswers: stat.correct,
                marksObtained: stat.scored
            }))
        }));

        const allResults = [...dbResults, ...studentLocalResults].sort((a, b) => {
            const dateA = new Date(a.completedAt || a.submittedAt);
            const dateB = new Date(b.completedAt || b.submittedAt);
            return dateB - dateA;
        });

        return res.json(allResults);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

/**
 * 13. Generate practice exams. Supports hybrid pre-existing DB fetching and dynamic FastAPI AI generation!
 */
const getPracticeTest = async (req, res) => {
    try {
        const { exam, subject, difficulty, count = 10, topic, focus } = req.query;
        const filter = { subjectName: subject, isActive: true };

        if (difficulty && difficulty !== 'Mixed') {
            filter.difficulty = difficulty;
        }

        let questions = [];
        
        // 1. Attempt to fetch pre-existing database questions if they exist for the subject
        if (difficulty === 'Mixed') {
            const countNum = parseInt(count);
            const easy = await Question.find({ ...filter, difficulty: 'Easy' }).limit(Math.ceil(countNum * 0.33));
            const medium = await Question.find({ ...filter, difficulty: 'Medium' }).limit(Math.ceil(countNum * 0.33));
            const hard = await Question.find({ ...filter, difficulty: 'Hard' }).limit(Math.ceil(countNum * 0.34));
            questions = [...easy, ...medium, ...hard];
        } else {
            questions = await Question.find(filter).limit(parseInt(count));
        }

        // 2. If there are no questions in the database, automatically generate high-fidelity practice questions using Gemini!
        if (questions.length < parseInt(count)) {
            console.log(`📡 [AI Practice] Found insufficient database questions (${questions.length}/${count}). Generating dynamically via Gemini for subject: "${subject}"...`);
            
            try {
                const response = await axios.post(`${AI_MICROSERVICE_URL}/api/generate-questions`, {
                    subject: subject,
                    topic: topic || 'Comprehensive assessment',
                    difficulty: difficulty || 'Medium',
                    count: parseInt(count),
                    question_type: 'MCQ',
                    marks: 1,
                    level: 'Mixed'
                }, { timeout: 120000 });

                const aiQuestions = Array.isArray(response.data?.questions) ? response.data.questions : [];
                
                if (aiQuestions.length > 0) {
                    questions = aiQuestions.map((q, idx) => ({
                        _id: new mongoose.Types.ObjectId(),
                        text: q.question || q.text || 'Practice Question',
                        options: q.options || [
                            { id: 'A', text: 'Option A' },
                            { id: 'B', text: 'Option B' },
                            { id: 'C', text: 'Option C' },
                            { id: 'D', text: 'Option D' }
                        ],
                        type: 'MCQ',
                        marks: q.marks || 1,
                        chapter: q.chapter || 'General',
                        topic: q.topic || 'General',
                        correctAnswer: q.answer?.correctOption || q.correctAnswer || 'A'
                    }));
                }
            } catch (aiError) {
                console.error('⚠️ [AI Practice Failure] Fallback generation errored out:', aiError.message);
                if (questions.length === 0) {
                    return res.status(500).json({ error: 'Failed to generate practice test questions.' });
                }
            }
        }

        // 3. Compile a temporary syllabus paper draft so the grading engine evaluates it cleanly
        const paperId = 'spaper_prac_' + Date.now();
        const mappedQuestions = questions.map((q, idx) => ({
            questionNo: idx + 1,
            _id: q._id,
            text: q.text,
            options: q.options,
            type: q.type || 'MCQ',
            marks: q.marks || 1,
            correctAnswer: q.correctAnswer || q.answer?.correctOption || 'A'
        }));

        const paperObj = {
            id: paperId,
            syllabusId: 'PRACTICE',
            subject: subject,
            className: 'Practice Class',
            teacherEmail: 'AI@qnario.com',
            paperType: 'Practice Test',
            totalMarks: mappedQuestions.length,
            difficulty: difficulty || 'Medium',
            language: 'English',
            duration: 30,
            questions: mappedQuestions,
            status: 'draft',
            createdAt: new Date()
        };

        const papers = readLocalData(fallbackPapersFile);
        papers.push(paperObj);
        writeLocalData(fallbackPapersFile, papers);

        return res.json({
            testId: Date.now(),
            paperId: paperId,
            totalQuestions: mappedQuestions.length,
            questions: mappedQuestions
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

/**
 * 14. Get student statistics for dashboard visualization.
 */
const getStudentDashboard = async (req, res) => {
    try {
        let studentEmail = req.params.studentId;
        let studentObjId = null;

        if (mongoose.Types.ObjectId.isValid(req.params.studentId)) {
            studentObjId = req.params.studentId;
            const userObj = await User.findById(studentObjId);
            if (userObj) {
                studentEmail = userObj.email;
            }
        } else {
            const userObj = await User.findOne({ email: req.params.studentId });
            if (userObj) {
                studentObjId = userObj._id;
            }
        }

        const dbResults = studentObjId 
            ? await StudentResult.find({ studentId: studentObjId }).sort({ completedAt: -1 })
            : [];

        const fallbackResultsFile = path.join(__dirname, '..', 'results.json');
        const localResults = readLocalData(fallbackResultsFile);
        
        const studentLocalResults = localResults.filter(r => 
            String(r.studentEmail).toLowerCase() === String(studentEmail).toLowerCase()
        ).map(r => ({
            _id: r.id,
            id: r.id,
            studentId: studentObjId,
            studentName: r.studentName,
            examName: r.roomCode === 'PRACTICE' ? 'AI Practice Quiz' : `Live Room: ${r.roomCode}`,
            totalMarks: r.totalMarks,
            marksObtained: r.totalScore,
            percentage: parseFloat(r.percentage) || 0,
            completedAt: r.submittedAt,
            submittedAt: r.submittedAt,
            subjectWisePerformance: Object.entries(r.chapterStats || {}).map(([ch, stat]) => ({
                subjectName: ch,
                totalQuestions: stat.total,
                correctAnswers: stat.correct,
                marksObtained: stat.scored
            }))
        }));

        const allResults = [...dbResults, ...studentLocalResults].sort((a, b) => {
            const dateA = new Date(a.completedAt || a.submittedAt);
            const dateB = new Date(b.completedAt || b.submittedAt);
            return dateB - dateA;
        });

        if (allResults.length === 0) {
            return res.json({
                totalExams: 0,
                averageScore: 0,
                strongSubjects: [],
                weakSubjects: [],
                recentExams: [],
                allSubjects: []
            });
        }

        const totalExams = allResults.length;
        const averageScore = allResults.reduce((sum, r) => sum + r.percentage, 0) / totalExams;

        const subjectStats = {};
        allResults.forEach(result => {
            if (result.subjectWisePerformance && result.subjectWisePerformance.length > 0) {
                result.subjectWisePerformance.forEach(subject => {
                    const subName = subject.subjectName || 'General';
                    if (!subjectStats[subName]) {
                        subjectStats[subName] = { correct: 0, total: 0 };
                    }
                    subjectStats[subName].correct += subject.correctAnswers || 0;
                    subjectStats[subName].total += subject.totalQuestions || 0;
                });
            }
        });

        const accuracies = Object.entries(subjectStats).map(([name, data]) => ({
            subject: name,
            accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0
        })).sort((a, b) => b.accuracy - a.accuracy);

        return res.json({
            totalExams,
            averageScore: Math.round(averageScore * 100) / 100,
            strongSubjects: accuracies.length > 0 ? accuracies.slice(0, 2).map(s => s.subject) : [],
            weakSubjects: accuracies.length > 0 ? accuracies.slice(-2).map(s => s.subject) : [],
            recentExams: allResults.slice(0, 5),
            allSubjects: accuracies
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// ============================================================
// 15. SYLLABUS FILES & GENERATORS STORE
// ============================================================

// Standard Mongoose-backed model collections or local JSON fallbacks if DB not ready
const fallbackSyllabusFile = path.join(__dirname, '..', 'syllabi.json');
const fallbackPapersFile = path.join(__dirname, '..', 'syllabus-papers.json');

const readLocalData = (filePath) => {
    if (!fs.existsSync(filePath)) return [];
    try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch { return []; }
};

const writeLocalData = (filePath, data) => {
    try { fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8'); } catch (e) { console.error('Local FS write error:', e); }
};

/**
 * Upload a syllabus file, parse DOCX/PDF, call Python microservice to extract topics.
 */
const uploadSyllabus = async (req, res) => {
    try {
        const { teacherEmail, subject, className } = req.body;
        
        let textContent = '';
        let fileName = 'AI Generated Syllabus';
        let filePath = 'AI_GENERATED';

        if (req.file) {
            filePath = req.file.path;
            fileName = req.file.originalname;
            const mimeType = req.file.mimetype;

            // DOCX extraction
            if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const result = await mammoth.extractRawText({ path: filePath });
                textContent = result.value;
            } 
            // PDF extraction
            else if (mimeType === 'application/pdf') {
                try {
                    const pdfModule = require('pdf-parse');
                    const dataBuffer = fs.readFileSync(filePath);
                    if (typeof pdfModule === 'function') {
                        const pdfData = await pdfModule(dataBuffer);
                        textContent = pdfData?.text || '';
                    } else if (pdfModule?.PDFParse) {
                        const parser = new pdfModule.PDFParse({ data: dataBuffer });
                        const result = await parser.getText();
                        textContent = result?.text || '';
                        if (typeof parser.destroy === 'function') {
                            await parser.destroy();
                        }
                    }
                } catch (pdfErr) {
                    console.error('PDF extraction failed:', pdfErr);
                }
            } 
            // Image extraction fallback
            else if (mimeType.startsWith('image/')) {
                textContent = `[IMAGE SYLLABUS - ${fileName}] Subject: ${subject || 'Unknown'}, Class: ${className || 'N/A'}. This is a scanned syllabus image.`;
            }
            // Plain text extraction
            else {
                textContent = fs.readFileSync(filePath, 'utf8');
            }
        }

        // If no file uploaded or text extraction yielded almost nothing, use Gemini to generate a syllabus automatically
        if (!textContent || textContent.trim().length < 20) {
            console.log(`🤖 No readable syllabus file text, prompting AI to generate standard syllabus for ${subject} - ${className}`);
            textContent = `Generate a comprehensive academic syllabus for the subject: ${subject || 'General'} and class/grade: ${className || 'Standard'}. List all standard units, chapters, and topics.`;
            if (!req.file) {
                fileName = 'AI Generated Syllabus';
                filePath = 'AI_GENERATED';
            }
        }

        console.log(`📡 Calling FastAPI for topic extraction (${textContent.length} chars)...`);
        const aiResponse = await axios.post(`${AI_MICROSERVICE_URL}/api/extract-syllabus`, {
            text: textContent.slice(0, 15000),
            subject: subject || ''
        }, { timeout: 120000 });

        const extracted = aiResponse.data?.extracted || aiResponse.data?.syllabus || {};
        if (!extracted.units) extracted.units = [];

        // Save locally to store
        const syllabi = readLocalData(fallbackSyllabusFile);
        const id = 'syl_' + Date.now();
        const record = {
            id,
            teacherEmail,
            subject: extracted.subject || subject || 'Unknown',
            className: className || extracted.className || 'N/A',
            fileName,
            filePath,
            extractedTopics: extracted.units || [],
            createdAt: new Date()
        };

        syllabi.push(record);
        writeLocalData(fallbackSyllabusFile, syllabi);

        return res.json({ success: true, syllabusId: id, extracted });
    } catch (error) {
        console.error('Syllabus upload controller failure:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * List uploaded syllabi.
 */
const listSyllabi = (req, res) => {
    try {
        const { teacherEmail } = req.query;
        const syllabi = readLocalData(fallbackSyllabusFile);
        const filtered = teacherEmail ? syllabi.filter(s => s.teacherEmail === teacherEmail) : syllabi;

        return res.json({
            success: true,
            syllabi: filtered.map(s => ({
                id: s.id,
                subject: s.subject,
                className: s.className,
                fileName: s.fileName,
                createdAt: s.createdAt,
                unitCount: s.extractedTopics?.length || 0
            }))
        });
    } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
    }
};

/**
 * Get single syllabus details.
 */
const getSyllabusById = (req, res) => {
    try {
        const syllabi = readLocalData(fallbackSyllabusFile);
        const record = syllabi.find(x => x.id === req.params.id);
        if (!record) return res.status(404).json({ success: false, error: 'Syllabus not found.' });
        return res.json({ success: true, syllabus: record });
    } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
    }
};

/**
 * Generate exam questions from uploaded syllabus using distributed topics per section.
 */
const generateSyllabusPaper = async (req, res) => {
    try {
        const syllabi = readLocalData(fallbackSyllabusFile);
        const syllabus = syllabi.find(x => x.id === req.params.id);
        if (!syllabus) return res.status(404).json({ success: false, error: 'Syllabus not found.' });

        const {
            paperType, totalMarks, sections, difficulty,
            language, duration, selectedChapters, bloomsLevel
        } = req.body;

        const allUnits = syllabus.extractedTopics || [];
        const unitTopicLines = allUnits.map(u => ({
            unitName: u.unitName || u.unit || 'Unit',
            lines: (u.chapters || []).flatMap(c => {
                const chName = c.chapterName || c.chapter || 'Chapter';
                return (selectedChapters && selectedChapters.length > 0 && !selectedChapters.includes(chName))
                    ? []
                    : (c.topics || []).map(t => `${u.unitName || u.unit} > ${chName} > ${t}`);
            })
        })).filter(u => u.lines.length > 0);

        const topicsList = unitTopicLines.flatMap(u => u.lines).join('\n');
        const topicsForPrompt = (topicsList || syllabus.subject || 'General').slice(0, 6000);

        const sectionList = Array.isArray(sections) && sections.length > 0
            ? sections
            : [{ name: 'Section A', type: 'MCQ', count: 5, marksEach: 1 }];

        const mapQuestionType = (type) => {
            const t = (type || 'MCQ').trim();
            if (t === 'MCQ' || t === 'Multiple Choice Question (MCQ)') return 'MCQ';
            if (t === 'Short' || t === 'Short Answer') return 'Short Answer';
            if (t === 'Long' || t === 'Long Answer') return 'Long Answer';
            if (t === 'Fill in Blank') return 'One-word Answer';
            if (t === 'Case Study') return 'Case Study';
            return t;
        };

        const buildDistributedTopics = (countNum) => {
            if (unitTopicLines.length === 0) return topicsForPrompt;
            const interleaved = [];
            const maxLength = Math.max(...unitTopicLines.map(u => u.lines.length));
            for (let i = 0; i < maxLength; i++) {
                for (const u of unitTopicLines) {
                    if (i < u.lines.length) interleaved.push(u.lines[i]);
                }
            }
            return interleaved.join('\n').slice(0, 6000);
        };

        const allQuestions = [];
        let globalQNo = 1;

        for (const section of sectionList) {
            const countVal = parseInt(section.count || section.questionCount || 0, 10) || 0;
            if (countVal < 1) continue;

            const qType = mapQuestionType(section.type);
            const marksEach = parseInt(section.marksEach || 1, 10) || 1;
            const sectionTopics = buildDistributedTopics(countVal);

            console.log(`[Generate] Section "${section.name}": calling microservice for ${countVal} ${qType}...`);

            try {
                const response = await axios.post(`${AI_MICROSERVICE_URL}/api/generate-questions`, {
                    subject: syllabus.subject || 'General',
                    topic: sectionTopics,
                    difficulty: difficulty || 'Medium',
                    count: countVal,
                    question_type: qType,
                    marks: marksEach,
                    level: bloomsLevel || 'Mixed'
                }, { timeout: 90000 });

                const questionsReturned = Array.isArray(response.data?.questions) ? response.data.questions : [];
                questionsReturned.slice(0, countVal).forEach(q => {
                    allQuestions.push({
                        ...q,
                        questionNo: globalQNo++,
                        section: section.name,
                        type: qType,
                        marks: marksEach,
                        correctAnswer: q.answer?.correctOption || q.correctAnswer || ''
                    });
                });
            } catch (err) {
                console.error(`AI question generation failed for section ${section.name}:`, err.message);
                // Fallback placeholder questions
                for (let i = 0; i < countVal; i++) {
                    allQuestions.push({
                        questionNo: globalQNo++,
                        section: section.name,
                        type: qType,
                        marks: marksEach,
                        text: `[Fallback] Could not generate question ${i + 1} for ${section.name}. Please regenerate.`,
                        options: qType === 'MCQ' ? [
                            { id: 'A', text: 'Option A' },
                            { id: 'B', text: 'Option B' },
                            { id: 'C', text: 'Option C' },
                            { id: 'D', text: 'Option D' }
                        ] : [],
                        correctAnswer: 'A'
                    });
                }
            }
        }

        const papers = readLocalData(fallbackPapersFile);
        const paperId = 'spaper_' + Date.now();
        const paper = {
            id: paperId,
            syllabusId: syllabus.id,
            subject: syllabus.subject,
            className: syllabus.className,
            teacherEmail: syllabus.teacherEmail,
            paperType,
            totalMarks,
            difficulty,
            language,
            duration,
            questions: allQuestions,
            status: 'draft',
            createdAt: new Date()
        };

        papers.push(paper);
        writeLocalData(fallbackPapersFile, papers);

        return res.json({ success: true, paperId, questions: allQuestions, count: allQuestions.length });
    } catch (e) {
        console.error('Syllabus generator controller error:', e);
        return res.status(500).json({ success: false, error: e.message });
    }
};

/**
 * List all generated papers.
 */
const listSyllabusPapers = (req, res) => {
    try {
        const { teacherEmail } = req.query;
        const papers = readLocalData(fallbackPapersFile);
        const filtered = teacherEmail ? papers.filter(p => p.teacherEmail === teacherEmail) : papers;

        return res.json({
            success: true,
            papers: filtered.map(p => ({
                id: p.id,
                syllabusId: p.syllabusId,
                subject: p.subject,
                className: p.className,
                paperType: p.paperType,
                totalMarks: p.totalMarks,
                createdAt: p.createdAt
            }))
        });
    } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
    }
};

/**
 * Get single generated paper.
 */
const getSyllabusPaperById = (req, res) => {
    try {
        const papers = readLocalData(fallbackPapersFile);
        const record = papers.find(x => x.id === req.params.id);
        if (!record) return res.status(404).json({ success: false, error: 'Paper not found.' });
        return res.json({ success: true, paper: record });
    } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
    }
};

/**
 * Modify a single question in a generated syllabus paper draft.
 */
const updatePaperQuestion = (req, res) => {
    try {
        const { id, qNo } = req.params;
        const papers = readLocalData(fallbackPapersFile);
        const record = papers.find(x => x.id === id);

        if (!record) return res.status(404).json({ success: false, error: 'Paper not found.' });

        const question = record.questions.find(x => String(x.questionNo) === String(qNo));
        if (!question) return res.status(404).json({ success: false, error: 'Question not found.' });

        Object.assign(question, req.body);
        writeLocalData(fallbackPapersFile, papers);

        return res.json({ success: true, message: 'Question updated successfully.' });
    } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
    }
};

// ============================================================
// 16. LIVE EXAM ROOMS MEMORY STORES (Auto Reconnects / Sockets)
// ============================================================

const examRooms = {};

/**
 * Teacher generates code and registers live proctored exam room.
 */
const createExamRoom = (req, res) => {
    try {
        const { paperId, teacherEmail, duration } = req.body;
        if (!paperId || !teacherEmail) {
            return res.status(400).json({ success: false, error: 'paperId and teacherEmail are required.' });
        }

        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        examRooms[code] = {
            paperId,
            teacherEmail,
            students: {},
            started: false,
            startTime: null,
            duration: duration || 180,
            createdAt: new Date()
        };

        return res.json({ success: true, roomCode: code });
    } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
    }
};

/**
 * Validate room code for Student Joins.
 */
const getExamRoomInfo = (req, res) => {
    try {
        const room = examRooms[req.params.code];
        if (!room) return res.status(404).json({ success: false, error: 'Invalid room code.' });

        const papers = readLocalData(fallbackPapersFile);
        const paper = papers.find(p => p.id === room.paperId);

        return res.json({
            success: true,
            subject: paper?.subject || 'Exam',
            className: paper?.className || '',
            duration: room.duration,
            started: room.started,
            startTime: room.startTime || null,
            studentCount: Object.keys(room.students).length
        });
    } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
    }
};

/**
 * Fetch paper questions stripped of answers for Student views.
 */
const getExamRoomPaper = (req, res) => {
    try {
        const room = examRooms[req.params.code];
        if (!room) return res.status(404).json({ success: false, error: 'Invalid room code.' });

        const papers = readLocalData(fallbackPapersFile);
        const paper = papers.find(p => p.id === room.paperId);
        if (!paper) return res.status(404).json({ success: false, error: 'Paper not found.' });

        // Strip correct answers
        const safeQuestions = paper.questions.map(q => ({
            ...q,
            correctAnswer: undefined,
            answer: undefined
        }));

        return res.json({
            success: true,
            paper: {
                ...paper,
                questions: safeQuestions
            },
            duration: room.duration
        });
    } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
    }
};

/**
 * Submit and auto-grade live proctored exam answers.
 */
const submitExamRoomAnswers = (req, res) => {
    try {
        const { code } = req.params;
        const room = examRooms[code];
        if (!room) return res.status(404).json({ success: false, error: 'Invalid room code.' });

        const { studentEmail, studentName, answers } = req.body;
        const papers = readLocalData(fallbackPapersFile);
        const paper = papers.find(p => p.id === room.paperId);
        if (!paper) return res.status(500).json({ success: false, error: 'Paper not found.' });

        let totalScore = 0;
        let totalMarks = 0;
        const chapterStats = {};

        const detailed = (answers || []).map(a => {
            const q = paper.questions.find(x => String(x.questionNo) === String(a.questionNo));
            let isCorrect = false;
            if (q) {
                totalMarks += q.marks || 1;
                const correctLetter = (q.correctAnswer || '').toUpperCase().charAt(0);
                const studentLetter = (a.answer || '').toUpperCase().charAt(0);
                isCorrect = correctLetter && correctLetter === studentLetter;

                if (isCorrect) totalScore += q.marks || 1;

                const ch = q.chapter || q.section || 'General';
                if (!chapterStats[ch]) {
                    chapterStats[ch] = { correct: 0, total: 0, marks: 0, scored: 0 };
                }
                chapterStats[ch].total++;
                chapterStats[ch].marks += q.marks || 1;
                if (isCorrect) {
                    chapterStats[ch].correct++;
                    chapterStats[ch].scored += q.marks || 1;
                }
            }
            return { questionNo: a.questionNo, answer: a.answer, isCorrect };
        });

        const resultId = 'sres_' + Date.now();
        const percentage = totalMarks > 0 ? ((totalScore / totalMarks) * 100).toFixed(1) : 0;

        const resultObj = {
            id: resultId,
            roomCode: code,
            paperId: room.paperId,
            studentEmail,
            studentName,
            totalScore,
            totalMarks,
            percentage,
            chapterStats,
            detailed,
            submittedAt: new Date()
        };

        // Cache results locally
        const fallbackResults = path.join(__dirname, '..', 'results.json');
        const results = readLocalData(fallbackResults);
        results.push(resultObj);
        writeLocalData(fallbackResults, results);

        // Notify teacher monitors if socket context is bound
        if (global.io) {
            global.io.to('teacher_' + code).emit('student_submitted', {
                studentEmail,
                studentName,
                totalScore,
                totalMarks,
                percentage
            });
        }

        return res.json({ success: true, resultId, totalScore, totalMarks, percentage, chapterStats });
    } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
    }
};

/**
 * Submit and auto-grade practice exams.
 */
const submitPracticeAnswers = (req, res) => {
    try {
        const { paperId, studentEmail, studentName, answers } = req.body;
        const papers = readLocalData(fallbackPapersFile);
        const paper = papers.find(p => p.id === paperId);
        if (!paper) return res.status(404).json({ success: false, error: 'Paper not found.' });

        let totalScore = 0;
        let totalMarks = 0;
        const chapterStats = {};

        const detailed = (answers || []).map(a => {
            const q = paper.questions.find(x => String(x.questionNo) === String(a.questionNo));
            let isCorrect = false;
            if (q) {
                totalMarks += q.marks || 1;
                const correctLetter = (q.correctAnswer || '').toUpperCase().charAt(0);
                const studentLetter = (a.answer || '').toUpperCase().charAt(0);
                isCorrect = correctLetter && correctLetter === studentLetter;

                if (isCorrect) totalScore += q.marks || 1;

                const ch = q.chapter || q.section || 'General';
                if (!chapterStats[ch]) {
                    chapterStats[ch] = { correct: 0, total: 0, marks: 0, scored: 0 };
                }
                chapterStats[ch].total++;
                chapterStats[ch].marks += q.marks || 1;
                if (isCorrect) {
                    chapterStats[ch].correct++;
                    chapterStats[ch].scored += q.marks || 1;
                }
            }
            return { questionNo: a.questionNo, answer: a.answer, isCorrect };
        });

        const resultId = 'sres_prac_' + Date.now();
        const percentage = totalMarks > 0 ? ((totalScore / totalMarks) * 100).toFixed(1) : 0;

        const resultObj = {
            id: resultId,
            roomCode: 'PRACTICE',
            paperId,
            studentEmail,
            studentName,
            totalScore,
            totalMarks,
            percentage,
            chapterStats,
            detailed,
            submittedAt: new Date()
        };

        const fallbackResults = path.join(__dirname, '..', 'results.json');
        const results = readLocalData(fallbackResults);
        results.push(resultObj);
        writeLocalData(fallbackResults, results);

        return res.json({ success: true, resultId, totalScore, totalMarks, percentage });
    } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
    }
};

/**
 * Compiles a list of created exam rooms and all student scores for a given teacher.
 */
const getTeacherRoomsReport = (req, res) => {
    try {
        const { teacherEmail } = req.query;
        if (!teacherEmail) {
            return res.status(400).json({ success: false, error: 'teacherEmail is required.' });
        }

        // Gather all rooms from examRooms memory (which mirrors exam-rooms.json)
        const roomsList = [];
        const papers = readLocalData(fallbackPapersFile);
        const results = readLocalData(path.join(__dirname, '..', 'results.json'));

        for (const [code, room] of Object.entries(examRooms)) {
            // Filter by teacher email
            if (String(room.teacherEmail).toLowerCase() === String(teacherEmail).toLowerCase()) {
                // Find matching paper to get Exam Name
                const paper = papers.find(p => p.id === room.paperId);
                
                // Get all student results for this room code
                const studentSubmissions = results
                    .filter(r => String(r.roomCode).toUpperCase() === String(code).toUpperCase())
                    .map(r => ({
                        id: r.id,
                        studentName: r.studentName,
                        studentEmail: r.studentEmail,
                        totalScore: r.totalScore,
                        totalMarks: r.totalMarks,
                        percentage: r.percentage,
                        submittedAt: r.submittedAt
                    }));

                // Calculate average percentage
                let averageScore = 0;
                if (studentSubmissions.length > 0) {
                    const totalPercentage = studentSubmissions.reduce((sum, s) => sum + parseFloat(s.percentage || 0), 0);
                    averageScore = parseFloat((totalPercentage / studentSubmissions.length).toFixed(1));
                }

                roomsList.push({
                    roomCode: code,
                    paperId: room.paperId,
                    examName: paper ? paper.subject : 'AI Practice / Custom Exam',
                    className: paper ? paper.className : 'General',
                    duration: room.duration,
                    createdAt: room.createdAt,
                    started: room.started,
                    studentCount: studentSubmissions.length,
                    averageScore,
                    results: studentSubmissions
                });
            }
        }

        // Sort by createdAt descending (newest rooms first)
        roomsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return res.json({ success: true, rooms: roomsList });
    } catch (e) {
        console.error('Failed to compile teacher reports:', e);
        return res.status(500).json({ success: false, error: e.message });
    }
};

module.exports = {
    getExams,
    getExamById,
    getExamSubjects,
    getQuestions,
    getQuestionById,
    getQuestionPreview,
    createQuestion,
    submitAttempt,
    getStudentAttempts,
    generateResult,
    getResultById,
    getStudentResults,
    getPracticeTest,
    getStudentDashboard,
    uploadSyllabus,
    listSyllabi,
    getSyllabusById,
    generateSyllabusPaper,
    listSyllabusPapers,
    getSyllabusPaperById,
    updatePaperQuestion,
    createExamRoom,
    getExamRoomInfo,
    getExamRoomPaper,
    submitExamRoomAnswers,
    submitPracticeAnswers,
    getTeacherRoomsReport,
    examRooms // Exporting object ref for WebSocket connection logic to utilize
};
