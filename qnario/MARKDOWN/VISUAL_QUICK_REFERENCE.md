# Visual Quick Reference Guide

## The 3 Steps

```
┌─────────────────┐
│  STEP 1         │
│  TEACHER        │
│  UPLOADS        │
└────────┬────────┘
         │
    ┌────▼────┐
    │ Creates │
    │ .docx   │
    │ file    │
    └────┬────┘
         │
    ┌────▼──────────┐
    │ Selects:      │
    │ Exam type     │
    │ Difficulty    │
    └────┬──────────┘
         │
    ┌────▼──────────┐
    │ Clicks:       │
    │ Upload &      │
    │ Parse         │
    └────┬──────────┘
         │
         ↓
┌─────────────────┐
│  STEP 2         │
│  SYSTEM         │
│  PROCESSES      │
└────────┬────────┘
         │
    ┌────▼────────────┐
    │ Validates       │
    │ DOCX format     │
    └────┬────────────┘
         │
    ┌────▼────────────┐
    │ Converts        │
    │ DOCX → HTML     │
    └────┬────────────┘
         │
    ┌────▼────────────┐
    │ Extracts        │
    │ Questions       │
    └────┬────────────┘
         │
    ┌────▼────────────┐
    │ Stores in       │
    │ JSON file       │
    └────┬────────────┘
         │
         ↓
┌─────────────────┐
│  STEP 3         │
│  STUDENT        │
│  USES           │
└────────┬────────┘
         │
    ┌────▼──────────┐
    │ Generates     │
    │ exam paper    │
    └────┬──────────┘
         │
    ┌────▼──────────┐
    │ System mixes: │
    │ Old + New Q's │
    └────┬──────────┘
         │
    ┌────▼──────────┐
    │ Selects       │
    │ randomly      │
    └────┬──────────┘
         │
    ┌────▼──────────┐
    │ Student sees  │
    │ beautiful Q's │
    │ with format   │
    └─────────────┘
```

---

## Document Format Example

### What You Type in Word:

```
┌────────────────────────────────────┐
│         Physics Question           │
├────────────────────────────────────┤
│                                    │
│  A ball is thrown upward with      │
│  velocity v = 20 m/s               │
│                                    │
│  Using: v² = u² - 2gs              │
│                                    │
│  [IMAGE: Diagram of ball path]     │
│                                    │
│  Find maximum height (g=10 m/s²)   │
│                                    │
│  Options:                          │
│  a) 10 m                           │
│  b) 20 m *                         │
│  c) 30 m                           │
│  d) 40 m                           │
│                                    │
└────────────────────────────────────┘
```

### What Student Sees in Exam:

```
┌────────────────────────────────────┐
│  Question 3 of 10  ⏱ Timer: 28:45  │
├────────────────────────────────────┤
│                                    │
│  A ball is thrown upward with      │
│  velocity v = 20 m/s               │
│                                    │
│  Using: v² = u² - 2gs              │
│  (g = 10 m/s²)                     │
│                                    │
│  ┌──────────────────────────────┐  │
│  │   [DIAGRAM SHOWS CLEARLY]    │  │
│  │   ↑ Ball going up            │  │
│  │   ↓ Ball coming down         │  │
│  └──────────────────────────────┘  │
│                                    │
│  Find maximum height               │
│                                    │
│  ○ 10 m                            │
│  ○ 20 m    ← Student selects       │
│  ○ 30 m                            │
│  ○ 40 m                            │
│                                    │
│  [Previous] [Next]                 │
└────────────────────────────────────┘
```

---

## Upload Process Timeline

```
Timeline:
0s     ┌─ You click "Upload & Parse"
       │
1-3s   ├─ File validates ✓
       │  (Is it .docx? Is it < 50MB?)
       │
3-8s   ├─ Mammoth converts DOCX → HTML
       │  (Equations become mathematical)
       │  (Images embedded)
       │  (Formatting preserved)
       │
8-10s  ├─ Parser extracts questions
       │  (Finds question text)
       │  (Finds options)
       │  (Finds correct answers)
       │
10-12s ├─ Questions stored in JSON
       │  (uploaded-questions.json)
       │
12-14s └─ Success message shown ✓
         "5 questions uploaded!"
         Ready to use immediately!

Total Time: ~12-15 seconds
```

---

## Question Pool Mixing

### Before You Upload:
```
Question Pool:
┌────────────────────────┐
│ Built-in Questions     │
│ (from question-bank.js)│
│                        │
│ • 5+3=?               │
│ • Prime number?       │
│ • H2O is?             │
│ • ... 150 questions   │
└────────────────────────┘
```

### After You Upload:
```
Question Pool:
┌────────────────────────┐
│ Built-in Questions     │
│ (150 questions)        │
│                        │
│ + Uploaded Questions   │
│ (5 new questions)      │
│                        │
│ = TOTAL: 155 questions │
└────────────────────────┘
       ↓
When student generates exam:
       ↓
┌────────────────────────┐
│ Filters by:            │
│ • Exam type    ✓       │
│ • Difficulty   ✓       │
│ • Question type ✓      │
│                        │
│ Result: Matching Q's   │
│ from BOTH sources      │
└────────────────────────┘
       ↓
Random selection (no duplicates)
       ↓
┌────────────────────────┐
│ Paper with:            │
│ • 3 built-in questions │
│ • 2 uploaded questions │
│ • Randomly mixed       │
│ • 5 total              │
└────────────────────────┘
```

---

## File Locations

### After You Upload, Files Are Stored Here:

```
Your Computer (Local)
└─ Physics_Easy.docx
   (Original file - you have it)

Server (Qnario)
├─ uploads/documents/
│  └─ 1705814400-Physics_Easy.docx
│     (Backup of your upload)
│
└─ uploaded-questions.json
   └─ [
       {
         id: "UPLOADED_1705814400_1",
         text: "A stone is thrown...",
         html: "<p>...</p>",
         options: [...],
         answer: "b) 20 m"
       },
       {
         id: "UPLOADED_1705814400_2",
         text: "Which organ pumps?",
         html: "<p>...</p>",
         options: [...],
         answer: "Heart"
       },
       ...
      ]
```

---

## Equation Formatting Comparison

### Before (Ugly):
```
Using v^2 = u^2 - 2*g*s

where:
  g = 10 m/s^2
  u = 20 m/s
  v = 0 m/s
```
❌ Hard to read, confusing notation

### After (Beautiful):
```
Using v² = u² - 2gs

where:
  g = 10 m/s²
  u = 20 m/s
  v = 0 m/s
```
✅ Professional, clear, easy to understand

---

## Upload Checklist

Before uploading, make sure:

```
Document Content:
  □ Questions are clear
  □ Equations formatted (Word Equation Editor)
  □ Images embedded (not linked)
  □ Correct answer marked with *
  □ Options clearly listed
  □ Questions separated

File Format:
  □ Saved as .docx (not .doc or .pdf)
  □ File name has no special characters
  □ File size < 50MB
  □ File is accessible

Server:
  □ Qnario server is running
  □ You're logged in as TEACHER
  □ Upload button is visible

Upload:
  □ Exam type selected (JEE/NEET/12th)
  □ Difficulty selected (Easy/Medium/Hard)
  □ File selected from computer
  □ Ready to click "Upload & Parse"

✓ All checked? Ready to upload!
```

---

## Student Experience Flow

```
Student's View:

1. Login Screen
   └─→ Enter email/password
       └─→ Click Login

2. Dashboard
   └─→ Click "Create Exam"

3. Exam Creation
   ├─→ Select exam type: JEE
   ├─→ Select difficulty: Easy
   ├─→ Enter questions: 10
   └─→ Click "Generate"

4. Paper Generated
   └─→ Redirects to exam

5. Exam Interface
   ┌─────────────────────────────┐
   │ Question 1 of 10            │
   │ [Beautiful question here]   │
   │ • Option A                  │
   │ • Option B ← Selected       │
   │ • Option C                  │
   │ • Option D                  │
   │ [Next]                      │
   └─────────────────────────────┘

6. Through all 10 questions
   └─→ Each beautifully formatted
       (Some from built-in bank)
       (Some from your uploads)
       (Randomly mixed)

7. Submit
   └─→ Results shown
```

---

## Data Types in System

### Question Structure:
```javascript
{
  id: "UPLOADED_1705814400_1",
  
  // Metadata
  examType: "JEE",        // Type of exam
  type: "MCQ",            // Question type
  difficulty: "Easy",     // Difficulty level
  
  // Content
  text: "Question text",  // Plain text
  html: "<p>...</p>",     // Rich HTML version
  
  // Options & Answer
  options: [
    "Option A",
    "Option B",
    "Option C",
    "Option D"
  ],
  answer: "Option B",     // Correct answer
  
  // Metadata
  uploadedAt: "2026-01-21T10:30:00Z"
}
```

---

## Error Messages & Fixes

```
Error: "Invalid file format"
├─ Check: File is .docx?
├─ Check: File < 50MB?
└─ Try: Re-save as .docx and upload again

Error: "Exam type and difficulty required"
├─ Check: Selected exam type?
├─ Check: Selected difficulty?
└─ Try: Select both and try again

Error: "No file uploaded"
├─ Check: File selected?
├─ Check: Dragging properly?
└─ Try: Use file browser instead

Upload Success but Questions Missing:
├─ Check: Exam type matches upload?
├─ Check: Difficulty matches upload?
└─ Try: Refresh page and try again

Equations not formatted:
├─ Check: Used Word Equation Editor?
├─ Check: Not plain text?
└─ Try: Re-create with Equation Editor
```

---

## Key Statistics

```
System Capacity:
- Max file size: 50 MB
- Max questions per upload: Unlimited
- Upload time: 10-20 seconds
- Processing time: 5-15 seconds
- Available immediately: Yes ✓

Question Pool:
- Built-in questions: ~150+
- Uploadable questions: Unlimited
- Total questions system can handle: 1000+
- Random selection: No duplicates ✓

Performance:
- Paper generation: < 2 seconds
- Display rendering: < 1 second
- Student experience: Smooth & fast ✓
```

---

## Quick Access Map

```
Want to...                    Go to...
─────────────────────────────────────────
Upload questions          → Teacher Dashboard → Upload Questions
Generate exam            → Student Dashboard → Create Exam
Check question details   → STEP_BY_STEP_GUIDE.md
Understand system        → SYSTEM_ARCHITECTURE.md
Troubleshoot issues      → QUICK_START_UPLOAD.md
Create documents         → SAMPLE_QUESTION_DOCUMENT.txt
```

---

## Visual: From Document to Exam

```
┌──────────────────────┐
│ You create in Word   │
│                      │
│ A stone is thrown    │
│ v = 20 m/s           │
│                      │
│ [diagram.png]        │
│                      │
│ v² = u² - 2gs        │
└──────────┬───────────┘
           │
           ↓
     Save as .docx
           │
           ↓
┌──────────────────────┐
│ Upload to Qnario     │
│                      │
│ Select: JEE          │
│ Select: Easy         │
│ Upload file          │
└──────────┬───────────┘
           │
           ↓
    System processes
    (15 seconds)
           │
           ↓
┌──────────────────────┐
│ Stored in system     │
│                      │
│ uploaded-            │
│ questions.json       │
│ [Your question]      │
└──────────┬───────────┘
           │
           ↓
┌──────────────────────┐
│ Student generates    │
│ exam (JEE/Easy)      │
│                      │
│ System combines:     │
│ • Old questions      │
│ • Your new question  │
│                      │
│ Random mix           │
└──────────┬───────────┘
           │
           ↓
┌──────────────────────┐
│ Student sees exam    │
│                      │
│ A stone is thrown    │
│ v = 20 m/s           │
│ ✓ Formatted equation │
│ ✓ Diagram visible    │
│                      │
│ Options:             │
│ ○ 10 m               │
│ ○ 20 m               │
│ ○ 30 m               │
│ ○ 40 m               │
│                      │
│ → Better clarity!    │
│ → Better answers!    │
│ → Better results!    │
└──────────────────────┘
```

---

## Remember

```
     Simple → Effective → Professional

Teacher:   Create Word doc (natural way)
                    ↓
           Upload (one click)
                    ↓
System:    Process automatically
                    ↓
Student:   See beautiful questions
                    ↓
Result:    Everyone happy! ✓
```

**That's how it works!** 🎉
