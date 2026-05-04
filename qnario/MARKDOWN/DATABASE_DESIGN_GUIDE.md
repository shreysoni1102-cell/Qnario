# Exam Platform Database Design Guide

## Overview
Complete database architecture for JEE, NEET, and Practice tests with hierarchical organization by subject, topic, and difficulty level.

---

## Database Schema Structure

### 1. **Collections/Tables Needed**

```
├── users
├── exams
├── subjects
├── topics
├── questions
├── student_attempts
├── student_results
├── exam_schedules
└── analytics
```

---

## Detailed Schema Design

### 1. **Users Collection**
Already exists - Extended for exam tracking

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (student/teacher),
  avatar: String (URL),
  
  // Student-specific fields
  studentDetails: {
    rollNumber: String,
    branch: String,
    targetExam: String (JEE/NEET/12th/etc),
    joinDate: Date,
    averageScore: Number,
    totalAttempts: Number
  },
  
  // Teacher-specific fields
  teacherDetails: {
    subject: String,
    experience: Number,
    qualifications: [String],
    createdQuestionsCount: Number
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

---

### 2. **Exams Collection**
Master exam definitions

```javascript
{
  _id: ObjectId,
  name: String (JEE Main, JEE Advanced, NEET, 12th Board),
  code: String (UNIQUE - jee_main, neet, 12th_maths),
  description: String,
  
  examDetails: {
    totalDuration: Number (in minutes),
    totalQuestions: Number,
    totalMarks: Number,
    negativeMarking: Boolean,
    negativeMarkPercentage: Number (e.g., 0.25 for 1/4),
    passingPercentage: Number
  },
  
  subjects: [{ subjectId, subjectName, questionCount, marks }],
  
  createdBy: ObjectId (teacherId),
  createdAt: Date,
  updatedAt: Date,
  isActive: Boolean
}
```

---

### 3. **Subjects Collection**
Physics, Chemistry, Biology, Mathematics, etc.

```javascript
{
  _id: ObjectId,
  name: String (Physics, Chemistry, Biology, Mathematics, English, History),
  code: String (UNIQUE - physics, chemistry, biology, maths, english, history),
  description: String,
  icon: String (URL),
  
  // Which exams include this subject
  applicableExams: [
    {
      examId: ObjectId,
      examName: String,
      weight: Number (percentage of total marks)
    }
  ],
  
  // Topic distribution
  topics: [ObjectId], // References to Topics collection
  
  totalTopics: Number,
  totalQuestions: Number,
  
  createdAt: Date,
  updatedAt: Date,
  isActive: Boolean
}
```

---

### 4. **Topics Collection**
Sub-topics within subjects

```javascript
{
  _id: ObjectId,
  name: String (e.g., "Kinematics", "Chemical Bonding", "Photosynthesis"),
  code: String (UNIQUE - physics_kinematics),
  description: String,
  
  subjectId: ObjectId,
  subjectName: String,
  
  // Hierarchy
  parentTopicId: ObjectId (null for main topics),
  subtopics: [ObjectId],
  
  // Learning resources
  resources: [
    {
      type: String (notes, video, article),
      title: String,
      url: String,
      duration: Number (for videos)
    }
  ],
  
  // Statistics
  totalQuestions: Number,
  questionsByDifficulty: {
    easy: Number,
    medium: Number,
    hard: Number
  },
  
  createdAt: Date,
  updatedAt: Date,
  isActive: Boolean
}
```

---

### 5. **Questions Collection** (Most Important)
Core collection with complete filtering capability

```javascript
{
  _id: ObjectId,
  
  // Basic Info
  questionNumber: Number (sequential within exam),
  text: String,
  type: String (MCQ, Descriptive, Short, NumericAnswer),
  marks: Number,
  
  // Subject & Topic Classification
  examId: ObjectId,
  examName: String (JEE Main, NEET, etc),
  subjectId: ObjectId,
  subjectName: String (Physics, Chemistry, etc),
  topicId: ObjectId,
  topicName: String,
  
  // Difficulty & Category
  difficulty: String (Easy, Medium, Hard),
  category: String (optional - Mechanics, Thermodynamics, etc),
  
  // Question Content
  options: [
    {
      id: String (A, B, C, D),
      text: String,
      imageUrl: String (optional)
    }
  ],
  
  answer: {
    correctOption: String (A, B, C, D),
    explanation: String (detailed explanation),
    solutionSteps: [String], // Step-by-step solution
    diagramUrl: String (optional),
    videoUrl: String (optional)
  },
  
  // Analytics
  totalAttempts: Number,
  correctAttempts: Number,
  successRate: Number (percentage),
  averageTimeSpent: Number (seconds),
  
  // Metadata
  createdBy: ObjectId (teacherId),
  createdAt: Date,
  updatedAt: Date,
  isActive: Boolean,
  tags: [String], // e.g., ["important", "frequently_asked", "high_difficulty"]
  
  // For Filtering
  solutionVideoUrl: String,
  solutionNoteUrl: String,
  previousYearPaper: { year: Number, paper: String }
}
```

---

### 6. **Student Attempts Collection**
Tracks each attempt by student

```javascript
{
  _id: ObjectId,
  
  studentId: ObjectId,
  studentName: String,
  
  examId: ObjectId,
  examName: String,
  
  questionId: ObjectId,
  questionText: String,
  
  // Attempt Details
  selectedAnswer: String (A, B, C, D),
  isCorrect: Boolean,
  marksObtained: Number,
  
  // Time Tracking
  startTime: Date,
  endTime: Date,
  timeSpent: Number (seconds),
  
  // Review Status
  isReviewed: Boolean,
  reviewedAt: Date,
  
  attemptNumber: Number (1st, 2nd, 3rd attempt),
  
  createdAt: Date,
  updatedAt: Date
}
```

---

### 7. **Student Results Collection**
Summary of exam attempts

```javascript
{
  _id: ObjectId,
  
  studentId: ObjectId,
  studentName: String,
  
  examId: ObjectId,
  examName: String,
  
  // Scores
  totalMarks: Number,
  marksObtained: Number,
  percentage: Number,
  rank: Number,
  
  // Breakdown by Subject
  subjectWisePerformance: [
    {
      subjectId: ObjectId,
      subjectName: String,
      totalQuestions: Number,
      correctAnswers: Number,
      wrongAnswers: Number,
      unattempted: Number,
      marksObtained: Number,
      successRate: Number
    }
  ],
  
  // Breakdown by Difficulty
  difficultyWisePerformance: {
    easy: { attempted: Number, correct: Number, accuracy: Number },
    medium: { attempted: Number, correct: Number, accuracy: Number },
    hard: { attempted: Number, correct: Number, accuracy: Number }
  },
  
  // Time Analysis
  totalTimeSpent: Number (seconds),
  averageTimePerQuestion: Number,
  
  // Status
  status: String (Completed, InProgress, Abandoned),
  startedAt: Date,
  completedAt: Date,
  
  // Feedback
  strongAreas: [String], // Topics where student performed well
  weakAreas: [String], // Topics needing improvement
  recommendations: [String],
  
  createdAt: Date,
  updatedAt: Date
}
```

---

### 8. **Exam Schedules Collection**
For scheduled tests

```javascript
{
  _id: ObjectId,
  
  examId: ObjectId,
  examName: String,
  
  // Schedule Details
  scheduledDate: Date,
  startTime: String (HH:MM format),
  endTime: String,
  duration: Number (minutes),
  
  // Student Enrollment
  enrolledStudents: [ObjectId],
  allowedStudents: [ObjectId],
  studentCount: Number,
  
  // Settings
  isPublic: Boolean,
  isLocked: Boolean (after exam starts),
  allowReattempt: Boolean,
  reattemptCount: Number,
  
  // Status
  status: String (Scheduled, InProgress, Completed, Cancelled),
  
  createdBy: ObjectId (teacherId),
  createdAt: Date,
  updatedAt: Date
}
```

---

### 9. **Analytics Collection**
For insights and reports

```javascript
{
  _id: ObjectId,
  
  type: String (student, teacher, exam, topic),
  
  // Student Analytics
  studentAnalytics: {
    studentId: ObjectId,
    totalExamsTaken: Number,
    averageScore: Number,
    totalQuestionsAttempted: Number,
    correctAnswers: Number,
    accuracy: Number,
    
    subjectPerformance: Map (subjectName -> { attempted, correct, accuracy }),
    difficultyPerformance: Map (difficulty -> { attempted, correct, accuracy }),
    
    progressOverTime: [
      { date: Date, score: Number, examId: ObjectId }
    ],
    
    learningPace: String (Fast, Average, Slow),
    strongSubjects: [String],
    weakSubjects: [String]
  },
  
  // Exam Analytics
  examAnalytics: {
    examId: ObjectId,
    totalAttempts: Number,
    averageScore: Number,
    averageAccuracy: Number,
    
    questionDifficulty: Map (questionId -> { difficulty, avgAccuracy }),
    subjectBreakdown: Map (subject -> { questions, avgAccuracy })
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

---

## Data Relationships & Filtering Strategy

### Hierarchical Structure:
```
Exam
  ├── Subject
  │    └── Topic
  │         └── Question
  │              ├── Student Attempt
  │              └── Analytics
  └── Schedule
       └── Student Results
```

### Query Examples:

**Get all Physics questions for JEE Main (Medium difficulty):**
```javascript
db.questions.find({
  examId: ObjectId("exam_jee_main"),
  subjectId: ObjectId("subject_physics"),
  difficulty: "Medium"
})
```

**Get student performance summary:**
```javascript
db.student_results.findOne({
  studentId: ObjectId("student_123"),
  examId: ObjectId("exam_neet")
})
```

**Get all Easy Biology questions for NEET:**
```javascript
db.questions.find({
  examId: ObjectId("exam_neet"),
  subjectName: "Biology",
  difficulty: "Easy"
})
```

**Get strong/weak areas for a student:**
```javascript
db.analytics.findOne({
  type: "student",
  "studentAnalytics.studentId": ObjectId("student_123")
})
```

---

## Database Optimization Tips

1. **Indexing:**
   - Create indexes on: `examId`, `subjectId`, `topicId`, `studentId`, `difficulty`
   - Compound indexes for frequently filtered combinations

2. **Query Performance:**
   - Use projection to return only needed fields
   - Cache frequently accessed data (exam definitions, subject list)
   - Use aggregation pipeline for complex analytics

3. **Data Validation:**
   - Enum validation for exam types, difficulty levels, question types
   - Required fields validation at schema level
   - Unique constraints on codes and emails

---

## Implementation Priority

**Phase 1 (Core):**
- Users
- Subjects
- Topics
- Questions

**Phase 2 (Functionality):**
- Exams
- Student Attempts
- Student Results

**Phase 3 (Advanced):**
- Exam Schedules
- Analytics
- Performance Tracking

---

## Data Format Examples

### New Question Entry:
```json
{
  "text": "What is the SI unit of force?",
  "type": "MCQ",
  "marks": 1,
  "examName": "JEE Main",
  "subjectName": "Physics",
  "topicName": "Mechanics",
  "difficulty": "Easy",
  "options": [
    { "id": "A", "text": "kg" },
    { "id": "B", "text": "Newton" },
    { "id": "C", "text": "Joule" },
    { "id": "D", "text": "Watt" }
  ],
  "answer": {
    "correctOption": "B",
    "explanation": "Newton (N) is the SI unit of force, named after Sir Isaac Newton."
  }
}
```

---

## Next Steps

1. Create Mongoose schemas for all collections
2. Set up proper indexing
3. Create validation middleware
4. Implement CRUD operations with proper error handling
5. Set up aggregation pipelines for analytics
