import requests
import json

print("\n" + "="*70)
print("CHECKING IF QUESTIONS ARE REAL GEMINI OR MOCK")
print("="*70)

# Test the microservice
endpoint = 'http://localhost:5000/api/generate-questions'
payload = {
    'subject': 'Physics',
    'topic': 'Motion',
    'difficulty': 'Easy',
    'count': 2,
    'question_type': 'MCQ'
}

print("\nTesting microservice...")
print(f"Subject: {payload['subject']}")
print(f"Topic: {payload['topic']}")
print(f"Difficulty: {payload['difficulty']}")

try:
    response = requests.post(endpoint, json=payload, timeout=60)
    data = response.json()
    
    print(f"\n✅ Response received!")
    print(f"Source: {data.get('source', 'unknown')}")
    
    if data.get('source') == 'gemini':
        print("🎉 REAL GEMINI API QUESTIONS!")
    elif data.get('source') == 'mock':
        print("⚠️  MOCK QUESTIONS (Fallback)")
        if data.get('warning'):
            print(f"Warning: {data['warning']}")
    
    print(f"\nQuestions count: {data.get('count')}")
    
    if data.get('questions'):
        print("\nFirst question sample:")
        q = data['questions'][0]
        print(f"Text: {q.get('text', 'N/A')[:100]}...")
        print(f"Options: {len(q.get('options', []))} options")
        print(f"Type: {q.get('type')} | Difficulty: {q.get('difficulty')}")
        
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "="*70)
