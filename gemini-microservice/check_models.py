import os
import requests
from dotenv import load_dotenv

load_dotenv()
key = os.getenv('GROQ_API_KEY')

test_models = ["mixtral-8x7b-32768", "llama2-70b-4096"]

for model_name in test_models:
    print(f"🔍 Checking {model_name}...")
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    payload = {
        "model": model_name,
        "messages": [{"role": "user", "content": "Say 'Hello'"}],
        "max_tokens": 10
    }
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        if response.status_code == 200:
            print(f"✅ SUCCESS! {model_name} is active.")
            print(f"Result: {response.json()['choices'][0]['message']['content']}")
            break
        else:
            print(f"❌ {model_name} failed: {response.text}")
    except Exception as e:
        print(f"❌ {model_name} failed: {e}")
