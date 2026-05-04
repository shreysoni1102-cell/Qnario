const mongoose = require('mongoose');

// Exam Schedule Schema
const examScheduleSchema = new mongoose.Schema({
    examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    examName: String,

    // Schedule Details
    scheduledDate: {
        type: Date,
        required: true
    },
    startTime: {
        type: String, // HH:MM format
        required: true
    },
    endTime: {
        type: String, // HH:MM format
        required: true
    },
    duration: Number, // in minutes

    // Student Enrollment
    enrolledStudents: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    allowedStudents: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    studentCount: { type: Number, default: 0 },

    // Settings
    isPublic: { type: Boolean, default: false },
    isLocked: { type: Boolean, default: false }, // Locked after exam starts
    allowReattempt: { type: Boolean, default: false },
    reattemptCount: { type: Number, default: 0 },

    // Instructions
    instructions: String,

    // Status
    status: {
        type: String,
        enum: ['Scheduled', 'InProgress', 'Completed', 'Cancelled'],
        default: 'Scheduled'
    },

    // Creator
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Index for queries
examScheduleSchema.index({ scheduledDate: 1, status: 1 });

module.exports = mongoose.model('ExamSchedule', examScheduleSchema);
