const nodemailer = require('nodemailer');

/**
 * Configure Nodemailer transport.
 * Allows using Gmail or other custom SMTP relays.
 */
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password'
    }
});

const isMockEmail = (email) => {
    if (!email) return true;
    const domain = String(email).split('@')[1]?.toLowerCase() || '';
    const mockDomains = ['qnario.com', 'example.com', 'test.com', 'localhost.localdomain', 'localhost'];
    return mockDomains.includes(domain) || domain.endsWith('.test') || domain.endsWith('.invalid');
};

/**
 * Dispatches a password reset URL to a user.
 * @param {string} userEmail - Target user email address
 * @param {string} resetToken - Generated verification token
 */
async function sendPasswordResetEmail(userEmail, resetToken, requestOrigin) {
    try {
        if (isMockEmail(userEmail)) {
            console.log(`✉️ [Email Service] Skipping email dispatch for mock address: "${userEmail}"`);
            return { success: true, skipped: true };
        }
        const baseUrl = requestOrigin || process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: process.env.EMAIL_USER || 'noreply@qnario.com',
            to: userEmail,
            subject: 'QNARIO - Password Reset Request',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #667eea; text-align: center;">Password Reset Request</h2>
                    <p>You requested a password reset for your QNARIO account.</p>
                    <p>Click the button below to reset your password:</p>
                    <div style="text-align: center;">
                        <a href="${resetUrl}" style="
                            display: inline-block;
                            padding: 12px 30px;
                            background: linear-gradient(135deg, #667eea, #764ba2);
                            color: white;
                            text-decoration: none;
                            border-radius: 8px;
                            margin: 20px 0;
                            font-weight: bold;
                        ">Reset Password</a>
                    </div>
                    <p>Or copy this link to your browser:</p>
                    <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
                    <p style="color: #999; font-size: 12px; margin-top: 30px;">
                        This link expires in 1 hour.<br/>
                        If you did not request this, please ignore this email.
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
 * Dispatches a welcome confirmation email to a newly signed-up user.
 * @param {string} userName - Name of the registered user
 * @param {string} userEmail - Target user email address
 */
async function sendWelcomeEmail(userName, userEmail) {
    try {
        if (isMockEmail(userEmail)) {
            console.log(`✉️ [Email Service] Skipping email dispatch for mock address: "${userEmail}"`);
            return { success: true, skipped: true };
        }
        const mailOptions = {
            from: process.env.EMAIL_USER || 'noreply@qnario.com',
            to: userEmail,
            subject: 'Welcome to QNARIO!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #667eea; text-align: center;">Welcome to QNARIO! 🎓</h2>
                    <p>Hi ${userName},</p>
                    <p>Your account has been successfully created!</p>
                    <p>You can now login and start using QNARIO to take and manage proctored exams.</p>
                    <div style="text-align: center;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" style="
                            display: inline-block;
                            padding: 12px 30px;
                            background: linear-gradient(135deg, #667eea, #764ba2);
                            color: white;
                            text-decoration: none;
                            border-radius: 8px;
                            margin: 20px 0;
                            font-weight: bold;
                        ">Go to QNARIO Dashboard</a>
                    </div>
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

/**
 * Sends a 6-digit OTP code to verify email ownership during signup.
 * @param {string} userName - The registrant's name
 * @param {string} userEmail - Target email address
 * @param {string} otp - 6-digit OTP code
 */
async function sendOTPEmail(userName, userEmail, otp) {
    try {
        if (isMockEmail(userEmail)) {
            console.log(`✉️ [Email Service] Skipping OTP email for mock address: "${userEmail}" | OTP: ${otp}`);
            return { success: true, skipped: true };
        }
        const mailOptions = {
            from: `"Qnario" <${process.env.EMAIL_USER || 'noreply@qnario.com'}>`,
            to: userEmail,
            subject: 'Qnario — Your Email Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #0f1228; color: #ffffff; border-radius: 16px; overflow: hidden;">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 32px 40px; text-align: center;">
                        <h1 style="margin: 0; font-size: 2rem; font-weight: 800; letter-spacing: -0.5px;">Qnario</h1>
                        <p style="margin: 6px 0 0; opacity: 0.85; font-size: 0.9rem;">AI-Powered Exam Platform</p>
                    </div>
                    <!-- Body -->
                    <div style="padding: 36px 40px;">
                        <p style="margin: 0 0 8px; font-size: 1rem;">Hi <strong>${userName}</strong>,</p>
                        <p style="margin: 0 0 28px; color: #a0aec0; font-size: 0.92rem; line-height: 1.6;">
                            You're almost there! Use the verification code below to complete your Qnario account registration.
                        </p>
                        <!-- OTP Box -->
                        <div style="text-align: center; margin: 0 0 28px;">
                            <div style="
                                display: inline-block;
                                background: rgba(102, 126, 234, 0.1);
                                border: 2px solid rgba(102, 126, 234, 0.4);
                                border-radius: 14px;
                                padding: 20px 48px;
                            ">
                                <p style="margin: 0 0 4px; font-size: 0.75rem; letter-spacing: 2px; color: #a78bfa; font-weight: 700;">VERIFICATION CODE</p>
                                <p style="margin: 0; font-size: 2.8rem; font-weight: 900; letter-spacing: 12px; color: #ffffff; font-family: monospace;">${otp}</p>
                            </div>
                        </div>
                        <p style="color: #f59e0b; font-size: 0.85rem; text-align: center; margin: 0 0 24px;">
                            ⏱️ This code expires in <strong>10 minutes</strong>.
                        </p>
                        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 0 0 24px;" />
                        <p style="color: #718096; font-size: 0.8rem; line-height: 1.6; margin: 0;">
                            If you did not attempt to register on Qnario, please ignore this email. No account will be created without the verification code.
                        </p>
                    </div>
                    <!-- Footer -->
                    <div style="background: rgba(0,0,0,0.2); padding: 16px 40px; text-align: center;">
                        <p style="margin: 0; color: #4a5568; font-size: 0.75rem;">© 2026 Qnario. All rights reserved.</p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('OTP email send error:', error);
        return { success: false, message: 'Failed to send OTP email.' };
    }
}

module.exports = {
    sendPasswordResetEmail,
    sendWelcomeEmail,
    sendOTPEmail
};
