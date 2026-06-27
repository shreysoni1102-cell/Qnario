import json
import logging
import re
import time
from typing import Any, Dict, List
import requests

from config import GEMINI_API_KEY, GROQ_API_KEY, GEMINI_MODEL_NAME

logger = logging.getLogger(__name__)


class GeminiQuestionGenerator:
    @property
    def model(self):
        import config
        import importlib
        importlib.reload(config)
        return config.GEMINI_MODEL_NAME

    @property
    def api_key(self):
        import config
        import importlib
        importlib.reload(config)
        return config.GEMINI_API_KEY

    @property
    def groq_key(self):
        import config
        import importlib
        importlib.reload(config)
        return config.GROQ_API_KEY

    def __init__(self):
        logger.info(f"Using Gemini model: {self.model}")

    def _chat_groq(self, prompt: str, max_tokens: int = 2048) -> Dict[str, Any]:
        if not self.groq_key:
            return {"success": False, "error": "GROQ_API_KEY is missing"}
        
        groq_max = min(max_tokens, 8000)  # Groq supports up to 8192; raised from 2048 so full multi-unit syllabi fit in response
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.groq_key}",
            "Content-Type": "application/json"
        }
        # Try multiple Groq models in order
        for groq_model in ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"]:
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

    def _chat(self, prompt: Any, max_tokens: int = 2048, temperature: float = 0.7) -> Dict[str, Any]:
        # Try Gemini first, fallback to Groq if 404 or missing
        def get_text_prompt(p):
            if isinstance(p, list):
                tp = ""
                for part in p:
                    if "text" in part:
                        tp += part["text"] + "\n"
                return tp
            return p

        # Detect if prompt contains inline PDF/image data (multimodal)
        def has_inline_data(p):
            if isinstance(p, list):
                return any("inlineData" in part for part in p)
            return False

        if not self.api_key:
            return self._chat_groq(get_text_prompt(prompt), max_tokens)

        self.url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        headers = {"Content-Type": "application/json"}

        parts = prompt if isinstance(prompt, list) else [{"text": prompt}]
        payload = {
            "contents": [{"parts": parts}],
            "generationConfig": {"maxOutputTokens": max_tokens, "temperature": temperature}
        }

        is_multimodal = has_inline_data(parts)
        # Multimodal (PDF/image): retry on 429 with backoff — Groq can't OCR
        # Text-only: immediately fall back to Groq on 429
        max_retries = 4 if is_multimodal else 2
        retry_delays = [15, 30, 45]

        for attempt in range(max_retries):
            try:
                response = requests.post(self.url, headers=headers, json=payload, timeout=60)
                if response.status_code == 200:
                    resp_json = response.json()
                    content = resp_json.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    return {"success": True, "content": content}

                logger.warning(f"Gemini API attempt {attempt + 1} failed with status {response.status_code}: {response.text[:300]}")

                # 403/404 = permanent error — fall back to Groq immediately
                if response.status_code in [403, 404]:
                    logger.warning(f"Gemini returned {response.status_code}. Permanent error, falling back to Groq.")
                    break

                # 429 = rate limit — retry with backoff for PDF, fall back for text
                if response.status_code == 429:
                    if is_multimodal and attempt < max_retries - 1:
                        wait = retry_delays[min(attempt, len(retry_delays) - 1)]
                        logger.warning(f"Gemini 429 rate limit (PDF). Waiting {wait}s before retry {attempt + 2}/{max_retries}...")
                        time.sleep(wait)
                        continue
                    else:
                        logger.warning(f"Gemini 429. {'All PDF retries exhausted' if is_multimodal else 'Falling back to Groq'}.")
                        break

                # Transient errors (503 etc): one retry
                if attempt < max_retries - 1:
                    logger.info(f"Retrying Gemini in 2s...")
                    time.sleep(2)
            except Exception as e:
                logger.error(f"Gemini Exception on attempt {attempt + 1}: {str(e)}")
                break

        # Fallback to Groq
        if is_multimodal:
            logger.warning("Gemini failed for PDF/image. Groq fallback cannot OCR — topics may be incomplete.")
        else:
            logger.warning("Gemini failed all attempts. Falling back to Groq...")
        return self._chat_groq(get_text_prompt(prompt), max_tokens)

    _TOKENS_PER_QUESTION = {
        'MCQ': 400,
        'Multiple Choice Question (MCQ)': 400,
        'Single Correct MCQ': 400,
        'MSQ': 600,
        'Multiple Select Question (MSQ)': 600,
        'True/False': 250,
        'Fill in the blanks': 300,
        'One-word Answer': 300,
        'Short Answer': 650,
        'Long Answer': 1200,
        'Case Study': 1500,
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
        return self._MAX_TOKENS_CAP

    def generate_questions(self, subject, topic, difficulty, count=5, question_type="MCQ", level=None, stream=None, specific_topics=None, marks=1, context=None):
        norm_marks = self._normalize_marks(marks)
        batch_size = self._batch_size_for(question_type)

        if count > batch_size:
            all_questions = []
            remaining = count
            while remaining > 0:
                batch_count = min(remaining, batch_size)
                batch_result = self._generate_single_batch(
                    subject, topic, difficulty, batch_count,
                    question_type, level, stream, specific_topics, norm_marks, context
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
            question_type, level, stream, specific_topics, norm_marks, context
        )

        return {
            "success": True,
            "count": len(questions),
            "questions": questions,
            "source": "gemini",
        }

    def generate_questions_stream(self, subject, topic, difficulty, count=5, question_type="MCQ", level=None, stream=None, specific_topics=None, marks=1, context=None):
        norm_marks = self._normalize_marks(marks)
        batch_size = self._batch_size_for(question_type)

        q_idx = 1
        remaining = count
        while remaining > 0:
            batch_count = min(remaining, batch_size)
            batch_result = self._generate_single_batch(
                subject, topic, difficulty, batch_count,
                question_type, level, stream, specific_topics, norm_marks, context
            )
            for q in batch_result:
                q['questionNumber'] = q_idx
                q_idx += 1
                yield q
            remaining -= batch_count
            if remaining > 0:
                time.sleep(self._INTER_BATCH_DELAY)

    def _generate_single_batch(self, subject, topic, difficulty, count, question_type, level, stream, specific_topics, norm_marks, context=None):
        prompt = self._build_prompt(subject, topic, difficulty, count, question_type, level, stream, specific_topics, norm_marks, context)
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
    def extract_syllabus_topics(self, text_content, subject_hint, pdf_base64=None):
        # --- Convert scanned PDF to compressed page images for efficient Gemini OCR ---
        # Sending raw PDF base64 (~975KB) uses 50K+ tokens and causes 429 quota errors.
        # Converting pages to compressed JPEGs (~50-80KB each) uses ~90% fewer tokens.
        image_parts = None
        if pdf_base64:
            try:
                import fitz  # PyMuPDF
                import base64 as _b64
                import io
                pdf_bytes = _b64.b64decode(pdf_base64)
                doc = fitz.open(stream=pdf_bytes, filetype="pdf")
                image_parts = []
                for page_num in range(len(doc)):
                    page = doc[page_num]
                    mat = fitz.Matrix(1.5, 1.5)  # 1.5x zoom for readability
                    pix = page.get_pixmap(matrix=mat)
                    img_bytes = pix.tobytes(output="jpeg", jpg_quality=75)
                    img_b64 = _b64.b64encode(img_bytes).decode('utf-8')
                    image_parts.append({"inlineData": {"mimeType": "image/jpeg", "data": img_b64}})
                    logger.info(f"Syllabus page {page_num + 1}: JPEG {len(img_bytes)} bytes")
                doc.close()
                logger.info(f"PDF converted to {len(image_parts)} page image(s) — raw PDF base64 replaced.")
                pdf_base64 = None  # Use images instead of raw PDF
            except ImportError:
                logger.warning("PyMuPDF not available — using raw PDF base64 (higher token cost).")
            except Exception as e:
                logger.error(f"PDF-to-image conversion failed: {e} — falling back to raw PDF base64.")
                image_parts = None

        # Trigger pruning on large text contents to prevent 503 payload/time limits on Gemini
        # and 413 request size limits on the Groq fallback.
        if not pdf_base64 and len(text_content) > 10000:
            logger.info(f"Large text content detected ({len(text_content)} chars). Running structural filter...")
            try:
                def clean_duplicate_segments(line):
                    # Split by tab or multiple spaces (>=2)
                    segments = re.split(r'\t| {2,}', line)
                    seen = set()
                    unique_segs = []
                    for seg in segments:
                        s = seg.strip()
                        if s and s not in seen:
                            seen.add(s)
                            unique_segs.append(s)
                    cleaned = " | ".join(unique_segs)
                    
                    # Word-level duplicate cleanup
                    words = cleaned.split()
                    if len(words) > 4:
                        for n in range(1, len(words) // 2 + 1):
                            for i in range(len(words) - 2*n + 1):
                                sub1 = words[i:i+n]
                                sub2 = words[i+n:i+2*n]
                                if sub1 == sub2:
                                    words = words[:i+n] + words[i+2*n:]
                                    break
                    return " ".join(words)

                lines = text_content.split("\n")
                filtered_lines = []
                
                skip_patterns = [
                    r'^\s*$',
                    r'^reprint\b',
                    r'^science\s+\d+$',
                    r'^electricity\s+\d+$',
                    r'^biology\s+\d+$',
                    r'^physics\s+\d+$',
                    r'^chemistry\s+\d+$',
                    r'^\d+\s*$',
                    r'^--\s*\d+\s*of\s*\d+\s*--$',
                    r'^example\b',
                    r'^solution\b',
                    r'^\??\s*questions\b',
                    r'^figure\b',
                    r'^table\b',
                    r'^activity\b',
                    r'^[A-Za-z]\s*=\s*.+$',
                    r'^I\s*=\s*.+$',
                    r'^V\s*=\s*.+$',
                    r'^R\s*=\s*.+$',
                    r'^H\s*=\s*.+$',
                    r'^[0-9+\-*/=×÷\s\.\(\)]+$',
                ]
                compiled_skips = [re.compile(p, re.IGNORECASE) for p in skip_patterns]

                for line in lines:
                    line_str = line.strip()
                    if not line_str:
                        continue
                        
                    should_skip = False
                    for pattern in compiled_skips:
                        if pattern.match(line_str):
                            should_skip = True
                            break
                    if should_skip:
                        continue
                    
                    has_sec_num = re.match(r'^(\d+(\.\d+)*|[I|V|X]+\b)\s+[A-Z]', line_str)
                    is_uppercase = line_str.isupper() and len(line_str) > 3
                    is_short_heading = len(line_str) < 65 and not line_str.endswith(('.', ',', ';', ':', '?', '!')) and (line_str[0].isupper() if line_str else False)
                    is_list_item = (line_str.startswith('-') or line_str.startswith('•') or re.match(r'^\([a-z0-9]\)', line_str)) and not re.search(r'[=×+]', line_str)
                    is_unit_header = re.match(r'^(unit|chapter|module|part)\b', line_str, re.IGNORECASE)
                    
                    if has_sec_num or is_uppercase or is_short_heading or is_list_item or is_unit_header:
                        if len(line_str) < 5 and not has_sec_num:
                            continue
                        cleaned = clean_duplicate_segments(line_str)
                        if cleaned:
                            filtered_lines.append(cleaned)
                
                unique_lines = []
                for line in filtered_lines:
                    if not unique_lines or line != unique_lines[-1]:
                        unique_lines.append(line)
                
                pruned = "\n".join(unique_lines)
                if len(pruned) > 500:
                    logger.info(f"Successfully pruned text from {len(text_content)} to {len(pruned)} chars.")
                    text_content = pruned[:12000]  # Increased limit to capture all units in large syllabi
                else:
                    logger.warning("Pruning resulted in too little text. Falling back to simple slicing.")
                    text_content = text_content[:10000]
            except Exception as e:
                logger.error(f"Error during text pruning: {e}. Falling back to slicing.")
                text_content = text_content[:5000]

        if image_parts or pdf_base64:
            prompt_text = f"""You are a strict syllabus parser. Your ONLY job is to extract structure from the given academic syllabus document image(s).

CRITICAL RULES — You MUST follow these exactly:
1. Use the EXACT unit/chapter names as written in the document. DO NOT rename, paraphrase, or reword them.
2. Keep the unitNumber as the ordinal (1 for UNIT-I, 2 for UNIT-II, etc.)
3. For chapters inside each unit: if the syllabus has sub-headings, use them exactly. If not, create 1-2 chapters from the main topic groups.
4. For topics: extract the exact technical terms listed (e.g., "Binary Search Tree", "Dijkstra's Algorithm").
5. DO NOT merge units together. Each UNIT in the syllabus MUST be a separate entry.
6. DO NOT create units that are not in the document.
7. Read ALL pages carefully before responding.

Subject hint: {subject_hint or 'Auto-detect from document'}

Return ONLY valid JSON in this exact format, nothing else:
{{
  "subject": "Exact subject name from the document",
  "units": [
    {{
      "unitNumber": 1,
      "unitName": "UNIT-I: EXACT NAME FROM DOCUMENT",
      "chapters": [
        {{
          "chapterName": "Chapter name",
          "topics": ["Topic 1", "Topic 2", "Topic 3"]
        }}
      ]
    }}
  ]
}}

REMINDER: Copy unit names VERBATIM. Extract from what you SEE in the image, not from memory."""

            if image_parts:
                # Use rendered JPEG images — much fewer tokens than raw PDF
                prompt = image_parts + [{"text": prompt_text}]
                logger.info(f"Extracting syllabus from {len(image_parts)} JPEG page image(s)...")
            else:
                # Fallback: raw PDF base64
                prompt = [
                    {"inlineData": {"mimeType": "application/pdf", "data": pdf_base64}},
                    {"text": prompt_text}
                ]
                logger.info(f"Extracting syllabus from raw PDF base64 ({len(pdf_base64)} chars)...")

        elif text_content.strip().startswith("Generate a comprehensive"):
            prompt = f"""You are an expert academic curriculum designer. Your job is to generate a comprehensive, structured syllabus for the requested subject and class/grade.
            
Subject: {subject_hint or 'General'}
Requirement: {text_content}

CRITICAL RULES:
1. Generate exactly 5 units representing a standard course curriculum for this subject.
2. Structure the output into Units, Chapters, and specific Topics.
3. Return ONLY valid JSON in this exact format, nothing else:
{{
  "subject": "{subject_hint or 'Subject'}",
  "units": [
    {{
      "unitNumber": 1,
      "unitName": "UNIT-I: [Name of Unit 1]",
      "chapters": [
        {{
          "chapterName": "[Name of Chapter 1]",
          "topics": ["[Topic 1]", "[Topic 2]", "[Topic 3]"]
        }}
      ]
    }}
  ]
}}
"""
            logger.info("Generating syllabus from AI prompts...")
        else:
            prompt = f"""You are a strict syllabus parser. Your ONLY job is to extract structure from the given academic syllabus document.

CRITICAL RULES — You MUST follow these exactly:
1. Use the EXACT unit names as written in the document. DO NOT rename, paraphrase, or reword them.
   - If the syllabus says "UNIT-I AUTOMATA FUNDAMENTALS", the unitName MUST be "UNIT-I: AUTOMATA FUNDAMENTALS"
   - If the syllabus says "UNIT-II REGULAR EXPRESSIONS AND LANGUAGES", the unitName MUST be "UNIT-II: REGULAR EXPRESSIONS AND LANGUAGES"
   - NEVER substitute your own names like "Introduction to Theory of Computation" or "Finite Automata"
2. Keep the unitNumber as the ordinal (1 for UNIT-I, 2 for UNIT-II, etc.)
3. For chapters inside each unit: if the syllabus has sub-headings, use them exactly. If not, create 1-2 chapters named after the main topic groups in that unit's content.
4. For topics: extract the exact technical terms listed in the unit content (e.g., "Deterministic Finite Automata", "Pushdown Automata", "Pumping Lemma").
5. DO NOT merge units together. Each UNIT in the syllabus must be a separate entry.
6. DO NOT create units that are not in the syllabus.

Subject: {subject_hint or 'Auto-detect from document'}

Return ONLY valid JSON in this exact format, nothing else:
{{
  "subject": "Exact subject name from the document",
  "units": [
    {{
      "unitNumber": 1,
      "unitName": "UNIT-I: EXACT NAME FROM DOCUMENT",
      "chapters": [
        {{
          "chapterName": "Exact or inferred chapter name",
          "topics": ["Exact Topic 1", "Exact Topic 2", "Exact Topic 3"]
        }}
      ]
    }}
  ]
}}

Syllabus document text:
{text_content}

REMINDER: Copy unit names VERBATIM from the document. Do not invent, rename, or merge units."""
            logger.info(f"Extracting syllabus from {len(text_content)} chars...")

        result = self._chat(prompt, max_tokens=4096, temperature=0.1)

        # If Gemini failed for a scanned PDF (image_parts), Groq received no visual content
        # and would guess random topics. Use a subject-based generation prompt instead.
        if not result["success"] and image_parts and subject_hint:
            logger.warning(f"Gemini failed for scanned PDF. Running Groq subject-based generation for '{subject_hint}'...")
            groq_fallback_prompt = f"""You are an expert academic curriculum designer.
Generate a comprehensive, structured university syllabus for this subject: {subject_hint}

Return ONLY valid JSON in this exact format, nothing else:
{{
  "subject": "{subject_hint}",
  "units": [
    {{
      "unitNumber": 1,
      "unitName": "UNIT-I: [Unit Name]",
      "chapters": [
        {{
          "chapterName": "[Chapter Name]",
          "topics": ["Topic 1", "Topic 2", "Topic 3"]
        }}
      ]
    }}
  ]
}}

Generate exactly 5 units with 2-4 real technical topics per chapter based on standard university curriculum for {subject_hint}."""
            result = self._chat_groq(groq_fallback_prompt, max_tokens=4096)
            if result["success"]:
                logger.info("Groq subject-based fallback succeeded.")

        if result["success"]:
            logger.info("AI call successful, parsing response...")
            parsed = self._parse_json_object(result["content"])
            if parsed and isinstance(parsed, dict) and "units" in parsed:
                original_units = parsed["units"]
                new_units = []
                unit_counter = 1
                for u in original_units:
                    chapters = u.get("chapters", [])
                    for c in chapters:
                        ch_name = c.get("chapterName") or c.get("chapter") or u.get("unitName") or f"Topic {unit_counter}"
                        new_units.append({
                            "unitNumber": unit_counter,
                            "unitName": ch_name,
                            "chapters": [
                                {
                                    "chapterName": ch_name,
                                    "topics": c.get("topics", [])
                                }
                            ]
                        })
                        unit_counter += 1
                parsed["units"] = new_units
                return {"success": True, "syllabus": parsed}
            elif parsed:
                return {"success": True, "syllabus": parsed}
            else:
                logger.error(f"Failed to parse AI JSON. Raw: {result['content'][:500]}")
                return {"success": False, "error": "AI returned non-JSON content.", "raw": result["content"]}

        logger.error(f"All AI attempts failed: {result.get('error')}")
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

    def _build_prompt(self, subject, topic, difficulty, count, question_type, level, stream, specific_topics, marks, context=None):
        effective_topic = specific_topics if specific_topics else topic
        marks_str = str(marks).replace('M', '')
        context_str = f"Context Information:\n{context}\n\nUse ONLY the context information above to generate the questions.\n" if context else ""
        
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

        return f"""{context_str}Generate exactly {count} academic questions for {subject}.
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

    # ─────────────────────────────────────────────────────────────────────────
    # CODING PRACTICE METHODS
    # ─────────────────────────────────────────────────────────────────────────

    def generate_coding_questions(self, language: str, topic: str, difficulty: str,
                                  count: int, question_type: str) -> Dict[str, Any]:
        """Generate coding-specific questions: CodeFill, Debugging, DSA, TraceOutput, ConceptMCQ."""
        try:
            if question_type == 'CodeFill':
                prompt = self._build_code_fill_prompt(language, topic, difficulty, count)
            elif question_type == 'Debugging':
                prompt = self._build_debug_prompt(language, topic, difficulty, count)
            elif question_type == 'TraceOutput':
                prompt = self._build_trace_output_prompt(language, topic, difficulty, count)
            else:
                # DSA / ConceptMCQ — reuse existing MCQ prompt tuned for coding
                prompt = self._build_coding_mcq_prompt(language, topic, difficulty, count)

            result = self._chat(prompt, max_tokens=4096, temperature=0.7)
            if not result['success']:
                return {'success': False, 'error': result.get('error', 'AI call failed')}

            parsed = self._parse_json_array(result['content'])
            if not parsed:
                # Try object wrapper fallback
                obj = self._parse_json_object(result['content'])
                parsed = obj.get('questions', [])

            if not parsed:
                return {'success': False, 'error': 'Failed to parse AI response as JSON'}

            return {'success': True, 'questions': parsed[:count], 'count': len(parsed[:count])}
        except Exception as e:
            logger.error(f'Coding question generation error: {e}')
            return {'success': False, 'error': str(e)}

    def _build_code_fill_prompt(self, language: str, topic: str, difficulty: str, count: int) -> str:
        return f"""Generate exactly {count} "Code Fill-in-the-Blank" questions for {language} on topic: {topic}.
Difficulty: {difficulty}

Rules:
- Show a real, meaningful code snippet related to {topic} in {language}
- Replace key parts with ___BLANK___ placeholders (1-3 blanks per question)
- Each blank must be a single expression, keyword, value, or short statement
- Make blanks test understanding, not trivial copying

Return ONLY a valid JSON array. Each object MUST have this EXACT structure:
[
  {{
    "questionNumber": 1,
    "type": "CodeFill",
    "language": "{language}",
    "topic": "{topic}",
    "difficulty": "{difficulty}",
    "instruction": "Fill in the blanks to complete the {language} code:",
    "code": "def binary_search(arr, target):\\n    left, right = 0, ___BLANK___\\n    while left <= right:\\n        mid = (left + right) // ___BLANK___\\n        if arr[mid] == target:\\n            return mid\\n        elif arr[mid] < target:\\n            left = mid + 1\\n        else:\\n            right = mid - 1\\n    return -1",
    "blanks": ["len(arr) - 1", "2"],
    "explanation": "right starts at last index; mid divides the search space in half"
  }}
]

IMPORTANT:
- Use ___BLANK___ (with triple underscores) as the placeholder
- blanks array must match the exact number of ___BLANK___ occurrences in code, in order
- Generate real, educational code — no toy examples
- Return ONLY the JSON array, no extra text"""

    def _build_debug_prompt(self, language: str, topic: str, difficulty: str, count: int) -> str:
        bug_types = {
            'Easy': ['wrong initialization', 'off-by-one error', 'wrong comparison operator'],
            'Medium': ['missing base case in recursion', 'wrong loop condition', 'logic error in condition'],
            'Hard': ['subtle logic bug', 'incorrect edge case handling', 'wrong algorithm step']
        }
        chosen_bugs = bug_types.get(difficulty, bug_types['Medium'])

        return f"""Generate exactly {count} "Debugging Challenge" questions for {language} on topic: {topic}.
Difficulty: {difficulty}
Bug types to include: {', '.join(chosen_bugs)}

Rules:
- Write a realistic code snippet with exactly ONE intentional bug
- The bug should be educational and related to common mistakes
- Provide the corrected version and a clear explanation of the bug

Return ONLY a valid JSON array. Each object MUST have this EXACT structure:
[
  {{
    "questionNumber": 1,
    "type": "Debugging",
    "language": "{language}",
    "topic": "{topic}",
    "difficulty": "{difficulty}",
    "instruction": "Find and fix the bug in this {language} code:",
    "buggyCode": "def find_max(arr):\\n    max_val = 0  # Bug here\\n    for num in arr:\\n        if num > max_val:\\n            max_val = num\\n    return max_val\\n\\nprint(find_max([-5, -3, -1]))  # Should print -1",
    "bugLine": 2,
    "bugDescription": "Initializing max_val to 0 fails for all-negative arrays",
    "fixedCode": "def find_max(arr):\\n    max_val = arr[0]  # Fixed: use first element\\n    for num in arr:\\n        if num > max_val:\\n            max_val = num\\n    return max_val",
    "fix": "max_val = arr[0]",
    "options": [
      {{"id": "A", "text": "Change `max_val = 0` to `max_val = arr[0]`"}},
      {{"id": "B", "text": "Change `if num > max_val` to `if num >= max_val`"}},
      {{"id": "C", "text": "Change `return max_val` to `return max_val - 1`"}},
      {{"id": "D", "text": "Add `arr.sort()` before the loop"}}
    ],
    "correctOption": "A",
    "explanation": "When all values are negative, starting max_val at 0 means no element ever exceeds it. Using arr[0] as the initial value handles all cases correctly."
  }}
]

IMPORTANT:
- bugLine is 1-indexed line number of the bug
- options must have exactly 4 choices (A, B, C, D)
- correctOption must be the letter of the correct fix
- Return ONLY the JSON array, no extra text"""

    def _build_trace_output_prompt(self, language: str, topic: str, difficulty: str, count: int) -> str:
        return f"""Generate exactly {count} "Trace the Output" questions for {language} on topic: {topic}.
Difficulty: {difficulty}

Rules:
- Write a short, complete code snippet (5-15 lines) that produces deterministic output
- The output should NOT be trivially obvious — it should test understanding
- Include tricky but fair aspects like loop behavior, variable scoping, or data structure ops

Return ONLY a valid JSON array. Each object MUST have this EXACT structure:
[
  {{
    "questionNumber": 1,
    "type": "TraceOutput",
    "language": "{language}",
    "topic": "{topic}",
    "difficulty": "{difficulty}",
    "instruction": "What is the output of this {language} code?",
    "code": "stack = []\\nfor i in range(1, 5):\\n    stack.append(i)\\nwhile stack:\\n    print(stack.pop(), end=' ')",
    "options": [
      {{"id": "A", "text": "1 2 3 4"}},
      {{"id": "B", "text": "4 3 2 1"}},
      {{"id": "C", "text": "1 2 3"}},
      {{"id": "D", "text": "Error"}}
    ],
    "correctOption": "B",
    "explanation": "Stack is LIFO. After pushing 1,2,3,4, popping yields 4,3,2,1."
  }}
]

IMPORTANT:
- Code must be syntactically correct and produce exactly one deterministic output
- Wrong options should be plausible (common misconceptions)
- Return ONLY the JSON array, no extra text"""

    def _build_coding_mcq_prompt(self, language: str, topic: str, difficulty: str, count: int) -> str:
        return f"""Generate exactly {count} coding concept MCQ questions for {language} on topic: {topic}.
Difficulty: {difficulty}

These questions test deep understanding of {language} and {topic} concepts.
Include questions about time/space complexity, algorithm behavior, language features, and best practices.

Return ONLY a valid JSON array. Each object MUST have this EXACT structure:
[
  {{
    "questionNumber": 1,
    "type": "ConceptMCQ",
    "language": "{language}",
    "topic": "{topic}",
    "difficulty": "{difficulty}",
    "instruction": "",
    "code": "",
    "text": "What is the time complexity of inserting an element at the beginning of a Python list?",
    "options": [
      {{"id": "A", "text": "O(1)"}},
      {{"id": "B", "text": "O(n)"}},
      {{"id": "C", "text": "O(log n)"}},
      {{"id": "D", "text": "O(n²)"}}
    ],
    "correctOption": "B",
    "explanation": "Python lists are dynamic arrays. Inserting at index 0 requires shifting all n existing elements right."
  }}
]

IMPORTANT:
- code field can be empty string if no code is needed
- Make questions genuinely educational, not trivial
- Return ONLY the JSON array, no extra text"""

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

# Hot-reload trigger after config model update completed
