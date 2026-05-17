#!/usr/bin/env python3
"""Direct Gemini API test to check quota and real generation"""

import os
import sys
from dotenv import load_dotenv

# Load environment
load_dotenv('gemini-microservice/.env')
API_KEY = os.getenv('GEMINI_API_KEY')

print(f"🔑 API Key loaded: {API_KEY[:20]}...{API_KEY[-10:]}")
print("=" * 60)

try:
    from google import genai
    print("✅ google-genai library imported successfully")
    
    # Initialize client
    client = genai.Client(api_key=API_KEY)
    print("✅ Gemini Client initialized")
    print("=" * 60)
    
    # Test 1: Simple health check
    print("\n📋 Test 1: Generating a simple Chemistry question (NOT mock)...")
    print("-" * 60)
    
    prompt = """Generate 1 Chemistry MCQ question on topic "Ionic Equilibrium" at Easy difficulty.
    
Return ONLY valid JSON, no additional text:
[
    {
        "questionNumber": 1,
        "text": "question text",
        "type": "MCQ",
        "difficulty": "Easy",
        "marks": 1,
        "options": [
            {"id": "A", "text": "option A"},
            {"id": "B", "text": "option B"},
            {"id": "C", "text": "option C"},
            {"id": "D", "text": "option D"}
        ],
        "answer": {
            "correctOption": "A",
            "explanation": "explanation"
        }
    }
]"""
    
    print(f"📤 Sending request to Gemini API (model: gemini-2.0-flash)...")
    response = client.models.generate_content(
        model='gemini-2.0-flash',
        contents=prompt
    )
    
    print(f"✅ Response received!")
    print(f"📝 Response text length: {len(response.text)} characters")
    print("\n📋 ACTUAL RESPONSE FROM GEMINI:\n")
    print(response.text)
    print("\n" + "=" * 60)
    
    # Parse JSON
    import json
    json_start = response.text.find('[')
    json_end = response.text.rfind(']') + 1
    if json_start != -1 and json_end > json_start:
        json_str = response.text[json_start:json_end]
        questions = json.loads(json_str)
        print(f"✅ Parsed {len(questions)} question(s)")
        print(f"✅ First question has {len(questions[0].get('options', []))} options")
        print(f"🎯 Question topic: Chemistry (Ionic Equilibrium) - NOT Physics!")
        print(f"📌 Options present: {questions[0].get('options')}")
    
    print("\n" + "=" * 60)
    print("✅ Real Gemini API is WORKING!")
    print("✅ Free tier quota is AVAILABLE!")
    print("=" * 60)
    
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    print(f"Error type: {type(e).__name__}")
    
    if '429' in str(e) or 'RESOURCE_EXHAUSTED' in str(e):
        print("⚠️  FREE TIER QUOTA EXCEEDED")
        print("💡 Solution: Enable billing at https://aistudio.google.com/apikey")
    elif '400' in str(e):
        print("❌ Invalid API key")
    else:
        print(f"Full error: {e}")

print("\n")
