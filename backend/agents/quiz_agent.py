import re
import json
from services.gemini_service import call_gemini


async def generate_quiz(document_text: str, document_name: str, num_questions: int = 10) -> dict:

    prompt = f"""You are analyzing a study document titled: "{document_name}"

Here is the extracted text:
---
{document_text[:12000]}
---

Generate {num_questions} multiple choice questions based on this content.

Return ONLY this JSON, no extra text:
{{
  "quiz_title": "Quiz on {document_name}",
  "total_questions": {num_questions},
  "questions": [
    {{
      "question_number": 1,
      "question": "The question text here?",
      "options": {{
        "A": "First option",
        "B": "Second option",
        "C": "Third option",
        "D": "Fourth option"
      }},
      "correct_answer": "A",
      "explanation": "Why this answer is correct",
      "difficulty": "Easy | Medium | Hard"
    }}
  ]
}}

Rules:
- Generate exactly {num_questions} questions
- Each question must have exactly 4 options (A, B, C, D)
- correct_answer must be exactly one of: A, B, C, D
- Mix difficulty: 40% Easy, 40% Medium, 20% Hard
- explanations must be clear and educational
- Questions must be based strictly on the document content
- Return ONLY the JSON object, no extra text"""

    raw = ""
    try:
        raw = call_gemini(prompt)

        if not raw or not raw.strip():
            return {
                "success": False,
                "error": "Groq returned an empty response. This usually means the "
                         "request was truncated, rate-limited, or the prompt/document "
                         "was too long. Try fewer questions or a shorter document.",
                "quiz": None,
            }

        cleaned = raw.strip()
        cleaned = re.sub(r"^```json\s*", "", cleaned)
        cleaned = re.sub(r"^```\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
        cleaned = cleaned.strip()

        try:
            quiz_data = json.loads(cleaned)
        except json.JSONDecodeError as je:
            # Surface exactly what the model sent back so the real problem is visible,
            # instead of a bare "Expecting value" with no context.
            preview = cleaned[:500]
            return {
                "success": False,
                "error": f"Model did not return valid JSON ({je}). "
                         f"First 500 chars of raw response: {preview!r}",
                "quiz": None,
            }

        return {"success": True, "quiz": quiz_data}

    except Exception as e:
        return {"success": False, "error": str(e), "quiz": None}