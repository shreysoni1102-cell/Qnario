const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });
const PORT = process.env.PORT || 3000;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// In-memory exam rooms, synced to file every 5s
function readExamRooms() {
    const file = path.join(__dirname, 'exam-rooms.json');
    if (!fs.existsSync(file)) return {};
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return {}; }
}
function writeExamRooms(rooms) {
    const file = path.join(__dirname, 'exam-rooms.json');
    fs.writeFileSync(file, JSON.stringify(rooms, null, 2), 'utf8');
}
const examRooms = readExamRooms();

// Auto-save exam rooms to persist across server restarts
setInterval(() => {
    writeExamRooms(examRooms);
}, 5000);

// Import all database models
const Subject = require('./models/Subject');
const Exam = require('./models/Exam');
const Topic = require('./models/Topic');
const Question = require('./models/Question');
const StudentAttempt = require('./models/StudentAttempt');
const StudentResult = require('./models/StudentResult');
const ExamSchedule = require('./models/ExamSchedule');
const Analytics = require('./models/Analytics');
const GeneratedQuestion = require('./models/GeneratedQuestion');

// Import routes
const examApi = require('./routes/exam-api');

// Middleware
app.use(cors());
app.use(express.json());
const cookieParser = require('cookie-parser');

// Global Rate Limiter for APIs
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // max 200 requests per IP
    message: { success: false, error: 'Too many requests. Please try again later.' }
});
app.use('/api', limiter);
app.use(cookieParser());
app.use(express.static(__dirname));

// Try connecting to MongoDB, but don't crash server if unavailable
connectDB().catch(err => {
    console.log('Database connection failed (or not running). Server will continue without DB.');
});

// Load database API routes
app.use('/', examApi);
console.log('✅ Database models loaded');
console.log('✅ API routes ready (exam-api)');

// Small helpers to keep original file-based user storage working while DB is optional
function readUsers() {
    const file = path.join(__dirname, 'users.json');
    if (!fs.existsSync(file)) return [];
    const data = fs.readFileSync(file, 'utf8');
    try {
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

function writeUsers(users) {
    const file = path.join(__dirname, 'users.json');
    fs.writeFileSync(file, JSON.stringify(users, null, 2), 'utf8');
}

// Helpers for exams and results (file-based offline storage)
function readExams() {
    const file = path.join(__dirname, 'exams.json');
    if (!fs.existsSync(file)) return [];
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return []; }
}

function writeExams(exams) {
    const file = path.join(__dirname, 'exams.json');
    fs.writeFileSync(file, JSON.stringify(exams, null, 2), 'utf8');
}

function readResults() {
    const file = path.join(__dirname, 'results.json');
    if (!fs.existsSync(file)) return [];
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return []; }
}

function writeResults(results) {
    const file = path.join(__dirname, 'results.json');
    fs.writeFileSync(file, JSON.stringify(results, null, 2), 'utf8');
}

// Use auth routes (JWT-based) - optional; these routes use the database-backed model
try {
    app.use('/api/auth', require('./routes/auth-enhanced'));
} catch (e) {
    console.log('Auth routes not available:', e.message);
}

// Health check - delegates to AI microservice (Groq)
app.get('/api/health', async (req, res) => {
    try {
        const axios = require('axios');
        const microserviceUrl = process.env.AI_MICROSERVICE_URL || 'http://localhost:5000';
        const serviceHealth = await axios.get(`${microserviceUrl}/health`, { timeout: 10000 });
        res.json({
            status: serviceHealth.data?.status || 'unknown',
            provider: 'Groq',
            microservice: serviceHealth.data
        });
    } catch (error) {
        console.error('❌ AI HEALTH ERROR:', error.message);
        res.status(500).json({ status: 'unhealthy', provider: 'Groq', error: error.message });
    }
});

// Legacy, file-based signup/login used by the frontend pages in this repo.
// These endpoints use users.json and will continue to work if MongoDB is not configured.
app.post('/api/signup', async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
        return res.status(400).json({ success: false, error: 'All fields are required.' });
    }

    // Basic email validation (keep same domains as original)
    const allowedDomains = ['@gmail.com', '@hotmail.com', '.edu.in', '@yahoo.com', '@outlook.com'];
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}$/;
    if (!emailPattern.test(email) || !allowedDomains.some(domain => email.endsWith(domain))) {
        return res.status(400).json({ success: false, error: 'Invalid email domain.' });
    }

    const users = readUsers();
    if (users.some(u => u.email === email)) {
        return res.status(400).json({ success: false, error: 'Email already registered.' });
    }

    // Hash password for offline storage
    const hashed = await bcrypt.hash(password, 10);
    users.push({ name, email, password: hashed, role });
    writeUsers(users);
    return res.status(201).json({ success: true, message: 'User registered successfully' });
});

app.post('/api/login', async (req, res) => {
    const { email, password, role } = req.body;
    const users = readUsers();
    const user = users.find(u => u.email === email && u.role === role);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials or not registered as ' + role + '.' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    
    // Generate secure JWT
    const token = jwt.sign(
        { email: user.email, role: user.role, name: user.name },
        process.env.JWT_SECRET || 'xK9#mP2$vL7nQ4wR8jY1uA6tD3sF5hG0',
        { expiresIn: '24h' }
    );

    return res.json({ 
        success: true, 
        token,
        user: { email: user.email, role: user.role, name: user.name } 
    });
});

// JWT Verification Middleware
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        // Fallback to legacy x-user-email for offline/local stability
        const legacyEmail = req.header('x-user-email');
        if (legacyEmail) {
            const users = readUsers();
            const user = users.find(u => u.email === legacyEmail);
            if (user) {
                req.user = { email: user.email, role: user.role, name: user.name };
                return next();
            }
        }
        return res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'xK9#mP2$vL7nQ4wR8jY1uA6tD3sF5hG0');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ success: false, error: 'Invalid or expired token.' });
    }
}

// Simple helper to get user from request headers (offline mode)
function getUserFromHeaders(req) {
    const email = req.header('x-user-email');
    if (!email) return null;
    const users = readUsers();
    return users.find(u => u.email === email) || null;
}

// Require role middleware (online with JWT + offline fallback)
function requireRole(role) {
    return (req, res, next) => {
        verifyToken(req, res, () => {
            if (!req.user || req.user.role !== role) {
                return res.status(403).json({ success: false, error: 'Forbidden: requires ' + role });
            }
            req.offlineUser = req.user; // backward compatibility
            next();
        });
    };
}

// Exams endpoints (file-based)
app.post('/api/exams', requireRole('teacher'), (req, res) => {
    const { title, questions } = req.body;
    if (!title || !Array.isArray(questions)) return res.status(400).json({ error: 'Invalid exam payload' });
    const exams = readExams();
    const id = Date.now().toString();
    exams.push({ id, title, questions, createdBy: req.offlineUser.email, createdAt: new Date() });
    writeExams(exams);
    res.status(201).json({ id, title });
});

app.get('/api/exams', (req, res) => {
    const exams = readExams();
    // Do not expose answers in list
    const safe = exams.map(e => ({ id: e.id, title: e.title, createdBy: e.createdBy }));
    res.json(safe);
});

app.get('/api/exams/:id', (req, res) => {
    const exams = readExams();
    const exam = exams.find(e => e.id === req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    // When returning an exam for taking, strip 'answer' fields from questions
    const publicExam = { id: exam.id, title: exam.title, questions: exam.questions.map(q => ({ id: q.id, text: q.text, options: q.options })) };
    res.json(publicExam);
});

// Submit exam and auto-grade if answers present
app.post('/api/exams/:id/submit', (req, res) => {
    const user = getUserFromHeaders(req);
    if (!user) return res.status(401).json({ error: 'Provide x-user-email header to identify user' });
    const { answers } = req.body; // [{ questionId, answer }]
    const exams = readExams();
    const exam = exams.find(e => e.id === req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    let score = null;
    if (Array.isArray(answers)) {
        let correct = 0;
        for (const a of answers) {
            const q = exam.questions.find(x => x.id === a.questionId);
            if (q && q.answer !== undefined) {
                if (String(a.answer) === String(q.answer)) correct++;
            }
        }
        score = correct;
    }
    const results = readResults();
    const result = { id: Date.now().toString(), examId: exam.id, user: user.email, answers: answers || [], score, submittedAt: new Date() };
    results.push(result);
    writeResults(results);
    res.json({ success: true, resultId: result.id, score });
});

// Quiz endpoints (Teacher creation with code)
app.post('/api/quizzes/create', requireRole('teacher'), (req, res) => {
    const { title, subject, topics, duration, difficulty, questions } = req.body;
    if (!title || !Array.isArray(questions)) return res.status(400).json({ error: 'Invalid payload' });

    const exams = readExams();
    const id = 'quiz_' + Date.now().toString();
    const quizCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    exams.push({
        id, isQuiz: true, quizCode, title, subject, topics,
        duration, difficulty, questions,
        createdBy: req.offlineUser.email, createdAt: new Date()
    });
    writeExams(exams);
    res.status(201).json({ id, quizCode, title });
});

// Quiz join endpoint for students
app.post('/api/quizzes/join', (req, res) => {
    const user = getUserFromHeaders(req);
    if (!user) return res.status(401).json({ error: 'Provide x-user-email header to identify user' });

    const { code } = req.body;
    const exams = readExams();
    const quiz = exams.find(e => e.quizCode === code && e.isQuiz);

    if (!quiz) return res.status(404).json({ error: 'Invalid Quiz Code' });

    const results = readResults();
    if (results.some(r => r.examId === quiz.id && r.user === user.email)) {
        return res.status(400).json({ error: 'You have already attempted this quiz.' });
    }

    res.json({ success: true, quizId: quiz.id });
});

// Submit Quiz and calculate specific analytics
app.post('/api/quizzes/:id/submit', (req, res) => {
    const user = getUserFromHeaders(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { answers } = req.body; // [{ questionId, answer, timeSpent }]
    const exams = readExams();
    const quiz = exams.find(e => e.id === req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    let score = 0;
    const topicStats = {};
    const detailedAnswers = [];

    if (Array.isArray(answers)) {
        for (const a of answers) {
            const q = quiz.questions.find(x => (x.id === a.questionId) || (x._id === a.questionId));
            let isCorrect = false;
            let topic = "General";

            if (q) {
                topic = q.topicName || q.subjectName || "General";
                if (String(a.answer) === String(q.answer?.correctOption || q.answer)) {
                    isCorrect = true;
                    score++;
                }
            }

            if (!topicStats[topic]) topicStats[topic] = { total: 0, correct: 0 };
            topicStats[topic].total++;
            if (isCorrect) topicStats[topic].correct++;

            detailedAnswers.push({
                questionId: a.questionId,
                answer: a.answer,
                isCorrect,
                timeSpent: a.timeSpent || 0,
                topic
            });
        }
    }

    const results = readResults();
    const resultObj = {
        id: 'res_' + Date.now().toString(),
        examId: quiz.id,
        user: user.email,
        score,
        totalQuestions: quiz.questions.length,
        accuracy: (score / quiz.questions.length) * 100,
        topicStats,
        detailedAnswers,
        submittedAt: new Date()
    };

    results.push(resultObj);
    writeResults(results);

    res.json({ success: true, resultId: resultObj.id });
});

app.get('/api/quizzes/result/:id', (req, res) => {
    const results = readResults();
    const result = results.find(r => r.id === req.params.id);
    if (!result) return res.status(404).json({ error: 'Result not found' });
    res.json(result);
});

// Teacher general quiz analytics
app.get('/api/quizzes/analytics', requireRole('teacher'), (req, res) => {
    const exams = readExams().filter(e => e.createdBy === req.offlineUser.email && e.isQuiz);
    const results = readResults();

    let totalAttempts = 0;
    let totalScore = 0;
    let totalPossible = 0;
    let topicStats = {};
    let recentAttempts = [];

    exams.forEach(quiz => {
        const quizResults = results.filter(r => r.examId === quiz.id);
        quizResults.forEach(r => {
            totalAttempts++;
            totalScore += r.score;
            totalPossible += (r.totalQuestions || quiz.questions.length);

            if (r.topicStats) {
                Object.keys(r.topicStats).forEach(topic => {
                    if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0 };
                    topicStats[topic].correct += r.topicStats[topic].correct;
                    topicStats[topic].total += r.topicStats[topic].total;
                });
            }

            recentAttempts.push({
                student: r.user,
                quizTitle: quiz.title,
                score: r.score,
                totalQuestions: r.totalQuestions || quiz.questions.length,
                accuracy: (r.score / (r.totalQuestions || quiz.questions.length)) * 100,
                submittedAt: r.submittedAt || new Date()
            });
        });
    });

    const averageAccuracy = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;

    // Sort topics by accuracy (weakest first)
    const sortedTopics = Object.keys(topicStats).map(t => {
        const acc = (topicStats[t].correct / topicStats[t].total) * 100;
        return { name: t, accuracy: acc, totalAttempts: topicStats[t].total };
    }).sort((a, b) => a.accuracy - b.accuracy);

    recentAttempts.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    res.json({
        totalQuizzes: exams.length,
        totalAttempts,
        averageAccuracy,
        topicPerformance: sortedTopics,
        recentAttempts: recentAttempts.slice(0, 50)
    });
});

// ============================================================
// SYLLABUS UPLOAD & AI SCAN ROUTES
// ============================================================
const multer = require('multer');

// Storage: save uploaded syllabi to /uploads/syllabi/
const syllabusStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'uploads', 'syllabi');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `syllabus_${Date.now()}_${file.originalname}`);
    }
});
const syllabusUpload = multer({
    storage: syllabusStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
    fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Only PDF, JPG, PNG, DOCX files are allowed'));
    }
});

// Helper: read/write syllabi store
function readSyllabi() {
    const file = path.join(__dirname, 'syllabi.json');
    if (!fs.existsSync(file)) return [];
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return []; }
}
function writeSyllabi(data) {
    fs.writeFileSync(path.join(__dirname, 'syllabi.json'), JSON.stringify(data, null, 2));
}

// Helper: read/write generated papers store
function readSyllabusPapers() {
    const file = path.join(__dirname, 'syllabus-papers.json');
    if (!fs.existsSync(file)) return [];
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return []; }
}
function writeSyllabusPapers(data) {
    fs.writeFileSync(path.join(__dirname, 'syllabus-papers.json'), JSON.stringify(data, null, 2));
}

// POST /api/syllabus/upload  — Upload file + call AI microservice to extract topics
app.post('/api/syllabus/upload', syllabusUpload.single('syllabusFile'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

        const { teacherEmail, subject, className } = req.body;
        const filePath = req.file.path;
        const fileName = req.file.originalname;
        const mimeType = req.file.mimetype;

        const axios = require('axios');
        const MICROSERVICE_URL = process.env.AI_MICROSERVICE_URL || 'http://localhost:5000';

        let textContent = '';

        // ── Extract raw text from the uploaded file ──
        if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            // DOCX → use mammoth
            const mammoth = require('mammoth');
            const result = await mammoth.extractRawText({ path: filePath });
            textContent = result.value;
            console.log(`[Syllabus] DOCX extracted ${textContent ? textContent.length : 0} chars`);

        } else if (mimeType === 'application/pdf') {
            // PDF → support both pdf-parse v1 (function) and v2 (PDFParse class)
            try {
                const pdfModule = require('pdf-parse');
                const dataBuffer = fs.readFileSync(filePath);

                if (typeof pdfModule === 'function') {
                    // v1 API: const pdf = require('pdf-parse'); await pdf(buffer)
                    const pdfData = await pdfModule(dataBuffer);
                    textContent = pdfData?.text || '';
                } else if (pdfModule?.PDFParse) {
                    // v2 API: const { PDFParse } = require('pdf-parse'); new PDFParse({ data }).getText()
                    const parser = new pdfModule.PDFParse({ data: dataBuffer });
                    const result = await parser.getText();
                    textContent = result?.text || '';
                    if (typeof parser.destroy === 'function') {
                        await parser.destroy();
                    }
                } else {
                    throw new Error('Unsupported pdf-parse export format');
                }

                console.log(`[Syllabus] PDF extracted ${textContent ? textContent.length : 0} chars`);
                if (!textContent || textContent.trim().length < 50) {
                    return res.status(400).json({ success: false, error: 'The uploaded PDF appears to be empty or contains only scanned images. Please upload a pure text PDF or DOCX file.' });
                }
            } catch (pdfErr) {
                console.error('[Syllabus] pdf-parse failed:', pdfErr.message);
                return res.status(500).json({ success: false, error: 'Failed to parse the PDF file. Please ensure it is a valid text-based PDF.' });
            }

        } else if (mimeType.startsWith('image/')) {
            // Image → convert to base64 and embed in the prompt text
            const imgBase64 = fs.readFileSync(filePath).toString('base64');
            textContent = `[IMAGE SYLLABUS - ${fileName}] Subject: ${subject || 'Unknown'}, Class: ${className || 'N/A'}. This is a scanned syllabus image.`;
            console.log(`[Syllabus] Image file — using filename/metadata for extraction`);

        } else {
            // Plain text or other formats — read directly
            textContent = fs.readFileSync(filePath, 'utf8');
        }

        if (!textContent || textContent.trim().length < 20) {
            return res.status(400).json({ success: false, error: 'Could not extract readable text from the uploaded file. Please try a DOCX or clear PDF.' });
        }

        // ── Extract topics via AI microservice (Groq) ──
        // FIXED: Raised from 8000→15000 so all units of a large syllabus PDF are captured
        console.log(`[Syllabus] Calling AI microservice for topic extraction (${textContent.length} chars)...`);
        const extractResp = await axios.post(`${MICROSERVICE_URL}/api/extract-syllabus`, {
            text: textContent.slice(0, 15000),
            subject: subject || ''
        }, { timeout: 120000 });
        const extracted = extractResp.data?.extracted || {};
        if (!extracted.units) extracted.units = [];
        console.log(`[Syllabus] Extracted ${(extracted.units || []).length} units successfully`);

        // ── Save to syllabi store ──
        const syllabi = readSyllabi();
        const id = 'syl_' + Date.now();
        const record = {
            id, teacherEmail,
            subject: extracted.subject || subject || 'Unknown',
            className, fileName, filePath,
            extractedTopics: extracted.units || [],
            createdAt: new Date()
        };
        syllabi.push(record);
        writeSyllabi(syllabi);
        return res.json({ success: true, syllabusId: id, extracted });

    } catch (err) {
        console.error('[Syllabus Upload Error]', err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/syllabus/list  — Get all syllabi for a teacher
app.get('/api/syllabus/list', (req, res) => {
    const email = req.query.teacherEmail;
    const syllabi = readSyllabi();
    const mine = email ? syllabi.filter(s => s.teacherEmail === email) : syllabi;
    res.json({ success: true, syllabi: mine.map(s => ({ id: s.id, subject: s.subject, className: s.className, fileName: s.fileName, createdAt: s.createdAt, unitCount: s.extractedTopics?.length || 0 })) });
});

// GET /api/syllabus/:id  — Get full syllabus with topics
app.get('/api/syllabus/:id', (req, res) => {
    const syllabi = readSyllabi();
    const s = syllabi.find(x => x.id === req.params.id);
    if (!s) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, syllabus: s });
});

// POST /api/syllabus/:id/generate  — Generate questions from syllabus + paper pattern
app.post('/api/syllabus/:id/generate', async (req, res) => {
    try {
        const syllabi = readSyllabi();
        const syllabus = syllabi.find(x => x.id === req.params.id);
        if (!syllabus) return res.status(404).json({ success: false, error: 'Syllabus not found' });

        const {
            paperType, totalMarks, sections, difficulty,
            language, duration, selectedChapters, bloomsLevel
        } = req.body;

        // Build prompt from syllabus + pattern
        // FIXED: Build a per-unit topic list so we can distribute questions across ALL units
        const allUnits = syllabus.extractedTopics || [];
        const unitTopicLines = allUnits.map(u => ({
            unitName: u.unitName || u.unit || 'Unit',
            lines: (u.chapters || []).flatMap(c => {
                const chapterName = c.chapterName || c.chapter || 'Chapter';
                return (selectedChapters && selectedChapters.length > 0 && !selectedChapters.includes(chapterName))
                    ? []
                    : (c.topics || []).map(t => `${u.unitName || u.unit} > ${chapterName} > ${t}`);
            })
        })).filter(u => u.lines.length > 0);

        // Full flat topic list (used as fallback)
        const topicsList = unitTopicLines.flatMap(u => u.lines).join('\n');
        // FIXED: Raised from 1200→6000 chars so all 5 units fit in the prompt
        const topicsForPrompt = (topicsList || syllabus.subject || 'General').slice(0, 6000);

        const axios = require('axios');
        const microserviceUrl = process.env.AI_MICROSERVICE_URL || 'http://localhost:5000';

        // ── Generate questions PER SECTION ──────────────────────────────────────
        // The frontend sends sections as: [{ name, type, count, marksEach }]
        // We call the microservice once per section so each gets the right type & count.
        const sectionList = Array.isArray(sections) && sections.length > 0
            ? sections
            : [{ name: 'Section A', type: 'MCQ', count: 10, marksEach: 1 }];

        // Map frontend type labels to microservice type strings
        function mapQuestionType(frontendType) {
            const t = (frontendType || 'MCQ').trim();
            if (t === 'MCQ' || t === 'Multiple Choice Question (MCQ)') return 'MCQ';
            if (t === 'Short' || t === 'Short Answer') return 'Short Answer';
            if (t === 'Long' || t === 'Long Answer') return 'Long Answer';
            if (t === 'Fill in Blank') return 'One-word Answer';
            if (t === 'Case Study') return 'Long Answer';
            return t;
        }

        // Helper: build a topic string that cycles through all units proportionally
        // so questions are not all generated from Unit 1 only.
        function buildDistributedTopics(totalCount) {
            if (unitTopicLines.length === 0) return topicsForPrompt;
            // How many units we have
            const numUnits = unitTopicLines.length;
            // Rotate/interleave lines from each unit so the AI sees variety
            const perUnit = Math.ceil(totalCount / numUnits); // lines per unit we want
            const interleaved = [];
            for (let i = 0; i < Math.max(...unitTopicLines.map(u => u.lines.length)); i++) {
                for (const u of unitTopicLines) {
                    if (i < u.lines.length) interleaved.push(u.lines[i]);
                }
            }
            // Return up to 6000 chars of interleaved topics
            return interleaved.join('\n').slice(0, 6000);
        }

        let allQuestions = [];
        let globalQNo = 1;

        for (const section of sectionList) {
            const sectionCount = parseInt(section.count || section.questionCount || section.questions || 0, 10) || 0;
            if (sectionCount < 1) continue;

            const qType = mapQuestionType(section.type);
            const marksEach = parseInt(section.marksEach || section.marks || 1, 10) || 1;

            // Build distributed topic string that covers all units for this section
            const sectionTopics = buildDistributedTopics(sectionCount);

            console.log(`[Generate] Section "${section.name}": ${sectionCount} × ${qType} (${marksEach} mark each), covering ${unitTopicLines.length} unit(s)`);

            try {
                const aiRes = await axios.post(`${microserviceUrl}/api/generate-questions`, {
                    subject: syllabus.subject || 'General',
                    topic: sectionTopics,          // FIXED: distributed across all units
                    difficulty: difficulty || 'Medium',
                    count: sectionCount,
                    question_type: qType,
                    marks: marksEach
                }, { timeout: 90000 });

                const sectionQs = Array.isArray(aiRes.data?.questions) ? aiRes.data.questions : [];

                // Normalise each question: assign sequential global number, section label, marks
                sectionQs.slice(0, sectionCount).forEach(q => {
                    allQuestions.push({
                        ...q,
                        questionNo: globalQNo++,
                        section: section.name,
                        type: qType,
                        marks: marksEach,
                        // Keep correctAnswer for grading later
                        correctAnswer: q.answer?.correctOption || q.correctAnswer || ''
                    });
                });
            } catch (sectionErr) {
                console.error(`[Generate] Section "${section.name}" failed:`, sectionErr.message);
                // On error, add mock placeholders so the count stays correct
                for (let i = 0; i < sectionCount; i++) {
                    allQuestions.push({
                        questionNo: globalQNo++,
                        section: section.name,
                        type: qType,
                        marks: marksEach,
                        text: `[Error] Could not generate question ${i + 1} for ${section.name}. Please regenerate.`,
                        options: [],
                        correctAnswer: ''
                    });
                }
            }
        }

        const questions = allQuestions;
        console.log(`[Generate] Total questions generated: ${questions.length}`);

        // Save paper
        const papers = readSyllabusPapers();
        const paperId = 'spaper_' + Date.now();
        const paper = {
            id: paperId, syllabusId: syllabus.id,
            subject: syllabus.subject, className: syllabus.className,
            teacherEmail: syllabus.teacherEmail,
            paperType, totalMarks, difficulty, language, duration,
            questions, status: 'draft', createdAt: new Date()
        };
        papers.push(paper);
        writeSyllabusPapers(papers);

        res.json({ success: true, paperId, questions, count: questions.length });

    } catch (err) {
        console.error('[Generate from Syllabus Error]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/syllabus-papers — Get all syllabus-generated papers
app.get('/api/syllabus-papers', (req, res) => {
    const email = req.query.teacherEmail;
    let papers = readSyllabusPapers();
    if (email) {
        papers = papers.filter(p => p.teacherEmail === email);
    }
    // Return basic metadata, exclude heavy questions payload for list view
    const paperList = papers.map(p => ({
        id: p.id,
        syllabusId: p.syllabusId,
        subject: p.subject,
        className: p.className,
        paperType: p.paperType,
        totalMarks: p.totalMarks,
        createdAt: p.createdAt
    }));
    res.json({ success: true, papers: paperList });
});

// GET /api/syllabus-papers/:id — Get a generated paper
app.get('/api/syllabus-papers/:id', (req, res) => {
    const papers = readSyllabusPapers();
    const p = papers.find(x => x.id === req.params.id);
    if (!p) return res.status(404).json({ success: false, error: 'Paper not found' });
    res.json({ success: true, paper: p });
});

// PATCH /api/syllabus-papers/:id/question/:qNo — Edit a single question
app.patch('/api/syllabus-papers/:id/question/:qNo', (req, res) => {
    const papers = readSyllabusPapers();
    const p = papers.find(x => x.id === req.params.id);
    if (!p) return res.status(404).json({ success: false, error: 'Paper not found' });
    const q = p.questions.find(x => String(x.questionNo) === req.params.qNo);
    if (!q) return res.status(404).json({ success: false, error: 'Question not found' });
    Object.assign(q, req.body);
    writeSyllabusPapers(papers);
    res.json({ success: true });
});

// ============================================================
// EXAM ROOM REST APIS (Phase 2)
// ============================================================

// POST /api/exam-room/create  — Teacher creates a live exam room
app.post('/api/exam-room/create', verifyToken, (req, res) => {
    const { paperId, teacherEmail, duration } = req.body;
    if (!paperId || !teacherEmail) return res.status(400).json({ success: false, error: 'paperId and teacherEmail required' });
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    examRooms[code] = {
        paperId, teacherEmail,
        students: {},
        started: false,
        startTime: null,
        duration: duration || 180,
        createdAt: new Date()
    };
    res.json({ success: true, roomCode: code });
});

// GET /api/exam-room/:code  — Get room info (student join check)
app.get('/api/exam-room/:code', (req, res) => {
    const room = examRooms[req.params.code];
    if (!room) return res.status(404).json({ success: false, error: 'Invalid room code' });
    const papers = readSyllabusPapers();
    const paper = papers.find(p => p.id === room.paperId);
    res.json({ success: true, subject: paper?.subject || 'Exam', className: paper?.className || '', duration: room.duration, started: room.started, studentCount: Object.keys(room.students).length });
});

// GET /api/exam-room/:code/paper  — Get full paper for student
app.get('/api/exam-room/:code/paper', (req, res) => {
    const room = examRooms[req.params.code];
    if (!room) return res.status(404).json({ success: false, error: 'Invalid room code' });
    const papers = readSyllabusPapers();
    const paper = papers.find(p => p.id === room.paperId);
    if (!paper) return res.status(404).json({ success: false, error: 'Paper not found' });
    // Strip correct answers before sending to student
    const safePaper = {
        ...paper,
        questions: paper.questions.map(q => ({ ...q, correctAnswer: undefined }))
    };
    res.json({ success: true, paper: safePaper, duration: room.duration });
});

// POST /api/exam-room/:code/submit  — Student submits answers
app.post('/api/exam-room/:code/submit', (req, res) => {
    const room = examRooms[req.params.code];
    if (!room) return res.status(404).json({ success: false, error: 'Invalid room code' });
    const { studentEmail, studentName, answers } = req.body;
    const papers = readSyllabusPapers();
    const paper = papers.find(p => p.id === room.paperId);
    if (!paper) return res.status(500).json({ success: false, error: 'Paper not found' });

    // Grade answers
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
            const ch = q.chapter || 'General';
            if (!chapterStats[ch]) chapterStats[ch] = { correct: 0, total: 0, marks: 0, scored: 0 };
            chapterStats[ch].total++;
            chapterStats[ch].marks += q.marks || 1;
            if (isCorrect) { chapterStats[ch].correct++; chapterStats[ch].scored += q.marks || 1; }
        }
        return { questionNo: a.questionNo, answer: a.answer, isCorrect };
    });

    const resultId = 'sres_' + Date.now();
    const resultObj = { id: resultId, roomCode: req.params.code, paperId: room.paperId, studentEmail, studentName, totalScore, totalMarks, percentage: totalMarks > 0 ? ((totalScore / totalMarks) * 100).toFixed(1) : 0, chapterStats, detailed, submittedAt: new Date() };

    const results = readResults();
    results.push(resultObj);
    writeResults(results);

    // Notify teacher via socket
    io.to('teacher_' + req.params.code).emit('student_submitted', { studentEmail, studentName, totalScore, totalMarks, percentage: resultObj.percentage });

    res.json({ success: true, resultId, totalScore, totalMarks, percentage: resultObj.percentage, chapterStats });
});

// POST /api/practice/submit — Student submits practice exam
app.post('/api/practice/submit', (req, res) => {
    const { paperId, studentEmail, studentName, answers } = req.body;
    const papers = readSyllabusPapers();
    const paper = papers.find(p => p.id === paperId);
    if (!paper) return res.status(500).json({ success: false, error: 'Paper not found' });

    // Grade answers
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
            const ch = q.chapter || 'General';
            if (!chapterStats[ch]) chapterStats[ch] = { correct: 0, total: 0, marks: 0, scored: 0 };
            chapterStats[ch].total++;
            chapterStats[ch].marks += q.marks || 1;
            if (isCorrect) { chapterStats[ch].correct++; chapterStats[ch].scored += q.marks || 1; }
        }
        return { questionNo: a.questionNo, answer: a.answer, isCorrect };
    });

    const resultId = 'sres_prac_' + Date.now();
    const resultObj = { id: resultId, roomCode: 'PRACTICE', paperId, studentEmail, studentName, totalScore, totalMarks, percentage: totalMarks > 0 ? ((totalScore / totalMarks) * 100).toFixed(1) : 0, chapterStats, detailed, submittedAt: new Date() };

    const results = readResults();
    results.push(resultObj);
    writeResults(results);

    res.json({ success: true, resultId, totalScore, totalMarks, percentage: resultObj.percentage });
});

// GET /api/exam-results/:resultId  — Get result card
app.get('/api/exam-results/:resultId', (req, res) => {
    const results = readResults();
    const r = results.find(x => x.id === req.params.resultId);
    if (!r) return res.status(404).json({ success: false, error: 'Result not found' });
    res.json({ success: true, result: r });
});

// GET /api/exam-results/:resultId/insights — Generate and get AI insights
app.get('/api/exam-results/:resultId/insights', async (req, res) => {
    try {
        const results = readResults();
        const r = results.find(x => x.id === req.params.resultId);
        if (!r) return res.status(404).json({ success: false, error: 'Result not found' });

        // Find subject from paper
        const papers = readSyllabusPapers();
        const paper = papers.find(p => p.id === r.paperId);
        const subject = paper ? paper.subject : 'General';

        // Call Python Microservice
        const MICROSERVICE_URL = process.env.AI_MICROSERVICE_URL || 'http://localhost:5000';
        try {
            const axios = require('axios');
            const aiResp = await axios.post(`${MICROSERVICE_URL}/api/generate-insights`, {
                studentName: r.studentName,
                subject: subject,
                chapterStats: r.chapterStats
            });

            if (aiResp.data && aiResp.data.success) {
                return res.json({ success: true, suggestions: aiResp.data.suggestions });
            }
        } catch (e) {
            console.error('Microservice error:', e.message);
            // Fallback string if microservice fails or quota exceeded
            return res.json({
                success: true,
                suggestions: [
                    "We're currently unable to generate personalized AI insights.",
                    "Review the chapters marked 'Needs Work' carefully.",
                    "Practice more questions related to your weak areas."
                ],
                fallback: true
            });
        }

    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// GET /api/exam-room/:code/monitor  — Teacher live dashboard data
app.get('/api/exam-room/:code/monitor', verifyToken, (req, res) => {
    const room = examRooms[req.params.code];
    if (!room) return res.status(404).json({ success: false, error: 'Room not found' });
    const results = readResults();
    const submitted = results.filter(r => r.roomCode === req.params.code);
    res.json({ success: true, room: { ...room, students: room.students }, submitted });
});

// ============================================================
// SOCKET.IO — REAL-TIME EVENTS
// ============================================================
io.on('connection', (socket) => {
    console.log('[Socket] Connected:', socket.id);

    // Teacher joins monitoring room
    socket.on('teacher_join', ({ roomCode }) => {
        socket.join('teacher_' + roomCode);
        console.log('[Socket] Teacher monitoring room:', roomCode);
    });

    // Student joins exam room
    socket.on('student_join', ({ roomCode, studentName, studentEmail }) => {
        const room = examRooms[roomCode];
        if (!room) { socket.emit('error', { message: 'Invalid room code' }); return; }
        socket.join('exam_' + roomCode);
        room.students[socket.id] = { name: studentName, email: studentEmail, progress: 0, answered: 0, status: 'active', joinedAt: new Date() };
        // Notify teacher
        io.to('teacher_' + roomCode).emit('student_joined', { socketId: socket.id, name: studentName, email: studentEmail, count: Object.keys(room.students).length });
        socket.emit('joined_ok', { duration: room.duration, started: room.started, startTime: room.startTime });
        console.log('[Socket] Student joined:', studentName, 'room:', roomCode);
    });

    // Student updates progress (answered N questions)
    socket.on('student_progress', ({ roomCode, answered, total }) => {
        const room = examRooms[roomCode];
        if (room && room.students[socket.id]) {
            room.students[socket.id].answered = answered;
            room.students[socket.id].progress = Math.round((answered / total) * 100);
            io.to('teacher_' + roomCode).emit('progress_update', { socketId: socket.id, name: room.students[socket.id].name, answered, total, progress: room.students[socket.id].progress });
        }
    });

    // Student sends a doubt
    socket.on('student_doubt', ({ roomCode, studentName, message }) => {
        io.to('teacher_' + roomCode).emit('doubt_received', { studentName, message, time: new Date().toLocaleTimeString() });
    });

    // Teacher replies to doubt
    socket.on('teacher_reply', ({ roomCode, message }) => {
        io.to('exam_' + roomCode).emit('teacher_reply', { message, time: new Date().toLocaleTimeString() });
    });

    // Teacher starts exam
    socket.on('start_exam', ({ roomCode }) => {
        const room = examRooms[roomCode];
        if (!room) return;
        room.started = true;
        room.startTime = new Date();
        io.to('exam_' + roomCode).emit('exam_started', { startTime: room.startTime, duration: room.duration });
        io.to('teacher_' + roomCode).emit('exam_started', { startTime: room.startTime });
        console.log('[Socket] Exam started in room:', roomCode);
    });

    // Anomaly alert (tab switch, idle)
    socket.on('anomaly', ({ roomCode, type }) => {
        const room = examRooms[roomCode];
        const name = room?.students[socket.id]?.name || 'Unknown';
        io.to('teacher_' + roomCode).emit('anomaly_alert', { studentName: name, type, time: new Date().toLocaleTimeString() });
    });

    // Disconnect
    socket.on('disconnect', () => {
        // Remove student from all rooms
        for (const code of Object.keys(examRooms)) {
            if (examRooms[code].students[socket.id]) {
                const name = examRooms[code].students[socket.id].name;
                delete examRooms[code].students[socket.id];
                io.to('teacher_' + code).emit('student_left', { socketId: socket.id, name, count: Object.keys(examRooms[code].students).length });
            }
        }
    });
});

// 404 handler - must be last
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Route not found', path: req.path });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('[Server Error]', err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server with Socket.IO
httpServer.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('✅ Socket.IO real-time server active');
    (async () => {
        const open = await import('open');
        open.default(`http://localhost:${PORT}/landing.html`);
    })();
});