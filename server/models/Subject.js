const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        enum: ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'English', 'History', 'General Knowledge']
    },
    code: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    description: String,
    icon: String,

    // Which exams include this subject
    applicableExams: [
        {
            examId: mongoose.Schema.Types.ObjectId,
            examName: String,
            weight: Number // percentage
        }
    ],

    // Topic references
    topics: [mongoose.Schema.Types.ObjectId],

    // Statistics
    totalTopics: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Subject', subjectSchema);
