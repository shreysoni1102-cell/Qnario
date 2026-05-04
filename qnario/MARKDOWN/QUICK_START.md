# QUICK START - Get Database Running in 5 Minutes

## 🚀 Step-by-Step Setup

### Step 1: Install Required Packages (if not already installed)
```bash
npm install mongoose dotenv
```

### Step 2: Update your server.js

Add these lines to connect the database and load models:

```javascript
// In server.js

const mongoose = require('mongoose');
const connectDB = require('./config/db');

// Import models
const User = require('./models/User');
const Subject = require('./models/Subject');
const Exam = require('./models/Exam');
const Topic = require('./models/Topic');
const Question = require('./models/Question');
const StudentAttempt = require('./models/StudentAttempt');
const StudentResult = require('./models/StudentResult');
const ExamSchedule = require('./models/ExamSchedule');
const Analytics = require('./models/Analytics');

// Import routes
const examApi = require('./routes/exam-api');

// Connect to database
connectDB();

// Add route to app
app.use('/', examApi);

console.log('✅ Database models loaded');
console.log('✅ API routes ready');
```

### Step 3: Seed Initial Data

Create a new file: `init-database.js`

```javascript
// init-database.js
const connectDB = require('./config/db');
const { seedDatabase } = require('./seed-data');

async function initializeDatabase() {
    await connectDB();
    console.log('🔄 Seeding database...');
    await seedDatabase();
    console.log('✅ Database initialized!');
    process.exit(0);
}

initializeDatabase().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
```

Run it once:
```bash
node init-database.js
```

### Step 4: Test the APIs

#### Get all exams:
```bash
curl http://localhost:5000/api/exams
```

#### Get questions for JEE Main Physics (Easy):
```bash
curl "http://localhost:5000/api/questions?exam=JEE%20Main&subject=Physics&difficulty=Easy"
```

#### Submit a student answer:
```bash
curl -X POST http://localhost:5000/api/attempts/submit \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student_123",
    "examId": "exam_jee_main",
    "questionId": "q_001",
    "selectedAnswer": "B"
  }'
```

#### Generate exam result:
```bash
curl -X POST http://localhost:5000/api/results/generate \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student_123",
    "examId": "exam_jee_main"
  }'
```

---

## 📋 Database Collections Created

After seeding, you'll have:

```
✓ users (existing)
✓ subjects (6 records: Physics, Chemistry, Biology, Math, English, History)
✓ exams (3 records: JEE Main, NEET, 12th Board)
✓ topics (6 records: Sample topics)
✓ questions (6 records: Sample questions)
✓ student_attempts (empty, ready for students)
✓ student_results (empty, ready for results)
✓ exam_schedules (empty, ready for scheduling)
✓ analytics (empty, ready for analytics)
```

---

## 🔗 Frontend Integration Examples

### React Component Example: Display Questions

```jsx
import React, { useState, useEffect } from 'react';

function QuestionDisplay() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch questions
    fetch('/api/questions?exam=JEE Main&subject=Physics&difficulty=Easy')
      .then(res => res.json())
      .then(data => {
        setQuestions(data.questions);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {questions.map(q => (
        <div key={q._id} className="question">
          <h3>{q.text}</h3>
          <div className="options">
            {q.options.map(opt => (
              <button key={opt.id}>{opt.id}) {opt.text}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default QuestionDisplay;
```

### React Component Example: Submit Answer

```jsx
function SubmitAnswer({ question }) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const handleSubmit = async () => {
    const response = await fetch('/api/attempts/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: 'student_123',
        examId: 'exam_jee_main',
        questionId: question._id,
        selectedAnswer: selectedAnswer
      })
    });

    const result = await response.json();
    alert(`${result.isCorrect ? '✓ Correct!' : '✗ Wrong!'} 
            Marks: ${result.marksObtained}
            Answer: ${result.correctAnswer}`);
  };

  return (
    <div>
      <div className="options">
        {question.options.map(opt => (
          <label key={opt.id}>
            <input
              type="radio"
              name="answer"
              value={opt.id}
              onChange={e => setSelectedAnswer(e.target.value)}
            />
            {opt.id}) {opt.text}
          </label>
        ))}
      </div>
      <button onClick={handleSubmit}>Submit Answer</button>
    </div>
  );
}
```

### React Component Example: Show Results

```jsx
function ExamResults({ studentId, examId }) {
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetch(`/api/results/student/${studentId}`)
      .then(res => res.json())
      .then(data => setResult(data[0])); // Latest result
  }, [studentId]);

  if (!result) return <div>Loading...</div>;

  return (
    <div className="result-card">
      <h2>Exam Results</h2>
      
      <div className="score-display">
        <h1>{result.percentage.toFixed(1)}%</h1>
        <p>{result.marksObtained} / {result.totalMarks} marks</p>
      </div>

      <div className="subject-breakdown">
        <h3>Subject-wise Performance:</h3>
        {result.subjectWisePerformance.map(sub => (
          <div key={sub.subjectName} className="subject-item">
            <span>{sub.subjectName}</span>
            <div className="progress-bar">
              <div style={{width: `${sub.successRate}%`}}></div>
            </div>
            <span>{sub.correctAnswers}/{sub.totalQuestions}</span>
          </div>
        ))}
      </div>

      <div className="recommendations">
        <h3>Recommendations:</h3>
        <ul>
          {result.recommendations?.map((rec, i) => (
            <li key={i}>{rec}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

---

## 🧪 Testing with Postman

### 1. Create New Test
**Method:** POST
**URL:** `http://localhost:5000/api/practice-test?exam=JEE Main&subject=Physics&difficulty=Easy&count=5`

### 2. Submit Answer
**Method:** POST
**URL:** `http://localhost:5000/api/attempts/submit`
**Body:**
```json
{
  "studentId": "65f1234567890abcdef12345",
  "examId": "65f0987654321fedcba54321",
  "questionId": "65f1111111111111111111111",
  "selectedAnswer": "B"
}
```

### 3. Get Results
**Method:** GET
**URL:** `http://localhost:5000/api/results/student/65f1234567890abcdef12345`

### 4. Get Dashboard
**Method:** GET
**URL:** `http://localhost:5000/api/dashboard/student/65f1234567890abcdef12345`

---

## 📊 Common API Patterns

### Pattern 1: Get Filtered Questions
```javascript
// Get questions with multiple filters
const params = new URLSearchParams({
  exam: 'JEE Main',
  subject: 'Physics',
  difficulty: 'Medium',
  topic: 'Mechanics',
  limit: 10,
  skip: 0
});

fetch(`/api/questions?${params}`)
  .then(res => res.json())
  .then(data => console.log(data.questions));
```

### Pattern 2: Submit Answer with Timer
```javascript
const startTime = Date.now();

// After student answers...
const timeSpent = (Date.now() - startTime) / 1000;

fetch('/api/attempts/submit', {
  method: 'POST',
  body: JSON.stringify({
    studentId,
    examId,
    questionId,
    selectedAnswer,
    timeSpent // In seconds
  })
});
```

### Pattern 3: Generate Practice Test
```javascript
async function generateTest(exam, subject, count = 10) {
  const response = await fetch(
    `/api/practice-test?exam=${exam}&subject=${subject}&count=${count}`
  );
  const test = await response.json();
  return test.questions;
}

// Usage:
const questions = await generateTest('NEET', 'Chemistry', 15);
```

---

## 🔑 Key API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/exams` | GET | Get all exams |
| `/api/questions` | GET | Get questions with filters |
| `/api/questions/:id` | GET | Get question with answer |
| `/api/attempts/submit` | POST | Submit student answer |
| `/api/attempts/student/:id` | GET | Get student's attempt history |
| `/api/results/generate` | POST | Generate exam result |
| `/api/results/:id` | GET | Get specific result |
| `/api/results/student/:id` | GET | Get all student results |
| `/api/practice-test` | GET | Generate practice test |
| `/api/dashboard/student/:id` | GET | Get student dashboard |

---

## ⚡ Performance Tips

### Cache Exam Data
```javascript
// Only load once and cache
const examCache = new Map();

async function getExam(examId) {
  if (examCache.has(examId)) {
    return examCache.get(examId);
  }
  const exam = await fetch(`/api/exams/${examId}`).then(r => r.json());
  examCache.set(examId, exam);
  return exam;
}
```

### Pagination for Questions
```javascript
const pageSize = 10;
const page = 1;

fetch(`/api/questions?limit=${pageSize}&skip=${(page-1)*pageSize}`)
```

### Lazy Load Results
```javascript
// Only show first 5 exams, load more on scroll
const [results, setResults] = useState([]);
const [page, setPage] = useState(1);

const loadMore = () => {
  fetch(`/api/results/student/${studentId}?limit=5&skip=${page*5}`)
    .then(r => r.json())
    .then(data => setResults([...results, ...data]));
  setPage(page + 1);
};
```

---

## ✅ Verification Checklist

After setup, verify:

```
□ Server starts without errors
□ MongoDB connection shows "✅ MongoDB connected"
□ Models loaded: "✅ Database models loaded"
□ API routes ready: "✅ API routes ready"
□ GET /api/exams returns 3 exams
□ GET /api/questions returns sample questions
□ POST /api/attempts/submit returns marks
□ POST /api/results/generate creates result
□ GET /api/dashboard/student/:id returns stats
□ Frontend fetch calls work without errors
```

---

## 🆘 Troubleshooting

### Error: `Cannot find module 'Question'`
**Solution:** Make sure all model files are in `models/` directory

### Error: `MongoDB connection error`
**Solution:** Check `.env` file has `MONGODB_URI` set correctly

### Error: `examId is not defined`
**Solution:** Make sure you're passing correct ObjectId from database

### Error: `404 Not Found`
**Solution:** Check route path matches exactly (case-sensitive)

---

## 📚 Files Created Overview

```
qnario/
├── models/ (NEW)
│   ├── Subject.js
│   ├── Topic.js
│   ├── Exam.js
│   ├── Question.js
│   ├── StudentAttempt.js
│   ├── StudentResult.js
│   ├── ExamSchedule.js
│   └── Analytics.js
├── routes/ (NEW/UPDATED)
│   └── exam-api.js
├── seed-data.js (NEW)
├── DATABASE_DESIGN_GUIDE.md (NEW)
├── DATABASE_FORMAT_REFERENCE.md (NEW)
├── DATABASE_INTEGRATION_EXAMPLES.js (NEW)
└── DATABASE_IMPLEMENTATION_SUMMARY.md (NEW)
```

---

## 🎉 You're All Set!

Your database is now structured to handle:
- ✅ Multiple exam types (JEE, NEET, 12th, etc.)
- ✅ Multiple subjects (Physics, Chemistry, Biology, Math, etc.)
- ✅ Difficulty levels (Easy, Medium, Hard)
- ✅ Question types (MCQ, Descriptive, Short, Numeric)
- ✅ Student attempts tracking
- ✅ Result generation & analytics
- ✅ Performance insights

**Start by seeding data, then connect your frontend!**
