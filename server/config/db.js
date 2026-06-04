const mongoose = require('mongoose');

/**
 * Initializes and establishes a connection to MongoDB using Mongoose.
 * Gracefully handles connection failures, allowing local or test environments
 * to remain active under degraded states.
 */
const connectDB = async () => {
    const dbUri = process.env.MONGODB_URI;
    if (!dbUri) {
        console.warn('⚠️ MONGODB_URI is not defined in .env - skipping MongoDB connection');
        return;
    }

    try {
        await mongoose.connect(dbUri, {
            serverSelectionTimeoutMS: 5000 // 5 seconds connection selection threshold
        });
        console.log('🔌 MongoDB successfully connected.');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message || error);
        console.log('⚠️ Running Express server under disconnected database state.');
    }
};

module.exports = connectDB;
