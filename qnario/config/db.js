const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    if (!process.env.MONGODB_URI) {
        console.log('MONGODB_URI not set in .env — skipping MongoDB connection');
        return;
    }

    try {
        // Only pass non-deprecated options. Mongoose will use sensible defaults.
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000 // 5 second timeout
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error.message || error);
        console.log('Starting server without MongoDB connection...');
        // Don't exit process — allow the server to run with file-based storage fallback
    }
};

module.exports = connectDB;