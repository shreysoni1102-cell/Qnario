const mongoose = require('mongoose');

const studentResultSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    studentName: String,

    examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    examName: String,

    // Scores
    totalMarks: Number,
    marksObtained: {
        type: Number,
        default: 0
    },
    percentage: {
        type: Number,
        default: 0
    },
    rank: Number,

    // Breakdown by Subject
    subjectWisePerformance: [
        {
            subjectId: mongoose.Schema.Types.ObjectId,
            subjectName: String,
            totalQuestions: Number,
            correctAnswers: { type: Number, default: 0 },
            wrongAnswers: { type: Number, default: 0 },
            unattempted: { type: Number, default: 0 },
            marksObtained: { type: Number, default: 0 },
            successRate: Number
        }
    ],

    // Breakdown by Difficulty
    difficultyWisePerformance: {
        easy: {
            attempted: { type: Number, default: 0 },
            correct: { type: Number, default: 0 },
            accuracy: { type: Number, default: 0 }
        },
        medium: {
            attempted: { type: Number, default: 0 },
            correct: { type: Number, default: 0 },
            accuracy: { type: Number, default: 0 }
        },
        hard: {
            attempted: { type: Number, default: 0 },
            correct: { type: Number, default: 0 },
            accuracy: { type: Number, default: 0 }
        }
    },

    // Time Analysis
    totalTimeSpent: Number, // in seconds
    averageTimePerQuestion: Number,

    // Status
    status: {
        type: String,
        enum: ['Completed', 'InProgress', 'Abandoned'],
        default: 'InProgress'
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: Date,

    // Feedback & Recommendations
    strongAreas: [String], // Topics where student performed well
    weakAreas: [String], // Topics needing improvement
    recommendations: [String],

    // Attempt tracking
    attemptNumber: { type: Number, default: 1 },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

studentResultSchema.index({ studentId: 1, examId: 1 });

module.exports = mongoose.model('StudentResult', studentResultSchema);
