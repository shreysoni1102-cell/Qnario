const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    // Numbering
    questionNumber: Number,
    
    // Basic Info
    text: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    marks: {
        type: Number,
        required: true,
        default: 1
    },

    // Classification
    examId: {
        type: String,
        required: true
    },
    examName: {
        type: String,
        required: true
    },

    subjectId: {
        type: String,
        required: false  // Optional for AI-generated questions
    },
    subjectName: {
        type: String,
        required: true
    },

    topicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic'
    },
    topicName: String,

    // Difficulty & Category
    difficulty: {
        type: String,
        required: true
    },
    category: String,

    // Question Content (For MCQ)
    options: [
        {
            id: { type: String, enum: ['A', 'B', 'C', 'D'] },
            text: String,
            imageUrl: String
        }
    ],

    // Answer & Explanation
    answer: {
        correctOption: String, // A, B, C, D for MCQ
        correctAnswerText: String, // For short/descriptive
        explanation: {
            type: String,
            required: false
        },
        solutionSteps: [String],
        diagramUrl: String,
        solutionVideoUrl: String,
        solutionNoteUrl: String
    },

    // Analytics
    totalAttempts: { type: Number, default: 0 },
    correctAttempts: { type: Number, default: 0 },
    successRate: { type: Number, default: 0 }, // percentage
    averageTimeSpent: { type: Number, default: 0 }, // seconds

    // Metadata
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    tags: [String], // e.g., ["important", "frequently_asked"]
    
    previousYearPaper: {
        year: Number,
        paper: String
    },

    imageUrl: String, // For questions with diagrams
    
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Indexing configurations for enhanced query speed
questionSchema.index({ examId: 1, subjectId: 1, difficulty: 1 });
questionSchema.index({ topicId: 1 });
questionSchema.index({ subjectName: 1, difficulty: 1 });

module.exports = mongoose.model('Question', questionSchema);
