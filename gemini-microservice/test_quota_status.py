#!/usr/bin/env python3
"""Test if Gemini API quota is exceeded"""

from gemini_service import GeminiQuestionGenerator

print("=" * 70)
print("🧪 TESTING GEMINI API QUOTA STATUS")
print("=" * 70)

service = GeminiQuestionGenerator()
result = service.generate_questions('Physics', 'Newton Laws', 'Easy', 2)

source = result.get('source', 'unknown')

print(f"\n📡 API Source: {source.upper()}")
print()

if source == 'mock':
    print("⚠️  QUOTA EXCEEDED OR API ERROR!")
    print()
    print("What happened:")
    print("  → Your Gemini free tier quota has been exceeded or the API key is invalid")
    print("  → System is showing mock sample questions instead")
    print()
    print("Warning message:")
    print(f"  {result.get('warning', 'No warning message')}")
    print()
    print("=" * 70)
    print("💡 WHAT TO DO:")
    print("=" * 70)
    print("  Option 1 (Wait):")
    print("    ✅ Free quota resets periodically based on Google AI Studio limits")
    print("    ✅ Check Google AI Studio for your specific rate limits")
    print()
    print("  Option 2 (Switch Project/Key):")
    print("    ✅ Create a new project in Google AI Studio")
    print("    ✅ Update your GEMINI_API_KEY in gemini-microservice/.env")
    print()
    print("  Steps to verify:")
    print("    1. Go to: https://aistudio.google.com/app/apikey")
    print("    2. Verify your key in gemini-microservice/.env (GEMINI_API_KEY)")
    print("    3. Check if the model 'gemini-1.5-flash' is available for your region")
    print()
    print("=" * 70)
else:
    print("✅ GEMINI API IS WORKING!")
    print()
    print(f"  Successfully generated {result.get('count', 0)} questions")
    print("  No quota issues at the moment")
    print()

print("=" * 70)

