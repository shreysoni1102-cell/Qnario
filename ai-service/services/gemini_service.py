import json
import logging
import re
import time
from typing import Any, Dict, List
import requests

from config import GEMINI_API_KEY, GROQ_API_KEY

logger = logging.getLogger(__name__)


class GeminiQuestionGenerator:
    def __init__(self):
        self.primary_model = "gemini-1.5-flash-latest"
        self.model = self.primary_model
        self.api_key = GEMINI_API_KEY
        self.groq_key = GROQ_API_KEY
        logger.info(f"Using Gemini model: {self.model}")

    def _chat_groq(self, prompt: str, max_tokens: int = 2048) -> Dict[str, Any]:
        if not self.groq_key:
            return {"success": False, "error": "GROQ_API_KEY is missing"}
        
        groq_max = min(max_tokens, 2048)
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.groq_key}",
            "Content-Type": "application/json"
        }
        # Try multiple Groq models in order
        for groq_model in ["llama-3.3-70b-versatile", "llama3-8b-8192", "mixtral-8x7b-32768"]:
            payload = {
                "model": groq_model,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": groq_max,
                "temperature": 0.7
            }
            try:
                response = requests.post(url, headers=headers, json=payload, timeout=30)
                logger.info(f"Groq [{groq_model}] status: {response.status_code}")
                if response.status_code == 200:
                    content = response.json().get("choices", [{}])[0].get("message", {}).get("content", "")
                    logger.info(f"Groq success with model: {groq_model}")
                    return {"success": True, "content": content}
                else:
                    logger.warning(f"Groq [{groq_model}] failed: {response.text[:200]}")
                    continue
            except Exception as e:
                logger.error(f"Groq [{groq_model}] exception: {str(e)}")
                continue
        return {"success": False, "error": "All Groq models failed"}

    def _chat(self, prompt: str, max_tokens: int = 2048, temperature: float = 0.7) -> Dict[str, Any]:
        # Try Gemini first, fallback to Groq if 404 or missing
        if not self.api_key:
            return self._chat_groq(prompt, max_tokens)

        self.url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"maxOutputTokens": max_tokens, "temperature": temperature}
        }

        try:
            response = requests.post(self.url, headers=headers, json=payload, timeout=60)
            if response.status_code == 200:
                resp_json = response.json()
                content = resp_json.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                return {"success": True, "content": content}
            elif response.status_code == 404 or response.status_code == 403:
                logger.warning(f"Gemini {response.status_code} Error. Falling back to Groq...")
                return self._chat_groq(prompt, max_tokens)
            elif response.status_code == 429:
                time.sleep(2)
                return self._chat_groq(prompt, max_tokens)
            else:
                return self._chat_groq(prompt, max_tokens)
        except Exception as e:
            logger.error(f"Gemini Exception: {str(e)}. Falling back to Groq...")
            return self._chat_groq(prompt, max_tokens)

    _TOKENS_PER_QUESTION = {
        'MCQ': 180,
        'Multiple Choice Question (MCQ)': 180,
        'Single Correct MCQ': 180,
        'MSQ': 350,
        'Multiple Select Question (MSQ)': 350,
        'True/False': 120,
        'Fill in the blanks': 150,
        'One-word Answer': 180,
        'Short Answer': 420,
        'Long Answer': 650,
        'Case Study': 800,
    }
    _BATCH_SIZE_DEFAULT = 8
    _BATCH_SIZE_HEAVY = 4
    _BATCH_SIZE = 8
    _MAX_TOKENS_CAP = 8192
    _INTER_BATCH_DELAY = 1

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
            while remaining > 0:
                batch_count = min(remaining, batch_size)
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
                "count": len(all_questions),
                "questions": all_questions,
                "source": "gemini_batched",
            }

        questions = self._generate_single_batch(
            subject, topic, difficulty, count,
            question_type, level, stream, specific_topics, norm_marks
        )

        return {
            "success": True,
            "count": len(questions),
            "questions": questions,
            "source": "gemini",
        }

    def _generate_single_batch(self, subject, topic, difficulty, count, question_type, level, stream, specific_topics, norm_marks):
        prompt = self._build_prompt(subject, topic, difficulty, count, question_type, level, stream, specific_topics, norm_marks)
        max_tok = self._tokens_for(question_type, count)
        logger.info(f"Calling Gemini: {count} × {question_type}, max_tokens={max_tok}")
        
        result = self._chat(prompt, max_tokens=max_tok)
        
        if not result["success"]:
            logger.error(f"Gemini API failure: {result.get('error')}")
            mock = self.generate_mock_questions(subject, topic, difficulty, count, question_type, norm_marks)
            return mock.get("questions", [])

        logger.info(f"Raw Gemini Response for Questions: {result['content'][:1000]}")
        parsed = self._parse_json_array(result["content"])
        if not parsed or len(parsed) == 0:
            logger.warning("Failed to parse Gemini JSON, using mock fallback")
            mock = self.generate_mock_questions(subject, topic, difficulty, count, question_type, norm_marks)
            return mock.get("questions", [])

        normalized = self._normalize_questions(parsed, question_type, difficulty, norm_marks, count)
        if len(normalized) < count:
            shortfall = count - len(normalized)
            mock_extra = self.generate_mock_questions(subject, topic, difficulty, shortfall, question_type, norm_marks)
            normalized.extend(mock_extra.get("questions", []))
            for i, q in enumerate(normalized, start=1):
                q['questionNumber'] = i

        return normalized

    def generate_mock_questions(self, subject, topic, difficulty, count, question_type, marks=1):
        norm_marks = self._normalize_marks(marks)
        
        # Extract default chapter/topic from the input topic string if hierarchical
        default_chapter = "General"
        default_topic = "General"
        if topic and ">" in topic:
            # e.g., "Unit 1 > Chapter A > Topic X"
            parts = [p.strip() for p in topic.split("\n")[0].split(">")]
            if len(parts) >= 2:
                default_chapter = parts[1]
            if len(parts) >= 3:
                default_topic = parts[2]
            elif len(parts) >= 1:
                default_topic = parts[0]
        elif topic:
            default_topic = topic.split("\n")[0].strip()

        questions = []
        for i in range(1, count + 1):
            if question_type in ['MCQ', 'Multiple Choice Question (MCQ)', 'Single Correct MCQ']:
                q = {
                    "questionNumber": i,
                    "text": f"Regarding {subject} and specifically {default_topic}, which of the following is correct?",
                    "type": "MCQ",
                    "difficulty": difficulty,
                    "marks": norm_marks,
                    "chapter": default_chapter,
                    "topic": default_topic,
                    "options": [
                        {"id": "A", "text": "Option A"},
                        {"id": "B", "text": "Option B"},
                        {"id": "C", "text": "Option C"},
                        {"id": "D", "text": "Option D"}
                    ],
                    "answer": {"correctOption": "A", "explanation": "Basic concept explanation."}
                }
            elif question_type in ['True/False']:
                q = {
                    "questionNumber": i,
                    "text": f"Is it true that {subject} principles apply to {default_topic}?",
                    "type": "True/False",
                    "difficulty": difficulty,
                    "marks": norm_marks,
                    "chapter": default_chapter,
                    "topic": default_topic,
                    "options": [{"id": "A", "text": "True"}, {"id": "B", "text": "False"}],
                    "answer": {"correctOption": "True", "explanation": "Verification of basic principles."}
                }
            elif question_type in ['Case Study']:
                q = {
                    "questionNumber": i,
                    "text": f"SCENARIO: Analysis of {default_topic} in a real-world environment.\n\nQUESTION: What is the primary implication of this scenario?",
                    "type": "Case Study",
                    "difficulty": difficulty,
                    "marks": norm_marks,
                    "chapter": default_chapter,
                    "topic": default_topic,
                    "options": [
                        {"id": "A", "text": "Increased efficiency"},
                        {"id": "B", "text": "Reduced overhead"},
                        {"id": "C", "text": "Resource allocation"},
                        {"id": "D", "text": "Quality control"}
                    ],
                    "answer": {"correctOption": "A", "explanation": "Scenario-based analysis result."},
                }
            else:
                q = {
                    "questionNumber": i,
                    "text": f"Explain the fundamental concepts of {subject} in the context of {default_topic}.",
                    "type": question_type,
                    "difficulty": difficulty,
                    "marks": norm_marks,
                    "chapter": default_chapter,
                    "topic": default_topic,
                    "options": [],
                    "answer": {"explanation": "Detailed theoretical explanation based on established concepts."}
                }
            questions.append(q)
        return {"success": True, "questions": questions}

    def extract_syllabus_topics(self, text_content, subject_hint):
        prompt = f"""Extract all units, chapters and topics from this syllabus text.
Subject hint: {subject_hint or 'Auto-detect'}
Return only JSON in this format:
{{
  "subject": "Name",
  "units": [
    {{
      "unitNumber": 1,
      "unitName": "Name",
      "chapters": [
        {{ "chapterName": "Name", "topics": ["Topic 1", "Topic 2"] }}
      ]
    }}
  ]
}}
Syllabus text:
{text_content[:15000]}"""
        
        logger.info(f"Extracting syllabus from {len(text_content)} chars...")
        result = self._chat(prompt, max_tokens=3000)
        
        if result["success"]:
            logger.info("Gemini call successful, parsing response...")
            parsed = self._parse_json_object(result["content"])
            if parsed:
                return {"success": True, "syllabus": parsed}
            else:
                logger.error(f"Failed to parse Gemini JSON. Raw content: {result['content'][:500]}")
                return {"success": False, "error": "AI returned non-JSON content. Check logs.", "raw": result["content"]}
        
        logger.error(f"Gemini API failure: {result.get('error')} - {result.get('details')}")
        return {"success": False, "error": f"AI Error: {result.get('error')}"}

    def generate_study_suggestions(self, student_name, subject, chapter_stats):
        prompt = f"""Generate personalized AI study insights for {student_name} based on their {subject} performance.
Chapter performance data: {json.dumps(chapter_stats)}
Return a JSON object with:
{{
  "summary": "overall performance summary",
  "strengths": ["list of strong chapters"],
  "weaknesses": ["list of chapters needing work"],
  "recommendations": ["specific actionable study steps"]
}}"""
        result = self._chat(prompt, max_tokens=1000)
        if result["success"]:
            parsed = self._parse_json_object(result["content"])
            if parsed:
                return {"success": True, "insights": parsed}
        return {"success": False, "error": "Failed to generate insights"}

    def _build_prompt(self, subject, topic, difficulty, count, question_type, level, stream, specific_topics, marks):
        effective_topic = specific_topics if specific_topics else topic
        marks_str = str(marks).replace('M', '')
        
        if question_type in ['MCQ', 'Multiple Choice Question (MCQ)', 'Single Correct MCQ']:
            options_spec = '"options": [{"id": "A", "text": "<real answer text>"}, {"id": "B", "text": "<real answer text>"}, {"id": "C", "text": "<real answer text>"}, {"id": "D", "text": "<real answer text>"}]'
            answer_spec = '"answer": {"correctOption": "B", "explanation": "<why this is correct>"}'
            extra_instructions = ('CRITICAL: You MUST replace ALL placeholder text with REAL academic content related to the topic.\n'
                'Example of CORRECT output:\n'
                '{"id": "A", "text": "It increases the voltage"}\n'
                '{"id": "B", "text": "It reduces electrical resistance"}\n'
                'NEVER output {"id": "A", "text": "Option A"} or any generic placeholder.\n'
                'Every option MUST be a factually different, plausible answer about the topic.')
        elif question_type in ['True/False']:
            options_spec = '"options": [{"id": "A", "text": "True"}, {"id": "B", "text": "False"}]'
            answer_spec = '"answer": {"correctOption": "True", "explanation": "..."}'
            extra_instructions = 'Provide exactly two options: True and False.'
        elif question_type in ['Fill in the blanks']:
            options_spec = '"options": []'
            answer_spec = '"answer": {"correctAnswer": "word", "explanation": "..."}'
            extra_instructions = 'Write a sentence with a clear blank. Provide the correct word in the answer.'
        elif question_type in ['One-word Answer']:
            options_spec = '"options": []'
            answer_spec = '"answer": {"value": "word", "explanation": "..."}'
            extra_instructions = 'Write a question requiring a single-word or short phrase answer. Leave options as empty array.'
        elif question_type in ['Short Answer']:
            options_spec = '"options": []'
            answer_spec = '"answer": {"explanation": "2-3 sentence answer here"}'
            extra_instructions = 'Write a short-answer question requiring a 2-3 sentence response. Leave options as empty array.'
        elif question_type in ['Case Study']:
            options_spec = '"options": [{"id": "A", "text": "..."}, {"id": "B", "text": "..."}, {"id": "C", "text": "..."}, {"id": "D", "text": "..."}]'
            answer_spec = '"answer": {"correctOption": "A", "explanation": "..."}'
            extra_instructions = (
                'Create a mini "Case Study" scenario.\n'
                'The "text" field MUST contain both the passage and the question.\n'
                'Format the "text" field as: "PASSAGE: <passage text>\\n\\nQUESTION: <question>".\n'
                'Then provide 4 MCQ options (A, B, C, D) and specify the correct option.'
            )
        else:
            options_spec = '"options": []'
            answer_spec = '"answer": {"explanation": "detailed model answer here (4-6 sentences)"}'
            extra_instructions = 'Write a long-answer question requiring a detailed paragraph response. Leave options as empty array.'

        return f"""Generate exactly {count} academic questions for {subject}.
Topic: {effective_topic}
Difficulty: {difficulty}
Question Type: {question_type}
Marks per question: {marks_str}
Level: {level or 'General'}

Output MUST be a valid JSON array of objects with this EXACT structure:
{{
  "questionNumber": 1,
  "text": "The question text here",
  "type": "{question_type}",
  "difficulty": "{difficulty}",
  "marks": {marks_str},
  "chapter": "Chapter Name",
  "topic": "Topic Name",
  {options_spec},
  {answer_spec}
}}

Specific Instructions:
- If the Topic contains Unit/Chapter/Topic mapping lines (formatted as "Unit > Chapter > Topic"), you MUST select one specific chapter and topic line for each generated question and set the "chapter" and "topic" fields to those exact names.
- Otherwise, default the "chapter" and "topic" fields to the most appropriate chapter/topic names within {subject} for each question.
- {extra_instructions}

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
        if not isinstance(options, list):
            options = []
        
        PLACEHOLDER_TEXTS = {'option a', 'option b', 'option c', 'option d', 'answer_1', 'answer_2', 'answer_3', 'answer_4', '...'}

        if len(options) > 0:
            if isinstance(options[0], dict) and 'id' in options[0] and 'text' in options[0]:
                first_text = str(options[0].get('text', '')).strip().lower()
                if first_text and first_text not in PLACEHOLDER_TEXTS:
                    return options
        
        formatted = []
        option_ids = ['A', 'B', 'C', 'D', 'E', 'F']
        
        for idx, opt in enumerate(options):
            if idx >= len(option_ids):
                break
            
            if isinstance(opt, dict):
                opt_text = opt.get('text') or opt.get('value') or str(opt)
                opt_id = opt.get('id') or option_ids[idx]
            else:
                opt_text = str(opt).strip()
                opt_id = option_ids[idx]
            
            if opt_text and opt_text.strip().lower() not in PLACEHOLDER_TEXTS:
                formatted.append({"id": opt_id, "text": opt_text})
        
        if (not formatted or len(formatted) < 2) and question_type in ['MCQ', 'Multiple Choice Question (MCQ)', 'Single Correct MCQ', 'Case Study']:
            return [
                {"id": "A", "text": "Refer to study material for Option A"},
                {"id": "B", "text": "Refer to study material for Option B"},
                {"id": "C", "text": "Refer to study material for Option C"},
                {"id": "D", "text": "Refer to study material for Option D"},
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

    def _normalize_questions(self, questions, question_type, difficulty, marks, count):
        normalized = []
        for idx, question in enumerate(questions[:count], start=1):
            text = question.get('text', f'Question {idx}')
            q_type = question.get('type', question_type)
            q_difficulty = question.get('difficulty', difficulty)
            raw_options = question.get('options', [])
            formatted_options = self._format_options(raw_options, q_type)
            raw_answer = question.get('answer', {})
            normalized_answer = self._normalize_answer(raw_answer, q_type)
            chapter = question.get('chapter', 'General')
            topic_val = question.get('topic', 'General')
            normalized.append({
                'questionNumber': idx,
                'text': text,
                'type': q_type,
                'difficulty': q_difficulty,
                'marks': marks,
                'chapter': chapter,
                'topic': topic_val,
                'options': formatted_options,
                'answer': normalized_answer
            })
        return normalized
