const mongoose = require('mongoose');

// Exam Schema
const examSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    description: String,

    examDetails: {
        totalDuration: Number, // in minutes
        totalQuestions: Number,
        totalMarks: Number,
        negativeMarking: { type: Boolean, default: false },
        negativeMarkPercentage: Number, // e.g., 0.25 for 1/4
        passingPercentage: { type: Number, default: 40 },
        sectionWise: [
            {
                sectionName: String,
                duration: Number,
                questions: Number,
                marks: Number
            }
        ]
    },

    // Subject breakdown
    subjects: [
        {
            subjectId: mongoose.Schema.Types.ObjectId,
            subjectName: String,
            questionCount: Number,
            marks: Number,
            weight: Number // percentage
        }
    ],

    // Creator
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Exam', examSchema);
