/**
 * SAMPLE API ROUTES - Integration with Express
 * This shows how to use the database with your API
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
// Set true to force local generation (demo)
const FORCE_LOCAL_GENERATOR = false;
const Question = require('../models/Question');
const AIClient = require('../utils/ai-client');
const StudentAttempt = require('../models/StudentAttempt');
const StudentResult = require('../models/StudentResult');
const Subject = require('../models/Subject');
const Exam = require('../models/Exam');
const Topic = require('../models/Topic');
const GeneratedQuestion = require('../models/GeneratedQuestion');
require('dotenv').config();

// Configure AI microservice URL (supports old env key for compatibility)
const AI_MICROSERVICE_URL = process.env.AI_MICROSERVICE_URL || 'http://localhost:5000';

// =====================================================
// EXAM ROUTES
// =====================================================

// GET: Get all available exams
router.get('/api/exams', async (req, res) => {
    try {
        const exams = await Exam.find({ isActive: true })
            .select('name code description examDetails subjects');
        res.json(exams);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Get exam details
router.get('/api/exams/:examId', async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.examId)
            .populate('subjects.subjectId');
        res.json(exam);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// SUBJECT ROUTES
// =====================================================

// GET: Get all subjects for an exam
router.get('/api/exams/:examId/subjects', async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.examId);
        const subjects = await Subject.find({
            _id: { $in: exam.subjects.map(s => s.subjectId) }
        }).select('name code description');
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// QUESTION ROUTES
// =====================================================

// GET: Get questions with filters
// Query: /api/questions?exam=JEE Main&subject=Physics&difficulty=Easy&limit=10
router.get('/api/questions', async (req, res) => {
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

        res.json({
            total,
            count: questions.length,
            questions
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Get a specific question with answer (for after exam)
router.get('/api/questions/:questionId', async (req, res) => {
    try {
        const question = await Question.findById(req.params.questionId);
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }
        res.json(question);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Get question for preview (without answer)
router.get('/api/questions/:questionId/preview', async (req, res) => {
    try {
        const question = await Question.findById(req.params.questionId)
            .select('-answer.correctOption -answer.explanation -answer.solutionSteps');
        res.json(question);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST: Create new question (Admin/Teacher only)
router.post('/api/questions', authenticateToken, async (req, res) => {
    try {
        // Verify user is teacher
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ error: 'Only teachers can create questions' });
        }

        const newQuestion = new Question({
            ...req.body,
            createdBy: req.user.id,
            createdAt: new Date()
        });

        await newQuestion.save();
        res.status(201).json(newQuestion);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// =====================================================
// STUDENT ATTEMPT ROUTES
// =====================================================

// POST: Submit answer to a question
// Body: { studentId, examId, questionId, selectedAnswer }
router.post('/api/attempts/submit', async (req, res) => {
    try {
        const { studentId, examId, questionId, selectedAnswer } = req.body;

        // Get the question
        const question = await Question.findById(questionId);
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }

        // Check if answer is correct
        const isCorrect = selectedAnswer === question.answer.correctOption;
        const marksObtained = isCorrect ? question.marks : 0;

        // If negative marking is enabled
        let finalMarks = marksObtained;
        const exam = await Exam.findById(examId);
        if (!isCorrect && exam.examDetails.negativeMarking) {
            finalMarks = -question.marks * exam.examDetails.negativeMarkPercentage;
        }

        // Record the attempt
        const attempt = new StudentAttempt({
            studentId,
            examId,
            questionId,
            selectedAnswer,
            isCorrect,
            marksObtained: finalMarks,
            startTime: new Date(),
            endTime: new Date()
        });

        await attempt.save();

        // Update question statistics
        await Question.findByIdAndUpdate(questionId, {
            $inc: {
                totalAttempts: 1,
                correctAttempts: isCorrect ? 1 : 0
            }
        });

        res.json({
            isCorrect,
            marksObtained: finalMarks,
            correctAnswer: question.answer.correctOption,
            explanation: question.answer.explanation
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Get student's attempt history
// /api/attempts/student/:studentId?examId=xxx
router.get('/api/attempts/student/:studentId', async (req, res) => {
    try {
        const { examId } = req.query;

        const filter = { studentId: req.params.studentId };
        if (examId) filter.examId = examId;

        const attempts = await StudentAttempt.find(filter)
            .populate('questionId', 'text options answer')
            .sort({ createdAt: -1 });

        res.json(attempts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// STUDENT RESULT ROUTES
// =====================================================

// POST: Generate/Submit exam result
router.post('/api/results/generate', async (req, res) => {
    try {
        const { studentId, examId } = req.body;

        // Get all attempts
        const attempts = await StudentAttempt.find({
            studentId,
            examId
        }).populate('questionId');

        if (attempts.length === 0) {
            return res.status(400).json({ error: 'No attempts found for this exam' });
        }

        // Calculate result
        let totalMarks = 0;
        let obtainedMarks = 0;
        const subjectPerformance = {};
        const difficultyPerformance = {
            Easy: { attempted: 0, correct: 0 },
            Medium: { attempted: 0, correct: 0 },
            Hard: { attempted: 0, correct: 0 }
        };

        attempts.forEach(attempt => {
            const q = attempt.questionId;
            totalMarks += q.marks;
            obtainedMarks += attempt.marksObtained;

            // Subject tracking
            if (!subjectPerformance[q.subjectName]) {
                subjectPerformance[q.subjectName] = {
                    totalQuestions: 0,
                    correct: 0,
                    marksObtained: 0
                };
            }
            subjectPerformance[q.subjectName].totalQuestions += 1;
            if (attempt.isCorrect) {
                subjectPerformance[q.subjectName].correct += 1;
            }
            subjectPerformance[q.subjectName].marksObtained += attempt.marksObtained;

            // Difficulty tracking
            const diff = q.difficulty;
            difficultyPerformance[diff].attempted += 1;
            if (attempt.isCorrect) {
                difficultyPerformance[diff].correct += 1;
            }
        });

        // Create result
        const result = new StudentResult({
            studentId,
            examId,
            totalMarks,
            marksObtained: obtainedMarks,
            percentage: (obtainedMarks / totalMarks) * 100,
            subjectWisePerformance: Object.entries(subjectPerformance).map(([name, data]) => ({
                subjectName: name,
                ...data,
                successRate: (data.correct / data.totalQuestions) * 100
            })),
            difficultyWisePerformance: difficultyPerformance,
            status: 'Completed',
            completedAt: new Date()
        });

        await result.save();

        res.json({
            resultId: result._id,
            marksObtained: obtainedMarks,
            totalMarks,
            percentage: result.percentage,
            subjectPerformance: result.subjectWisePerformance
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Get student's result
router.get('/api/results/:resultId', async (req, res) => {
    try {
        const result = await StudentResult.findById(req.params.resultId);
        if (!result) {
            return res.status(404).json({ error: 'Result not found' });
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Get all results for a student
router.get('/api/results/student/:studentId', async (req, res) => {
    try {
        const results = await StudentResult.find({ studentId: req.params.studentId })
            .sort({ completedAt: -1 });
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// PRACTICE TEST ROUTES
// =====================================================

// GET: Generate practice test
// /api/practice-test?exam=JEE Main&subject=Physics&difficulty=Mixed&count=10
router.get('/api/practice-test', async (req, res) => {
    try {
        const { exam, subject, difficulty, count = 10 } = req.query;

        const filter = {
            examName: exam,
            subjectName: subject,
            isActive: true
        };

        if (difficulty !== 'Mixed') {
            filter.difficulty = difficulty;
        }

        // Get questions, distributed across difficulties if Mixed
        let questions = [];

        if (difficulty === 'Mixed') {
            const easy = await Question.find({ ...filter, difficulty: 'Easy' })
                .limit(Math.ceil(count * 0.33));
            const medium = await Question.find({ ...filter, difficulty: 'Medium' })
                .limit(Math.ceil(count * 0.33));
            const hard = await Question.find({ ...filter, difficulty: 'Hard' })
                .limit(Math.ceil(count * 0.34));
            questions = [...easy, ...medium, ...hard];
        } else {
            questions = await Question.find(filter).limit(count);
        }

        // Shuffle questions
        questions.sort(() => Math.random() - 0.5);

        res.json({
            testId: new Date().getTime(), // Simple test ID
            totalQuestions: questions.length,
            questions: questions.map(q => ({
                _id: q._id,
                text: q.text,
                options: q.options,
                type: q.type,
                marks: q.marks
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// DASHBOARD/ANALYTICS ROUTES
// =====================================================

// GET: Student dashboard
router.get('/api/dashboard/student/:studentId', async (req, res) => {
    try {
        const results = await StudentResult.find({ studentId: req.params.studentId })
            .sort({ completedAt: -1 });

        if (results.length === 0) {
            return res.json({
                totalExams: 0,
                averageScore: 0,
                recentExams: []
            });
        }

        const totalExams = results.length;
        const averageScore = results.reduce((sum, r) => sum + r.percentage, 0) / totalExams;

        const subjectStats = {};
        results.forEach(result => {
            result.subjectWisePerformance.forEach(subject => {
                if (!subjectStats[subject.subjectName]) {
                    subjectStats[subject.subjectName] = { correct: 0, total: 0 };
                }
                subjectStats[subject.subjectName].correct += subject.correct || 0;
                subjectStats[subject.subjectName].total += subject.totalQuestions;
            });
        });

        const subjectAccuracies = Object.entries(subjectStats)
            .map(([name, data]) => ({
                subject: name,
                accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0
            }))
            .sort((a, b) => b.accuracy - a.accuracy);

        res.json({
            totalExams,
            averageScore: Math.round(averageScore * 100) / 100,
            strongSubjects: subjectAccuracies.slice(0, 2).map(s => s.subject),
            weakSubjects: subjectAccuracies.slice(-2).map(s => s.subject),
            recentExams: results.slice(0, 5),
            allSubjects: subjectAccuracies
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// AI QUESTION GENERATION - GROQ API (via Python microservice)
// =====================================================

// TEST ROUTE
router.post('/api/test', (req, res) => {
    console.log('🔥 TEST ROUTE HIT');
    res.json({ message: 'Test route works', body: req.body });
});

// POST: Generate questions via AI microservice
router.post('/api/generate-questions', async (req, res) => {
    console.log('🔥 HIT: /api/generate-questions route called');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    try {
        const { topic: rawTopic, chapter, numQuestions, subjectId, examId, subjectName, difficulty = 'Medium', questionType = 'MCQ' } = req.body;
        const topic = rawTopic || chapter || subjectName || 'General';

        // subjectId is now optional because teachers may type a name directly
        if (!topic || !numQuestions || !examId) {
            return res.status(400).json({ error: 'Missing required fields: topic/chapter, numQuestions, examId' });
        }

        const incomingType = String(questionType).trim();
        let promptIntro = '';
        let generatorType = 'MCQ';

        if (/^(Single Correct MCQ|MCQ)$/i.test(incomingType)) {
            promptIntro = 'multiple-choice';
            generatorType = 'MCQ';
        } else if (/^(Multiple Select Question \(MSQ\)|MSQ)$/i.test(incomingType)) {
            promptIntro = 'multiple-select';
            generatorType = 'MSQ';
        } else if (/^(True\/False)$/i.test(incomingType)) {
            promptIntro = 'true/false';
            generatorType = 'True/False';
        } else if (/^(One-word Answer|One-word)$/i.test(incomingType)) {
            promptIntro = 'one-word answer';
            generatorType = 'One-word Answer';
        } else if (/^(Short Answer)$/i.test(incomingType)) {
            promptIntro = 'short answer';
            generatorType = 'Short Answer';
        } else if (/^(Long Answer)$/i.test(incomingType)) {
            promptIntro = 'long answer';
            generatorType = 'Long Answer';
        } else {
            promptIntro = 'multiple-choice';
            generatorType = 'MCQ';
        }

        console.log(`🚀 Generating ${numQuestions} "${difficulty}" ${incomingType} questions on "${topic}" (${subjectName}) via microservice...`);
        let generatedQuestions = null;
        try {
            console.log('📡 Calling AI microservice...');
            const aiResult = await AIClient.generateQuestions({
                subject: subjectName || 'General',
                topic: topic,
                difficulty: difficulty,
                count: numQuestions,
                question_type: generatorType
            });

            if (aiResult.success && aiResult.questions) {
                generatedQuestions = aiResult.questions;
                if (aiResult.source === 'mock') {
                    console.log(`⚠️  Generated ${generatedQuestions.length} MOCK questions (fallback mode)`);
                } else {
                    console.log(`✅ Generated ${generatedQuestions.length} questions from ${aiResult.source || 'Groq'}`);
                }
            }
        } catch (microserviceError) {
            console.error('AI microservice error:', microserviceError.message);
        }

        if (!generatedQuestions || generatedQuestions.length === 0) {
            return res.status(500).json({
                error: 'Failed to generate questions - both APIs unavailable',
                details: 'Check if GROQ_API_KEY is valid in microservice .env file'
            });
        }

        // Save all questions to MongoDB or file
        const savedQuestions = [];
        const fallbackFile = path.join(__dirname, '..', 'generated-questions.json');

        for (let index = 0; index < generatedQuestions.slice(0, numQuestions).length; index++) {
            const q = generatedQuestions[index];
            
            // Determine the answer field based on question type
            let answerField = {};
            if (incomingType === 'Long Answer') {
                answerField.detailedAnswer = q.answer || q.detailedAnswer || 'Detailed answer (5-7 lines)';
            } else if (incomingType === 'Short Answer') {
                answerField.answer = q.answer || 'Brief answer (3-4 lines)';
            } else {
                answerField.answer = q.answer || { correctOption: '', explanation: '' };
            }
            
            const doc = {
                questionNumber: index + 1,
                text: q.text || `Question ${index + 1}`,
                type: q.type || 'MCQ',
                marks: q.marks || 1,
                options: q.options || [],
                difficulty: q.difficulty || difficulty,
                examId: examId,
                examName: 'Generated Exam',
                subjectId: subjectId,
                subjectName: subjectName || 'General',
                topicName: topic,
                ...answerField,
                createdAt: new Date(),
                isActive: true
            };

            try {
                if (mongoose.connection && mongoose.connection.readyState === 1) {
                    const created = await Question.create(doc);
                    savedQuestions.push(created);
                } else {
                    let existing = [];
                    if (fs.existsSync(fallbackFile)) {
                        try { existing = JSON.parse(fs.readFileSync(fallbackFile, 'utf8') || '[]'); } catch (e) { existing = []; }
                    }
                    const localDoc = Object.assign({ _id: `local-${Date.now()}-${index}` }, doc);
                    existing.push(localDoc);
                    fs.writeFileSync(fallbackFile, JSON.stringify(existing, null, 2), 'utf8');
                    savedQuestions.push(localDoc);
                }
            } catch (e) {
                console.error('Error saving question:', e.message);
            }
        }

        console.log(`💾 Saved ${savedQuestions.length} questions`);

        res.json({
            success: true,
            message: `Generated ${savedQuestions.length} ${difficulty} questions for "${topic}"`,
            questionsCount: savedQuestions.length,
            questions: savedQuestions
        });

    } catch (error) {
        console.error('❌ Error in generate-questions endpoint:', error.message);
        res.status(500).json({
            error: 'Failed to process question generation',
            details: error.message
        });
    }
});

// =====================================================
// HELPER: Authentication middleware (example)
// =====================================================
function authenticateToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    
    // Verify token here
    // For now, just pass
    next();
}

// =====================================================
// SAVE GENERATED QUESTIONS
// =====================================================
router.post('/api/save-generated-questions', async (req, res) => {
    try {
        const { teacherEmail, level, stream, subject, chapter, marks, questionType, specificTopics, questions } = req.body;

        if (!teacherEmail || !questions || !Array.isArray(questions)) {
            return res.status(400).json({ error: 'Missing required fields: teacherEmail and questions array' });
        }

        // Create a new generated question document
        const generatedQuestionDoc = new GeneratedQuestion({
            teacherEmail,
            level,
            stream,
            subject,
            chapter,
            marks,
            questionType,
            specificTopics,
            questions,
            createdAt: new Date()
        });

        await generatedQuestionDoc.save();

        res.json({
            success: true,
            message: 'Generated questions saved successfully',
            id: generatedQuestionDoc._id
        });

    } catch (error) {
        console.error('Error saving generated questions:', error);
        res.status(500).json({
            error: 'Failed to save generated questions',
            details: error.message
        });
    }
});

// =====================================================
// GET GENERATED QUESTIONS FOR A TEACHER
// =====================================================
router.get('/api/generated-questions/:teacherEmail', async (req, res) => {
    try {
        const { teacherEmail } = req.params;

        if (!teacherEmail) {
            return res.status(400).json({ error: 'Teacher email is required' });
        }

        let generatedQuestions = [];

        // Try to get from database first
        try {
            if (mongoose.connection && mongoose.connection.readyState === 1) {
                generatedQuestions = await GeneratedQuestion.find({ teacherEmail })
                    .sort({ createdAt: -1 });
            }
        } catch (dbError) {
            console.log('Database not available, checking JSON fallback');
        }

        // If no questions in database, check the JSON fallback file
        if (generatedQuestions.length === 0) {
            try {
                const fs = require('fs');
                const path = require('path');
                const fallbackFile = path.join(__dirname, '..', 'generated-questions.json');

                if (fs.existsSync(fallbackFile)) {
                    const jsonData = JSON.parse(fs.readFileSync(fallbackFile, 'utf8') || '[]');

                    // Group questions by creation time (assuming questions generated together have similar timestamps)
                    const questionGroups = {};
                    jsonData.forEach(question => {
                        // Group by subject and topic, and creation date (within same minute)
                        const date = new Date(question.createdAt);
                        const groupKey = `${question.subjectName}_${question.topicName}_${date.getFullYear()}-${date.getMonth()}-${date.getDate()}_${date.getHours()}:${date.getMinutes()}`;

                        if (!questionGroups[groupKey]) {
                            questionGroups[groupKey] = {
                                _id: `fallback_${groupKey}`,
                                teacherEmail: teacherEmail, // Use current teacher email
                                level: 'UG', // Default values since not stored in JSON
                                stream: null,
                                subject: question.subjectName,
                                chapter: question.topicName,
                                marks: question.marks.toString(),
                                questionType: question.type,
                                specificTopics: question.topicName,
                                questions: [],
                                createdAt: question.createdAt
                            };
                        }
                        questionGroups[groupKey].questions.push(question);
                    });

                    // Convert to array and sort by creation date
                    generatedQuestions = Object.values(questionGroups).sort((a, b) =>
                        new Date(b.createdAt) - new Date(a.createdAt)
                    );

                    console.log(`Loaded ${generatedQuestions.length} question sets from JSON fallback`);
                }
            } catch (jsonError) {
                console.error('Error reading JSON fallback:', jsonError.message);
            }
        }

        res.json({
            success: true,
            questions: generatedQuestions
        });

    } catch (error) {
        console.error('Error retrieving generated questions:', error);
        res.status(500).json({
            error: 'Failed to retrieve generated questions',
            details: error.message
        });
    }
});

// =====================================================
// DELETE GENERATED QUESTIONS
// =====================================================
router.delete('/api/generated-questions/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'Question set ID is required' });
        }

        const deletedQuestion = await GeneratedQuestion.findByIdAndDelete(id);

        if (!deletedQuestion) {
            return res.status(404).json({ error: 'Question set not found' });
        }

        res.json({
            success: true,
            message: 'Question set deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting generated questions:', error);
        res.status(500).json({
            error: 'Failed to delete generated questions',
            details: error.message
        });
    }
});

module.exports = router;
