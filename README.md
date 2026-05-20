# Qnario — AI-Powered Exam Platform

![CI](https://github.com/shreysoni1102-cell/Qnario/actions/workflows/ci.yml/badge.svg)
![License](https://img.shields.io/badge/license-Academic-blue)
![Node](https://img.shields.io/badge/node-20+-green)
![Python](https://img.shields.io/badge/python-3.11+-blue)

> Real-time AI exam platform — syllabus PDF in, exam questions out, live proctoring included.

**[Live Demo](https://your-live-demo-url.com)** | **[Demo Video](https://your-demo-video-url)**

---

## What it does

Teachers upload a syllabus PDF. The AI (Gemini + Groq Llama3-70b) extracts topics and
generates exam questions in seconds. Students join via a 6-digit code. The teacher watches
a live proctoring dashboard — tab switches, idle time, and anomalies are flagged in real
time via Socket.IO. If the server crashes, exam sessions auto-restore within 1.5 seconds.

## Architecture

```
Browser (HTML/CSS/JS)
       |
       | HTTP + WebSockets
       v
Node.js / Express (Port 3000)    <---->   MongoDB
       |                                  + JSON state backup
       | REST
       v
Python / Flask AI Service (Port 5000)
       |
       +--> Google Gemini 1.5 Flash
       +--> Groq Llama3-70b
```

## Quick start (Docker)

```bash
git clone https://github.com/shreysoni1102-cell/Qnario.git
cd Qnario
cp qnario/.env.example qnario/.env
cp gemini-microservice/.env.example gemini-microservice/.env
# Fill in your API keys in both .env files
docker-compose up --build
# Open http://localhost:3000
```

## Manual start (without Docker)

```bash
# Terminal 1 — AI microservice
cd gemini-microservice && python -m venv .venv && .venv/Scripts/activate
pip install -r requirements.txt && python app.py

# Terminal 2 — Main server
cd qnario && npm install && npm start
```

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla JS, HTML5, CSS3 (Glassmorphism) |
| Backend | Node.js 20, Express.js |
| Real-time | Socket.IO |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| AI Service | Python 3.11, Flask |
| AI Models | Google Gemini 1.5 Flash, Groq Llama3-70b |
| PDF Parsing | PyPDF2, Mammoth |
| DevOps | Docker, Docker Compose, GitHub Actions |

## Running tests

```bash
cd qnario && npm test
cd gemini-microservice && python -m pytest tests/
```

## Key engineering decisions

- **Microservice split**: AI tasks run in a separate Python process so a spike in PDF
  processing never blocks live exam WebSocket signals.
- **Crash recovery**: Exam room state is snapshotted to disk every 5 seconds. On restart,
  students reconnect automatically using localStorage session data.
- **Anti-cheat**: DOM focus/blur events trigger instant Socket.IO anomaly alerts to the
  teacher. Force-end freezes the student UI and auto-submits after 1.5 seconds.
- **Rate limiting**: 200 requests per 15 minutes globally to block abuse.

---
Developed as a capstone project. All rights reserved.
