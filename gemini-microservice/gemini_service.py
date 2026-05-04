import json
import logging
import re
import time
from typing import Any, Dict, List

import requests

from config import GROQ_API_KEY

logger = logging.getLogger(__name__)


class GroqQuestionGenerator:
    def __init__(self):
        self.primary_model = "llama3-8b-8192"
        self.model = self.primary_model
        self.api_key = GROQ_API_KEY
        logger.info(f"Using Groq model: {self.model}")

    def _chat(self, prompt: str, max_tokens: int = 2048, temperature: float = 0.7) -> Dict[str, Any]:
        if not self.api_key:
            return {"success": False, "error": "GROQ_API_KEY is missing", "quota_exhausted": False}

        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": max_tokens,
            "temperature": temperature
        }

        last_error = None
        for attempt in range(3):
            try:
                if attempt > 0:
                    time.sleep(3 * attempt)
                response = requests.post(url, headers=headers, json=payload, timeout=60)
                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("choices", [])
                    if candidates and candidates[0].get("message", {}).get("content"):
                        content = candidates[0]["message"]["content"]
                        return {"success": True, "content": content}
                    return {"success": False, "error": "Empty response from Groq"}
                if response.status_code == 429:
                    last_error = "Groq rate limit/quota exceeded"
                    continue
                return {"success": False, "error": f"Groq API error {response.status_code}", "details": response.text}
            except Exception as exc:
                last_error = str(exc)

        return {"success": False, "error": last_error or "Groq request failed", "quota_exhausted": True}

    # Tokens needed per question by type (conservative estimates)
    _TOKENS_PER_QUESTION = {
        'MCQ': 260,
        'Multiple Choice Question (MCQ)': 260,
        'Single Correct MCQ': 260,
        'MSQ': 300,
        'Multiple Select Question (MSQ)': 300,
        'True/False': 150,
        'One-word Answer': 180,
        'Short Answer': 420,
        'Long Answer': 650,
        'Case Study': 800,
    }
    _BATCH_SIZE_DEFAULT = 8
    _BATCH_SIZE_HEAVY = 4
    _BATCH_SIZE = 8
    _MAX_TOKENS_CAP = 8192
    _INTER_BATCH_DELAY = 2

    def _batch_size_for(self, question_type: str) -> int:
        if question_type in ('Long Answer', 'Case Study'):
            return self._BATCH_SIZE_HEAVY
        return self._BATCH_SIZE_DEFAULT

    def _tokens_for(self, question_type: str, count: int) -> int:
        per_q = self._TOKENS_PER_QUESTION.get(question_type, 420)
        needed = per_q * count + 600
        return min(needed, self._MAX_TOKENS_CAP)

    def generate_questions(self, subject, topic, difficulty, count=5, question_type="MCQ", level=None, stream=None, specific_topics=None, marks=1):
        norm_marks = self._normalize_marks(marks)
        batch_size = self._batch_size_for(question_type)

        if count > batch_size:
            all_questions = []
            remaining = count
            batch_no = 0
            while remaining > 0:
                batch_count = min(remaining, batch_size)
                batch_no += 1
                logger.info(f"Batch {batch_no}: requesting {batch_count} × {question_type}")
                batch_result = self._generate_single_batch(
                    subject, topic, difficulty, batch_count,
                    question_type, level, stream, specific_topics, norm_marks
                )
                all_questions.extend(batch_result)
                remaining -= batch_count
                if remaining > 0:
                    time.sleep(self._INTER_BATCH_DELAY)

            for idx, q in enumerate(all_questions, start=1):
                q['questionNumber'] = idx

            return {
                "success": True,
                "questions": all_questions,
                "count": len(all_questions),
                "source": "groq_batched",
            }

        questions = self._generate_single_batch(
            subject, topic, difficulty, count,
            question_type, level, stream, specific_topics, norm_marks
        )
        return {
            "success": True,
            "questions": questions,
            "count": len(questions),
            "source": "groq",
        }

    def _generate_single_batch(self, subject, topic, difficulty, count, question_type, level, stream, specific_topics, norm_marks):
        prompt = self._build_prompt(subject, topic, difficulty, count, question_type, level, stream, specific_topics, norm_marks)
        max_tok = self._tokens_for(question_type, count)
        logger.info(f"Calling Groq: {count} × {question_type}, max_tokens={max_tok}")

        result = self._chat(prompt, max_tokens=max_tok, temperature=0.5)
        if not result.get("success"):
            logger.warning(f"Groq call failed — falling back to mock for {count} × {question_type}")
            mock = self.generate_mock_questions(subject, topic, difficulty, count, question_type, norm_marks)
            return mock.get("questions", [])

        parsed = self._parse_json_array(result.get("content", ""))
        if not parsed:
            logger.warning(f"JSON parse failed — falling back to mock for {count} × {question_type}")
            mock = self.generate_mock_questions(subject, topic, difficulty, count, question_type, norm_marks)
            return mock.get("questions", [])

        normalized = self._normalize_questions(parsed, question_type, difficulty, norm_marks, count)
        if len(normalized) < count:
            shortfall = count - len(normalized)
            logger.warning(f"Groq returned {len(normalized)}/{count} — adding {shortfall} mock question(s)")
            mock = self.generate_mock_questions(subject, topic, difficulty, shortfall, question_type, norm_marks)
            for q in mock.get("questions", []):
                q['questionNumber'] = len(normalized) + 1
                normalized.append(q)

        return normalized

    def generate_mock_questions(self, subject, topic, difficulty, count, question_type, marks=1):
        norm_marks = self._normalize_marks(marks)
        questions = []
        for i in range(1, count + 1):
            if question_type in ['MCQ', 'Multiple Choice Question (MCQ)', 'Single Correct MCQ']:
                q = {
                    "questionNumber": i,
                    "text": f"[Mock] {subject} - {topic} question {i}",
                    "type": question_type,
                    "difficulty": difficulty,
                    "marks": norm_marks,
                    "options": [
                        {"id": "A", "text": "Option A"},
                        {"id": "B", "text": "Option B"},
                        {"id": "C", "text": "Option C"},
                        {"id": "D", "text": "Option D"},
                    ],
                    "answer": {"correctOption": "A", "explanation": "Mock fallback answer"},
                }
            elif question_type in ['MSQ', 'Multiple Select Question (MSQ)']:
                q = {
                    "questionNumber": i,
                    "text": f"[Mock] {subject} - {topic} MSQ question {i}",
                    "type": question_type,
                    "difficulty": difficulty,
                    "marks": norm_marks,
                    "options": [
                        {"id": "A", "text": "Option A"},
                        {"id": "B", "text": "Option B"},
                        {"id": "C", "text": "Option C"},
                        {"id": "D", "text": "Option D"},
                    ],
                    "answer": {"correctOptions": ["A", "B"], "explanation": "Mock fallback answer"},
                }
            elif question_type in ['True/False']:
                q = {
                    "questionNumber": i,
                    "text": f"[Mock] {subject} - {topic} statement {i}",
                    "type": question_type,
                    "difficulty": difficulty,
                    "marks": norm_marks,
                    "options": [
                        {"id": "True", "text": "True"},
                        {"id": "False", "text": "False"},
                    ],
                    "answer": {"correctOption": "True"},
                }
            elif question_type in ['Case Study']:
                q = {
                    "questionNumber": i,
                    "text": f"PASSAGE: [Mock] Read the following passage about {subject} and answer: {topic} scenario {i}\n\nQUESTION: What is the main point of the passage?",
                    "type": question_type,
                    "difficulty": difficulty,
                    "marks": norm_marks,
                    "options": [
                        {"id": "A", "text": "Option A"},
                        {"id": "B", "text": "Option B"},
                        {"id": "C", "text": "Option C"},
                        {"id": "D", "text": "Option D"},
                    ],
                    "answer": {"correctOption": "A", "explanation": "Mock case study answer"},
                }
            else:
                q = {
                    "questionNumber": i,
                    "text": f"[Mock] {subject} - {topic} question {i}",
                    "type": question_type,
                    "difficulty": difficulty,
                    "marks": norm_marks,
                    "options": [],
                    "answer": {"correctOption": "", "explanation": "Mock fallback answer"},
                }
            questions.append(q)
        
        return {
            "success": True,
            "questions": questions,
            "count": len(questions),
            "source": "mock",
            "warning": "Mock data generated because Groq API was unavailable.",
        }

    def extract_syllabus_topics(self, text_content, subject_hint):
        prompt = f"""Extract all units, chapters and topics from this syllabus text.
Subject hint: {subject_hint or 'Auto-detect'}
Return only JSON in this format:
{{"subject":"Subject Name","units":[{{"unit":"Unit Name","chapters":[{{"chapter":"Chapter Name","topics":["topic1","topic2"]}}]}}]}}
Text:
{text_content[:15000]}"""
        result = self._chat(prompt, max_tokens=3000, temperature=0.2)
        if not result.get("success"):
            return result

        obj = self._parse_json_object(result.get("content", ""))
        if not obj:
            return {"success": False, "error": "Failed to parse syllabus extraction response"}
        if "units" not in obj:
            obj["units"] = []
        return {"success": True, "extracted": obj}

    def generate_study_suggestions(self, student_name, subject, chapter_stats):
        chapter_lines = []
        for chapter, stats in chapter_stats.items():
            scored = float(stats.get("scored", 0))
            marks = float(stats.get("marks", 0))
            percent = int((scored / marks) * 100) if marks > 0 else 0
            chapter_lines.append(f"- {chapter}: {percent}% ({scored}/{marks})")
        prompt = f"""Give 3-4 concise study suggestions for a student based on their test performance.
Student: {student_name}
Subject: {subject}
Performance:
{chr(10).join(chapter_lines)}
Return only JSON array of strings."""
        result = self._chat(prompt, max_tokens=700, temperature=0.4)
        if not result.get("success"):
            return result

        suggestions = self._parse_json_array(result.get("content", ""))
        if not isinstance(suggestions, list) or not suggestions:
            return {"success": False, "error": "Failed to parse study suggestions"}
        return {"success": True, "suggestions": [str(x) for x in suggestions[:5]]}

    def _build_prompt(self, subject, topic, difficulty, count, question_type, level, stream, specific_topics, marks):
        effective_topic = specific_topics if specific_topics else topic
        marks_str = str(marks).replace('M', '')
        
        if question_type in ['MCQ', 'Multiple Choice Question (MCQ)', 'Single Correct MCQ']:
            options_spec = '"options": [{"id": "A", "text": "..."}, {"id": "B", "text": "..."}, {"id": "C", "text": "..."}, {"id": "D", "text": "..."}]'
            answer_spec = '"answer": {"correctOption": "A", "explanation": "..."}'
            extra_instructions = 'Include 4 distinct options (A, B, C, D). Specify the single correct option letter.'
        elif question_type in ['MSQ', 'Multiple Select Question (MSQ)']:
            options_spec = '"options": [{"id": "A", "text": "..."}, {"id": "B", "text": "..."}, {"id": "C", "text": "..."}, {"id": "D", "text": "..."}]'
            answer_spec = '"answer": {"correctOptions": ["A", "C"], "explanation": "..."}'
            extra_instructions = 'Include 4 options (A, B, C, D). Two or more may be correct; list all correct option letters in correctOptions array.'
        elif question_type in ['True/False']:
            options_spec = '"options": [{"id": "True", "text": "True"}, {"id": "False", "text": "False"}]'
            answer_spec = '"answer": {"correctOption": "True"}'
            extra_instructions = 'Write a factual statement. correctOption must be exactly "True" or "False".'
        elif question_type in ['One-word Answer']:
            options_spec = '"options": []'
            answer_spec = '"answer": {"value": "exact one-word answer here"}'
            extra_instructions = 'The answer must be a single word. Leave options as empty array.'
        elif question_type in ['Short Answer']:
            options_spec = '"options": []'
            answer_spec = '"answer": {"explanation": "2-3 sentence answer here"}'
            extra_instructions = 'Write a short-answer question requiring a 2-3 sentence response. Leave options as empty array.'
        elif question_type in ['Case Study']:
            options_spec = '"options": [{"id": "A", "text": "..."}, {"id": "B", "text": "..."}, {"id": "C", "text": "..."}, {"id": "D", "text": "..."}]'
            answer_spec = '"answer": {"correctOption": "A", "explanation": "..."}'
            extra_instructions = (
                'Each question MUST have two parts separated by a newline:\n'
                '1) A short case/scenario passage (3-5 sentences) describing a real-world situation.\n'
                '2) A question about that passage.\n'
                'Format the "text" field as: "PASSAGE: <passage text>\\n\\nQUESTION: <question>".\n'
                'Then provide 4 MCQ options (A, B, C, D) and specify the correct option.'
            )
        else:
            options_spec = '"options": []'
            answer_spec = '"answer": {"explanation": "detailed model answer here (4-6 sentences)"}'
            extra_instructions = 'Write a long-answer question requiring a detailed paragraph response. Leave options as empty array.'
        
        return f"""You are an expert exam question writer for Indian curriculum (CBSE/ICSE).
Generate exactly {count} {question_type} questions.
Subject: {subject}
Topic: {effective_topic}
Difficulty: {difficulty}
Level: {level or 'General'}
Stream: {stream or 'General'}
Marks each: {marks_str}

Special instructions for {question_type}: {extra_instructions}

Return ONLY a valid JSON array. Each element MUST follow this EXACT structure:
{{
  "questionNumber": 1,
  "text": "Question text here",
  "type": "{question_type}",
  "difficulty": "{difficulty}",
  "marks": {marks_str},
  {options_spec},
  {answer_spec}
}}

Do NOT include any text outside the JSON array. Do NOT add markdown code fences.
Generate all {count} questions now."""

    def _parse_json_array(self, text: str) -> List[Dict[str, Any]]:
        if not text:
            return []
        clean = text.strip()
        if clean.startswith("```json"):
            clean = clean.replace("```json", "", 1)
        if clean.startswith("```"):
            clean = clean.replace("```", "", 1)
        if clean.endswith("```"):
            clean = clean[:-3]
        clean = clean.strip()
        if clean.startswith('['):
            try:
                data = json.loads(clean)
                if isinstance(data, list):
                    return data
            except json.JSONDecodeError:
                pass
        try:
            match = re.search(r'\[[\s\S]*\]', clean)
            if match:
                data = json.loads(match.group(0))
                if isinstance(data, list):
                    return data
        except:
            pass
        try:
            matches = re.findall(r'\{[^}]*\}', clean)
            if matches:
                objects = []
                for match in matches[:20]:
                    try:
                        objects.append(json.loads(match))
                    except:
                        continue
                if objects:
                    return objects
        except:
            pass
        return []

    def _parse_json_object(self, text: str) -> Dict[str, Any]:
        try:
            clean = text.strip().replace("```json", "").replace("```", "")
            match = re.search(r"\{[\s\S]*\}", clean)
            if not match:
                return {}
            data = json.loads(match.group(0))
            return data if isinstance(data, dict) else {}
        except Exception:
            return {}

    def _normalize_marks(self, marks):
        if marks is None:
            return 1
        marks_str = str(marks).strip().upper().replace('M', '')
        try:
            return int(marks_str)
        except:
            return 1
    
    def _format_options(self, options, question_type):
        if isinstance(options, list) and len(options) > 0:
            if isinstance(options[0], dict) and 'id' in options[0]:
                return options
        formatted = []
        if isinstance(options, list):
            option_ids = ['A', 'B', 'C', 'D', 'E', 'F']
            for idx, opt in enumerate(options):
                if idx >= len(option_ids):
                    break
                opt_text = str(opt).strip() if opt else ""
                if opt_text:
                    formatted.append({"id": option_ids[idx], "text": opt_text})
        if question_type in ['MCQ', 'Multiple Choice Question (MCQ)', 'Single Correct MCQ',
                             'MSQ', 'Multiple Select Question (MSQ)', 'Case Study']:
            if not formatted or len(formatted) < 2:
                formatted = [
                    {"id": "A", "text": "Option A"},
                    {"id": "B", "text": "Option B"},
                    {"id": "C", "text": "Option C"},
                    {"id": "D", "text": "Option D"},
                ]
        return formatted
    
    def _normalize_answer(self, answer, question_type):
        if not answer:
            answer = {}
        if not isinstance(answer, dict):
            answer = {"value": str(answer)}
        if question_type in ['True/False']:
            correct_opt = answer.get('correctOption', '')
            if correct_opt and correct_opt.upper() in ['A', 'TRUE', 'T']:
                answer['correctOption'] = 'True'
            elif correct_opt and correct_opt.upper() in ['B', 'FALSE', 'F']:
                answer['correctOption'] = 'False'
            return answer
        if question_type in ['MCQ', 'Multiple Choice Question (MCQ)', 'Single Correct MCQ', 'Case Study']:
            if 'correctOption' not in answer or not answer['correctOption']:
                answer['correctOption'] = 'A'
            return answer
        if question_type in ['MSQ', 'Multiple Select Question (MSQ)']:
            if 'correctOptions' not in answer:
                if 'correctOption' in answer:
                    answer['correctOptions'] = [answer['correctOption']]
                else:
                    answer['correctOptions'] = ['A']
            return answer
        if question_type in ['One-word Answer']:
            if 'value' not in answer and 'correctAnswer' in answer:
                answer['value'] = answer['correctAnswer']
            return answer
        return answer

    def _normalize_questions(self, questions, question_type, difficulty, marks, count):
        normalized = []
        for idx, question in enumerate(questions[:count], start=1):
            text = question.get('text', f'Question {idx}')
            q_type = question.get('type', question_type)
            q_difficulty = question.get('difficulty', difficulty)
            q_marks = self._normalize_marks(question.get('marks', marks))
            raw_options = question.get('options', [])
            formatted_options = self._format_options(raw_options, q_type)
            raw_answer = question.get('answer', {})
            normalized_answer = self._normalize_answer(raw_answer, q_type)
            normalized.append({
                'questionNumber': idx,
                'text': text,
                'type': q_type,
                'difficulty': q_difficulty,
                'marks': q_marks,
                'options': formatted_options,
                'answer': normalized_answer
            })
        return normalized