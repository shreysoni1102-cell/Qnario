const jwt = require('jsonwebtoken');

/**
 * Express middleware to authenticate users using JWTs.
 * Extracts the token from the Authorization header and verifies it.
 */
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        const token = authHeader?.startsWith('Bearer ') 
            ? authHeader.replace('Bearer ', '') 
            : req.cookies?.token; // fallback to cookies if configured

        if (!token) {
            return res.status(401).json({ message: 'Authentication required. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Contains id, email, role, etc.
        next();
    } catch (error) {
        console.error('JWT Auth Error:', error.message || error);
        return res.status(401).json({ message: 'Authentication failed. Invalid or expired token.' });
    }
};

/**
 * Middleware factory to restrict routes to specific roles.
 * Must be executed after the authenticate middleware.
 * @param {...string} roles - List of allowed roles (e.g., 'teacher', 'admin')
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(500).json({ message: 'Authorization error: User profile not authenticated.' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Access denied. Authorized roles: [${roles.join(', ')}]. Your role: '${req.user.role}'` 
            });
        }

        next();
    };
};

module.exports = {
    authenticate,
    authorize
};
