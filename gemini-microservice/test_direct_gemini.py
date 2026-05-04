#!/usr/bin/env python3
"""
Direct Gemini API Test - Check API key and basic completion
"""
import os
import requests
from dotenv import load_dotenv

load_dotenv()
key = os.getenv('GEMINI_API_KEY')

print("="*70)
print("DIRECT GEMINI API TEST - Verify Key and Completion")
print("="*70)

print("\n1. Checking API Key...")
if not key:
    print("   ❌ ERROR: GEMINI_API_KEY not found in environment!")
    exit(1)
print(f"   API Key: {key[:15]}...{key[-5:]}")

print("\n2. Sending test prompt to Gemini API...")
model = "gemini-1.5-flash"
url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
headers = {"Content-Type": "application/json"}
payload = {
    "contents": [{"parts": [{"text": "Say 'Gemini API is working' if you can read this."}]}],
    "generationConfig": {
        "maxOutputTokens": 50
    }
}
try:
    response = requests.post(url, headers=headers, json=payload, timeout=20)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        content = data['candidates'][0]['content']['parts'][0]['text']
        print("Response:", content.strip())
    else:
        print("Error Data:", response.text)
except Exception as e:
    print(f"FAILED: {e}")

