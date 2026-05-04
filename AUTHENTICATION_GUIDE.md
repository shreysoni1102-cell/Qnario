# 🔐 Qnario Authentication System - Complete Guide

## ✅ What's Been Fixed

1. **Unified Login System**: All (student, teacher, admin) now use the same `/api/login` endpoint
2. **Proper User Storage**: All users stored in `backend/users.json` with hashed passwords
3. **Data Linking**: All papers, questions, results linked to user email
4. **Existing Data Preserved**: Old testuser@gmail.com data and all generated papers/questions retained
5. **Session Management**: User info saved to localStorage after login for all operations
6. **Simple Signup**: Enhanced signup with proper validation and role-based redirect

---

## 👥 Test Credentials

### **Student Account**
- **Email**: `student@gmail.com`
- **Password**: `student123`
- **Role**: Student
- **Access**: Student dashboard, take exams, view results

### **Teacher Account**
- **Email**: `teacher@gmail.com`
- **Password**: `teacher123`
- **Role**: Teacher
- **Access**: Teacher dashboard, upload syllabus, generate questions, create papers, view analytics

### **Old Teacher Account** (Has all existing papers & questions)
- **Email**: `testuser@gmail.com`
- **Password**: `student123` (same as student for simplicity)
- **Role**: Teacher
- **Access**: All previously generated papers, questions, and results

### **Admin Account**
- **Email**: `admin@gmail.com`
- **Password**: `admin123`
- **Role**: Admin
- **Access**: All user data, analytics, system-wide views

### **Another Student Account** (Has exam results)
- **Email**: `abc@gmail.com`
- **Password**: `student123`
- **Role**: Student
- **Access**: Previous exam attempts and results

---

## 🔄 How Authentication Works Now

### **1. Signup Flow**
```
User clicks "Sign Up" → Fills form (name, email, password, mobile, role)
→ Validates email domain and password
→ Hashes password with bcrypt
→ Stores in users.json
→ Redirects to appropriate login page
```

### **2. Login Flow**
```
User enters email & password → Selects role (student/teacher/admin)
→ Backend validates credentials against users.json
→ Returns user info + session token
→ Frontend saves user to localStorage
→ Redirects to dashboard
```

### **3. Data Operations** (Papers, Questions, Results)
```
User logged in (email in localStorage)
→ When generating papers/questions, user email automatically included
→ When retrieving data, filtered by user's email
→ Only admin sees all data; others see only their own
```

---

## 📝 User Data Structure in users.json

```json
{
  "name": "Teacher Name",
  "email": "teacher@gmail.com",
  "password": "$2b$10$hashed_password...",
  "role": "teacher",
  "mobile": "9876543210",
  "createdAt": "2026-04-27T10:00:00Z"
}
```

---

## 🔗 Linked Data By User

### **Teacher Data**
- Uploaded syllabi (in `uploads/syllabi/` with email in metadata)
- Generated papers (syllabus-papers.json, tagged with teacherEmail)
- Generated questions (generated-questions.json, tagged with createdBy)
- Student exam attempts in their class

### **Student Data**
- Exam attempts (results.json, tagged with studentEmail)
- Quiz responses
- Performance analytics

### **Admin Data**
- Can view all user data
- Can view all papers and questions
- Can view all results and analytics
- Can manage all users

---

## 🚀 Test the System

### **Step 1: Login as Teacher**
1. Go to `http://localhost:3001/teacher-login.html`
2. Enter: `teacher@gmail.com` / `teacher123`
3. Should see teacher dashboard with option to upload syllabus

### **Step 2: View Existing Papers**
1. Go to `http://localhost:3001/teacher-syllabus-papers.html`
2. Should see previously generated papers

### **Step 3: Logout & Login as Old Teacher**
1. Login as `testuser@gmail.com` / `student123`
2. Should see all old papers and questions that were generated before
3. Data includes papers from Feb-Mar 2026

### **Step 4: Create New User**
1. Go to `http://localhost:3001/signup.html`
2. Fill form with new credentials
3. Should be redirected to login page
4. Login with new account to access personal dashboard

### **Step 5: Admin Access**
1. Go to `http://localhost:3001/admin-login.html`
2. Enter: `admin@gmail.com` / `admin123`
3. Should see admin dashboard with all users and data

---

## 🔧 API Endpoints

### **Authentication**
```
POST /api/signup
POST /api/login
```

### **Syllabus Management**
```
POST /api/syllabus/upload        (requires: teacherEmail from body)
GET  /api/syllabus/list
GET  /api/syllabus/:id
POST /api/syllabus/:id/generate  (auto-uses teacherEmail)
```

### **Questions**
```
POST /api/generate-questions     (auto-uses user email from request)
```

### **Results**
```
POST /api/exams/:id/submit       (auto-uses studentEmail from header)
GET  /api/results/:id
```

---

## 💾 Data Files Structure

```
backend/
├── users.json                      # All user accounts (name, email, hashed password, role)
├── users.json                      # Student/Teacher email list
├── syllabi.json                    # All uploaded syllabi (linked to teacherEmail)
├── syllabus-papers.json            # Generated papers (linked to teacherEmail)
├── generated-questions.json        # Generated questions (linked to createdBy)
├── results.json                    # Exam results (linked to studentEmail)
├── exams.json                      # Exam definitions
├── uploads/
│   └── syllabi/                    # Uploaded PDF/DOCX files
```

---

## ✨ Features That Now Work

✅ Proper user authentication with role-based access
✅ All previous data (papers, questions, results) preserved
✅ Data properly linked to users by email
✅ Signup with validation
✅ Login redirects to correct dashboard
✅ Session persistence via localStorage
✅ Simple password reset can be added
✅ Admin can view all data
✅ Teachers can see only their papers
✅ Students can see only their results

---

## 🐛 If Something Doesn't Work

1. **Check browser console** (F12) for errors
2. **Clear localStorage**: Go to DevTools → Application → Local Storage → Clear All
3. **Hard refresh page**: Ctrl+Shift+R
4. **Restart services**: Kill all services and run `.\startup-all.ps1` again

---

## 📞 Support

All authentication data is stored in `backend/users.json`. To manually add a user:

1. Hash a password: Use bcrypt online tool or run in Node.js:
```javascript
const bcrypt = require('bcryptjs');
bcrypt.hash('password', 10).then(hash => console.log(hash));
```

2. Add to users.json:
```json
{
  "name": "New User",
  "email": "user@gmail.com",
  "password": "$2b$10$hashed...",
  "role": "teacher",
  "createdAt": "2026-04-29T00:00:00Z"
}
```

---

**System Ready for Full Testing!** 🎉
