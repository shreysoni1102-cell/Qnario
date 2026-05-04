# Quick Start: Upload Questions with Equations & Diagrams

## What's New? ✨

Your app now supports uploading Word documents (.docx) with:
- ✅ Complex equations (MathML/LaTeX)
- ✅ Diagrams and images
- ✅ Rich text formatting
- ✅ All integrated into exam papers

## 3 Steps to Get Started

### Step 1: Install Dependencies
```powershell
cd e:\CHECKING\ 1\qnario
npm install multer mammoth cors
```

### Step 2: Restart Your Server
```powershell
npm start
# or your usual server start command
```

### Step 3: Upload Your First Document
1. **Login as Teacher**
2. Go to **Teacher Dashboard**
3. Click **"Upload Questions"**
4. Select exam type and difficulty
5. Upload your .docx file
6. Done! Questions are now in the system

## Creating Your Word Document

### Do's ✅
- Save as **.docx** (modern Word format)
- Use **Section Breaks** between questions
- Insert equations with **Word Equation Editor**
- Embed images **directly in document**
- Use **bullet points** for options
- Mark correct answer with **asterisk (*)**

### Example Structure
```
## Question 1

What is the integral of ∫x² dx?

a) x³/3 + C *
b) x³ + C
c) 2x + C
d) x² + C

---

## Question 2

[Next question...]
```

### Don'ts ❌
- Don't use plain text equation notation (write: x² not x^2)
- Don't link images (embed them)
- Don't use PDF (convert to .docx first)
- Don't add complex styling (keep it simple)

## Behind the Scenes

### What Happens When You Upload?
```
Your .docx File
       ↓
Uploaded to: uploads/documents/
       ↓
Converted to HTML (mammoth library)
       ↓
Parsed into questions
       ↓
Stored in: uploaded-questions.json
       ↓
Available for exam generation
```

### How Exams Are Generated
```
Student creates exam
       ↓
System combines:
  • Built-in questions (question-bank.js)
  + Uploaded questions (uploaded-questions.json)
       ↓
Random selection based on filters
       ↓
Questions displayed with full formatting
```

## File Changes Made

### New Files Created ✨
- `routes/question-upload.js` - Upload API
- `teacher-upload-questions.html` - Upload interface
- `rich-question-renderer.js` - Display helper
- `DOCUMENT_UPLOAD_SETUP.md` - Full guide
- `uploads/` directory - For documents

### Files Modified 🔧
- `server.js` - Added routes
- `package.json` - Added dependencies
- `student-create-exam.html` - Loads uploaded questions
- `teacher-dashboard.html` - Added upload link

## Verification Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Server running
- [ ] Can access Teacher Dashboard
- [ ] "Upload Questions" button appears
- [ ] Can select exam type
- [ ] Can upload .docx file
- [ ] Questions appear in system
- [ ] Students see formatted questions in exams

## Example: Physics Question with Diagram

```
## Free Fall Problem

A ball is dropped from height h.
[Image: Diagram of falling ball with arrow showing velocity]

Using v² = u² + 2as, find velocity after falling 20m:

a) 20 m/s *
b) 10 m/s
c) 30 m/s
d) 15 m/s
```

→ In exam: Student sees **diagram + equation + options**

## Example: Chemistry with Complex Equation

```
## Molecular Weight

What is the molecular weight of H₂SO₄?

a) 98 g/mol *
b) 96 g/mol
c) 100 g/mol
d) 94 g/mol
```

→ In exam: **Equation properly rendered** (not just text)

## API Reference

### For Developers

**Upload endpoint:**
```javascript
fetch('/api/upload-questions', {
  method: 'POST',
  body: formData // Contains: file, examType, difficulty
})
```

**Get all uploaded questions:**
```javascript
fetch('/api/uploaded-questions').then(r => r.json())
```

**Get by exam type:**
```javascript
fetch('/api/questions-by-type/JEE').then(r => r.json())
```

## Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| Can't find upload page | Clear cache, login as teacher |
| File upload fails | Ensure .docx format, < 50MB |
| Equations show as text | Use Word Equation Editor |
| Images not appearing | Embed in Word (not external links) |
| Server won't start | Run `npm install` again |

## Support for Competitive Exams

Perfect for:
- **JEE**: Physics diagrams + math equations
- **NEET**: Biology diagrams + labels
- **12th Board**: All subjects with visual aids

## Next Features (Future)

- PDF upload support
- Real-time preview while creating document
- Batch upload multiple documents
- Question bank management UI
- Duplicate detection
- Auto-categorization

---

**Version**: 2.0  
**Feature**: Document Upload with Rich Content  
**Status**: Ready to use! 🚀
