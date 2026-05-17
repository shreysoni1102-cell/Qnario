import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
if GEMINI_API_KEY:
	print(f"DEBUG: GEMINI API Key loaded: {GEMINI_API_KEY[:10]}...")
if GROQ_API_KEY:
	print(f"DEBUG: GROQ API Key loaded: {GROQ_API_KEY[:10]}...")
else:
	print("DEBUG: GEMINI API Key NOT found!")

PYTHON_PORT = int(os.getenv('PYTHON_PORT', 5000))
NODE_SERVER_URL = os.getenv('NODE_SERVER_URL', 'http://localhost:3000')
DEBUG = True