import requests
import json

print("\n" + "="*70)
print("FULL SYSTEM TEST: Node.js Backend -> Gemini Microservice")
print("="*70)

# Test the exam API endpoint that should call Gemini
payload = {
    'topic': 'Algebra',
    'numQuestions': 2,
    'subjectId': '507f1f77bcf86cd799439011',  # Dummy MongoDB ID
    'examId': '507f1f77bcf86cd799439012',    # Dummy MongoDB ID
    'subjectName': 'Mathematics',
    'difficulty': 'Easy'
}

print("\nTesting: POST http://localhost:3000/api/generate-questions")
print("Payload:", json.dumps(payload, indent=2))

try:
    response = requests.post(
        'http://localhost:3000/api/generate-questions',
        json=payload,
        timeout=60
    )
    
    print(f"\nStatus Code: {response.status_code}")
    
    if response.status_code in [200, 201]:
        data = response.json()
        print("\n✅ RESPONSE RECEIVED:")
        print(json.dumps(data, indent=2)[:800])
        
        if 'questions' in data:
            print(f"\n✅ Questions generated: {len(data.get('questions', []))}")
        if 'warning' in data:
            print(f"\n⚠️  Warning: {data['warning']}")
    else:
        print(f"\nStatus: {response.status_code}")
        print("Response:", response.text[:200])
        
except Exception as e:
    print(f"\n❌ Error: {e}")

print("\n" + "="*70)
