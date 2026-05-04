const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Register User
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        user = new User({
            name,
            email,
            password,
            role
        });

        await user.save();

        // Generate token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Login User
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== ADMIN ENDPOINTS ====================

// Admin Login - Same as regular login but checks for admin role
router.post('/admin-login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if user is admin
        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized - Admin access required' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin Middleware - checks if user is admin
const adminAuth = (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Get all users (Admin only) - excludes passwords
router.get('/admin/all-users', auth, adminAuth, async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json({
            total: users.length,
            users: users
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user by ID (Admin only)
router.get('/admin/user/:id', auth, adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete user (Admin only)
router.delete('/admin/user/:id', auth, adminAuth, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted successfully', user: user.name });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user (Admin only)
router.put('/admin/user/:id', auth, adminAuth, async (req, res) => {
    try {
        const { name, email, role } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { name, email, role },
            { new: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;