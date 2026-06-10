# 🤖 Qnario AI Microservice

This folder contains the **AI Microservice** for Qnario, built using **FastAPI** and **Python 3.10+**. 

The microservice runs as an independent async backend server. It handles all AI operations: parsing raw academic syllabi, generating high-fidelity question papers (MCQs, Short/Long answers), and generating personalized study insights for students.

---

## ✨ Features

- **Google Gemini API**: Utilizes `gemini-1.5-pro` (or similar models) as the primary generation engine.
- **Groq Fallback Engine**: Transparently falls back to Groq (`llama-3.3-70b-versatile` / `llama3-70b-8192`) if the Gemini API key hits its free-tier rate limits or quota boundaries.
- **Async Execution**: Leverages Python's async features and Uvicorn to ensure that heavy AI generation requests do not block Node.js Express server event loops or WebSocket channels.
- **Cross-Platform Compatibility**: Automatically detects Windows runtimes and reconfigures standard I/O stdout streams to UTF-8 to prevent console logging emoji encoding crashes.

---

## 🛠️ Tech Stack

- **Python 3.10+**
- **FastAPI**: Modern, high-performance async web framework.
- **Uvicorn**: ASGI web server implementation.
- **Pydantic v2**: Strict schema-based data validation and settings management.
- **Google GenAI / Groq SDKs**: Official API adapters.

---

## 🚀 Setup & Installation

### 1. Create a Virtual Environment
Navigate to the `ai-service` directory and run:

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# Mac/Linux
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Set Up Environment Variables
Copy the `.env.example` file and fill in your details:

```bash
cp .env.example .env
```

Ensure your `.env` contains:
```env
PYTHON_PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
DEBUG=True
```

### 4. Run the Dev Server
```bash
uvicorn main:app --host 127.0.0.1 --port 5000 --reload
```
The service will start running on **http://localhost:5000**. You can access the auto-generated Swagger documentation at **http://localhost:5000/docs**.

---

## 🌐 API Reference

### 1. Health Status
Verify the microservice and Gemini API status.

* **URL**: `/api/health`
* **Method**: `GET`
* **Response**:
```json
{
  "status": "healthy",
  "service": "FastAPI Gemini Question Generator Microservice",
  "version": "2.0",
  "gemini_status": "healthy",
  "current_model": "gemini-1.5-pro"
}
```

### 2. Generate Questions
Generates academic questions based on parameters.

* **URL**: `/api/generate-questions`
* **Method**: `POST`
* **Headers**: `Content-Type: application/json`
* **Body Schema**:
```json
{
  "subject": "Physics",
  "topic": "Newtonian Mechanics",
  "difficulty": "Medium",
  "count": 5,
  "question_type": "MCQ",
  "marks": 1
}
```
* **Response**:
```json
{
  "success": true,
  "source": "Gemini",
  "count": 5,
  "questions": [
    {
      "questionNo": 1,
      "text": "What is the force acting on an object under free fall?",
      "options": [
        {"id": "A", "text": "Gravity"},
        {"id": "B", "text": "Air resistance"},
        {"id": "C", "text": "Friction"},
        {"id": "D", "text": "Electromagnetism"}
      ],
      "correctAnswer": "A",
      "marks": 1
    }
  ]
}
```

### 3. Extract Syllabus
Parses text files (scanned DOCX/PDF text) and structures them into organized units and topics.

* **URL**: `/api/extract-syllabus`
* **Method**: `POST`
* **Headers**: `Content-Type: application/json`
* **Body Schema**:
```json
{
  "text": "Raw syllabus string containing units, chapters, and topics...",
  "subject": "Computer Science"
}
```

### 4. Generate Study Suggestions
Analyzes attempt performance statistics per chapter and generates insights.

* **URL**: `/api/generate-insights`
* **Method**: `POST`
* **Headers**: `Content-Type: application/json`
* **Body Schema**:
```json
{
  "studentName": "Alex",
  "subject": "Chemistry",
  "chapterStats": {
    "Organic Chemistry": { "correct": 2, "total": 5 },
    "Thermodynamics": { "correct": 4, "total": 4 }
  }
}
```
