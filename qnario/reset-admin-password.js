/**
 * Reset Admin Password Script
 * Changes the admin password to a new one
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/qnario';
const ADMIN_EMAIL = 'admin@example.com';
const NEW_PASSWORD = 'admin123'; // Set your desired password here

async function resetAdminPassword() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Import User model
        const User = require('./models/User');

        // Find admin user
        console.log('🔍 Finding admin user...');
        const admin = await User.findOne({ email: ADMIN_EMAIL });
        
        if (!admin) {
            console.log('❌ Admin user not found!');
            await mongoose.connection.close();
            return;
        }

        console.log('✅ Admin user found:', admin.name);

        // Hash new password
        console.log('🔐 Hashing new password...');
        const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);

        // Update password
        admin.password = hashedPassword;
        await admin.save();

        console.log('\n✅ ✅ ✅ PASSWORD RESET SUCCESSFULLY! ✅ ✅ ✅\n');
        console.log('📧 Email:    ' + ADMIN_EMAIL);
        console.log('🔑 Password: ' + NEW_PASSWORD);
        console.log('🔐 Role:     admin\n');
        console.log('👉 You can now login at: http://localhost:3000/admin-login.html\n');

        await mongoose.connection.close();
        console.log('✅ Database connection closed');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

resetAdminPassword();
