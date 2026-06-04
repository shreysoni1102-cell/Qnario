const mongoose = require('mongoose');

const studentAttemptSchema = new mongoose.Schema({
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

    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true
    },
    questionText: String,

    // Attempt Details
    selectedAnswer: String, // A, B, C, D or text for descriptive
    isCorrect: {
        type: Boolean,
        default: false
    },
    marksObtained: {
        type: Number,
        default: 0
    },

    // Time Tracking
    startTime: Date,
    endTime: Date,
    timeSpent: Number, // in seconds

    // Review Status
    isReviewed: { type: Boolean, default: false },
    reviewedAt: Date,
    reviewerComments: String,

    attemptNumber: { type: Number, default: 1 },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

studentAttemptSchema.index({ studentId: 1, examId: 1 });
studentAttemptSchema.index({ questionId: 1 });

module.exports = mongoose.model('StudentAttempt', studentAttemptSchema);
