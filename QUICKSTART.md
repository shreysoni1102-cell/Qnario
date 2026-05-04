# 🚀 QNARIO - QUICK START GUIDE

## Start All Services in 1 Click!

### **Windows Users**
Simply double-click:
```
startup-all.bat
```

Or in PowerShell:
```powershell
.\startup-all.ps1
```

### **Linux/Mac Users**
```bash
chmod +x startup-all.sh
./startup-all.sh
```

---

## ✅ Services Will Start:

1. **Backend** → http://localhost:3000 (API Server)
2. **Frontend** → http://localhost:3001 (Web App)
3. **Microservice** → http://localhost:5000 (AI Engine)

---

## 🌐 Open Your Browser

Go to: **http://localhost:3001**

You'll see the Qnario landing page.

---

## 👤 Test Login (Optional)

**Role Selection Page** will show three options:
- Admin
- Teacher
- Student

Choose one and test the login flow.

---

## 🛑 Stop Services

Close the terminal windows where services are running.

---

## ⚠️ Pre-Requisites (First Time Only)

Make sure you have:
1. **Node.js** installed → [nodejs.org](https://nodejs.org)
2. **Python 3.x** installed → [python.org](https://www.python.org)
3. **MongoDB** running locally
   - Windows: `mongod` in PowerShell
   - Mac: `brew services start mongodb-community`
   - Linux: `sudo systemctl start mongod`

---

## 🔧 Manual Start (If Scripts Don't Work)

**Terminal 1 - Backend:**
```bash
cd backend
npm install  # Only first time
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
source venv/bin/activate  # or venv\Scripts\activate on Windows
python app.py
```

---

## 📍 Important URLs

| Component | URL |
|-----------|-----|
| Frontend (User Interface) | http://localhost:3001 |
| Backend (API) | http://localhost:3000 |
| Microservice (AI) | http://localhost:5000 |

---

## 🆘 Troubleshooting

### **Services won't start?**
1. Check if ports 3000, 3001, 5000 are free
2. Make sure MongoDB is running
3. Check Node.js and Python are installed

### **Can't login?**
1. Check backend is running at http://localhost:3000
2. Check database connection in backend/.env
3. Look at terminal errors

### **AI questions not generating?**
1. Check microservice is running at http://localhost:5000
2. Check GROQ_API_KEY in backend/.env
3. Look at terminal errors

---

## 📚 Learn More

- **Full Guide**: Read `README.md`
- **Backend Setup**: Read `backend/README.md`
- **Frontend Setup**: Read `frontend/README.md`
- **Verification**: Read `SEPARATION-VERIFICATION.md`

---

## 🎉 That's It!

Your Qnario platform is now running with:
- ✓ Separated Frontend & Backend
- ✓ Real-time Features
- ✓ AI Integration
- ✓ Database
- ✓ Authentication

Enjoy! 🎓
