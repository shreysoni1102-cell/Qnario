# Practical Walkthrough: First Upload

## Let's Do It Step-by-Step

This guide walks you through your FIRST document upload, from start to finish.

---

## PART 1: CREATE YOUR FIRST DOCUMENT (10 minutes)

### Step 1: Open Word

1. Click **Start Menu** (Windows logo)
2. Type: **"Word"** or **"Microsoft Word"**
3. Click **Microsoft Word** from results
4. Choose **Blank Document**
5. Click **Create**

You now have a blank Word document open.

### Step 2: Type Your First Question

Type this in your document:

```
Question 1

A car travels 100 km in 2 hours.
Find the average speed.

Formula: Speed = Distance / Time

Options:
a) 25 km/h
b) 50 km/h
c) 75 km/h
d) 100 km/h

Answer: b) 50 km/h
```

### Step 3: Add a Simple Equation

Now let's add a fancy equation:

1. Click at the end of "Formula:"
2. Press **Space**
3. Go to menu: **Insert** → **Equation**
4. Type in the equation box:
   ```
   Speed = Distance / Time
   ```
5. Click outside the equation box to save it

Now your equation looks professional!

```
Formula: Speed = Distance / Time
         (properly formatted with fraction)
```

### Step 4: Add Another Question

Press **Enter** a few times, then add:

```
Question 2

Which of the following is a compound?
a) Oxygen (O₂)
b) Water (H₂O)
c) Nitrogen (N₂)
d) Chlorine (Cl₂)

Answer: b) Water (H₂O)
```

### Step 5: Save Your Document

1. Press **Ctrl + S** (or go to File → Save)
2. Name it: **`My_First_Questions.docx`**
3. **IMPORTANT:** Make sure it says ".docx" at the end
4. Click **Save**

✓ Your document is saved!

---

## PART 2: LOGIN TO QNARIO (2 minutes)

### Step 1: Start Your Server

Open PowerShell and run:
```powershell
npm start
```

Wait for:
```
Server running at http://localhost:3000
```

### Step 2: Open Browser

1. Open any browser (Chrome, Firefox, Edge, etc.)
2. Go to: **http://localhost:3000**
3. You see Qnario homepage

### Step 3: Login as Teacher

1. Click **"Teacher Login"**
2. Enter your email: (use a teacher email)
3. Enter password: (your password)
4. Click **"Login"** button

You're now logged in as a teacher! ✓

---

## PART 3: UPLOAD YOUR DOCUMENT (5 minutes)

### Step 1: Go to Dashboard

After login, you automatically go to Teacher Dashboard.

You see 4 options:
- Create New Exam
- View Papers
- **Upload Questions** ← Click this
- Analytics

### Step 2: Click "Upload Questions"

Click the **"Upload Questions"** button.

You now see the upload page:

```
┌──────────────────────────────────────┐
│   Upload Question Document           │
│                                      │
│  Exam Type:  [Select ▼]              │
│  Difficulty: [Select ▼]              │
│  File:       [Choose DOCX File]      │
│                                      │
│  [Upload & Parse] [Cancel]           │
└──────────────────────────────────────┘
```

### Step 3: Select Exam Type

1. Click on **"[Select ▼]"** under "Exam Type"
2. Choose one from dropdown:
   - JEE (for engineering students)
   - NEET (for medical students)
   - 12th (for board exams)

**For this example:** Select **"12th"**

### Step 4: Select Difficulty

1. Click on **"[Select ▼]"** under "Difficulty"
2. Choose one:
   - Easy
   - Medium
   - Hard

**For this example:** Select **"Easy"**

### Step 5: Upload Your File

You have 2 options:

**Option A: Click to Browse**
1. Click on **"📄 Choose DOCX File"**
2. File explorer opens
3. Navigate to your file: **`My_First_Questions.docx`**
4. Click on it to select
5. Click **"Open"** button

**Option B: Drag & Drop**
1. Find your file on your computer
2. Drag it onto the upload box
3. Drop it there

Either way, the file gets selected.

### Step 6: Verify Selection

You should see:
```
Exam Type: 12th ✓
Difficulty: Easy ✓
File: My_First_Questions.docx ✓
```

All filled in? Great!

### Step 7: Click "Upload & Parse"

Now click the **big blue button: "Upload & Parse"**

You see:
```
Processing document...
[████████░░] 80%
```

Wait... the system is:
1. Receiving your file
2. Converting DOCX → HTML
3. Extracting questions
4. Storing in system

Takes about 10-15 seconds.

---

## PART 4: SUCCESS! (Automatic)

### You See Success Message

```
┌──────────────────────────────────────┐
│  ✅ 2 questions uploaded successfully │
│                                      │
│  Preview - Questions Extracted:      │
│                                      │
│  Q1: A car travels 100 km...         │
│      Options: 4 | Type: MCQ          │
│                                      │
│  Q2: Which is a compound?            │
│      Options: 4 | Type: MCQ          │
│                                      │
│  [Redirecting in 2 seconds...]       │
└──────────────────────────────────────┘
```

Congratulations! 🎉

Your questions are now in the system!

---

## PART 5: TEST IT - STUDENT VIEW (5 minutes)

### Step 1: Logout as Teacher

1. Look for logout button (top right)
2. Click it
3. You're logged out

### Step 2: Login as Student

1. Click **"Student Login"**
2. Enter student credentials
3. Click **"Login"**

### Step 3: Create a Test Exam

1. Click **"Generate Paper"** or **"Create Exam"**
2. Select:
   - Exam Type: **12th** (matches upload)
   - Difficulty: **Easy** (matches upload)
   - Questions: **2**
3. Click **"Generate"**

### Step 4: Take the Exam

You now see your questions!

```
┌──────────────────────────────────────────┐
│  Question 1 of 2          Timer: 30:00   │
├──────────────────────────────────────────┤
│                                          │
│  A car travels 100 km in 2 hours.        │
│  Find the average speed.                 │
│                                          │
│  Formula: Speed = Distance / Time        │
│  (with proper equation formatting!)      │
│                                          │
│  Options:                                │
│  ○ 25 km/h                               │
│  ○ 50 km/h                               │
│  ○ 75 km/h                               │
│  ○ 100 km/h                              │
│                                          │
│  [Next]                                  │
└──────────────────────────────────────────┘
```

### Step 5: Verify It Works

✓ Question displays properly
✓ Equation shows formatted
✓ Options are clear
✓ Everything looks professional

**It works!** 🚀

---

## PART 6: WHAT JUST HAPPENED?

Let me explain what happened behind the scenes:

### Inside the Server:

```
1. Your file: My_First_Questions.docx
   ├─ Uploaded to server
   └─ Saved in: uploads/documents/
   
2. Mammoth library converted it
   └─ DOCX → HTML
      └─ With formatted equations
      └─ With embedded content
   
3. Parser extracted questions
   ├─ Found: "A car travels..."
   ├─ Found: "Which is compound?"
   ├─ Found: Options for each
   └─ Found: Correct answers
   
4. Stored in uploaded-questions.json
   └─ Now available in system
   
5. When student generated exam:
   ├─ System loaded built-in questions
   ├─ System loaded your questions
   ├─ Mixed them together
   ├─ Random selection
   └─ Paper created with BOTH sources
```

### File Storage:

**On Server Now:**
```
Server Files:

uploads/documents/
└─ 1705814400-My_First_Questions.docx (backup)

uploaded-questions.json
└─ [
     {
       id: "UPLOADED_1705814400_1",
       examType: "12th",
       difficulty: "Easy",
       text: "A car travels 100 km...",
       html: "<p>A car travels...</p>",
       options: ["25 km/h", "50 km/h", ...],
       answer: "50 km/h"
     },
     {
       id: "UPLOADED_1705814400_2",
       examType: "12th",
       difficulty: "Easy",
       text: "Which is a compound?",
       html: "<p>Which is...</p>",
       options: ["O₂", "H₂O", ...],
       answer: "H₂O"
     }
   ]
```

Everything is stored and accessible!

---

## PART 7: COMMON QUESTIONS

### Q: Can I upload more questions?

**A:** Yes! Just create another document and upload it. They all combine in the system.

### Q: Can I upload to different exam types?

**A:** Yes! Upload to JEE, NEET, 12th - each will be categorized correctly.

### Q: What if I made a mistake in the document?

**A:** You can upload again with corrected questions. The new ones get added.

### Q: How many questions can I upload per document?

**A:** As many as you want! System handles unlimited.

### Q: Will it affect existing questions?

**A:** No! Old questions still work. Your uploads are added to the pool.

### Q: Can students see uploaded questions?

**A:** Only if the exam type/difficulty matches. They get random mix of old + new.

### Q: How long before questions are available?

**A:** Immediately! Takes 10-15 seconds to upload and process.

---

## PART 8: NEXT STEPS

### Now You Can:

1. **Create more documents** with different subjects
2. **Upload to different exam types** (JEE, NEET, 12th)
3. **Upload to different difficulties** (Easy, Medium, Hard)
4. **Add complex equations** (using Word Equation Editor)
5. **Add diagrams/images** (insert directly in Word)
6. **Build complete question bank** from your documents

### Try Advanced Features:

1. **Add images** - Insert diagram in Word
2. **Add equations** - Use Equation Editor
3. **Multiple documents** - Upload several
4. **Different subjects** - Physics, Chemistry, Biology
5. **Mixed difficulty** - Upload Easy, Medium, Hard

---

## TROUBLESHOOTING FOR YOUR FIRST UPLOAD

### If upload button doesn't appear:
```
1. Refresh page (Ctrl+R)
2. Make sure you're logged as TEACHER
3. Check dashboard loaded
4. Try clearing cache (Ctrl+Shift+Delete)
```

### If file upload fails:
```
1. Check file is .docx (not .doc or .pdf)
2. Check file size (< 50MB)
3. Try smaller file first
4. Check internet connection
5. Restart server and try again
```

### If questions don't appear:
```
1. Check exam type matches (12th = 12th)
2. Check difficulty matches (Easy = Easy)
3. Refresh page
4. Try generating exam again
5. Check server logs for errors
```

### If equations look wrong:
```
1. Make sure you used Word Equation Editor
2. Not plain text "Speed = Distance / Time"
3. Should be formatted equation
4. Try re-uploading
```

---

## CHECKLIST: YOUR FIRST UPLOAD

Before you start:
- [ ] Word installed
- [ ] Server running
- [ ] Browser ready
- [ ] Document prepared

During upload:
- [ ] Logged in as teacher ✓
- [ ] Upload button visible ✓
- [ ] Exam type selected ✓
- [ ] Difficulty selected ✓
- [ ] File selected ✓
- [ ] Clicked "Upload & Parse" ✓

After upload:
- [ ] Success message shown ✓
- [ ] Question preview visible ✓
- [ ] Redirected to dashboard ✓

Testing:
- [ ] Logged in as student ✓
- [ ] Generated exam ✓
- [ ] Questions appear ✓
- [ ] Formatting looks good ✓
- [ ] Everything works ✓

**All done!** 🎉

---

## TIPS FOR SUCCESS

✓ **Keep first document simple** (just 2-3 questions to test)
✓ **Use same exam type** (Upload 12th, test with 12th)
✓ **Use same difficulty** (Upload Easy, test with Easy)
✓ **Check formatting** (Make sure equations/images included)
✓ **Don't rush** (Process takes 10-15 seconds)
✓ **Be patient** (Might take extra time first time)
✓ **Test thoroughly** (Generate exam and verify display)

---

## WHAT'S NEXT?

After your first successful upload:

1. **Create more documents** for other subjects
2. **Upload different exam types** (JEE, NEET, 12th)
3. **Add complex content** (equations, diagrams)
4. **Build your question library** gradually
5. **Have students practice** with better questions
6. **See improved results** with clearer questions

---

## You Did It! 🎉

You've successfully:
✓ Created a Word document
✓ Uploaded it to Qnario
✓ System processed it
✓ Student saw beautiful questions

Your document upload system is working!

Now you can create professional exam papers with equations and diagrams.

**Congratulations!** Welcome to Qnario v2.0 with Document Upload! 🚀

---

**Next:** Read `SAMPLE_QUESTION_DOCUMENT.txt` for advanced document formatting tips!
