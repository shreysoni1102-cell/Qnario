const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const examRoutes = require('./routes/examRoutes');
const registerSocketHandlers = require('./socket/socketHandler');
const { examRooms } = require('./controllers/examController');
const { apiLimiter } = require('./middleware/rateLimiter');
const { getDocsHTML } = require('./utils/docsTemplate');

const app = express();
const corsOrigin = (origin, callback) => {
    if (!origin) return callback(null, true);
    const isLocal = origin.includes('localhost') || 
                    origin.includes('127.0.0.1') || 
                    origin.startsWith('http://192.168.') || 
                    origin.startsWith('http://10.') || 
                    origin.startsWith('http://172.');
    const isTunnel = origin.includes('ngrok-free.app') || 
                    origin.includes('ngrok-free.dev') || 
                    origin.includes('ngrok.io') ||
                    origin.includes('ngrok.dev') ||
                    origin.includes('trycloudflare.com') ||
                    origin.includes('cloudflareaccess.com');
    if (isLocal || isTunnel || origin === process.env.FRONTEND_URL) {
        callback(null, true);
    } else {
        callback(new Error('Not allowed by CORS'));
    }
};

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: corsOrigin,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        credentials: true
    }
});

const PORT = process.env.PORT || 3000;

// ==================== DATABASE INITIALIZATION ====================
connectDB().catch((err) => {
    console.error('⚠️ Direct database connection failed. Server running in disconnected state.', err.message);
});

// ==================== SECURITY & GLOBAL MIDDLEWARE ====================
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(cors({
    origin: corsOrigin,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ==================== REQUEST LOGGER (DEBUG) ====================
app.use('/api', (req, res, next) => {
    console.log(`📨 [REQUEST] ${req.method} ${req.path} | origin="${req.headers.origin || 'none'}" | ip="${req.ip}"`);
    next();
});

// Global rate limiting DISABLED for LAN/ngrok testing
// app.use('/api', apiLimiter);

// ==================== CRASH RECOVERY PERSISTENCY ====================
// Automatically snapshot active exam rooms to disk every 5 seconds
const examRoomsFile = path.join(__dirname, 'exam-rooms.json');

const loadExamRoomsBackup = () => {
    if (!fs.existsSync(examRoomsFile)) return;
    try {
        const data = JSON.parse(fs.readFileSync(examRoomsFile, 'utf8'));
        Object.assign(examRooms, data);
        console.log(`💾 [Crash Recovery] Restored ${Object.keys(examRooms).length} active exam rooms from backup.`);
    } catch (e) {
        console.warn('⚠️ [Crash Recovery] Failed to restore exam room backup:', e.message);
    }
};

const saveExamRoomsBackup = () => {
    try {
        fs.writeFileSync(examRoomsFile, JSON.stringify(examRooms, null, 2), 'utf8');
    } catch (e) {
        console.error('⚠️ [Crash Recovery] Failed to save exam room snapshot:', e.message);
    }
};

// Restore active state upon startup
loadExamRoomsBackup();

// Start persistence backup interval
let backupInterval;
if (process.env.NODE_ENV !== 'test') {
    backupInterval = setInterval(saveExamRoomsBackup, 5000);
}

// ==================== ROUTE REGISTRATIONS ====================
app.use('/api/auth', authRoutes);
app.use('/api', examRoutes);

// General Health Check
app.get('/api/health', (req, res) => {
    return res.status(200).json({
        status: 'healthy',
        service: 'Qnario Core MVC Backend API',
        timestamp: new Date(),
        activeExamRooms: Object.keys(examRooms).length
    });
});

// Swagger API Documentations Endpoint (Stunning Glassmorphic Visual Explorer)
app.get('/api/docs', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    const activeRoomsCount = Object.keys(examRooms).length;
    return res.status(200).send(getDocsHTML(PORT, activeRoomsCount));
});

// ==================== WEBSOCKET INTEGRATION ====================
registerSocketHandlers(io);

// ==================== ERROR HANDLING MIDDLEWARES ====================
app.use((req, res) => {
    return res.status(404).json({ success: false, error: `Route not found: ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
    console.error('🔥 [Fatal Error]:', err.stack || err.message);
    return res.status(500).json({ success: false, error: 'Internal system error occurred.' });
});

// ==================== SERVER BOOTSTRAPPING ====================
if (require.main === module) {
    httpServer.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Qnario Core MVC Server active on port: ${PORT} (all interfaces)`);
        console.log(`📄 Swagger documentation specifications available at http://localhost:${PORT}/api/docs`);
        console.log('⚡ Socket.io proctoring connection listeners successfully registered.');
    });
}

module.exports = { app, httpServer };
