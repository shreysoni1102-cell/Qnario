import os
import sys
from dotenv import load_dotenv

# Reconfigure stdout/stderr encoding on Windows to prevent UnicodeEncodeError with emojis
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

# Initialize dot env mappings
load_dotenv()

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
GROQ_API_KEY = os.getenv('GROQ_API_KEY')

PYTHON_PORT = int(os.getenv('PYTHON_PORT', 5000))
NODE_SERVER_URL = os.getenv('NODE_SERVER_URL', 'http://server:3000')
DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'

# Validate loaded state
if GEMINI_API_KEY:
    print(f"📡 [AI Microservice] Gemini API Key loaded successfully (Prefix: {GEMINI_API_KEY[:6]}...)")
else:
    print("⚠️ [AI Microservice] GEMINI_API_KEY not found in environment!")

if GROQ_API_KEY:
    print(f"📡 [AI Microservice] Groq API Key loaded successfully (Prefix: {GROQ_API_KEY[:6]}...)")
else:
    print("⚠️ [AI Microservice] GROQ_API_KEY not found in environment!")
