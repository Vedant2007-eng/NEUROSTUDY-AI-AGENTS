import re
import json
from services.gemini_service import call_gemini


async def generate_notes(document_text: str, document_name: str) -> dict:

    prompt = f"""You are analyzing a study document titled: "{document_name}"

Here is the extracted text:
---
{document_text[:12000]}
---

Return ONLY this JSON, no extra text:
{{
  "summary": "3-5 sentence overview",
  "key_points": ["point 1", "point 2"],
  "important_terms": [{{"term": "...", "definition": "..."}}],
  "quick_revision": ["fact 1", "fact 2"],
  "difficulty_level": "Beginner | Intermediate | Advanced",
  "estimated_read_time": "X minutes",
  "topic_tags": ["tag1", "tag2"]
}}

Rules: 5-10 key_points, 5-10 important_terms, 5-8 quick_revision facts."""

    raw = ""
    try:
        raw = call_gemini(prompt)

        if not raw or len(raw.strip()) == 0:
            return {
                "success": False,
                "error": "AI returned empty response. Try again or use a shorter document.",
                "notes": None,
            }

        cleaned = raw.strip()
        cleaned = re.sub(r"^```json\s*", "", cleaned)
        cleaned = re.sub(r"^```\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
        cleaned = cleaned.strip()

        try:
            notes_data = json.loads(cleaned)
        except json.JSONDecodeError as je:
            preview = cleaned[:500]
            return {
                "success": False,
                "error": f"Model did not return valid JSON ({je}). "
                         f"First 500 chars of raw response: {preview!r}",
                "notes": None,
            }

        return {"success": True, "notes": notes_data}

    except Exception as e:
        return {"success": False, "error": str(e), "notes": None}