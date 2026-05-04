# ⚡ MONGODB SETUP - 5 MINUTE QUICK GUIDE

## Option 1: MongoDB Atlas (Cloud) - RECOMMENDED ⭐

### Step 1: Create Free Account
1. Go to: https://www.mongodb.com/cloud/atlas
2. Click "Try Free"
3. Sign up with Google or email
4. Verify your email

### Step 2: Create Cluster
1. Click "Create a Deployment"
2. Choose "Free" tier
3. Select your preferred region
4. Click "Create Deployment"
5. Wait 2-3 minutes for cluster to load

### Step 3: Get Connection String
1. Click "Connect"
2. Click "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database password

### Step 4: Update .env File
Open `e:\CHECKING 1\qnario\.env` and replace:

```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/exam-platform?retryWrites=true&w=majority
PORT=3000
```

### Step 5: Test Connection
```bash
node init-database.js
```

You should see: ✅ DATABASE SEEDED SUCCESSFULLY!

---

## Option 2: MongoDB Local (Need MongoDB installed)

### If you have MongoDB installed locally:
1. Start MongoDB service
2. Leave .env as is (mongodb://localhost:27017/exam-platform)
3. Run: `node init-database.js`

---

## Option 3: Use Pre-Seeded File-Based Data (For Testing)

If you don't want to setup MongoDB yet:
1. Edit `.env` to have a placeholder:
```
MONGODB_URI=mongodb://localhost:27017/exam-platform
PORT=3000
```

2. Use the file-based question storage instead
3. Later switch to MongoDB Atlas when ready

---

## 🚀 RECOMMENDED: MongoDB Atlas Setup (2 minutes)

1. **Create account:** https://www.mongodb.com/cloud/atlas
2. **Create free cluster**
3. **Get connection string**
4. **Paste in `.env` file**
5. **Run:** `node init-database.js`
6. **Done!** ✅

This is the easiest and works instantly!

---

## Need Help?

If connection fails:
- Check your internet connection
- Verify MONGODB_URI is correct in .env
- Try MongoDB Atlas (it's free and just works)

Contact MongoDB support: https://www.mongodb.com/docs/

---

**Total Time: 5 minutes**
