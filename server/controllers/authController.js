const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendPasswordResetEmail, sendWelcomeEmail, sendOTPEmail } = require('../utils/emailService');

/**
 * In-memory OTP store for signup verification.
 * Structure: email -> { otp, expiresAt, name, password, role }
 * Entries are auto-invalidated after use or expiry.
 */
const signupOtpStore = new Map();

/**
 * Helper to generate JWT authentication tokens.
 */
const generateToken = (user) => {
    return jwt.sign(
        { userId: user._id, role: user.role, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
};

/**
 * Step 1 of 2-step signup: Send a 6-digit OTP to the provided email.
 * Validates inputs and checks for duplicate email before sending.
 */
const sendSignupOTP = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'All registration fields are required.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'This email address is already registered.' });
        }

        // Generate a 6-digit numeric OTP
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

        // Store OTP entry (overwrites any previous pending OTP for this email)
        signupOtpStore.set(email, { otp, expiresAt, name, password, role });

        // Send OTP email
        const emailResult = await sendOTPEmail(name, email, otp);
        if (!emailResult.success && !emailResult.skipped) {
            signupOtpStore.delete(email);
            return res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
        }

        return res.json({
            success: true,
            message: `Verification code sent to ${email}. It expires in 10 minutes.`,
            // In development, expose OTP in console for testing
        });
    } catch (error) {
        console.error('Send Signup OTP Error:', error);
        return res.status(500).json({ message: 'Server error while sending verification code.' });
    }
};

/**
 * Step 2 of 2-step signup: Verify OTP and create the user account.
 */
const signup = async (req, res) => {
    try {
        const { name, email, password, role, otp } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'All registration fields are required.' });
        }

        if (!otp) {
            return res.status(400).json({ message: 'Verification code is required.' });
        }

        // Validate OTP from store
        const pending = signupOtpStore.get(email);
        if (!pending) {
            return res.status(400).json({ message: 'No pending verification found for this email. Please request a new code.' });
        }
        if (Date.now() > pending.expiresAt) {
            signupOtpStore.delete(email);
            return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
        }
        if (pending.otp !== String(otp).trim()) {
            return res.status(400).json({ message: 'Incorrect verification code. Please try again.' });
        }

        // OTP validated — remove from store
        signupOtpStore.delete(email);

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email address is already registered.' });
        }

        const user = new User({
            name,
            email,
            password,
            role,
            isEmailVerified: true
        });

        await user.save();

        // Silent dispatch of welcome email
        await sendWelcomeEmail(name, email);

        const token = generateToken(user);

        // Secure HttpOnly cookie creation
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 Hours
        });

        return res.status(201).json({
            success: true,
            message: 'User account created successfully.',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Signup Error:', error);
        return res.status(500).json({ message: 'Server error occurred during account registration.' });
    }
};

/**
 * Handles general Login authentication.
 */
const login = async (req, res) => {
    try {
        const { email, password, expectedRole } = req.body;
        const normalizedEmail = email ? String(email).trim().toLowerCase() : '';
        console.log(`🔍 [DEBUG] Login attempt: email="${normalizedEmail}" | origin="${req.headers.origin}" | ip="${req.ip}"`);

        if (!normalizedEmail || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const user = await User.findOne({ email: normalizedEmail });
        console.log(`🔍 [DEBUG] User found: ${user ? `YES (${user.email})` : 'NO - not in DB'}`);
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const isMatch = await user.comparePassword(password);
        console.log(`🔍 [DEBUG] Password match: ${isMatch}`);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Validate expectedRole if provided
        if (expectedRole && user.role !== expectedRole) {
            return res.status(403).json({ message: `This login is for ${expectedRole} accounts only. Please use the correct portal for your account type.` });
        }

        // Track user login timestamps — use updateOne to avoid triggering
        // the pre('save') bcrypt hook which would double-hash the password.
        await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });

        const token = generateToken(user);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 Hours
        });

        return res.json({
            success: true,
            message: 'Logged in successfully.',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({ message: 'Server error occurred during authentication.' });
    }
};

/**
 * Obtains profiles for currently authenticated users.
 */
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password -passwordResetToken -emailVerificationToken');
        if (!user) {
            return res.status(404).json({ message: 'User account not found.' });
        }
        return res.json(user);
    } catch (error) {
        console.error('Profile Error:', error);
        return res.status(500).json({ message: 'Server error occurred while pulling user profiles.' });
    }
};

/**
 * Resets user sessions and clears HTTP cookies.
 */
const logout = (req, res) => {
    res.clearCookie('token');
    return res.json({ success: true, message: 'Logged out successfully.' });
};

/**
 * Initiates Forgot Password token allocations.
 */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email address is required.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            // Conceal user existence for security
            return res.json({ 
                success: true, 
                message: 'If an account exists under this email, a secure reset link will be sent.' 
            });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.passwordResetToken = tokenHash;
        user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 Hour lifespan
        await user.save();

        const reqOrigin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : '') || process.env.FRONTEND_URL || 'http://localhost:5173';
        const emailResult = await sendPasswordResetEmail(email, resetToken, reqOrigin);

        if (emailResult.success) {
            return res.json({ success: true, message: 'Reset instruction email dispatched successfully.' });
        } else {
            return res.status(500).json({ success: false, message: 'Unable to deliver password reset instructions. Try again.' });
        }
    } catch (error) {
        console.error('Forgot Password Error:', error);
        return res.status(500).json({ message: 'Server error occurred during password reset invocation.' });
    }
};

/**
 * Performs final Password Overwrites based on tokens.
 */
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token and new password values are required.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
        }

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            passwordResetToken: tokenHash,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
        }

        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        return res.json({ success: true, message: 'Password updated successfully. You can now login.' });
    } catch (error) {
        console.error('Reset Password Error:', error);
        return res.status(500).json({ message: 'Server error occurred during password reset.' });
    }
};

/**
 * Admin Login Authentication Endpoint.
 */
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admin credentials required.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        user.lastLoginAt = new Date();
        await user.save();

        const token = generateToken(user);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });

        return res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Admin Login Error:', error);
        return res.status(500).json({ message: 'Server error occurred during admin access.' });
    }
};

/**
 * Admin: Retrieve all users.
 */
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password -passwordResetToken -emailVerificationToken');
        return res.json({
            total: users.length,
            users
        });
    } catch (error) {
        console.error('Admin Get Users Error:', error);
        return res.status(500).json({ message: 'Server error occurred while pulling user registries.' });
    }
};

/**
 * Admin: Retrieve single user by ID.
 */
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password -passwordResetToken -emailVerificationToken');
        if (!user) {
            return res.status(404).json({ message: 'User account not found.' });
        }
        return res.json(user);
    } catch (error) {
        console.error('Admin Get User ID Error:', error);
        return res.status(500).json({ message: 'Server error occurred.' });
    }
};

/**
 * Admin: Modify user profiles.
 */
const updateUser = async (req, res) => {
    try {
        const { name, email, role } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { name, email, role, updatedAt: new Date() },
            { new: true }
        ).select('-password -passwordResetToken -emailVerificationToken');

        if (!user) {
            return res.status(404).json({ message: 'User account not found.' });
        }

        return res.json({ success: true, message: 'User account updated successfully.', user });
    } catch (error) {
        console.error('Admin Update User Error:', error);
        return res.status(500).json({ message: 'Server error occurred.' });
    }
};

/**
 * Admin: Remove user account.
 */
const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User account not found.' });
        }
        return res.json({ success: true, message: 'User account deleted successfully.', user: user.name });
    } catch (error) {
        console.error('Admin Delete User Error:', error);
        return res.status(500).json({ message: 'Server error occurred.' });
    }
};

/**
 * User: Self-remove account.
 */
const deleteOwnAccount = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User account not found.' });
        }
        return res.json({ success: true, message: 'Your account has been deleted successfully.' });
    } catch (error) {
        console.error('Delete Own Account Error:', error);
        return res.status(500).json({ message: 'Server error occurred during account deletion.' });
    }
};

module.exports = {
    sendSignupOTP,
    signup,
    login,
    getProfile,
    logout,
    forgotPassword,
    resetPassword,
    adminLogin,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    deleteOwnAccount
};
