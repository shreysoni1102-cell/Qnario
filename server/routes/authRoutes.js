const express = require('express');
const { body, validationResult } = require('express-validator');
const { 
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
    deleteUser
} = require('../controllers/authController');

const { authenticate, authorize } = require('../middleware/authMiddleware');
// Rate limiters temporarily disabled for LAN/ngrok testing
// const { loginLimiter, signupLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Helper to validate and return structural input violations
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// ==================== PUBLIC CREDENTIAL FLOWS ====================

// Step 1: Request OTP before signup
router.post(
    '/send-signup-otp',
    [
        body('name').trim().notEmpty().withMessage('Name is required.'),
        body('email').isEmail().withMessage('Please supply a valid email address.').normalizeEmail(),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
        body('role').isIn(['student', 'teacher', 'admin']).withMessage('Invalid registration role.')
    ],
    validateRequest,
    sendSignupOTP
);

// Step 2: Verify OTP and create account
router.post(
    '/signup',
    [
        body('name').trim().notEmpty().withMessage('Name is required.'),
        body('email').isEmail().withMessage('Please supply a valid email address.').normalizeEmail(),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
        body('role').isIn(['student', 'teacher', 'admin']).withMessage('Invalid registration role.'),
        body('otp').notEmpty().withMessage('Verification code is required.')
    ],
    validateRequest,
    signup
);

router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Please supply a valid email address.').normalizeEmail(),
        body('password').notEmpty().withMessage('Password is required.')
    ],
    validateRequest,
    login
);

router.post('/logout', authenticate, logout);

router.get('/profile', authenticate, getProfile);

// ==================== PASSWORD RECOVERY ACTIONS ====================

router.post(
    '/forgot-password',
    [
        body('email').isEmail().withMessage('Please supply a valid email address.').normalizeEmail()
    ],
    validateRequest,
    forgotPassword
);

router.post(
    '/reset-password',
    [
        body('token').notEmpty().withMessage('Verification token is required.'),
        body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long.')
    ],
    validateRequest,
    resetPassword
);

// ==================== ADMINISTRATIVE PORTAL ENDPOINTS ====================

router.post(
    '/admin-login',
    [
        body('email').isEmail().withMessage('Please supply a valid email address.').normalizeEmail(),
        body('password').notEmpty().withMessage('Password is required.')
    ],
    validateRequest,
    adminLogin
);

// Retrieve all user accounts (Admin Only)
router.get('/admin/all-users', authenticate, authorize('admin'), getAllUsers);

// Retrieve, Modify, or Delete singular accounts (Admin Only)
router.route('/admin/user/:id')
    .get(authenticate, authorize('admin'), getUserById)
    .put(
        authenticate,
        authorize('admin'),
        [
            body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
            body('email').optional().isEmail().withMessage('Please supply a valid email.').normalizeEmail(),
            body('role').optional().isIn(['student', 'teacher', 'admin']).withMessage('Invalid user role.')
        ],
        validateRequest,
        updateUser
    )
    .delete(authenticate, authorize('admin'), deleteUser);

router.get('/debug-env', (req, res) => {
    const rawUri = process.env.MONGODB_URI || 'NOT_SET';
    const maskedUri = rawUri.replace(/:([^@]+)@/, ':****@');
    return res.json({
        MONGODB_URI_masked: maskedUri,
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT
    });
});

module.exports = router;
