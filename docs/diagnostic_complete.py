#!/usr/bin/env python3
"""
COMPLETE DIAGNOSTIC TOOL FOR QNARIO AI QUESTION GENERATION
Tests all generation paths and provides detailed diagnostics
"""

import requests
import json
import sys
from colorama import Fore, Back, Style, init

init(autoreset=True)

def print_header(title):
    print(f"\n{Back.CYAN}{Fore.BLACK} {title} {Style.RESET_ALL}\n")
    print("=" * 80)

def print_success(msg):
    print(f"{Fore.GREEN}✅ {msg}{Style.RESET_ALL}")

def print_error(msg):
    print(f"{Fore.RED}❌ {msg}{Style.RESET_ALL}")

def print_warn(msg):
    print(f"{Fore.YELLOW}⚠️  {msg}{Style.RESET_ALL}")

def print_info(msg):
    print(f"{Fore.CYAN}ℹ️  {msg}{Style.RESET_ALL}")

print_header("QNARIO AI QUESTION GENERATION DIAGNOSTIC TOOL")
print("Checking all question generation paths...\n")

# ============================================================================
# TEST 1: Direct Gemini API (Python library)
# ============================================================================
print_header("TEST 1: Direct Gemini API (google-genai library)")

try:
    from google import genai
    print_success("google-genai library imported")
    
    from gemini_microservice.config import GEMINI_API_KEY
    client = genai.Client(api_key=GEMINI_API_KEY)
    print_success("Gemini Client initialized")
    
    print_info("Testing gemini-1.5-flash model...")
    response = client.models.generate_content(
        model='gemini-1.5-flash',
        contents="Generate 1 quick Physics MCQ on 'Motion'.\nReturn only valid JSON."
    )
    print_success(f"Direct API works! Response: {len(response.text)} chars")
    
except Exception as e:
    error_msg = str(e)
    if "RESOURCE_EXHAUSTED" in error_msg or "429" in error_msg:
        print_error("Direct API - QUOTA EXHAUSTED (429)")
        print_warn("Solution: Enable billing at https://aistudio.google.com/apikey")
    elif "not found" in error_msg.lower():
        print_error("Direct API - Model not found or API error")
        print_info(f"Error: {error_msg[:100]}...")
    else:
        print_error(f"Direct API failed: {error_msg[:80]}...")

# ============================================================================
# TEST 2: Microservice (Flask on port 5000)
# ============================================================================
print_header("TEST 2: Microservice (Flask on port 5000)")

try:
    MICROSERVICE_URL = "http://localhost:5000/api/generate-questions"
    
    payload = {
        'subject': 'Physics',
        'topic': 'Motion', 
        'difficulty': 'Easy',
        'count': 2,
        'question_type': 'MCQ'
    }
    
    print_info(f"Calling {MICROSERVICE_URL}...")
    response = requests.post(MICROSERVICE_URL, json=payload, timeout=30)
    
    if response.status_code == 200:
        data = response.json()
        
        if data.get('success'):
            print_success(f"Microservice generated {data.get('count')} questions")
            print_info(f"Source: {data.get('source', 'unknown')}")
            
            if data.get('questions') and len(data['questions']) > 0:
                q = data['questions'][0]
                print_info(f"Sample: '{q.get('text', 'N/A')[:60]}...'")
        else:
            error = data.get('error', 'Unknown error')
            print_error(f"Microservice error: {error[:80]}...")
            
            if 'quota' in error.lower() or '429' in error:
                print_warn("Quota exhausted - enable billing")
            elif 'not found' in error.lower():
                print_warn("Model not found - API endpoint issue")
    else:
        print_error(f"Microservice returned status {response.status_code}")
        print_info(f"Response: {response.text[:100]}...")
        
except requests.exceptions.ConnectionError:
    print_error("Cannot connect to microservice (port 5000)")
    print_info("Start microservice: cd gemini-microservice && python app.py")
except Exception as e:
    print_error(f"Microservice test failed: {str(e)[:80]}...")

# ============================================================================
# TEST 3: Mock Data Fallback
# ============================================================================
print_header("TEST 3: Mock Data (Fallback)")

try:
    MOCK_URL = "http://localhost:5000/api/generate-questions-with-mock"
    
    payload = {
        'subject': 'Physics',
        'topic': 'Motion',
        'difficulty': 'Easy',
        'count': 2,
        'question_type': 'MCQ'
    }
    
    print_info(f"Testing mock fallback endpoint...")
    response = requests.post(MOCK_URL, json=payload, timeout=30)
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            print_success(f"Mock data works - {data.get('count')} questions generated")
            print_info(f"Source: {data.get('source', 'mock')}")
        else:
            print_warn("Mock endpoint not returning success")
    else:
        print_warn("Mock endpoint not available (need implementation)")
        
except requests.exceptions.ConnectionError:
    print_warn("Microservice not running")
except Exception as e:
    print_warn(f"Mock fallback not fully implemented: {str(e)[:60]}...")

# ============================================================================
# SUMMARY & RECOMMENDATIONS
# ============================================================================
print_header("DIAGNOSTIC SUMMARY & ACTION ITEMS")

print_info("Current Status:")
print("1. Direct Gemini API: " + ("❌ QUOTA EXHAUSTED" if "QUOTA" in error_msg or "429" in str(error_msg) else "⚠️  Check above"))
print("2. Microservice Status: Check above")  
print("3. Mock Fallback: Needs full implementation")

print_info("\n" + "=" * 80)
print_info("RECOMMENDED ACTIONS:\n")

print(f"{Fore.CYAN}═ IMMEDIATE (Required to generate real questions):{Style.RESET_ALL}")
print("1. Go to: https://aistudio.google.com/apikey")
print("2. Create a new API Key (or use existing)")
print("3. In Google Cloud Console, link a billing account")
print("4. Update .env files with the new key if different")
print("5. Re-run this diagnostic\n")

print(f"{Fore.GREEN}═ OPTIONAL (If billing not ready):{Style.RESET_ALL}")
print("6. Implement mock data fallback in microservice")
print("7. Use for UI testing while billing setup completes\n")

print(f"{Fore.MAGENTA}═ VERIFICATION:{Style.RESET_ALL}")
print("After billing enabled, run: python check_real_or_mock.py")
print("Expected: 'Source: gemini-1.5-flash' or similar\n")

print_header("END OF DIAGNOSTIC")
