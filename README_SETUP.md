# 🚀 **QNARIO: COMPLETE PROJECT SETUP GUIDE**

This guide contains everything you need to set up and run the Qnario project on a new PC or Laptop.

---

## 🛠️ **PREREQUISITES (Must Install First)**

If you do not have these installed, the project **will not run**.

### 1️⃣ **Node.js (LTS Version)**
*   **Purpose:** Runs the main web server and frontend logic.
*   **Download:** [nodejs.org](https://nodejs.org/)
*   **Verify:** Open Command Prompt and type `node -v` (Should be v18 or higher).

### 2️⃣ **Python (3.10 or higher)**
*   **Purpose:** Runs the AI Gemini Microservice.
*   **Download:** [python.org](https://www.python.org/downloads/)
*   **Important:** During installation, check the box **"Add Python to PATH"**.
*   **Verify:** Type `python --version` in terminal.

### 3️⃣ **MongoDB Community Server**
*   **Purpose:** Stores user data, exam results, and syllabus info.
*   **Download:** [mongodb.com](https://www.mongodb.com/try/download/community)
*   **Install:** Use "Complete" setup. Install as a "Service".

### 4️⃣ **Google Chrome / Edge / Brave**
*   **Purpose:** To view the application.

---

## 📂 **PROJECT STRUCTURE**

Your project folder should look like this:
```text
QNARIO_PROJECT/
├── qnario/                <-- Node.js Server & Frontend
├── gemini-microservice/   <-- Python AI Microservice
├── package.json           <-- Root dependencies
├── requirements.txt       <-- Python dependencies
└── README_SETUP.md        <-- This guide
```

---

## 🏁 **SETUP STEPS**

### **STEP 1: Install Node.js Libraries**
Open a terminal in the root folder:
```bash
npm install
cd qnario
npm install
```

### **STEP 2: Install Python Libraries**
Open a terminal in the root folder:
```bash
pip install -r requirements.txt
```

### **STEP 3: Configure Environment (.env)**
Ensure the `.env` files exist with the correct keys:
1.  **qnario/.env**:
    ```text
    PORT=3000
    MONGODB_URI=mongodb://localhost:27017/qnario
    GEMINI_API_KEY=YOUR_GEMINI_KEY_HERE
    GEMINI_MICROSERVICE_URL=http://localhost:5000
    ```
2.  **gemini-microservice/.env**:
    ```text
    GEMINI_API_KEY=YOUR_GEMINI_KEY_HERE
    PYTHON_PORT=5000
    ```

---

## 🏎️ **HOW TO RUN (3 Windows Architecture)**

To run the full project, you need **3 terminal windows** open simultaneously.

### **Window ❶: MongoDB (Database)**
```bash
mongod
```
*(Skip if MongoDB is already running as a Windows service)*

### **Window ❷: Python Microservice (AI)**
```bash
cd gemini-microservice
python app.py
```
*Wait for: `Starting Gemini Microservice on port 5000`*

### **Window ❸: Node.js Backend (Web)**
```bash
cd qnario
npm start
```
*Wait for: `Server running on http://localhost:3000`*

---

## 🌐 **ACCESS THE APP**

Open your browser and go to:
*   **Landing Page:** `http://localhost:3000`
*   **Teacher Login:** `http://localhost:3000/teacher-login.html`
*   **Student Login:** `http://localhost:3000/student-login.html`

---

## ⚠️ **TROUBLESHOOTING**

| Error Message | Solution |
| :--- | :--- |
| `'node' is not recognized` | Install Node.js and restart your computer. |
| `'python' is not recognized` | Reinstall Python and make sure "Add to PATH" is checked. |
| `MongoDB connection failed` | Ensure `mongod` is running or the MongoDB service is started. |
| `ModuleNotFoundError` | Run `pip install -r requirements.txt` again. |
| `Cannot find module 'express'` | Run `npm install` inside the `qnario` folder. |
| `Port 3000 already in use` | Close other terminals or change `PORT` in `.env`. |

---

## ✅ **QUICK CHECKLIST FOR MIGRATION**

1.  **ZIP the folder** (excluding `node_modules` and `__pycache__` to save size).
2.  **Unzip** on the new PC.
3.  **Install Prerequisites** (Node, Python, MongoDB).
4.  **Run Install Commands** (npm install & pip install).
5.  **Start Services** (Microservice first, then Node server).
6.  **Enjoy!** 🎉

---
**Version:** 2.0.0 (Updated for AI Microservice Integration)
**Last Updated:** April 2026

DO NOT INCLUDE:
❌ node_modules/ (will recreate with npm install)
❌ .git folder (if using git)
❌ Any backup files
```

---

## **THAT'S IT! YOU'RE READY!** 🎉

Follow these 7 steps and your project will run perfectly with all user authentication and saved data!

**For your team:** Give them this file and they can run it on their computer too!

---

**Version:** 1.0.0
**Last Updated:** March 26, 2026
