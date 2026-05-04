#!/usr/bin/env python3
"""
Test Groq API for question pattern consistency issues
"""
import json
import logging
from gemini_service import GroqQuestionGenerator

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def validate_question_structure(question, question_type):
    """Validate if question matches expected pattern"""
    errors = []
    
    # Required fields
    if not question.get('text'):
        errors.append("Missing 'text' field")
    
    if not question.get('type'):
        errors.append("Missing 'type' field")
    
    if 'marks' not in question:
        errors.append("Missing 'marks' field")
    
    # Type-specific validation
    if question_type in ['MCQ', 'MSQ', 'Single Correct MCQ', 'Multiple Select Question (MSQ)']:
        if not question.get('options'):
            errors.append(f"Missing 'options' for {question_type}")
        elif not isinstance(question['options'], list):
            errors.append(f"'options' must be a list for {question_type}")
        elif len(question['options']) < 2:
            errors.append(f"'options' must have at least 2 items for {question_type}")
        
        # Check for answer
        answer = question.get('answer', {})
        if isinstance(answer, dict):
            if not answer.get('correctOption'):
                errors.append(f"Missing 'answer.correctOption' for {question_type}")
    
    elif question_type in ['True/False']:
        answer = question.get('answer', {})
        if isinstance(answer, dict):
            correct = answer.get('correctOption')
            if correct not in ['True', 'False', 'T', 'F']:
                errors.append(f"Invalid True/False answer: {correct}")
    
    elif question_type in ['One-word Answer', 'Short Answer']:
        answer = question.get('answer', {})
        if not answer:
            errors.append(f"Missing answer for {question_type}")
    
    elif question_type in ['Long Answer']:
        answer = question.get('answer', {})
        if not answer:
            errors.append(f"Missing answer for {question_type}")
    
    return errors

def test_question_generation(question_type, marks, num_tests=3):
    """Test question generation for consistency"""
    print(f"\n{'='*70}")
    print(f"Testing: {question_type} | Marks: {marks}")
    print('='*70)
    
    generator = GroqQuestionGenerator()
    all_issues = []
    
    for test_num in range(num_tests):
        print(f"\n--- Test {test_num + 1}/{num_tests} ---")
        
        result = generator.generate_questions(
            subject='Physics',
            topic='Motion',
            difficulty='Medium',
            count=2,
            question_type=question_type,
            marks=marks
        )
        
        print(f"Success: {result['success']}")
        print(f"Source: {result.get('source', 'unknown')}")
        
        if not result['success']:
            print(f"Error: {result.get('error')}")
            all_issues.append(f"Generation failed: {result.get('error')}")
            continue
        
        questions = result.get('questions', [])
        print(f"Generated: {len(questions)} questions")
        
        for q_idx, q in enumerate(questions):
            print(f"\n  Question {q_idx + 1}:")
            print(f"    Text: {q.get('text', 'MISSING')[:50]}...")
            print(f"    Type: {q.get('type', 'MISSING')}")
            print(f"    Marks: {q.get('marks', 'MISSING')}")
            print(f"    Options: {len(q.get('options', []))} items")
            print(f"    Answer: {q.get('answer', 'MISSING')}")
            
            # Validate structure
            errors = validate_question_structure(q, question_type)
            if errors:
                print(f"    ❌ VALIDATION ERRORS:")
                for error in errors:
                    print(f"       - {error}")
                all_issues.append(f"{question_type} - Q{q_idx+1}: {', '.join(errors)}")
            else:
                print(f"    ✅ Valid structure")
    
    return all_issues

def test_marks_handling():
    """Test marks format consistency"""
    print(f"\n{'='*70}")
    print("Testing: Marks Format Handling")
    print('='*70)
    
    generator = GroqQuestionGenerator()
    marks_formats = ['1', 1, '1M', '2M']
    issues = []
    
    for marks in marks_formats:
        print(f"\nTesting marks format: {repr(marks)} (type: {type(marks).__name__})")
        
        result = generator.generate_questions(
            subject='Chemistry',
            topic='Atoms',
            difficulty='Easy',
            count=1,
            question_type='MCQ',
            marks=marks
        )
        
        if result['success']:
            q = result['questions'][0]
            marks_value = q.get('marks')
            marks_type = type(marks_value).__name__
            print(f"  Returned marks: {repr(marks_value)} (type: {marks_type})")
            
            # Check if marks is consistent
            if not isinstance(marks_value, (int, str)):
                issues.append(f"Marks returned as {marks_type}: {marks_value}")
        else:
            print(f"  Error: {result.get('error')}")
            issues.append(f"Failed for marks={marks}: {result.get('error')}")
    
    return issues

def test_options_format():
    """Test if options are consistently formatted"""
    print(f"\n{'='*70}")
    print("Testing: Options Format Consistency")
    print('='*70)
    
    generator = GroqQuestionGenerator()
    issues = []
    
    result = generator.generate_questions(
        subject='Biology',
        topic='Photosynthesis',
        difficulty='Medium',
        count=5,
        question_type='MCQ',
        marks=1
    )
    
    if result['success']:
        for q_idx, q in enumerate(result['questions']):
            options = q.get('options', [])
            
            if not options:
                issues.append(f"Q{q_idx+1}: No options provided")
                continue
            
            # Check option structure
            for opt_idx, opt in enumerate(options):
                if isinstance(opt, dict):
                    if not opt.get('id') or not opt.get('text'):
                        issues.append(f"Q{q_idx+1} Opt{opt_idx+1}: Missing id or text in dict option")
                elif isinstance(opt, str):
                    issues.append(f"Q{q_idx+1} Opt{opt_idx+1}: Option is string, expected dict")
                else:
                    issues.append(f"Q{q_idx+1} Opt{opt_idx+1}: Invalid option type: {type(opt)}")
    
    return issues

def main():
    print("\n" + "="*70)
    print("GROQ AI - QUESTION PATTERN VALIDATION TEST SUITE")
    print("="*70)
    
    all_issues = []
    
    # Test different question types
    test_configs = [
        ('MCQ', '1'),
        ('MCQ', '2M'),
        ('One-word Answer', '1'),
        ('Short Answer', '2'),
        ('Long Answer', '5'),
        ('True/False', '1'),
    ]
    
    for q_type, marks in test_configs:
        issues = test_question_generation(q_type, marks, num_tests=2)
        all_issues.extend(issues)
    
    # Test marks handling
    issues = test_marks_handling()
    all_issues.extend(issues)
    
    # Test options format
    issues = test_options_format()
    all_issues.extend(issues)
    
    # Summary
    print(f"\n{'='*70}")
    print("SUMMARY")
    print('='*70)
    
    if all_issues:
        print(f"\n❌ Found {len(all_issues)} ISSUES:\n")
        for idx, issue in enumerate(all_issues, 1):
            print(f"{idx}. {issue}")
    else:
        print("\n✅ All tests passed! No pattern consistency issues found.")
    
    return len(all_issues) == 0

if __name__ == '__main__':
    success = main()
    exit(0 if success else 1)
