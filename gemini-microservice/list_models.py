
import requests
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('GEMINI_API_KEY')
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"

print(f"Listing available models...")
try:
    response = requests.get(url, timeout=30)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        models = response.json().get('models', [])
        for m in models:
            print(f"- {m['name']} (Methods: {m['supportedGenerationMethods']})")
    else:
        print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {str(e)}")
