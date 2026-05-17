#!/usr/bin/env python3
"""
Complete Integration Test - Testing Question Generation End-to-End
Tests both Node.js API and Python microservice
"""

import requests
import json

print("\n" + "="*80)
print("COMPLETE END-TO-END INTEGRATION TEST")
print("="*80 + "\n")

# Test 1: Direct Node.js API
print("TEST 1: Node.js Express API (Port 3000)")
print("-" * 80)

try:
    url = "http://localhost:3000/api/generate-questions"
    payload = {
        "topic": "Ionic Bonding",
        "numQuestions": 3,
        "examId": "test-exam-001",
        "subjectName": "Chemistry",
        "difficulty": "Medium",
        "questionType": "MCQ"
    }
    
    print(f"📤 Calling: {url}")
    print(f"📋 Payload: {json.dumps(payload, indent=2)}\n")
    
    response = requests.post(url, json=payload, timeout=30)
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            print(f"✅ SUCCESS!")
            print(f"   Generated Questions: {data.get('questionsCount')}")
            print(f"   Source: {data.get('message')}")
            
            if data.get('questions') and len(data['questions']) > 0:
                q = data['questions'][0]
                print(f"\n📝 First Question Sample:")
                print(f"   Text: {q.get('text', 'N/A')[:80]}...")
                print(f"   Subject: {q.get('subjectName')}")
                print(f"   Difficulty: {q.get('difficulty')}")
                print(f"   Topic: {q.get('topicName')}")
                print(f"   Type: {q.get('type')}")
                print(f"   Options: {len(q.get('options', []))} options")
                
                ans = q.get('answer', {})
                if isinstance(ans, dict):
                    print(f"   Answer: {ans.get('correctOption', 'N/A')}")
                    print(f"   Explanation: {ans.get('explanation', 'N/A')[:60]}...")
        else:
            print(f"❌ API returned error: {data.get('error')}")
            print(f"   Details: {data.get('details', 'N/A')}")
    else:
        print(f"❌ HTTP Status {response.status_code}")
        print(f"   Response: {response.text[:200]}")
        
except requests.exceptions.ConnectionError:
    print("❌ Cannot connect to Node.js server (port 3000)")
    print("   Start server: cd qnario && npm start")
except Exception as e:
    print(f"❌ Error: {str(e)}")

print("\n" + "="*80)
print("TEST 2: Python Microservice API (Port 5000)")
print("-" * 80)

try:
    url = "http://localhost:5000/api/generate-questions"
    payload = {
        "subject": "Chemistry",
        "topic": "Ionic Bonding",
        "difficulty": "Medium",
        "count": 3,
        "question_type": "MCQ"
    }
    
    print(f"📤 Calling: {url}")
    print(f"📋 Payload: {json.dumps(payload, indent=2)}\n")
    
    response = requests.post(url, json=payload, timeout=30)
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            print(f"✅ SUCCESS!")
            print(f"   Generated Questions: {data.get('count')}")
            print(f"   Source: {data.get('source')}")
            
            if data.get('warning'):
                print(f"   ⚠️  {data.get('warning')}")
            
            if data.get('questions') and len(data['questions']) > 0:
                q = data['questions'][0]
                print(f"\n📝 First Question Sample:")
                print(f"   Text: {q.get('text', 'N/A')[:80]}...")
                print(f"   Difficulty: {q.get('difficulty')}")
                print(f"   Type: {q.get('type')}")
                print(f"   Options: {len(q.get('options', []))} options")
                
                ans = q.get('answer', {})
                if isinstance(ans, dict):
                    print(f"   Answer: {ans.get('correctOption', 'N/A')}")
                    print(f"   Explanation: {ans.get('explanation', 'N/A')[:60]}...")
        else:
            print(f"❌ API returned error: {data.get('error')}")
            print(f"   Details: {data.get('details', 'N/A')}")
    else:
        print(f"❌ HTTP Status {response.status_code}")
        print(f"   Response: {response.text[:200]}")
        
except requests.exceptions.ConnectionError:
    print("❌ Cannot connect to Microservice (port 5000)")
    print("   Start microservice: cd gemini-microservice && python app.py")
except Exception as e:
    print(f"❌ Error: {str(e)}")

print("\n" + "="*80)
print("INTEGRATION TEST SUMMARY")
print("="*80)
print("\n✅ If both tests passed:")
print("   - Question generation is fully operational")
print("   - Both APIs are working correctly")
print("   - System is ready for production")
print("\n⚠️  If tests show mock data:")
print("   - API quota exhausted (expected)")
print("   - Fallback system is working")
print("   - Enable billing to use real API")
print("\n❌ If tests failed:")
print("   - Check if services are running")
print("   - Check firewall/network settings")
print("   - Run: python diagnostic_complete.py")

print("\n" + "="*80 + "\n")
