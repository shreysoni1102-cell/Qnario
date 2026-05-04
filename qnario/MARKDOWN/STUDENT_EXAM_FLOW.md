# 🎯 How Student Generates & Takes Exam

## Step-by-Step Flow

### 1️⃣ Student Clicks "Start Exam"
```
Student selects:
- Exam: JEE Main / NEET / Practice Test
- Subject: Physics / Chemistry / Biology / Math
- Difficulty: Easy / Medium / Hard / Mixed

API Call:
GET /api/practice-test?exam=JEE&subject=Physics&difficulty=mixed

Database Response:
- Randomly picks 30 questions
- Mix: Easy (10) + Medium (10) + Hard (10)
```

---

### 2️⃣ Questions Appear on Screen
```
┌─────────────────────────────────────────┐
│ Question 1 of 30                   2:45 │
├─────────────────────────────────────────┤
│                                         │
│ A ball is thrown upward with velocity   │
│ 20 m/s. Find max height.                │
│                                         │
│ ○ A) 10 m                               │
│ ○ B) 20 m                               │
│ ⊙ C) 30 m  ← Student selected          │
│ ○ D) 40 m                               │
│                                         │
│         [Previous] [Next] [Submit]      │
└─────────────────────────────────────────┘
```

---

### 3️⃣ Student Selects Answer & Clicks "Next"
```
API Call:
POST /api/attempts/submit

Request Body:
{
  "studentId": "student_123",
  "examId": "jee_main",
  "questionId": "q_001",
  "selectedAnswer": "C",
  "timeSpent": 45
}

What Happens:
✓ Answer saved to database
✓ Time tracked
✓ Move to Question 2
```

---

### 4️⃣ Repeat for All 30 Questions
```
Question 1  → Answer Saved ✓
Question 2  → Answer Saved ✓
Question 3  → Answer Saved ✓
Question 4  → Answer Saved ✓
Question 5  → Answer Saved ✓
...
Question 30 → Answer Saved ✓

Total Time Spent: 2 hours 15 minutes
```

---

### 5️⃣ Student Clicks "Submit Exam"
```
API Call:
POST /api/results/generate

Request Body:
{
  "studentId": "student_123",
  "examId": "jee_main"
}

What Database Does:
✓ Check all 30 answers
✓ Compare with correct answers
✓ Calculate marks
✓ Apply negative marking
✓ Generate score report
```

---

### 6️⃣ Result Shows

```
╔═════════════════════════════════════╗
║          EXAM RESULT                ║
╠═════════════════════════════════════╣
║                                     ║
║  Total Score:  24 / 30              ║
║  Percentage:   80%                  ║
║  Rank:         5th in Class         ║
║                                     ║
║  ─────────────────────────────────  ║
║  SUBJECT-WISE PERFORMANCE:          ║
║  ─────────────────────────────────  ║
║                                     ║
║  Physics:       18 / 20  (90%)  ⭐ ║
║  Chemistry:      6 / 10  (60%)     ║
║                                     ║
║  ─────────────────────────────────  ║
║  DIFFICULTY-WISE PERFORMANCE:       ║
║  ─────────────────────────────────  ║
║                                     ║
║  Easy:          10 / 10  (100%) ✓  ║
║  Medium:         8 / 10  (80%)     ║
║  Hard:           6 / 10  (60%)  ✗  ║
║                                     ║
║  ─────────────────────────────────  ║
║  ANALYSIS:                          ║
║  ─────────────────────────────────  ║
║                                     ║
║  Strong Areas:                      ║
║  • Physics - Mechanics              ║
║  • Easy Level Questions             ║
║                                     ║
║  Weak Areas:                        ║
║  • Chemistry - Organic              ║
║  • Hard Level Questions             ║
║                                     ║
║  Recommendation:                    ║
║  Focus on Chemistry & Hard Qs       ║
║                                     ║
╚═════════════════════════════════════╝
```

---

## 📊 Behind the Scenes (Database)

```
StudentAttempt Collection:
{
  _id: ObjectId(...),
  studentId: "student_123",
  examId: "jee_main",
  questionId: "q_001",
  selectedAnswer: "C",
  correctAnswer: "C",
  isCorrect: true,
  marksObtained: 1,
  timeSpent: 45,
  attemptNumber: 1,
  createdAt: "2026-01-22T10:30:00Z"
}
```

---

## 🎯 Complete Timeline

| Time | Action | Database |
|------|--------|----------|
| 10:00 | Student starts exam | Exam locked for student |
| 10:02 | Q1 answered (C) | Attempt saved |
| 10:03 | Q2 answered (A) | Attempt saved |
| ... | ... | ... |
| 12:15 | Student submits exam | Result calculated |
| 12:16 | Results displayed | Analytics updated |

---

## ✅ Summary

1. **Student selects exam** → API generates questions
2. **Questions displayed** → One by one
3. **Student answers** → Each answer saved immediately
4. **All 30 done** → Student clicks submit
5. **Results calculated** → Marks, percentage, analysis shown
6. **Database updated** → Student performance recorded

**Total Time: 2 hours for exam + instant result**

---

## 🔄 Data Flow Diagram

```
Student
   ↓
[Select Exam]
   ↓
GET /api/practice-test
   ↓
Database fetches 30 random questions
   ↓
[Show Question 1]
   ↓
Student selects answer
   ↓
POST /api/attempts/submit
   ↓
Database saves attempt
   ↓
[Show Question 2]
   ↓
... (repeat 28 more times) ...
   ↓
[Question 30 - Student clicks SUBMIT]
   ↓
POST /api/results/generate
   ↓
Database calculates result
   ↓
[Display Results Page]
   ↓
Student sees score, analysis, recommendations
```

---

**That's how the entire exam flow works!** 🎉
