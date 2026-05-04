# Step-by-Step: How Document Upload Works

## Overview

The document upload system works in **3 main phases:**
1. **Teacher uploads a Word document**
2. **System processes and stores questions**
3. **Students see questions in exams**

Let me explain each phase in detail.

---

## PHASE 1: TEACHER UPLOADS DOCUMENT

### Step 1: Teacher Prepares Document

**What you do:**
1. Open Microsoft Word or Google Docs
2. Create your questions with:
   - Question text
   - Equations (using Word's Equation Editor)
   - Diagrams/images (inserted directly)
   - Multiple choice options
   - Mark the correct answer with asterisk (*)

**Example document structure:**

```
Question 1
------------------
A ball is thrown upward with velocity v = 20 m/s.
Using the equation: v² = u² - 2gs

Find the maximum height reached (g = 10 m/s²)

[INSERT DIAGRAM: Arrow showing ball trajectory]

Options:
a) 10 m
b) 15 m
c) 20 m *
d) 25 m

------------------

Question 2
[Next question...]
```

**Important:**
- Save as **`.docx`** format (not `.doc` or `.pdf`)
- Keep questions clearly separated
- For equations: Use Word Equation Editor (Insert → Equation)
- For images: Insert directly in Word (don't link to external files)

### Step 2: Teacher Logs Into Qnario

1. Open browser
2. Go to http://localhost:3000
3. Click **"Teacher Login"**
4. Enter email and password
5. Click **Login**

### Step 3: Go to Teacher Dashboard

After login, you see:
```
┌─────────────────────────────────────┐
│     Teacher Dashboard               │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Create New Exam             │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ View Papers                 │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Upload Questions      ← NEW │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Analytics                   │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Step 4: Click "Upload Questions" Button

When you click, you go to the upload page:

```
┌──────────────────────────────────────────────────────┐
│           Upload Question Document                   │
│                                                      │
│  📋 Document Format Guidelines:                      │
│  • Use Microsoft Word (.docx)                        │
│  • Include equations and diagrams                    │
│  • Mark correct answer with *                        │
│                                                      │
│  Exam Type: [JEE ▼]                                  │
│  Difficulty: [Easy ▼]                                │
│                                                      │
│  [📄 Choose DOCX File]                               │
│  (Drag & drop or click to select)                    │
│                                                      │
│  ┌──────────────────┐    ┌──────────────┐           │
│  │ Upload & Parse   │    │ Cancel       │           │
│  └──────────────────┘    └──────────────┘           │
└──────────────────────────────────────────────────────┘
```

### Step 5: Select Exam Type

Click the dropdown: **[JEE ▼]**

Choose one:
- **JEE** - For JEE Main/Advanced students
- **NEET** - For medical entrance students
- **12th** - For 12th board students

### Step 6: Select Difficulty Level

Click the dropdown: **[Easy ▼]**

Choose one:
- **Easy** - Basic questions
- **Medium** - Intermediate difficulty
- **Hard** - Advanced/challenging questions

### Step 7: Upload Your Word Document

**Option A: Click to Browse**
1. Click on **"📄 Choose DOCX File"**
2. File explorer opens
3. Navigate to your document
4. Select it
5. Click Open

**Option B: Drag & Drop**
1. Find your `.docx` file on your computer
2. Drag it to the upload box
3. Drop it there
4. File gets selected automatically

### Step 8: Click "Upload & Parse"

1. Click the **"Upload & Parse"** button
2. You'll see:
```
Processing document...
[████████░░] 80%
```

---

## PHASE 2: SYSTEM PROCESSES DOCUMENT

### What Happens Behind the Scenes

#### Step 1: File Validation (0.5 seconds)
```
Server receives file
    ↓
Check: Is it .docx? ✓
Check: Is it < 50MB? ✓
Check: Valid format? ✓
    ↓
All checks pass → Continue
```

**If validation fails:**
- Error shown: "Invalid file format"
- Solution: Use .docx format, not PDF or DOC

#### Step 2: File Uploaded to Server (1-5 seconds)
```
Your computer
    ↓ (upload)
Server receives file
    ↓
Saved to: uploads/documents/1705814400-MyQuestions.docx
```

#### Step 3: Mammoth Conversion (2-5 seconds)
```
.docx file
    ↓ (Mammoth library)
Converts to HTML
    ↓
Preserves:
  ✓ Equations (as MathML)
  ✓ Images (embedded)
  ✓ Formatting (bold, italic)
  ✓ Text styling
    ↓
Result: Beautiful HTML
```

**Example conversion:**

**Original Word:**
```
If x² + 5x + 6 = 0, solve for x
```

**After conversion (HTML):**
```html
<p>If <math><mi>x</mi><mo>²</mo> <mo>+</mo> ...</math>, solve for x</p>
```

#### Step 4: Question Parsing (1-2 seconds)
```
HTML content
    ↓
Parser looks for:
  1. Question text blocks
  2. Multiple choice options
  3. Correct answer (marked with *)
  4. Images/diagrams
    ↓
Extracts and structures:
{
  id: "UPLOADED_1705814400_1",
  examType: "JEE",
  difficulty: "Easy",
  text: "Question text",
  html: "<p>Rich content</p>",
  options: ["a", "b", "c", "d"],
  answer: "a"
}
```

#### Step 5: Store in JSON (< 1 second)
```
Parsed questions
    ↓
Saved to: uploaded-questions.json
    ↓
File on server (persistent storage)
```

**Final storage looks like:**
```json
[
  {
    "id": "UPLOADED_1705814400_1",
    "examType": "JEE",
    "type": "MCQ",
    "difficulty": "Easy",
    "text": "If x² + 5x + 6 = 0, solve for x",
    "html": "<p>If <math>...</math>, solve for x</p>",
    "options": ["x = -2, -3", "x = 2, 3", ...],
    "answer": "x = -2, -3",
    "uploadedAt": "2026-01-21T10:30:00Z"
  },
  { ... more questions ... }
]
```

### Step 9: See Success Message

After processing completes (5-15 seconds total):

```
┌──────────────────────────────────────────┐
│  ✅ 5 questions uploaded successfully!   │
│                                          │
│  Preview - Questions Extracted:          │
│                                          │
│  Q1: If x² + 5x + 6 = 0...               │
│      Options: 4 | Type: MCQ              │
│                                          │
│  Q2: A ball is thrown upward...          │
│      Options: 4 | Type: MCQ              │
│                                          │
│  Q3: Which organ pumps blood?            │
│      Options: 4 | Type: MCQ              │
│                                          │
│  [Redirecting to dashboard...]           │
└──────────────────────────────────────────┘
```

Questions are now **ready to use**! ✓

---

## PHASE 3: STUDENTS USE UPLOADED QUESTIONS

### Step 1: Student Creates Exam

Student logs in and goes to **"Create Exam"**

```
┌──────────────────────────────────────┐
│      Create Exam Paper               │
│                                      │
│  Exam Type:     [JEE ▼]              │
│  Question Type: [MCQ ▼]              │
│  Difficulty:    [Easy ▼]             │
│  Questions:     [10]                 │
│  Timer (min):   [30]                 │
│                                      │
│  ☑ Shuffle questions                 │
│                                      │
│  ┌─────────────────────────────┐    │
│  │  Generate Paper             │    │
│  └─────────────────────────────┘    │
└──────────────────────────────────────┘
```

### Step 2: System Combines Questions

When student clicks **"Generate Paper":**

```
System runs this logic:

1. Load built-in questions
   question-bank.js
   ├─ Question 1: "What is 5 + 3?"
   ├─ Question 2: "Which is prime?"
   └─ ... more questions ...

2. Load uploaded questions
   uploaded-questions.json
   ├─ Question 1: "If x² + 5x + 6 = 0..."
   ├─ Question 2: "A ball is thrown..."
   └─ ... more questions ...

3. Combine both pools
   allQuestions = [
     ...built-in questions,
     ...uploaded questions
   ]

4. Filter by selected criteria
   • Exam Type: JEE ✓
   • Difficulty: Easy ✓
   • Question Type: MCQ ✓
   
   filtered = allQuestions.filter(q =>
     q.examType === "JEE" &&
     q.difficulty === "Easy" &&
     q.type === "MCQ"
   )

5. Random selection
   Select 10 random questions from filtered pool
   No duplicates
   
6. Create paper object
   paper = {
     id: "PAPER_1705814400",
     questions: [selected 10 questions],
     meta: { examType, difficulty, ... }
   }
```

**Visual:**
```
Original Question Pool:
┌─────────────────────────┐
│ Built-in (old):         │
│ • Q1: 5+3=?            │
│ • Q2: Prime number?    │
│ • Q3: H2O?             │
│ • ... (150 questions)  │
│                        │
│ Uploaded (new) + filter:
│ • Q1: x²+5x+6=0? ✓JEE │
│ • Q2: Ball thrown? ✓   │
│ • Q3: Organ pumps? ✗   │
│ • ... (20 questions)   │
└─────────────────────────┘
         ↓
Random Selection (10 questions)
         ↓
┌─────────────────────────┐
│ Generated Paper:        │
│ • Q1: x²+5x+6=0?       │
│ • Q2: 5+3=?            │
│ • Q3: Prime number?    │
│ • Q4: Ball thrown?     │
│ • ... (10 total)       │
└─────────────────────────┘
```

### Step 3: Student Takes Exam

Student sees exam page:

```
┌──────────────────────────────────────────────┐
│  Question 1 of 10                Timer: 30:00 │
├──────────────────────────────────────────────┤
│                                              │
│  If x² + 5x + 6 = 0, solve for x             │
│                                              │
│  [Beautiful HTML rendering of equation]      │
│  [If diagram exists: Image displayed]        │
│                                              │
│  Options:                                    │
│  ○ x = -2, -3                                │
│  ○ x = 2, 3                                  │
│  ○ x = -1, -6                                │
│  ○ x = 1, 6                                  │
│                                              │
│  ┌──────────────┐  ┌──────────────┐         │
│  │ Previous     │  │ Next         │         │
│  └──────────────┘  └──────────────┘         │
└──────────────────────────────────────────────┘
```

**Key Difference:**

**BEFORE (ugly):**
```
If x^2 + 5x + 6 = 0, solve for x
```

**AFTER (beautiful):** ✨
```
If x² + 5x + 6 = 0, solve for x
(with proper formatting)
```

### Step 4: Student Answers

Student selects an option and continues.

If diagram was in document:
- **Shows clearly** ✓
- **Easy to understand** ✓
- **Better answers** ✓

---

## COMPLETE FLOW DIAGRAM

```
┌──────────────────────────────────────────────────────────┐
│                 COMPLETE FLOW                            │
└──────────────────────────────────────────────────────────┘

TEACHER:
1. Create Word doc
   ├─ Type questions
   ├─ Add equations
   └─ Insert images

2. Save as .docx
   └─ "MyQuestions.docx"

3. Login to Qnario
   └─ Teacher Dashboard

4. Click "Upload Questions"
   └─ Go to upload page

5. Select exam type
   └─ Choose: JEE/NEET/12th

6. Select difficulty
   └─ Choose: Easy/Medium/Hard

7. Upload file
   ├─ Drag & drop OR
   └─ Click to browse

8. Click "Upload & Parse"
   └─ System processes

   [Behind scenes:]
   ├─ Validate file
   ├─ Convert DOCX → HTML
   ├─ Extract questions
   ├─ Parse structure
   └─ Save to JSON

9. See success message
   └─ "5 questions uploaded!"

10. Questions available
    └─ In uploaded-questions.json


STUDENT:
1. Login to Qnario
   └─ Student Dashboard

2. Click "Generate Paper"
   └─ Go to paper creation

3. Select filters
   ├─ Exam Type: JEE
   ├─ Difficulty: Easy
   ├─ Questions: 10
   └─ Click "Generate"

4. System combines
   ├─ Load built-in Q's
   ├─ Load uploaded Q's
   ├─ Merge both
   ├─ Filter by criteria
   └─ Random selection

5. Paper created
   └─ Redirect to exam

6. Take exam
   ├─ See questions
   ├─ Answer with
   │  ├─ Proper equations
   │  ├─ Diagrams visible
   │  └─ Clear formatting
   └─ Submit

7. Result
   └─ Better understanding
      └─ Better scores!
```

---

## REAL EXAMPLE: START TO FINISH

### Create Document

**You type in Word:**
```
QUESTION 1

A stone is thrown vertically upward with velocity u = 20 m/s.
Find the maximum height.

Using: v² = u² - 2gs where g = 10 m/s²

[INSERT IMAGE: Diagram of stone trajectory]

Options:
a) 10 m
b) 20 m
c) 30 m
d) 40 m

Answer: b) 20 m
```

### Upload

1. Save as: `Physics_Easy.docx`
2. Go to Qnario Dashboard
3. Click "Upload Questions"
4. Select: JEE, Easy
5. Upload file
6. Click "Upload & Parse"

### What Happens Inside Server

```
Server processes:

Input:  Physics_Easy.docx (120 KB)
   ↓
Mammoth converts:
   Document: "A stone is thrown..."
   Image: [diagram.png embedded]
   ↓
HTML created:
   <p>A stone is thrown upward...</p>
   <math>v<sup>2</sup> = u<sup>2</sup>...</math>
   <img src="data:image/png..." />
   ↓
Parser extracts:
   text: "A stone is thrown..."
   html: "<p>Rich content...</p>"
   options: ["10 m", "20 m", "30 m", "40 m"]
   answer: "20 m"
   ↓
Saved to: uploaded-questions.json
   ↓
Output: Question ready in system
```

### Student Generates Exam

Student clicks "Generate" for:
- JEE exam
- Easy difficulty
- 5 questions

System combines:
- 3 questions from built-in bank
- 2 questions from your upload
- Randomly mixed

### Student Takes Exam

Sees beautiful question:
```
┌────────────────────────────────────┐
│ A stone is thrown vertically       │
│ upward with velocity u = 20 m/s.   │
│ Find the maximum height.           │
│                                    │
│ Using: v² = u² - 2gs              │
│ (where g = 10 m/s²)               │
│                                    │
│ [DIAGRAM SHOWS CLEARLY]            │
│                                    │
│ Options:                           │
│ ◯ 10 m                             │
│ ◯ 20 m                             │
│ ◯ 30 m                             │
│ ◯ 40 m                             │
└────────────────────────────────────┘
```

Clear, professional, easy to understand! ✓

---

## DATA FLOW VISUALIZATION

```
Teacher's Computer
    │
    ├─ Creates: Physics_Easy.docx
    │   ├─ Questions with equations
    │   ├─ Diagrams/images
    │   └─ Professional formatting
    │
    └─→ Uploads via browser
        │
        ↓
    Qnario Server
    │
    ├─ Receives file
    ├─ Validates format
    ├─ Converts DOCX → HTML
    ├─ Extracts questions
    ├─ Stores images
    ├─ Creates JSON
    └─→ Saved: uploaded-questions.json
        │
        ├─ [
        │   {
        │     id: "UPLOADED_...",
        │     text: "Question...",
        │     html: "<p>Rich...</p>",
        │     options: [...],
        │     answer: "..."
        │   }
        │ ]
        │
        └─→ Available in system
            │
            ├─ Student creates exam
            ├─ System combines:
            │  ├─ Built-in questions
            │  └─ Uploaded questions
            ├─ Random selection
            └─→ Paper generated
                │
                └─→ Student sees
                    beautiful questions!
                    ✓ Equations formatted
                    ✓ Diagrams visible
                    ✓ Easy to understand
```

---

## STORAGE STRUCTURE

After you upload questions, here's what exists on server:

```
Server Storage:

1. Original file:
   uploads/documents/
   └─ 1705814400-Physics_Easy.docx (backup)

2. Processed questions:
   uploaded-questions.json
   └─ [
       {
         id: "UPLOADED_1705814400_1",
         examType: "JEE",
         type: "MCQ",
         difficulty: "Easy",
         text: "A stone is thrown...",
         html: "<p>A stone...</p>",
         options: ["10 m", "20 m", "30 m", "40 m"],
         answer: "20 m",
         uploadedAt: "2026-01-21T10:30:00Z"
       },
       { ... more questions ... }
     ]

3. During exam creation:
   Question pool = [
     ...question-bank.js (old),
     ...uploaded-questions.json (new)
   ]
```

---

## KEY POINTS TO REMEMBER

### When Creating Document:
✓ Use Word Equation Editor for math
✓ Embed images directly (no external links)
✓ Mark correct answer with asterisk (*)
✓ Keep questions clearly separated
✓ Save as .docx (not PDF)

### When Uploading:
✓ Select correct exam type (JEE/NEET/12th)
✓ Select correct difficulty (Easy/Medium/Hard)
✓ Make sure file is < 50MB
✓ Wait for "Success" message

### What Students See:
✓ Properly formatted equations
✓ Clear diagrams/images
✓ Professional presentation
✓ Easy to understand
✓ Better answers!

### Behind The Scenes:
✓ Mammoth converts DOCX → HTML
✓ Questions parsed and extracted
✓ Stored in JSON file
✓ Merged with existing questions
✓ Random selection for papers

---

## COMMON SCENARIOS

### Scenario 1: Upload Physics Questions

```
You: Create Word doc with physics problems
     Add diagrams showing forces
     Add equations with proper notation
     Upload to JEE/Easy
     ↓
System: Parse 5 questions
        Store with HTML formatting
     ↓
Student: Generate JEE/Easy exam
         Gets 2-3 physics questions
         Sees diagrams clearly
         Understands better
         Gets more correct!
```

### Scenario 2: Upload Chemistry Questions

```
You: Create Word doc with chemistry
     Add molecular structures (as images)
     Add chemical equations
     Upload to NEET/Medium
     ↓
System: Parse questions
        Keep formatting
     ↓
Student: Generate NEET/Medium exam
         Sees molecule structures
         Chemical equations formatted
         Easier to solve
         More confident answers
```

### Scenario 3: Upload Mixed Questions

```
You: Create Word with multiple topics
     Physics, Chemistry, Biology mix
     Each with relevant diagrams
     Upload to 12th/Hard
     ↓
System: Parse all questions
        Match metadata
     ↓
Student: Generate 12th/Hard exam
         Gets well-formatted questions
         Each with clarity
         Better exam experience
         Improved results
```

---

## TROUBLESHOOTING FLOW

```
PROBLEM: Upload button not visible
FIX: 
  1. Make sure you're logged as TEACHER
  2. Clear browser cache
  3. Refresh page
  4. Check dashboard appears

PROBLEM: File upload fails
FIX:
  1. Check file is .docx (not PDF)
  2. Check file size < 50MB
  3. Try with a simple test file
  4. Check internet connection

PROBLEM: Questions not showing
FIX:
  1. Check exam type matches upload
  2. Check difficulty matches upload
  3. Refresh page
  4. Check uploaded-questions.json exists
  5. Check server logs

PROBLEM: Equations not formatted
FIX:
  1. Make sure you used Word Equation Editor
  2. Not plain text like "x^2"
  3. Word must have "Insert > Equation" format
  4. Try re-uploading document

PROBLEM: Images not showing
FIX:
  1. Embed images in Word (not external links)
  2. Check image file size
  3. Use common formats (JPG, PNG)
  4. Try with smaller image
```

---

## SUMMARY

**Your complete workflow:**

1. **Create** → Type in Word with equations/diagrams
2. **Save** → Save as .docx
3. **Upload** → Go to Qnario, upload file
4. **System processes** → Converts and stores automatically
5. **Students use** → See beautiful questions in exams
6. **Results** → Better understanding, better scores!

**Total time:** 
- Creating document: 15-30 min
- Uploading: 1 minute
- System processing: 5-15 seconds
- Available immediately: ✓

**That's it!** 🎉

Everything else happens automatically!

---

**Ready to upload your first document?** Start with just 1-2 test questions and see how it works!
