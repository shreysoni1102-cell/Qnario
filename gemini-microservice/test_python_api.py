import requests
import os
from dotenv import load_dotenv

load_dotenv()
key = os.getenv('GROQ_API_KEY')

print(f"Testing Groq API via Requests... Key: {key[:10]}...")

url = "https://api.groq.com/openai/v1/chat/completions"
payload = {
    "model": "llama-3.1-8b-instant",
    "messages": [{"role": "user", "content": "Say 'Python API is working' if you can read this."}]
}

try:
    response = requests.post(
        url,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        json=payload,
        timeout=10
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("Response:", response.json()['choices'][0]['message']['content'])
    else:
        print("Error Data:", response.text)
except Exception as e:
    print(f"FAILED: {e}")
