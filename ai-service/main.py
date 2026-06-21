import logging
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

from services.gemini_service import GeminiQuestionGenerator
from config import PYTHON_PORT, DEBUG

# Configure Logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Qnario AI Microservice",
    description="High-performance async FastAPI question generator utilizing Gemini and Groq fallback streams.",
    version="2.0.0"
)

# Configure CORS policies
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI Service instance
ai_generator = GeminiQuestionGenerator()


# ==================== PYDANTIC MODELS FOR SCHEMA VALIDATION ====================

class GenerationRequest(BaseModel):
    topic: Optional[str] = None
    chapter: Optional[str] = None
    subject: Optional[str] = "General"
    subjectName: Optional[str] = None
    difficulty: Optional[str] = "Medium"
    count: Optional[int] = Field(default=5, ge=1, le=50)
    numQuestions: Optional[int] = None
    question_type: Optional[str] = None
    questionType: Optional[str] = None
    level: Optional[str] = None
    stream: Optional[str] = None
    specific_topics: Optional[str] = None
    specificTopics: Optional[str] = None
    marks: Optional[Any] = 1

class SyllabusRequest(BaseModel):
    text: str
    subject: Optional[str] = ""
    pdfBase64: Optional[str] = None

class InsightsRequest(BaseModel):
    studentName: Optional[str] = "Student"
    subject: Optional[str] = "General"
    chapterStats: Dict[str, Any]


# ==================== ENDPOINT HANDLERS ====================

@app.get("/health")
@app.get("/api/health")
async def health_check():
    """Health check endpoint validating Gemini API operational status."""
    try:
        # Dry-run query check
        test_run = ai_generator.generate_questions(
            subject='Physics',
            topic='Motion',
            difficulty='Easy',
            count=1,
            question_type='MCQ'
        )
        status = 'healthy' if test_run.get('success') else 'degraded'
        error = test_run.get('error') if not test_run.get('success') else None
        
        return {
            'status': 'healthy',
            'service': 'FastAPI Gemini Question Generator Microservice',
            'version': '2.0',
            'gemini_status': status,
            'current_model': ai_generator.model,
            'error': error
        }
    except Exception as e:
        logger.error(f"❌ Microservice Health Check Failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate")
@app.post("/api/generate-questions")
async def generate_questions(payload: GenerationRequest):
    """Generates exams questions using Gemini or fallback Groq engines."""
    try:
        # Map overlapping key parameters
        topic = payload.topic or payload.chapter or "General"
        subject = payload.subject or payload.subjectName or "General"
        count = payload.count or payload.numQuestions or 5
        q_type = payload.question_type or payload.questionType or "MCQ"
        specific_topics = payload.specific_topics or payload.specificTopics
        marks = payload.marks or 1

        logger.info(f"🚀 [AI Gen] Generating {count} {q_type} questions on Topic: {topic} (Subject: {subject})")
        
        result = ai_generator.generate_questions(
            subject=subject,
            topic=topic,
            difficulty=payload.difficulty,
            count=count,
            question_type=q_type,
            level=payload.level,
            stream=payload.stream,
            specific_topics=specific_topics,
            marks=marks
        )

        if result.get("success"):
            logger.info(f"✅ [AI Gen] Successfully compiled {result.get('count')} questions from {result.get('source')}")
            return result
        else:
            error_msg = result.get("error", "Unknown error")
            if result.get("quota_exhausted"):
                logger.warning(f"⚠️ [API Quota Exceeded]: {error_msg}")
                raise HTTPException(status_code=429, detail=error_msg)
            else:
                logger.error(f"❌ [AI Failed]: {error_msg}")
                raise HTTPException(status_code=500, detail=error_msg)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"❌ [Unhandled AI Exception]: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/test-gemini")
async def test_gemini():
    """Simple API check confirming model key validity."""
    try:
        result = ai_generator.generate_questions(
            subject='Physics',
            topic='Motion',
            difficulty='Easy',
            count=1,
            question_type='MCQ'
        )
        if result.get('success'):
            return result
        raise HTTPException(status_code=500, detail=result.get('error', 'API Failed.'))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/quota-status")
async def quota_status():
    """Validates if standard free-tier quotas are exhausted."""
    try:
        result = ai_generator.generate_questions(
            subject='General',
            topic='Test',
            difficulty='Easy',
            count=1,
            question_type='MCQ'
        )
        if result.get('success'):
            return {
                'status': 'available',
                'message': 'API quota is fully available.',
                'model': ai_generator.model
            }
        elif result.get('quota_exhausted'):
            raise HTTPException(status_code=429, detail="API quota exceeded.")
        else:
            raise HTTPException(status_code=400, detail=result.get('error', 'API query failure.'))
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/extract-syllabus")
async def extract_syllabus(payload: SyllabusRequest):
    """Scans raw syllabus documents and extracts structured JSON chapters."""
    try:
        text = payload.text.strip()
        if not text:
            raise HTTPException(status_code=400, detail="No syllabus content provided.")
        
        result = ai_generator.extract_syllabus_topics(text, payload.subject, payload.pdfBase64)
        
        # Ensure parity with Express server which expects syllabus in 'extracted'
        if result.get('success') and 'syllabus' in result:
            result['extracted'] = result.pop('syllabus')
            
        if result.get('success'):
            return result
        raise HTTPException(status_code=500, detail=result.get('error', 'Syllabus scan failed.'))
    except Exception as e:
        logger.error(f"❌ [Syllabus Parse Error]: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate-insights")
async def generate_insights(payload: InsightsRequest):
    """Analyzes chapter stats and generates personalized study feedback."""
    try:
        if not payload.chapterStats:
            raise HTTPException(status_code=400, detail="Chapter stats is required.")
        
        result = ai_generator.generate_study_suggestions(
            student_name=payload.studentName,
            subject=payload.subject,
            chapter_stats=payload.chapterStats
        )
        if result.get('success'):
            return result
        raise HTTPException(status_code=500, detail=result.get('error', 'Insight generation failed.'))
    except Exception as e:
        logger.error(f"❌ [Insight Error]: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


class CodingRequest(BaseModel):
    language: Optional[str] = "Python"
    topic: Optional[str] = "Arrays"
    difficulty: Optional[str] = "Medium"
    count: Optional[int] = Field(default=5, ge=1, le=20)
    question_type: Optional[str] = "ConceptMCQ"   # CodeFill | Debugging | TraceOutput | ConceptMCQ


@app.post("/api/coding-practice")
async def coding_practice(payload: CodingRequest):
    """Generate coding-specific questions: CodeFill, Debugging, TraceOutput, ConceptMCQ."""
    try:
        logger.info(f"🧑‍💻 [Coding] {payload.count}x {payload.question_type} | {payload.language} | {payload.topic} | {payload.difficulty}")
        result = ai_generator.generate_coding_questions(
            language=payload.language,
            topic=payload.topic,
            difficulty=payload.difficulty,
            count=payload.count,
            question_type=payload.question_type
        )
        if result.get("success"):
            logger.info(f"✅ [Coding] Generated {result.get('count')} questions")
            return result
        raise HTTPException(status_code=500, detail=result.get("error", "Generation failed"))
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"❌ [Coding Error]: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== RUN APPLICATION ====================

if __name__ == '__main__':
    import uvicorn
    logger.info(f"Starting FastAPI AI Microservice on port {PYTHON_PORT}")
    uvicorn.run(app, host="0.0.0.0", port=PYTHON_PORT)
