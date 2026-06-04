const rateLimit = require('express-rate-limit');

// General API request rate-limit: 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { message: 'Too many API requests from this connection. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Sensitive auth login attempts: 5 requests per 15 minutes
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Sensitive registration limits: 3 signups per hour per IP
const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: { message: 'Too many accounts generated from this connection. Please try again after 1 hour.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Secure password reset request limit: 3 per hour
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: { message: 'Too many password reset requests from this connection. Please try again after 1 hour.' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    apiLimiter,
    loginLimiter,
    signupLimiter,
    passwordResetLimiter
};
