/**
 * Debug Admin User Script
 * Check what's stored in the database
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/qnario';
const ADMIN_EMAIL = 'admin@example.com';
const TEST_PASSWORD = 'admin123';

async function debugAdmin() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Import User model
        const User = require('./models/User');

        // Find admin user
        const admin = await User.findOne({ email: ADMIN_EMAIL });
        
        if (!admin) {
            console.log('❌ Admin user not found!');
            await mongoose.connection.close();
            return;
        }

        console.log('\n📋 Admin User Details:');
        console.log('─'.repeat(50));
        console.log('Name:', admin.name);
        console.log('Email:', admin.email);
        console.log('Role:', admin.role);
        console.log('Hashed Password:', admin.password);
        console.log('Password Length:', admin.password ? admin.password.length : 0);

        // Test password comparison
        console.log('\n🔐 Testing Password Comparison:');
        console.log('─'.repeat(50));
        console.log('Testing password: "' + TEST_PASSWORD + '"');
        
        const isMatch = await admin.comparePassword(TEST_PASSWORD);
        console.log('Password matches:', isMatch);

        if (!isMatch) {
            console.log('\n❌ Password does NOT match!');
            console.log('📝 Here are the hashing details:');
            
            // Test bcrypt directly
            const testHash = await bcrypt.hash(TEST_PASSWORD, 10);
            console.log('\nDirect bcrypt test:');
            console.log('Test hash:', testHash);
            
            const directMatch = await bcrypt.compare(TEST_PASSWORD, admin.password);
            console.log('Direct bcrypt compare result:', directMatch);
        } else {
            console.log('\n✅ Password matches correctly!');
        }

        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

debugAdmin();
