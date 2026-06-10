const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { 
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
    deleteSyllabusPaper,
    deleteExamRoomReport,
    deleteStudentResult
} = require('../controllers/examController');

const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// ==================== MULTER UPLOAD CONFIGURATION ====================

const uploadDir = path.join(__dirname, '..', 'uploads', 'syllabi');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `syllabus_${Date.now()}_${file.originalname}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf', 
            'image/jpeg', 
            'image/png', 
            'image/jpg',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Format rejected. Only PDF, DOCX, and JPG/PNG images are allowed.'));
        }
    }
});

// ==================== EXAM AND SUBJECT PATHS ====================

router.get('/exams', getExams);
router.get('/exams/:examId', getExamById);
router.get('/exams/:examId/subjects', getExamSubjects);

// ==================== QUESTION BANK ROUTES ====================

router.get('/questions', getQuestions);
router.get('/questions/:questionId', getQuestionById);
router.get('/questions/:questionId/preview', getQuestionPreview);
router.post('/questions', authenticate, authorize('teacher', 'admin'), createQuestion);

// ==================== ATTEMPT AND RESULT PROGRESS ====================

router.post('/attempts/submit', submitAttempt);
router.get('/attempts/student/:studentId', getStudentAttempts);

router.post('/results/generate', generateResult);
router.get('/results/:resultId', getResultById);
router.get('/results/student/:studentId', getStudentResults);

router.get('/practice-test', getPracticeTest);
router.get('/dashboard/student/:studentId', getStudentDashboard);

// ==================== SYLLABUS SCAN & AI PAPER GENERATOR ====================

router.post('/syllabus/upload', upload.single('syllabusFile'), uploadSyllabus);
router.get('/syllabus/list', listSyllabi);
router.route('/syllabus/:id')
    .get(getSyllabusById)
    .post(generateSyllabusPaper);
router.post('/syllabus/:id/generate', generateSyllabusPaper);

router.get('/syllabus-papers', listSyllabusPapers);
router.get('/syllabus-papers/:id', getSyllabusPaperById);
router.patch('/syllabus-papers/:id/question/:qNo', updatePaperQuestion);
router.delete('/syllabus-papers/:id', authenticate, authorize('teacher', 'admin'), deleteSyllabusPaper);

// ==================== LIVE PROCTORED EXAM ROOMS ====================

router.get('/exam-room/teacher/reports', authenticate, authorize('teacher', 'admin'), getTeacherRoomsReport);
router.post('/exam-room/create', authenticate, authorize('teacher', 'admin'), createExamRoom);
router.delete('/exam-room/:code', authenticate, authorize('teacher', 'admin'), deleteExamRoomReport);
router.get('/exam-room/:code', getExamRoomInfo);
router.get('/exam-room/:code/paper', getExamRoomPaper);
router.post('/exam-room/:code/submit', submitExamRoomAnswers);

router.post('/practice/submit', submitPracticeAnswers);
router.delete('/results/:id', authenticate, authorize('teacher', 'admin'), deleteStudentResult);


module.exports = router;
