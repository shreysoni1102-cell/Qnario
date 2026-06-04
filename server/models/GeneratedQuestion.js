const mongoose = require('mongoose');

const generatedQuestionSchema = new mongoose.Schema({
    teacherEmail: {
        type: String,
        required: true,
        lowercase: true
    },
    id: {
        type: String,
        required: false
    },
    level: {
        type: String,
        required: true
    },
    stream: {
        type: String,
        default: null
    },
    subject: {
        type: String,
        required: true
    },
    chapter: {
        type: String,
        required: true
    },
    marks: {
        type: String,
        required: true
    },
    questionType: {
        type: String,
        required: true
    },
    specificTopics: {
        type: String,
        default: null
    },
    questions: [{
        questionNumber: Number,
        text: String,
        options: [String],
        answer: {
            correctOption: String,
            explanation: String
        },
        marks: Number,
        difficulty: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const GeneratedQuestion = mongoose.model('GeneratedQuestion', generatedQuestionSchema);

module.exports = GeneratedQuestion;
