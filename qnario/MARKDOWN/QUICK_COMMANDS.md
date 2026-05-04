# ⚡ QUICK COMMANDS - COPY & PASTE

## 🚀 FASTEST WAY TO GET STARTED

### Command 1: Install everything
```bash
cd E:\CHECKING\ 1\qnario
npm install
```
**Time: 2 min**

---

### Command 2: Setup MongoDB Atlas (DO THIS)

**Go to:** https://www.mongodb.com/cloud/atlas

1. Create free account
2. Create cluster (wait 2-3 min)
3. Click "Connect" → "Connect your application"
4. Copy connection string
5. Edit `.env` file and replace MONGODB_URI with your string

**Example:**
```
MONGODB_URI=mongodb+srv://myusername:mypassword@cluster0.xxxxx.mongodb.net/exam-platform?retryWrites=true&w=majority
PORT=3000
```

**Time: 5 min**

---

### Command 3: Seed database
```bash
node init-database.js
```
**Time: 1 min**

---

### Command 4: Start server
```bash
node server.js
```
**Time: 30 sec**

---

### Command 5: Test API
```bash
curl http://localhost:3000/api/exams
```

Or open browser: http://localhost:3000/api/exams

**Time: 1 min**

---

## ✅ YOU'RE DONE!

Total time: **~10 minutes**

Your exam platform is now:
- ✅ Running
- ✅ Has sample data
- ✅ Ready to use

---

## 🔗 TEST THESE URLS IN YOUR BROWSER

1. Get all exams:
```
http://localhost:3000/api/exams
```

2. Get Physics questions:
```
http://localhost:3000/api/questions?subject=Physics
```

3. Get JEE Main exam:
```
http://localhost:3000/api/exams?exam=JEE%20Main
```

4. Get practice test:
```
http://localhost:3000/api/practice-test?exam=JEE%20Main&subject=Physics&count=5
```

---

## 📝 ADD YOUR OWN DATA

### Add a new question to the database:

```bash
curl -X POST http://localhost:3000/api/questions \
  -H "Content-Type: application/json" \
  -d '{
    "text": "What is the speed of light?",
    "type": "MCQ",
    "marks": 4,
    "examName": "JEE Main",
    "subjectName": "Physics",
    "topicName": "Mechanics",
    "difficulty": "Easy",
    "options": ["3×10^8 m/s", "2×10^8 m/s", "4×10^8 m/s", "1×10^8 m/s"],
    "answer": {
      "correctOption": "3×10^8 m/s",
      "explanation": "Speed of light in vacuum is 3×10^8 m/s"
    }
  }'
```

---

## 👨‍🎓 STUDENT TAKES EXAM

### Step 1: Get practice test
```bash
curl http://localhost:3000/api/practice-test?exam=JEE%20Main&subject=Physics&count=10
```

### Step 2: Submit answer
```bash
curl -X POST http://localhost:3000/api/attempts/submit \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student_123",
    "examId": "JEE_MAIN",
    "questionId": "QUESTION_ID_HERE",
    "selectedAnswer": "A"
  }'
```

### Step 3: Generate result
```bash
curl -X POST http://localhost:3000/api/results/generate \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student_123",
    "examId": "JEE_MAIN"
  }'
```

### Step 4: Get student dashboard
```bash
curl http://localhost:3000/api/dashboard/student/student_123
```

---

## 🐛 IF SOMETHING BREAKS

### Error: "Cannot find module"
```bash
npm install
```

### Error: "MongoDB connection refused"
→ Setup MongoDB Atlas (https://www.mongodb.com/cloud/atlas)
→ Update .env file
→ Try again

### Error: "Port 3000 already in use"
```bash
# Change port in .env to 3001 or kill process on port 3000
```

### Error: "No data in database"
```bash
node init-database.js
```

---

## 📊 DATABASE STRUCTURE

```
Database: exam-platform

Collections:
├── subjects (6 documents)
│   Physics, Chemistry, Biology, Math, English, History
│
├── exams (3 documents)
│   JEE Main, NEET, 12th Board
│
├── topics (6 documents)
│   Mechanics, Thermodynamics, Bonding, Organic, Cell Bio, Genetics
│
├── questions (6+ documents)
│   Sample questions ready to use
│
├── student_attempts (grows with usage)
│   Records each student answer
│
├── student_results (grows with usage)
│   Stores exam results
│
├── exam_schedules (schedules)
│   Scheduled tests
│
└── analytics (performance data)
    Student performance analytics
```

---

## 🎯 NEXT WHAT TO DO

1. ✅ Run all commands above
2. ✅ Open http://localhost:3000/api/exams
3. ✅ See if you get 3 exams in JSON
4. ✅ If yes → EVERYTHING WORKS!
5. ✅ If no → Check error, follow troubleshooting

---

## 📞 NEED MORE HELP?

Read these files in qnario folder:
- EVERYTHING_READY.md (full status)
- SETUP_INSTRUCTIONS.md (step-by-step)
- MONGODB_SETUP.md (MongoDB help)
- STUDENT_EXAM_FLOW.md (how exams work)
- QUICK_START.md (frontend integration)

---

**Ready? Start with:**
```bash
npm install
```

**Then follow commands 2-5 above!** ✅
