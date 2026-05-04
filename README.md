# 🎓 QNARIO - Multi-Service Architecture

A complete educational platform with **separated backend and frontend** services + Python microservice for AI.

---

## 📋 Project Structure After Separation

```
Qnario-C01/
│
├── 📁 backend/                 (Node.js/Express API Server)
│   ├── server.js
│   ├── package.json
│   ├── .env
│   ├── config/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── README.md
│
├── 📁 frontend/                (HTML/CSS/JS Application)
│   ├── config.js              (API Configuration)
│   ├── *.html                 (All pages)
│   ├── js/                    (JavaScript files)
│   ├── css/                   (Stylesheets)
│   ├── data/                  (JSON files)
│   └── README.md
│
├── 📁 gemini-microservice/     (Python AI Service)
│   ├── app.py
│   ├── config.py
│   ├── requirements.txt
│   └── venv/
│
├── startup-all.bat            (Windows startup)
├── startup-all.sh             (Linux/Mac startup)
├── startup-all.ps1            (PowerShell startup)
└── README.md                  (This file)
```

---

## 🚀 Quick Start

### **Option 1: Automated Startup (Windows)**

**For Command Prompt:**
```bash
startup-all.bat
```

**For PowerShell:**
```powershell
.\startup-all.ps1
```

### **Option 2: Automated Startup (Linux/Mac)**

```bash
chmod +x startup-all.sh
./startup-all.sh
```

### **Option 3: Manual Startup**

**Terminal 1 - Backend:**
```bash
cd backend
npm install  # First time only
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npx http-server -p 3001 -c-1
```

**Terminal 3 - Microservice:**
```bash
cd gemini-microservice
source venv/bin/activate  # On Windows: venv\Scripts\activate
python app.py
```

---

## 🌐 Access Points

| Service | URL | Port | Purpose |
|---------|-----|------|---------|
| **Frontend** | http://localhost:3001 | 3001 | User Interface |
| **Backend API** | http://localhost:3000 | 3000 | REST API & WebSocket |
| **Microservice** | http://localhost:5000 | 5000 | AI Question Generation |

---

## ⚙️ Configuration

### Backend (.env)
Located in `backend/.env`

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/qnario
JWT_SECRET=your_jwt_secret_key
AI_MICROSERVICE_URL=http://localhost:5000
CORS_ORIGIN=http://localhost:3001
```

### Frontend (config.js)
Located in `frontend/config.js`

```javascript
const API_BASE_URL = 'http://localhost:3000';
const SOCKET_URL = 'http://localhost:3000';
```

### Microservice (.env)
Located in `gemini-microservice/.env` or `config.py`

---

## 📡 Communication Flow

```
┌─────────────────────────────┐
│  Frontend (Port 3001)       │
│  User Interface             │
└──────────────┬──────────────┘
               │ HTTP REST Requests
               │ /api/auth/*
               │ /api/generate-questions
               ▼
┌─────────────────────────────┐
│  Backend (Port 3000)        │
│  Express.js API Server      │
│  MongoDB Connection         │
└──────────────┬──────────────┘
               │ axios calls
               │ /api/generate-questions
               ▼
┌─────────────────────────────┐
│ Microservice (Port 5000)    │
│ Python/Flask AI Service     │
│ Groq/Gemini Integration     │
└─────────────────────────────┘
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/admin-login` - Admin login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/login` - Student/Teacher login
- `POST /api/signup` - User registration

### Question Generation (AI)
- `POST /api/generate-questions` - Generate questions using AI
- `POST /api/save-generated-questions` - Save generated questions
- `POST /api/generate-insights` - Generate insights

### Exams & Quizzes
- `POST /api/exams/{id}` - Get exam details
- `POST /api/quizzes/create` - Create quiz
- `POST /api/quizzes/join` - Join quiz
- `POST /api/quizzes/{id}/submit` - Submit quiz
- `GET /api/quizzes/analytics` - Get quiz analytics

### Syllabus & Papers
- `POST /api/syllabus/upload` - Upload syllabus
- `GET /api/syllabus-papers` - Get all papers
- `POST /api/exam-room/create` - Create exam room

---

## 📦 Dependencies

### Backend
- Express.js 5.1.0
- MongoDB/Mongoose 8.0.3
- Socket.io 4.8.3
- CORS enabled
- JWT authentication

### Frontend
- Vanilla JavaScript (ES6+)
- HTML5
- CSS3
- Fetch API for HTTP calls
- Socket.io client library

### Microservice
- Python 3.x
- Flask with CORS
- Groq API
- PDF parsing libraries

---

## ✅ Features

✓ **Separated Frontend & Backend** - Easy to maintain and scale  
✓ **Real-time Communication** - Socket.io for live exams  
✓ **AI Integration** - Question generation using Groq  
✓ **Role-Based Access** - Admin, Teacher, Student  
✓ **JWT Authentication** - Secure API endpoints  
✓ **CORS Configured** - Cross-origin requests handled  
✓ **Database Integration** - MongoDB for data persistence  
✓ **Microservices Architecture** - Scalable design  

---

## 🔍 Testing the Integration

### 1. **Test Backend Health**
```bash
curl http://localhost:3000/health
```

### 2. **Test Frontend**
Open browser: `http://localhost:3001`

### 3. **Test AI Microservice**
```bash
curl http://localhost:5000/health
```

### 4. **Test API Call (Login)**
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

## 🛠️ Troubleshooting

### **Frontend can't reach Backend?**
- Check `frontend/config.js` - API_BASE_URL should be `http://localhost:3000`
- Check CORS settings in `backend/server.js` - should include frontend URL
- Check if backend is running on port 3000

### **MongoDB connection failed?**
- Ensure MongoDB is running: `mongod`
- Check connection string in `backend/.env`
- Default: `mongodb://localhost:27017/qnario`

### **Microservice not responding?**
- Check if Python is installed: `python --version`
- Check virtual environment is activated
- Check Groq API key in microservice config
- Review `gemini-microservice/app.py` for error logs

### **Port already in use?**
- Find process: `lsof -i :3000` (Mac/Linux) or `netstat -ano | findstr :3000` (Windows)
- Kill process and restart
- Or change PORT in `.env` files

---

## 📝 Development Notes

### Making API Changes
1. Update backend routes in `backend/routes/`
2. Update frontend fetch calls - already configured to use `API_BASE_URL`
3. No need to hardcode URLs anymore!

### Switching between Environments
Just change `API_BASE_URL` in `frontend/config.js`:
- **Development**: `http://localhost:3000`
- **Production**: `https://api.yourdomain.com`

### Real-time Features
Socket.io connections automatically use `SOCKET_URL` from config.

---

## 🚢 Deployment Ready

The separated architecture is ready for:
- **Docker containerization** - Each service in its own container
- **Kubernetes orchestration** - Scale services independently
- **Cloud deployment** - AWS, Azure, Google Cloud compatible
- **CI/CD pipelines** - GitHub Actions, GitLab CI, etc.

---

## 📞 Support

For issues or questions:
1. Check individual service READMEs: `backend/README.md`, `frontend/README.md`
2. Review error logs in terminal windows
3. Check API documentation in backend routes

---

## 📄 License

Qnario Platform - Educational Use

---

**Last Updated:** April 26, 2026  
**Version:** 2.0 (Multi-Service Architecture)
