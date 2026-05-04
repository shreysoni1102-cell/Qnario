# 🚀 SETUP INSTRUCTIONS - GET EVERYTHING WORKING NOW

## Step 1: Install All Libraries
Run this command in your terminal (in the qnario folder):

```bash
npm install
```

This will install:
- ✅ mongoose (database)
- ✅ dotenv (configuration)
- ✅ express (already have)
- ✅ All other dependencies

**Time: 2-3 minutes**

---

## Step 2: Setup MongoDB Connection

### Option A: Using MongoDB Atlas (Cloud) - RECOMMENDED
1. Go to: https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a cluster
4. Get connection string
5. Create `.env` file in qnario folder with:

```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/exam-platform?retryWrites=true&w=majority
PORT=3000
```

### Option B: Using Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Create `.env` file:

```
MONGODB_URI=mongodb://localhost:27017/exam-platform
PORT=3000
```

**Time: 5 minutes**

---

## Step 3: Seed Your Database
After connecting, run this to add sample data:

```bash
node init-database.js
```

You should see:
```
✅ MongoDB connected
✅ Cleared existing data
✅ 6 subjects added
✅ 3 exams added
✅ 6 topics added
✅ 6 sample questions added

🎉 DATABASE SEEDED SUCCESSFULLY!
```

**Time: 1 minute**

---

## Step 4: Start Your Server
```bash
node server.js
```

You should see:
```
✅ MongoDB connected
✅ Database models loaded
✅ API routes ready (exam-api)
Server running on http://localhost:3000
```

**Time: 30 seconds**

---

## Step 5: Test the API
Open another terminal and run:

```bash
curl http://localhost:3000/api/exams
```

Or go to: http://localhost:3000/api/exams

You should see JSON with 3 exams (JEE Main, NEET, 12th Board)

**Time: 1 minute**

---

## ✅ Complete! You're Done!

Now you can:
- ✅ Get all exams: http://localhost:3000/api/exams
- ✅ Get physics questions: http://localhost:3000/api/questions?exam=JEE%20Main&subject=Physics
- ✅ Submit answers and get results
- ✅ View student dashboard

---

## Quick Test Commands

### Get all exams:
```bash
curl http://localhost:3000/api/exams
```

### Get JEE Main Physics questions:
```bash
curl "http://localhost:3000/api/questions?exam=JEE%20Main&subject=Physics"
```

### Submit an answer:
```bash
curl -X POST http://localhost:3000/api/attempts/submit \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student_123",
    "examId": "JEE_MAIN",
    "questionId": "YOUR_QUESTION_ID",
    "selectedAnswer": "Yes"
  }'
```

---

## ⚠️ Troubleshooting

### Error: "Cannot find module mongoose"
**Fix:** Run `npm install` again

### Error: "ECONNREFUSED" or "connection refused"
**Fix:** Check MongoDB is running or .env file has correct MONGODB_URI

### Error: "Cannot find module './models/Subject'"
**Fix:** Make sure all model files exist in models/ folder

### API returns empty
**Fix:** Run `node init-database.js` to add sample data

---

## 📊 What Gets Created

After seeding, your database will have:

**Subjects (6):**
- Physics, Chemistry, Biology, Mathematics, English, History

**Exams (3):**
- JEE Main (300 marks, 180 min)
- NEET (720 marks, 180 min)
- 12th Board (500 marks, 180 min)

**Topics (6):**
- Mechanics, Thermodynamics, Bonding, Organic Chemistry, Cell Biology, Genetics

**Questions (6 sample):**
- Physics, Chemistry, Biology, Mathematics questions ready to use

---

## 🎯 Next Steps After Setup

1. **Add More Questions** using the API or database
2. **Connect Your Frontend** to the API endpoints
3. **Let Students Take Exams** using /api/practice-test
4. **View Results** and analytics

---

## ✨ That's It!

Your entire exam platform database is now:
- ✅ Installed
- ✅ Connected
- ✅ Seeded with sample data
- ✅ Running and accessible

**Total Setup Time: ~15 minutes**

Start with: `npm install` → `node init-database.js` → `node server.js`

Done! 🎉
