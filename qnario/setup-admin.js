/**
 * One-time Admin Setup Script
 * Creates the first admin user with properly hashed password
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/qnario';

// Admin credentials to set
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123'; // Change this to your desired password
const ADMIN_NAME = 'Admin User';

async function setupAdmin() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Import User model
        const User = require('./models/User');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
        if (existingAdmin) {
            console.log('⚠️  Admin user already exists!');
            console.log(`📧 Email: ${existingAdmin.email}`);
            console.log(`👤 Name: ${existingAdmin.name}`);
            console.log(`🔐 Role: ${existingAdmin.role}`);
            await mongoose.connection.close();
            return;
        }

        // Hash password
        console.log('🔐 Hashing password...');
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

        // Create admin user
        console.log('👤 Creating admin user...');
        const admin = new User({
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            password: hashedPassword,
            role: 'admin'
        });

        await admin.save();

        console.log('\n✅ ✅ ✅ ADMIN ACCOUNT CREATED SUCCESSFULLY! ✅ ✅ ✅\n');
        console.log('📧 Email:    ' + ADMIN_EMAIL);
        console.log('🔑 Password: ' + ADMIN_PASSWORD);
        console.log('🔐 Role:     admin\n');
        console.log('👉 You can now login at: http://localhost:3000/admin-login.html\n');

        await mongoose.connection.close();
        console.log('✅ Database connection closed');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

setupAdmin();
