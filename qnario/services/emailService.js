/**
 * Email Service for Password Reset
 * Uses nodemailer to send password reset emails
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

// Configure your email service here
// For Gmail: https://myaccount.google.com/apppasswords
// For other services: adjust accordingly

const transporter = nodemailer.createTransport({
    service: 'gmail', // Change if using different email service
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password'
    }
});

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(userEmail, resetToken) {
    try {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password.html?token=${resetToken}`;

        const mailOptions = {
            from: process.env.EMAIL_USER || 'noreply@qnario.com',
            to: userEmail,
            subject: 'QNARIO - Password Reset Request',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #667eea;">Password Reset Request</h2>
                    <p>You requested a password reset for your QNARIO account.</p>
                    <p>Click the button below to reset your password:</p>
                    
                    <a href="${resetUrl}" style="
                        display: inline-block;
                        padding: 12px 30px;
                        background: linear-gradient(135deg, #667eea, #764ba2);
                        color: white;
                        text-decoration: none;
                        border-radius: 8px;
                        margin: 20px 0;
                    ">Reset Password</a>
                    
                    <p>Or copy this link:</p>
                    <p>${resetUrl}</p>
                    
                    <p style="color: #999; font-size: 12px;">
                        This link expires in 1 hour.
                        If you didn't request this, ignore this email.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        return { success: true, message: 'Reset email sent successfully' };
    } catch (error) {
        console.error('Email send error:', error);
        return { success: false, message: 'Failed to send reset email' };
    }
}

/**
 * Send welcome email
 */
async function sendWelcomeEmail(userName, userEmail) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER || 'noreply@qnario.com',
            to: userEmail,
            subject: 'Welcome to QNARIO!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #667eea;">Welcome to QNARIO! 🎓</h2>
                    <p>Hi ${userName},</p>
                    <p>Your account has been successfully created!</p>
                    <p>You can now login and start using QNARIO:</p>
                    
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/role-selection.html" style="
                        display: inline-block;
                        padding: 12px 30px;
                        background: linear-gradient(135deg, #667eea, #764ba2);
                        color: white;
                        text-decoration: none;
                        border-radius: 8px;
                        margin: 20px 0;
                    ">Go to QNARIO</a>
                    
                    <p>If you have any questions, feel free to contact us.</p>
                    <p>Happy learning! 📚</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Welcome email error:', error);
        return { success: false };
    }
}

module.exports = {
    sendPasswordResetEmail,
    sendWelcomeEmail
};
