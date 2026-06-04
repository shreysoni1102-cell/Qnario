const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
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

    // Hierarchy
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    subjectName: String,

    parentTopicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic',
        default: null // null for main topics
    },
    subtopics: [mongoose.Schema.Types.ObjectId],

    // Learning Resources
    resources: [
        {
            type: { type: String, enum: ['notes', 'video', 'article'] },
            title: String,
            url: String,
            duration: Number // in seconds for videos
        }
    ],

    // Statistics
    totalQuestions: { type: Number, default: 0 },
    questionsByDifficulty: {
        easy: { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        hard: { type: Number, default: 0 }
    },

    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Topic', topicSchema);
