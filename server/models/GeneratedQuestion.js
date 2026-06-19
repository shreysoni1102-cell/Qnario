const mongoose = require('mongoose');

/**
 * Stores every AI-generated question paper in MongoDB.
 * This collection mirrors syllabus-papers.json so data is always
 * visible in MongoDB Compass under the `generatedquestions` collection.
 */
const generatedQuestionSchema = new mongoose.Schema({
    // Teacher who triggered generation
    teacherEmail: {
        type: String,
        required: true,
        lowercase: true
    },

    // Cross-reference to local JSON paper ID (syllabus-papers.json)
    paperId: {
        type: String,
        default: null
    },

    // Source syllabus reference
    syllabusId: {
        type: String,
        default: null
    },

    // Paper Classification
    subject: {
        type: String,
        required: true
    },
    className: {
        type: String,
        default: null
    },
    paperType: {
        type: String,
        default: 'Custom'
    },

    // Generation Parameters
    level: {
        type: String,
        default: 'Mixed'
    },
    stream: {
        type: String,
        default: null
    },
    difficulty: {
        type: String,
        default: 'Medium'
    },
    language: {
        type: String,
        default: 'English'
    },
    duration: {
        type: Number,
        default: null  // in minutes
    },
    marks: {
        type: String,
        required: true  // total marks as string
    },
    questionType: {
        type: String,
        default: 'MCQ'  // comma-separated if mixed: "MCQ, Short Answer"
    },
    specificTopics: {
        type: String,
        default: null
    },

    // Paper Status
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },

    // The Generated Questions
    questions: [{
        questionNumber: { type: Number },
        text: { type: String, default: '' },
        section: { type: String, default: '' },
        type: { type: String, default: 'MCQ' },
        options: { type: [String], default: [] },
        answer: {
            correctOption: { type: String, default: '' },
            explanation: { type: String, default: '' }
        },
        marks: { type: Number, default: 1 },
        difficulty: { type: String, default: 'Medium' }
    }],

    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for quick teacher-based lookups in Compass / queries
generatedQuestionSchema.index({ teacherEmail: 1, createdAt: -1 });
generatedQuestionSchema.index({ subject: 1 });

const GeneratedQuestion = mongoose.model('GeneratedQuestion', generatedQuestionSchema);

module.exports = GeneratedQuestion;
