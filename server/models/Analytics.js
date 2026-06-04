const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['student', 'teacher', 'exam', 'topic'],
        required: true
    },

    // Student Analytics
    studentAnalytics: {
        studentId: mongoose.Schema.Types.ObjectId,
        studentName: String,
        totalExamsTaken: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 },
        totalQuestionsAttempted: { type: Number, default: 0 },
        correctAnswers: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 }, // percentage

        // Performance by Subject
        subjectPerformance: [
            {
                subjectName: String,
                attempted: { type: Number, default: 0 },
                correct: { type: Number, default: 0 },
                accuracy: { type: Number, default: 0 }
            }
        ],

        // Performance by Difficulty
        difficultyPerformance: [
            {
                difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
                attempted: { type: Number, default: 0 },
                correct: { type: Number, default: 0 },
                accuracy: { type: Number, default: 0 }
            }
        ],

        // Progress Over Time
        progressOverTime: [
            {
                date: Date,
                score: Number,
                percentage: Number,
                examId: mongoose.Schema.Types.ObjectId
            }
        ],

        // Learning Insights
        learningPace: { type: String, enum: ['Fast', 'Average', 'Slow'] },
        strongSubjects: [String],
        weakSubjects: [String],
        improvementAreas: [String]
    },

    // Teacher Analytics
    teacherAnalytics: {
        teacherId: mongoose.Schema.Types.ObjectId,
        teacherName: String,
        totalQuestionsCreated: { type: Number, default: 0 },
        totalStudentsManaged: { type: Number, default: 0 },
        averageStudentScore: { type: Number, default: 0 },

        // Questions by Difficulty
        questionsByDifficulty: {
            easy: { type: Number, default: 0 },
            medium: { type: Number, default: 0 },
            hard: { type: Number, default: 0 }
        },

        // Student Performance
        studentPerformanceStats: {
            topPerformers: [
                {
                    studentId: mongoose.Schema.Types.ObjectId,
                    studentName: String,
                    averageScore: Number
                }
            ],
            needsAttention: [
                {
                    studentId: mongoose.Schema.Types.ObjectId,
                    studentName: String,
                    averageScore: Number
                }
            ]
        }
    },

    // Exam Analytics
    examAnalytics: {
        examId: mongoose.Schema.Types.ObjectId,
        examName: String,
        totalAttempts: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 },
        averageAccuracy: { type: Number, default: 0 },

        // Difficulty Distribution
        difficultyDistribution: [
            {
                difficulty: String,
                questionCount: Number,
                averageAccuracy: Number
            }
        ],

        // Question Analysis
        questionAnalysis: [
            {
                questionId: mongoose.Schema.Types.ObjectId,
                difficulty: String,
                accuracy: Number,
                timeSpent: Number,
                confusionIndex: Number // 0-1, higher = more confusing
            }
        ],

        // Subject Breakdown
        subjectBreakdown: [
            {
                subjectName: String,
                questionCount: Number,
                averageAccuracy: Number,
                topicPerformance: [
                    {
                        topicName: String,
                        accuracy: Number,
                        difficulty: String
                    }
                ]
            }
        ]
    },

    // Topic Analytics
    topicAnalytics: {
        topicId: mongoose.Schema.Types.ObjectId,
        topicName: String,
        totalQuestionsAttempted: { type: Number, default: 0 },
        averageAccuracy: { type: Number, default: 0 },

        // Performance Breakdown
        performanceByDifficulty: {
            easy: { attempted: Number, accuracy: Number },
            medium: { attempted: Number, accuracy: Number },
            hard: { attempted: Number, accuracy: Number }
        },

        // Common Mistakes
        commonMistakes: [
            {
                questionId: mongoose.Schema.Types.ObjectId,
                frequency: Number, // How many students got it wrong
                wrongOptionSelected: String
            }
        ]
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

analyticsSchema.index({ type: 1 });
analyticsSchema.index({ 'studentAnalytics.studentId': 1 });

module.exports = mongoose.model('Analytics', analyticsSchema);
