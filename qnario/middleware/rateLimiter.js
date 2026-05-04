/**
 * Rate Limiting Middleware
 * Prevents brute force attacks on login/signup endpoints
 */

const rateLimit = require('express-rate-limit');

// Limit login attempts: 5 attempts per 15 minutes
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many login attempts. Please try again after 15 minutes.',
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Limit signup attempts: 3 per hour per IP
const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: 'Too many accounts created from this IP. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Limit password reset: 3 per hour
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: 'Too many password reset requests. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    loginLimiter,
    signupLimiter,
    passwordResetLimiter
};
