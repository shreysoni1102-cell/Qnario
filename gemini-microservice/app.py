from flask import Flask, request, jsonify
from flask_cors import CORS
from gemini_service import GroqQuestionGenerator
from config import PYTHON_PORT, DEBUG
import logging
import requests
import json

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Groq service
groq_generator = GroqQuestionGenerator()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint with detailed Groq status"""
    try:
        # Test Groq connection
        test_result = groq_generator.generate_questions(
            subject='Physics',
            topic='Motion',
            difficulty='Easy',
            count=1,
            question_type='MCQ'
        )
        groq_status = 'healthy' if test_result['success'] else 'degraded'
        error_msg = test_result.get('error') if not test_result['success'] else None
        return jsonify({
            'status': 'healthy',
            'service': 'Groq Question Generator Microservice',
            'version': '2.0',
            'groq_status': groq_status,
            'current_model': groq_generator.model,
            'error': error_msg
        }), 200
    except Exception as e:
        logger.error(f"❌ Health check failed: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'service': 'Groq Question Generator Microservice',
            'error': str(e)
        }), 500

@app.route('/api/generate-questions', methods=['POST'])
def generate_questions():
    """
    Generate questions using Groq API via the Python service
    """
    try:
        data = request.get_json()
        topic = data.get('topic') or data.get('chapter')
        subject = data.get('subject') or data.get('subjectName') or 'General'
        if not topic:
            return jsonify({'success': False, 'error': 'Missing required field: topic or chapter'}), 400
        difficulty = data.get('difficulty', 'Medium')
        count = int(data.get('count') or data.get('numQuestions') or 5)
        question_type = data.get('question_type') or data.get('questionType') or 'MCQ'
        level = data.get('level')
        stream = data.get('stream')
        specific_topics = data.get('specific_topics') or data.get('specificTopics')
        marks = data.get('marks', 1)
        if count < 1 or count > 50: count = 5
        logger.info(f'🚀 Generating {count} {question_type} questions for {subject} - {topic} ({difficulty})')
        result = groq_generator.generate_questions(
            subject=subject, topic=topic, difficulty=difficulty, count=count,
            question_type=question_type, level=level, stream=stream,
            specific_topics=specific_topics, marks=marks
        )
        if result['success']:
            logger.info(f'✅ Successfully generated {result["count"]} questions from {result.get("source", "Groq")}')
            return jsonify(result), 200
        else:
            error_msg = result.get('error', 'Unknown error')
            if result.get('quota_exhausted'):
                logger.warning(f'⚠️ QUOTA EXHAUSTED: {error_msg}')
                return jsonify(result), 429
            else:
                logger.error(f'❌ Generation failed: {error_msg}')
                return jsonify(result), 500
    except Exception as e:
        logger.error(f'❌ Error in generate_questions: {str(e)}')
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/test-groq', methods=['GET'])
def test_groq():
    try:
        result = groq_generator.generate_questions(subject='Physics', topic='Motion', difficulty='Easy', count=1, question_type='MCQ')
        return jsonify(result), 200 if result['success'] else (429 if result.get('quota_exhausted') else 500)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/quota-status', methods=['GET'])
def quota_status():
    try:
        result = groq_generator.generate_questions(subject='General', topic='Test', difficulty='Easy', count=1, question_type='MCQ')
        if result['success']:
            return jsonify({'status': 'available', 'message': 'API quota is available', 'model': groq_generator.model}), 200
        elif result.get('quota_exhausted'):
            return jsonify({'status': 'quota_exhausted', 'message': result.get('error', 'API quota exceeded'), 'model': groq_generator.model}), 429
        else:
            return jsonify({'status': 'error', 'message': result.get('error', 'Unknown error'), 'model': groq_generator.model}), 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/extract-syllabus', methods=['POST'])
def extract_syllabus():
    try:
        data = request.get_json()
        text_content = data.get('text', '').strip()
        subject_hint = data.get('subject', '')
        if not text_content: return jsonify({'success': False, 'error': 'No text content provided'}), 400
        result = groq_generator.extract_syllabus_topics(text_content, subject_hint)
        return jsonify(result), 200 if result['success'] else 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/generate-insights', methods=['POST'])
def generate_insights():
    try:
        data = request.get_json()
        student_name = data.get('studentName', 'Student')
        subject = data.get('subject', 'General')
        chapter_stats = data.get('chapterStats', {})
        if not chapter_stats: return jsonify({'success': False, 'error': 'No chapter stats provided'}), 400
        result = groq_generator.generate_study_suggestions(student_name, subject, chapter_stats)
        return jsonify(result), 200 if result['success'] else 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.errorhandler(404)
def not_found(error): return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error): return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    logger.info(f'Starting Groq Question Generator Microservice on port {PYTHON_PORT}')
    app.run(host='0.0.0.0', port=PYTHON_PORT, debug=DEBUG)
