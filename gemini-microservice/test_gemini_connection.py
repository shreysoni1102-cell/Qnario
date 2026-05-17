
import requests
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('GEMINI_API_KEY')
model = "gemini-1.5-flash"
url = f"https://generativelanguage.googleapis.com/v1/models/{model}:generateContent?key={api_key}"

payload = {
    "contents": [{"parts": [{"text": "Say hello"}]}]
}
headers = {"Content-Type": "application/json"}

print(f"Testing Gemini API with model {model}...")
try:
    response = requests.post(url, headers=headers, json=payload, timeout=30)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {str(e)}")
