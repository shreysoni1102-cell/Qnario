# Installation & Verification Checklist

## Pre-Installation
- [ ] Node.js installed (check: `node --version`)
- [ ] npm installed (check: `npm --version`)
- [ ] Qnario folder accessible
- [ ] Server can be started normally

## Installation Steps

### Step 1: Run Installation
Choose your method:

**Option A - PowerShell (Recommended)**
```powershell
cd e:\CHECKING\ 1\qnario
.\install-document-upload.ps1
```

**Option B - Command Prompt (Batch)**
```cmd
cd e:\CHECKING\ 1\qnario
install-document-upload.bat
```

**Option C - Manual**
```powershell
cd e:\CHECKING\ 1\qnario
npm install multer mammoth cors
mkdir uploads\documents
```

### Step 2: Verify Installation
- [ ] All packages installed (check: `npm list multer mammoth`)
- [ ] No error messages during installation
- [ ] `uploads` directory created
- [ ] `uploads/documents` directory created

### Step 3: Restart Server
```powershell
npm start
# or your usual server command
```

Check that server starts without errors:
- [ ] Server running on port 3000 (or your port)
- [ ] No "Cannot find module" errors
- [ ] Routes loaded successfully

---

## Post-Installation Verification

### Check 1: Teacher Dashboard Update
1. [ ] Login as teacher
2. [ ] Go to Teacher Dashboard
3. [ ] See "Upload Questions" button
4. [ ] Click it - should load upload page

### Check 2: Upload Page Access
1. [ ] Upload page loads successfully
2. [ ] Can select exam type dropdown
3. [ ] Can select difficulty dropdown
4. [ ] File input shows

### Check 3: Test Upload
1. [ ] Create test Word document (.docx)
   - [ ] Add 1-2 sample questions
   - [ ] Save as .docx format
2. [ ] Upload test document
   - [ ] Select exam type: JEE
   - [ ] Select difficulty: Easy
   - [ ] Choose file
   - [ ] Click Upload
3. [ ] Upload succeeds
   - [ ] No errors shown
   - [ ] Preview appears
   - [ ] Question count displays

### Check 4: Questions Available in System
1. [ ] Check `uploaded-questions.json` exists
2. [ ] File contains uploaded questions
3. [ ] Questions have correct exam type
4. [ ] Questions have difficulty level

### Check 5: Student Paper Generation
1. [ ] Login as student
2. [ ] Go to Create Exam / Generate Paper
3. [ ] Select exam type (same as uploaded)
4. [ ] Select difficulty (same as uploaded)
5. [ ] Request questions
6. [ ] Paper includes uploaded questions ✓
7. [ ] Questions display correctly ✓

### Check 6: Question Display Quality
1. [ ] Text questions display clearly
2. [ ] Equations format properly (if in document)
3. [ ] Images/diagrams display
4. [ ] Options visible and selectable
5. [ ] Overall presentation looks good

---

## Troubleshooting Checks

### If packages fail to install:
```
❌ Problem: "npm install failed"
✓ Solution:
  - Check internet connection
  - Try: npm cache clean --force
  - Then: npm install multer mammoth cors
```

### If upload page not found:
```
❌ Problem: "Cannot find upload page"
✓ Solution:
  - Clear browser cache (Ctrl+Shift+Delete)
  - Restart server
  - Make sure you're logged in as teacher
  - Check teacher role in localStorage
```

### If upload fails with file error:
```
❌ Problem: "Invalid file format"
✓ Solution:
  - Ensure file is .docx (not .doc or .pdf)
  - Ensure file < 50MB
  - Try with sample test file first
```

### If questions don't appear in exams:
```
❌ Problem: "Uploaded questions not showing"
✓ Solution:
  - Check exam type matches upload type
  - Check difficulty matches upload difficulty
  - Verify uploaded-questions.json has content
  - Check browser console for errors (F12)
  - Restart server and try again
```

### If server won't start after changes:
```
❌ Problem: "Server fails to start"
✓ Solution:
  - Run: npm install again
  - Check for syntax errors in modified files
  - Restart Node.js completely
  - Check port 3000 not in use
```

---

## File Structure Verification

After installation, verify you have:

```
qnario/
├── ✓ package.json (modified - has new dependencies)
├── ✓ server.js (modified - has upload routes)
├── ✓ student-create-exam.html (modified - loads uploaded questions)
├── ✓ teacher-dashboard.html (modified - has upload button)
│
├── ✓ routes/
│   └── question-upload.js (NEW)
│
├── ✓ teacher-upload-questions.html (NEW)
├── ✓ rich-question-renderer.js (NEW)
│
├── ✓ uploads/ (NEW directory)
│   └── documents/ (NEW subdirectory)
│
├── ✓ uploaded-questions.json (CREATED on first upload)
│
├── ✓ DOCUMENT_UPLOAD_SETUP.md (guide)
├── ✓ QUICK_START_UPLOAD.md (quick ref)
├── ✓ SOLUTION_SUMMARY.md (overview)
├── ✓ SAMPLE_QUESTION_DOCUMENT.txt (template)
└── ✓ install-document-upload.* (installers)
```

---

## Quick Test Scenario

### Complete test workflow (5 minutes):

1. **Prepare** (1 min)
   - [ ] Create test Word doc with 2 questions
   - [ ] Add exam type (JEE) and difficulty (Easy)

2. **Upload** (1 min)
   - [ ] Go to upload page
   - [ ] Upload test document
   - [ ] Verify success message

3. **Generate Exam** (1 min)
   - [ ] Login as student
   - [ ] Create exam paper (same exam type/difficulty)
   - [ ] Request 5-10 questions

4. **Verify** (2 min)
   - [ ] Paper generated
   - [ ] Uploaded questions appear
   - [ ] Questions display correctly
   - [ ] Options are selectable
   - [ ] Can submit exam

**Expected Result:** ✅ All checks pass, system working!

---

## Performance Checks

### Typical Performance
- [ ] Upload file: < 30 seconds
- [ ] Parse document: < 5 seconds
- [ ] Paper generation: < 2 seconds
- [ ] Exam display: Instant
- [ ] No lag when answering

### If performance is slow:
- Check file size (should be < 10MB)
- Check number of questions (should be < 100 per document)
- Restart server
- Check available disk space

---

## Security Checks

✓ Verify these security features:
- [ ] Only .docx files accepted (try PDF - should reject)
- [ ] File size limited to 50MB (try > 50MB - should reject)
- [ ] Uploaded files stored server-side (not executed)
- [ ] Questions stored in JSON (safe format)
- [ ] Teacher authentication required (try without login - redirect to login)

---

## Browser Compatibility

Test on these browsers:
- [ ] Chrome (Latest)
- [ ] Firefox (Latest)
- [ ] Edge (Latest)
- [ ] Safari (if macOS available)

Should work on all modern browsers.

---

## Rollback (If Needed)

If something goes wrong, rollback to original:

1. Undo package.json changes
2. Undo server.js changes
3. Delete new files:
   - routes/question-upload.js
   - teacher-upload-questions.html
   - rich-question-renderer.js
   - uploads/ directory
4. Restart server

Your system will work as before.

---

## Success Indicators ✓

You know it's working when:

✅ **Teachers can:**
- Access upload page from dashboard
- Select exam type and difficulty
- Upload Word documents
- See uploaded questions in preview

✅ **Students can:**
- See uploaded questions in generated papers
- Questions display with formatting
- Equations show properly (if in document)
- Images/diagrams visible (if in document)
- Answer questions normally
- Submit papers

✅ **System-wide:**
- No errors in console (F12)
- No errors in server logs
- uploaded-questions.json has content
- Both old and new questions work together
- Performance is normal

---

## Next Steps After Installation

1. **Create Sample Documents**
   - Use SAMPLE_QUESTION_DOCUMENT.txt as reference
   - Create test questions for each subject

2. **Train Teachers**
   - Show upload process
   - Share document format guidelines
   - Demonstrate results

3. **Monitor First Uses**
   - Check uploaded-questions.json
   - Verify questions display correctly
   - Get feedback from teachers/students

4. **Full Rollout**
   - Teachers start uploading their questions
   - Build up question bank
   - Students benefit from rich content

---

## Getting Help

If issues occur, check:
1. `QUICK_START_UPLOAD.md` - Quick fixes
2. `DOCUMENT_UPLOAD_SETUP.md` - Detailed setup
3. Browser console (F12) - JavaScript errors
4. Server logs - Node.js errors
5. Check file permissions - Can server write to uploads/?

---

## Documentation References

- **Quick Start**: QUICK_START_UPLOAD.md
- **Full Setup**: DOCUMENT_UPLOAD_SETUP.md
- **Solution Overview**: SOLUTION_SUMMARY.md
- **Document Template**: SAMPLE_QUESTION_DOCUMENT.txt
- **This Checklist**: This file

---

**Installation Status: Ready to Begin**

Now run the installer and complete the verification checks!

Good luck! 🚀
