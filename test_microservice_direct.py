import requests
import json

# Test the microservice directly
endpoint = 'http://localhost:5000/api/generate-questions'
payload = {
    'subject': 'Mathematics',
    'topic': 'Algebra',
    'difficulty': 'Easy',
    'count': 2,
    'question_type': 'MCQ'
}

print("Testing microservice endpoint:", endpoint)
print("Payload:", json.dumps(payload, indent=2))

try:
    response = requests.post(endpoint, json=payload, timeout=60)
    data = response.json()
    print(f"Status: {response.status_code}")
    print(f"Response keys: {list(data.keys())}")
    print(f"Count field: {data.get('count')}")
    print(f"Questions length: {len(data.get('questions', []))}")
    print("\nFull response sample:")
    print(json.dumps(data, indent=2)[:1500])
except Exception as e:
    print(f"Error: {e}")
