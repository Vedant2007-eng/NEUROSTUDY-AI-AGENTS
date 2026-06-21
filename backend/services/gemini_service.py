import os
import requests
from dotenv import load_dotenv

load_dotenv()

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_KEY = os.getenv("GROQ_API_KEY")


def call_gemini(prompt: str) -> str:
    if not GROQ_KEY:
        raise RuntimeError(
            "GROQ_API_KEY is not set. Check your .env file and that "
            "load_dotenv() is finding it (run uvicorn from the backend folder)."
        )

    headers = {
        "Authorization": f"Bearer {GROQ_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7
    }

    response = requests.post(GROQ_URL, headers=headers, json=payload, timeout=60)
    data = response.json()

    if response.status_code != 200:
        # Groq error payloads look like: {"error": {"message": "...", "type": "..."}}
        err = data.get("error", {})
        message = err.get("message", str(data))
        err_type = err.get("type", "unknown_error")
        raise RuntimeError(
            f"Groq API error ({response.status_code}, {err_type}): {message}"
        )

    if "choices" not in data or not data["choices"]:
        raise RuntimeError(f"Groq API returned no choices. Full response: {data}")

    return data["choices"][0]["message"]["content"]