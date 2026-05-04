// Practical Database Integration Guide with Examples

/**
 * DATABASE STRUCTURE SUMMARY
 * ===========================
 * 
 * Collections:
 * 1. users (already exists)
 * 2. subjects - Physics, Chemistry, Biology, Maths, English, etc.
 * 3. topics - Mechanics, Kinematics, Chemical Bonding, etc.
 * 4. exams - JEE Main, NEET, 12th Board, Practice Tests
 * 5. questions - All questions with full metadata
 * 6. student_attempts - Track each answer attempt
 * 7. student_results - Summary of exam performance
 * 8. exam_schedules - Schedule tests for students
 * 9. analytics - Performance insights
 */

/**
 * INTEGRATION FLOW EXAMPLES
 */

// Example 1: Adding a Question
// =============================
async function addNewQuestion(questionData) {
    const Question = require('../models/Question');
    
    const newQuestion = new Question({
        text: "What is Newton's first law of motion?",
        type: "MCQ",
        marks: 1,
        examName: "JEE Main",
        examId: "exam_jee_main_id",
        subjectName: "Physics",
        subjectId: "subject_physics_id",
        topicName: "Mechanics",
        topicId: "topic_mechanics_id",
        difficulty: "Easy",
        
        options: [
            { id: "A", text: "An object at rest stays at rest" },
            { id: "B", text: "Force equals mass times acceleration" },
            { id: "C", text: "Every action has an equal reaction" },
            { id: "D", text: "Energy is conserved" }
        ],
        
        answer: {
            correctOption: "A",
            explanation: "Newton's first law states that an object in motion stays in motion unless acted upon by an external force, and an object at rest stays at rest unless acted upon by an external force.",
            solutionSteps: [
                "Identify Newton's first law",
                "Understand the concept of inertia",
                "Recognize that objects resist changes in motion"
            ]
        }
    });
    
    await newQuestion.save();
    return newQuestion;
}

// Example 2: Getting All Questions for a Subject & Difficulty
// =============================================================
async function getFilteredQuestions(examName, subjectName, difficulty) {
    const Question = require('../models/Question');
    
    const questions = await Question.find({
        examName: examName,
        subjectName: subjectName,
        difficulty: difficulty,
        isActive: true
    }).select('_id text options answer difficulty marks');
    
    return questions;
}

// Example 3: Recording a Student Answer
// ======================================
async function recordStudentAttempt(studentId, examId, questionId, selectedAnswer) {
    const StudentAttempt = require('../models/StudentAttempt');
    const Question = require('../models/Question');
    
    // Get the question
    const question = await Question.findById(questionId);
    
    // Check if answer is correct
    const isCorrect = selectedAnswer === question.answer.correctOption;
    const marksObtained = isCorrect ? question.marks : 0;
    
    // Record the attempt
    const attempt = new StudentAttempt({
        studentId,
        examId,
        questionId,
        selectedAnswer,
        isCorrect,
        marksObtained,
        startTime: new Date(),
        endTime: new Date()
    });
    
    await attempt.save();
    
    // Update question statistics
    question.totalAttempts += 1;
    if (isCorrect) question.correctAttempts += 1;
    question.successRate = (question.correctAttempts / question.totalAttempts) * 100;
    await question.save();
    
    return attempt;
}

// Example 4: Generate Student Result
// ===================================
async function generateStudentResult(studentId, examId) {
    const StudentAttempt = require('../models/StudentAttempt');
    const StudentResult = require('../models/StudentResult');
    const Exam = require('../models/Exam');
    
    // Get all attempts for this student in this exam
    const attempts = await StudentAttempt.find({
        studentId,
        examId
    }).populate('questionId');
    
    // Get exam details
    const exam = await Exam.findById(examId);
    
    // Calculate totals
    let totalMarks = 0;
    let correctCount = 0;
    let subjectPerformance = {};
    let difficultyPerformance = {
        easy: { attempted: 0, correct: 0 },
        medium: { attempted: 0, correct: 0 },
        hard: { attempted: 0, correct: 0 }
    };
    
    attempts.forEach(attempt => {
        const question = attempt.questionId;
        totalMarks += question.marks;
        
        if (attempt.isCorrect) {
            correctCount += attempt.marksObtained;
        }
        
        // Track by subject
        if (!subjectPerformance[question.subjectName]) {
            subjectPerformance[question.subjectName] = {
                totalQuestions: 0,
                correctAnswers: 0,
                wrongAnswers: 0,
                unattempted: 0,
                marksObtained: 0
            };
        }
        subjectPerformance[question.subjectName].totalQuestions += 1;
        if (attempt.isCorrect) {
            subjectPerformance[question.subjectName].correctAnswers += 1;
            subjectPerformance[question.subjectName].marksObtained += attempt.marksObtained;
        } else {
            subjectPerformance[question.subjectName].wrongAnswers += 1;
        }
        
        // Track by difficulty
        const diff = question.difficulty.toLowerCase();
        difficultyPerformance[diff].attempted += 1;
        if (attempt.isCorrect) {
            difficultyPerformance[diff].correct += 1;
        }
    });
    
    // Calculate percentages
    const percentage = (correctCount / totalMarks) * 100;
    
    // Convert subjectPerformance object to array
    const subjectArray = Object.entries(subjectPerformance).map(([subject, data]) => ({
        subjectName: subject,
        ...data,
        successRate: (data.correctAnswers / data.totalQuestions) * 100
    }));
    
    // Calculate difficulty accuracy
    Object.keys(difficultyPerformance).forEach(diff => {
        if (difficultyPerformance[diff].attempted > 0) {
            difficultyPerformance[diff].accuracy = 
                (difficultyPerformance[diff].correct / difficultyPerformance[diff].attempted) * 100;
        }
    });
    
    // Create result
    const result = new StudentResult({
        studentId,
        examId,
        totalMarks,
        marksObtained: correctCount,
        percentage,
        subjectWisePerformance: subjectArray,
        difficultyWisePerformance: difficultyPerformance,
        status: 'Completed',
        completedAt: new Date()
    });
    
    await result.save();
    return result;
}

// Example 5: Get Dashboard Analytics
// ===================================
async function getStudentDashboard(studentId) {
    const StudentResult = require('../models/StudentResult');
    const Analytics = require('../models/Analytics');
    
    // Get all results for student
    const results = await StudentResult.find({ studentId })
        .sort({ createdAt: -1 })
        .limit(10);
    
    // Calculate overall stats
    const totalExams = results.length;
    const averageScore = results.reduce((sum, r) => sum + r.percentage, 0) / totalExams || 0;
    const totalQuestions = results.reduce((sum, r) => {
        return sum + r.subjectWisePerformance.reduce((subSum, sub) => subSum + sub.totalQuestions, 0);
    }, 0);
    
    // Get strong and weak subjects
    const subjectStats = {};
    results.forEach(result => {
        result.subjectWisePerformance.forEach(subject => {
            if (!subjectStats[subject.subjectName]) {
                subjectStats[subject.subjectName] = { total: 0, correct: 0 };
            }
            subjectStats[subject.subjectName].total += subject.totalQuestions;
            subjectStats[subject.subjectName].correct += subject.correctAnswers;
        });
    });
    
    const subjectAccuracies = Object.entries(subjectStats).map(([subject, data]) => ({
        subject,
        accuracy: (data.correct / data.total) * 100
    })).sort((a, b) => b.accuracy - a.accuracy);
    
    return {
        totalExams,
        averageScore,
        totalQuestions,
        recentResults: results,
        strongSubjects: subjectAccuracies.slice(0, 3).map(s => s.subject),
        weakSubjects: subjectAccuracies.slice(-3).map(s => s.subject),
        subjectBreakdown: subjectAccuracies
    };
}

// Example 6: Get Questions for a Practice Test
// =============================================
async function generatePracticeTest(examName, subjectName, numberOfQuestions = 10) {
    const Question = require('../models/Question');
    
    // Get questions distributed across difficulties
    const easyQuestions = await Question.find({
        examName,
        subjectName,
        difficulty: 'Easy',
        isActive: true
    }).limit(Math.ceil(numberOfQuestions * 0.33));
    
    const mediumQuestions = await Question.find({
        examName,
        subjectName,
        difficulty: 'Medium',
        isActive: true
    }).limit(Math.ceil(numberOfQuestions * 0.34));
    
    const hardQuestions = await Question.find({
        examName,
        subjectName,
        difficulty: 'Hard',
        isActive: true
    }).limit(Math.ceil(numberOfQuestions * 0.33));
    
    const allQuestions = [...easyQuestions, ...mediumQuestions, ...hardQuestions];
    
    // Shuffle and limit
    return allQuestions.sort(() => Math.random() - 0.5).slice(0, numberOfQuestions);
}

// Example 7: Update Subject Statistics
// =====================================
async function updateSubjectStats(subjectId) {
    const Subject = require('../models/Subject');
    const Topic = require('../models/Topic');
    const Question = require('../models/Question');
    
    // Get all topics for this subject
    const topics = await Topic.find({ subjectId });
    
    // Count questions by difficulty
    const totalQuestions = await Question.countDocuments({ subjectId });
    
    // Update subject
    await Subject.findByIdAndUpdate(subjectId, {
        totalTopics: topics.length,
        totalQuestions: totalQuestions,
        updatedAt: new Date()
    });
}

// Example 8: Get Topic Statistics
// ================================
async function getTopicStats(topicId) {
    const Topic = require('../models/Topic');
    const Question = require('../models/Question');
    
    // Get topic
    const topic = await Topic.findById(topicId);
    
    // Count questions by difficulty
    const stats = await Question.aggregate([
        { $match: { topicId: topicId } },
        { $group: {
            _id: '$difficulty',
            count: { $sum: 1 },
            avgAccuracy: { $avg: '$successRate' }
        }}
    ]);
    
    return {
        topicName: topic.name,
        statistics: stats
    };
}

// Example 9: Search Questions
// ============================
async function searchQuestions(searchTerm, filters = {}) {
    const Question = require('../models/Question');
    
    const query = {
        $or: [
            { text: { $regex: searchTerm, $options: 'i' } },
            { 'answer.explanation': { $regex: searchTerm, $options: 'i' } },
            { topicName: { $regex: searchTerm, $options: 'i' } }
        ],
        ...filters,
        isActive: true
    };
    
    const results = await Question.find(query)
        .select('_id text difficulty subjectName topicName examName')
        .limit(20);
    
    return results;
}

// Example 10: Export Data for Analytics
// ======================================
async function exportExamAnalytics(examId) {
    const StudentResult = require('../models/StudentResult');
    const Question = require('../models/Question');
    
    // Get all results for this exam
    const results = await StudentResult.find({ examId });
    
    // Calculate statistics
    const totalStudents = results.length;
    const averageScore = results.reduce((sum, r) => sum + r.percentage, 0) / totalStudents;
    const highestScore = Math.max(...results.map(r => r.percentage));
    const lowestScore = Math.min(...results.map(r => r.percentage));
    
    // Get questions with low accuracy
    const questions = await Question.find({ examId }).sort({ successRate: 1 }).limit(10);
    
    return {
        examId,
        totalStudents,
        averageScore,
        highestScore,
        lowestScore,
        difficultQuestions: questions,
        generatedAt: new Date()
    };
}

module.exports = {
    addNewQuestion,
    getFilteredQuestions,
    recordStudentAttempt,
    generateStudentResult,
    getStudentDashboard,
    generatePracticeTest,
    updateSubjectStats,
    getTopicStats,
    searchQuestions,
    exportExamAnalytics
};
