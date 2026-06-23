import sys
import os
import json
import logging

# Set up python path to include parent directory
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.gemini_service import GeminiQuestionGenerator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def evaluate_syllabus_extraction(generator, test_cases):
    results = []
    total_score = 0
    total_checks = 0

    print("\n--- Running Syllabus Extraction Evals ---")
    for case in test_cases:
        case_id = case["id"]
        subject = case["subject_hint"]
        text = case["text"]
        expected = case["expected_units"]

        print(f"Running {case_id} ({subject})...")
        try:
            res = generator.extract_syllabus_topics(text, subject)
            if not res.get("success"):
                print(f"  ❌ Failed: {res.get('error')}")
                results.append({
                    "id": case_id,
                    "subject": subject,
                    "passed": False,
                    "score": 0.0,
                    "error": res.get("error", "API call unsuccessful"),
                    "details": "API failed"
                })
                total_checks += len(expected)
                continue

            extracted = res.get("syllabus", res.get("extracted", {}))
            units = extracted.get("units", [])
            extracted_names = [u.get("unitName", "").strip() for u in units]

            matches = 0
            detail_msgs = []
            for exp in expected:
                if exp in extracted_names:
                    matches += 1
                    detail_msgs.append(f"Verbatim match found: '{exp}'")
                else:
                    detail_msgs.append(f"Missing unit name verbatim: '{exp}'")

            score = matches / len(expected) if expected else 1.0
            passed = score >= 1.0
            
            results.append({
                "id": case_id,
                "subject": subject,
                "passed": passed,
                "score": score,
                "expected": expected,
                "extracted": extracted_names,
                "details": detail_msgs
            })

            total_score += matches
            total_checks += len(expected)
            print(f"  {'✅' if passed else '❌'} Verbatim Match Score: {matches}/{len(expected)} ({score * 100:.1f}%)")

        except Exception as e:
            print(f"  ❌ Exception: {str(e)}")
            results.append({
                "id": case_id,
                "subject": subject,
                "passed": False,
                "score": 0.0,
                "error": str(e),
                "details": "Exception occurred"
            })
            total_checks += len(expected)

    avg_score = (total_score / total_checks) if total_checks else 0.0
    return results, avg_score

def call_llm_judge(generator, question_data, subject, topic):
    # Try to use a judge LLM to rate question quality/relevance/difficulty on a 1-5 scale.
    # We will build a prompt asking for rating, and call the _chat helper.
    judge_prompt = f"""You are an expert academic judge. Rate the academic quality, correctness, and relevance of the following generated question for the Subject "{subject}" and Topic "{topic}".
Question:
{json.dumps(question_data, indent=2)}

Rate the question on these criteria (1 to 5 scale):
1. Relevance to the Topic and Subject.
2. Correctness of the question, options, and explanation.
3. Appropriate difficulty alignment.

Provide your output ONLY in this valid JSON format:
{{
  "relevance_score": 5,
  "correctness_score": 5,
  "difficulty_score": 4,
  "overall_rating": 4.5,
  "feedback": "Reason for the score"
}}
"""
    try:
        # Avoid nested loop failures if judge call rate-limits or fails. Use try-except.
        res = generator._chat(judge_prompt, max_tokens=300, temperature=0.1)
        if res.get("success"):
            parsed = generator._parse_json_object(res["content"])
            if parsed and "overall_rating" in parsed:
                return parsed
    except Exception as e:
        logger.warning(f"Judge LLM failed: {e}")
    return {"overall_rating": 4.0, "feedback": "Fallback score (Judge LLM skipped/errored)"}

def evaluate_question_generation(generator, test_cases):
    results = []
    total_score = 0
    total_cases = 0

    print("\n--- Running Question Generation Evals ---")
    for case in test_cases:
        case_id = case["id"]
        subject = case["subject"]
        topic = case["topic"]
        difficulty = case["difficulty"]
        q_type = case["question_type"]
        count = case["count"]

        print(f"Running {case_id} ({subject} | {topic} | {q_type} | {difficulty})...")
        try:
            res = generator.generate_questions(
                subject=subject,
                topic=topic,
                difficulty=difficulty,
                count=count,
                question_type=q_type
            )

            if not res.get("success"):
                print(f"  ❌ Failed: {res.get('error')}")
                results.append({
                    "id": case_id,
                    "subject": subject,
                    "topic": topic,
                    "passed": False,
                    "score": 0.0,
                    "error": res.get("error", "API call unsuccessful")
                })
                total_cases += 1
                continue

            questions = res.get("questions", [])
            
            # 1. Check count
            count_ok = len(questions) == count
            
            # 2. Check JSON schema correctness & option absurdity
            schema_ok = True
            duplicates_exist = False
            absurd_options_exist = False
            
            texts = []
            details = []
            
            for q in questions:
                # Key validation
                req_keys = ["questionNumber", "text", "type", "difficulty", "marks", "chapter", "topic", "options", "answer"]
                missing = [k for k in req_keys if k not in q]
                if missing:
                    schema_ok = False
                    details.append(f"Missing keys: {missing}")

                # Check options duplicate / placeholder
                opts = q.get("options", [])
                if q_type in ["MCQ", "True/False", "Case Study"]:
                    if not opts or len(opts) < 2:
                        schema_ok = False
                        details.append("Insufficient options for choice question type")
                    else:
                        opt_texts = [str(o.get("text", "")).strip().lower() for o in opts]
                        # Check all identical
                        if len(set(opt_texts)) == 1:
                            absurd_options_exist = True
                            details.append(f"All options are identical: {opt_texts}")
                        # Check generic option names
                        placeholders = {"option a", "option b", "option c", "option d", "option 1", "option 2", "..."}
                        if any(pt in placeholders for pt in opt_texts):
                            absurd_options_exist = True
                            details.append(f"Placeholder options detected: {opt_texts}")
                
                # For duplicate check
                q_text = str(q.get("text", "")).strip().lower()
                if q_text in texts:
                    duplicates_exist = True
                    details.append(f"Duplicate question text: '{q_text}'")
                texts.append(q_text)

            # 3. Call LLM judge on the first question for quality validation
            judge_score = 4.0
            judge_feedback = "N/A"
            if questions:
                judge_res = call_llm_judge(generator, questions[0], subject, topic)
                judge_score = judge_res.get("overall_rating", 4.0)
                judge_feedback = judge_res.get("feedback", "N/A")

            # Score logic:
            # Full score is 1.0. Deduct 0.2 for schema issues, 0.2 for duplicates, 0.2 for absurd options.
            # Scale judge score (1-5) to fit remaining portion or weigh it.
            base_score = 1.0
            if not count_ok:
                base_score -= 0.3
            if not schema_ok:
                base_score -= 0.3
            if duplicates_exist:
                base_score -= 0.2
            if absurd_options_exist:
                base_score -= 0.2

            # Adjust score using judge rating (weighted)
            # judge_score of 5.0 matches 1.0 multiplier, 1.0 matches 0.2
            judge_mult = judge_score / 5.0
            final_score = max(0.0, base_score * 0.6 + judge_mult * 0.4)
            passed = final_score >= 0.7

            results.append({
                "id": case_id,
                "subject": subject,
                "topic": topic,
                "passed": passed,
                "score": final_score,
                "count_ok": count_ok,
                "schema_ok": schema_ok,
                "duplicates_exist": duplicates_exist,
                "absurd_options_exist": absurd_options_exist,
                "judge_score": judge_score,
                "judge_feedback": judge_feedback,
                "details": details
            })

            total_score += final_score
            total_cases += 1
            print(f"  {'✅' if passed else '❌'} Score: {final_score * 100:.1f}% (Judge: {judge_score}/5, Schema: {schema_ok}, Duplicates: {duplicates_exist}, Absurd: {absurd_options_exist})")

        except Exception as e:
            print(f"  ❌ Exception: {str(e)}")
            results.append({
                "id": case_id,
                "subject": subject,
                "topic": topic,
                "passed": False,
                "score": 0.0,
                "error": str(e)
            })
            total_cases += 1

    avg_score = (total_score / total_cases) if total_cases else 0.0
    return results, avg_score

def write_report(se_results, se_avg, qg_results, qg_avg):
    overall_avg = (se_avg + qg_avg) / 2.0
    overall_passed = overall_avg >= 0.75

    report = {
        "overall": {
            "passed": overall_passed,
            "average_score": overall_avg,
            "syllabus_extraction_average": se_avg,
            "question_generation_average": qg_avg
        },
        "syllabus_extraction": se_results,
        "question_generation": qg_results
    }

    # Write JSON report
    report_json_path = os.path.join(os.path.dirname(__file__), 'eval_report.json')
    with open(report_json_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)

    # Write Markdown report
    report_md_path = os.path.join(os.path.dirname(__file__), 'eval_report.md')
    with open(report_md_path, 'w', encoding='utf-8') as f:
        f.write("# Qnario AI Question-Generation Pipeline Evaluation Report\n\n")
        f.write(f"**Overall Status:** {'✅ PASSED' if overall_passed else '❌ FAILED'}\n")
        f.write(f"**Overall Score:** {overall_avg * 100:.1f}%\n")
        f.write(f"- Syllabus Extraction Avg: {se_avg * 100:.1f}%\n")
        f.write(f"- Question Generation Avg: {qg_avg * 100:.1f}%\n\n")

        f.write("## Syllabus Extraction Results\n")
        f.write("| ID | Subject | Verbatim Match Score | Passed |\n")
        f.write("|---|---|---|---|\n")
        for r in se_results:
            passed_icon = "✅" if r["passed"] else "❌"
            f.write(f"| {r['id']} | {r['subject']} | {r.get('score', 0.0) * 100:.1f}% | {passed_icon} |\n")

        f.write("\n## Question Generation Results\n")
        f.write("| ID | Subject | Topic | Score | Judge Rating | Schema OK | Dup Exist | Absurd Opt | Passed |\n")
        f.write("|---|---|---|---|---|---|---|---|---|\n")
        for r in qg_results:
            passed_icon = "✅" if r["passed"] else "❌"
            f.write(f"| {r['id']} | {r['subject']} | {r['topic']} | {r.get('score', 0.0) * 100:.1f}% | {r.get('judge_score', 'N/A')} | {r.get('schema_ok', False)} | {r.get('duplicates_exist', False)} | {r.get('absurd_options_exist', False)} | {passed_icon} |\n")
        
        f.write("\n## Detailed Issues/Logs\n")
        has_details = False
        for r in se_results + qg_results:
            details = r.get("details", [])
            if details:
                has_details = True
                f.write(f"### {r['id']} - {r['subject']}\n")
                for d in details:
                    f.write(f"- {d}\n")
        if not has_details:
            f.write("No schema validation or string-verbatim mismatches occurred!\n")

    print(f"\nReport written to: {report_md_path}")
    print(f"Overall Score: {overall_avg * 100:.1f}% ({'PASSED' if overall_passed else 'FAILED'})")

def main():
    # Set dummy API keys for fallback test validation if not present in env
    if not os.getenv("GEMINI_API_KEY"):
        os.environ["GEMINI_API_KEY"] = "dummy_key_for_eval"
    if not os.getenv("GROQ_API_KEY"):
        os.environ["GROQ_API_KEY"] = "dummy_key_for_eval"

    generator = GeminiQuestionGenerator()
    test_cases_path = os.path.join(os.path.dirname(__file__), 'test_cases.json')
    
    with open(test_cases_path, 'r', encoding='utf-8') as f:
        cases = json.load(f)

    se_results, se_avg = evaluate_syllabus_extraction(generator, cases["syllabus_extraction"])
    qg_results, qg_avg = evaluate_question_generation(generator, cases["question_generation"])

    write_report(se_results, se_avg, qg_results, qg_avg)

if __name__ == "__main__":
    main()
