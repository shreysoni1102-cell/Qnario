import requests
import json

# Test Gemini Microservice
print("="*60)
print("TESTING GEMINI MICROSERVICE")
print("="*60)

# 1. Test Health Endpoint
print("\n1. Testing Health Endpoint...")
try:
    response = requests.get("http://localhost:5000/health")
    print(f"   Status Code: {response.status_code}")
    print(f"   Response: {json.dumps(response.json(), indent=2)}")
    print("   ✅ Health check PASSED")
except Exception as e:
    print(f"   ❌ Error: {e}")

# 2. Test Question Generation
print("\n2. Testing Question Generation API...")
test_payload = {
    "subject": "Physics",
    "topic": "Newton's Laws",
    "difficulty": "Easy",
    "count": 2,
    "question_type": "MCQ"
}

try:
    print(f"   Sending request: {json.dumps(test_payload, indent=2)}")
    response = requests.post(
        "http://localhost:5000/api/generate-questions",
        json=test_payload,
        timeout=60
    )
    print(f"\n   Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"   Response: {json.dumps(data, indent=2)}")
        
        if data.get('success'):
            print("   ✅ Question Generation PASSED")
            print(f"   Generated {len(data.get('questions', []))} questions")
        else:
            print(f"   ⚠️  Error in response: {data.get('error')}")
    else:
        print(f"   ❌ Failed with status {response.status_code}")
        print(f"   Response: {response.text}")
        
except requests.exceptions.Timeout:
    print("   ❌ Request timed out - Gemini API may be returning error or slow")
except Exception as e:
    print(f"   ❌ Error: {e}")

print("\n" + "="*60)
print("TEST COMPLETE")
print("="*60)
