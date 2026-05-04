/**
 * Clean Admin Setup Script
 * Deletes existing admin and creates a fresh one
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/qnario';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_NAME = 'Admin User';

async function cleanSetupAdmin() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Import User model
        const User = require('./models/User');

        // Delete existing admin
        console.log('🗑️  Deleting existing admin user...');
        const deleted = await User.deleteOne({ email: ADMIN_EMAIL });
        console.log('✅ Deleted:', deleted.deletedCount, 'user(s)');

        // Create new admin user (DO NOT hash - User model pre-save hook will do it)
        console.log('👤 Creating fresh admin user...');
        const admin = new User({
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,  // Pass plain password - pre-save hook will hash it
            role: 'admin'
        });

        await admin.save();

        // Verify it was saved correctly
        console.log('✅ Admin user created');
        
        // Test the password
        console.log('🔐 Verifying password...');
        const isMatch = await admin.comparePassword(ADMIN_PASSWORD);
        
        if (isMatch) {
            console.log('\n✅ ✅ ✅ ADMIN ACCOUNT READY! ✅ ✅ ✅\n');
            console.log('📧 Email:    ' + ADMIN_EMAIL);
            console.log('🔑 Password: ' + ADMIN_PASSWORD);
            console.log('🔐 Role:     admin\n');
            console.log('👉 You can now login at: http://localhost:3000/admin-login.html\n');
        } else {
            console.log('❌ WARNING: Password verification failed!');
        }

        await mongoose.connection.close();
        console.log('✅ Database connection closed');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

cleanSetupAdmin();
