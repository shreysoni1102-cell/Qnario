# Groq Question Generator Microservice Setup Guide

## Overview
A Python microservice (Flask) that integrates with Groq API to generate high-quality exam questions. This microservice runs independently and is called by your Node.js backend.

---

## Architecture

```
┌─────────────────────┐
│   Teacher Frontend   │ (teacher-create-exam.html)
│  (Generate Q button) │
└──────────┬──────────┘
           │ POST /api/generate-questions
           ▼
┌──────────────────────────────┐
│   Node.js Express Backend    │ (server.js)
│   (qnario/routes/exam-api.js)│
└──────────┬──────────────────┘
           │ HTTP Request (axios)
           ▼
┌──────────────────────────────┐
│  Python Groq Microservice  │ (gemini-microservice/)
│         (Flask app.py)       │
└──────────┬──────────────────┘
           │ API Call
           ▼
┌──────────────────────────────┐
│   Groq API                   │
│   (mixtral-8x7b-32768)       │
└──────────────────────────────┘
```

---

## Setup Instructions

### Step 1: Navigate to Microservice Directory
```powershell
cd "e:\CHECKING 1\gemini-microservice"
```

### Step 2: Verify Python Installation
```powershell
python --version
# Should be 3.8 or higher
```

### Step 3: Create Virtual Environment (Optional but Recommended)
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### Step 4: Install Dependencies
```powershell
pip install -r requirements.txt
```

### Step 5: Configure Environment Variables
The `.env` file should have:
```
GROQ_API_KEY=your-groq-api-key-here
PYTHON_PORT=5000
NODE_SERVER_URL=http://localhost:3000
```

### Step 6: Start the Microservice
```powershell
python app.py
```

You should see:
```
Starting Groq Question Generator Microservice on port 5000
Running on http://0.0.0.0:5000
```

---

## Testing the Microservice

### Test 1: Health Check
```powershell
curl http://localhost:5000/health
```

Expected response:
```json
{
    "status": "healthy",
    "service": "Gemini Question Generator Microservice",
    "version": "1.0"
}
```

### Test 2: Groq Connection Test
```powershell
curl http://localhost:5000/api/test-groq
```

### Test 3: Generate Questions
```powershell
$body = @{
    subject = "Physics"
    topic = "Newton's Laws"
    difficulty = "Medium"
    count = 3
    question_type = "MCQ"
} | ConvertTo-Json

curl -Method POST `
  -Uri http://localhost:5000/api/generate-questions `
  -ContentType "application/json" `
  -Body $body
```

---

## API Endpoints

### 1. Health Check
- **Endpoint:** `GET /health`
- **Response:** Service status
- **No authentication required**

### 2. Test Groq Connection
- **Endpoint:** `GET /api/test-groq`
- **Response:** Test question generation result
- **No authentication required**

### 3. Generate Questions
- **Endpoint:** `POST /api/generate-questions`
- **Required Headers:** `Content-Type: application/json`

**Request Payload:**
```json
{
    "subject": "Physics",           // Required: Physics, Chemistry, Biology, Mathematics, English, History
    "topic": "Newton's Laws",       // Required: Any topic string
    "difficulty": "Medium",         // Required: Easy, Medium, Hard
    "count": 5,                     // Optional: 1-20 (default: 5)
    "question_type": "MCQ"          // Optional: MCQ, Descriptive, Short, NumericAnswer
}
```

**Response (Success):**
```json
{
    "success": true,
    "questions": [
        {
            "questionNumber": 1,
            "text": "What is Newton's first law of motion?",
            "type": "MCQ",
            "difficulty": "Easy",
            "marks": 1,
            "options": [
                {"id": "A", "text": "Force equals mass times acceleration"},
                {"id": "B", "text": "An object in motion stays in motion..."},
                {"id": "C", "text": "Action equals reaction"},
                {"id": "D", "text": "Energy cannot be created or destroyed"}
            ],
            "answer": {
                "correctOption": "B",
                "explanation": "Newton's first law states that an object in motion stays in motion unless acted upon by force..."
            }
        }
        // ... more questions
    ],
    "count": 5
}
```

**Response (Error):**
```json
{
    "success": false,
    "error": "Invalid subject. Valid subjects: [...]",
    "questions": []
}
```

---

## File Structure

```
gemini-microservice/
├── app.py                  # Flask application & routes
├── config.py              # Configuration (API keys, port)
├── gemini_service.py       # Groq API integration logic
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables
└── README.md              # This file
```

---

## Features

✅ **Validated Inputs** - Ensures subject, topic, difficulty are valid
✅ **Error Handling** - Comprehensive error messages
✅ **Structured Output** - Questions in JSON format matching MongoDB schema
✅ **CORS Support** - Works with Node.js frontend
✅ **Health Checks** - Monitor service availability
✅ **Logging** - Detailed logs for debugging

---

## Integration with Node.js Backend

The Node.js backend calls this microservice via `gemini-client.js`:

```javascript
const GeminiClient = require('../utils/gemini-client');

const result = await GeminiClient.generateQuestions({
    subject: 'Physics',
    topic: 'Newton\'s Laws',
    difficulty: 'Medium',
    count: 5,
    question_type: 'MCQ'
});

if (result.success) {
    // Save to MongoDB
    for (let q of result.questions) {
        const question = new Question(q);
        await question.save();
    }
}
```

---

## Troubleshooting

### Issue: Port 5000 already in use
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (replace PID)
taskkill /PID <PID> /F

# Start microservice on different port
set PYTHON_PORT=5001
```

### Issue: GROQ_API_KEY not found
- Verify `.env` file exists in `gemini-microservice/`
- Check API key is valid (from Groq dashboard)
- Ensure quotes are NOT around the key

### Issue: Connection timeout from Node.js
- Verify Python microservice is running: `curl http://localhost:5000/health`
- Check `GEMINI_MICROSERVICE_URL` in Node.js `.env`
- Ensure Node.js can reach localhost:5000

### Issue: Invalid JSON from Groq API
- Groq sometimes returns markdown code blocks
- The code automatically strips these, but if issues persist:
    - Check Groq API status
    - Update prompt in `gemini_service.py`
    - Consider fallback to hardcoded questions

---

## Configuration

### Change Port
Edit `gemini-microservice/.env`:
```
PYTHON_PORT=5001
```

### Change Groq Model
Edit `gemini_service.py`:
```python
self.model = 'mixtral-8x7b-32768'  # or another Groq-supported model
```

### Increase Timeout
Edit `app.py`:
```python
@app.route('/api/generate-questions', methods=['POST'])
def generate_questions():
    # Increase timeout in axios call (Node.js side)
```

---

## Performance Notes

- **Average response time:** 3-10 seconds per 5 questions
- **Max questions per request:** 20 (configurable)
- **Rate limits:** Groq API free tier has generous quotas
- **Caching:** Consider caching common topic questions

---

## Next Steps

1. ✅ Python microservice created and running
2. ✅ Gemini API integration ready
3. ✅ Node.js backend configured to call microservice
4. 📝 Test with teacher UI
5. 📝 Implement caching for performance
6. 📝 Add admin metrics/analytics

---

## Support

For issues:
1. Check logs: `python app.py` (verbose output)
2. Test endpoint: `curl http://localhost:5000/health`
3. Verify API key has Gemini access
4. Check Node.js console for errors

---

**Last Updated:** February 24, 2026  
**Version:** 1.0
