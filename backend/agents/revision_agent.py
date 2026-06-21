import re
import json
from services.gemini_service import call_gemini


async def generate_revision(
    document_text: str,
    document_name: str,
    weak_topics: list = []
) -> dict:

    weak_topics_str = ""
    if weak_topics:
        weak_topics_str = f"\nThe student struggled with these topics: {', '.join(weak_topics)}"
    else:
        weak_topics_str = "\nNo specific weak topics provided — identify the most commonly difficult topics from the document."

    prompt = f"""You are NeuroStudy AI's Revision Agent — an expert at identifying weak areas and creating focused revision plans.
You are analyzing a study document titled: "{document_name}"

Here is the document content:
---
{document_text[:6000]}
---
{weak_topics_str}

Create a focused revision plan.

Return ONLY this JSON, no extra text:
{{
  "revision_title": "Revision Plan for {document_name}",
  "total_topics": 5,
  "estimated_time": "X hours",
  "weak_topics": [
    {{
      "topic": "Topic name",
      "reason": "Why this topic is commonly difficult",
      "priority": "High | Medium | Low",
      "revision_time": "30 minutes",
      "key_points": [
        "Key point to remember 1",
        "Key point to remember 2"
      ],
      "practice_questions": [
        "Practice question 1?",
        "Practice question 2?"
      ],
      "revision_tip": "Specific tip to master this topic"
    }}
  ],
  "revision_schedule": [
    {{
      "session": 1,
      "topic": "Topic name",
      "duration": "30 minutes",
      "activity": "What to do in this session"
    }}
  ],
  "general_tips": [
    "General study tip 1",
    "General study tip 2"
  ]
}}

Rules:
- Identify exactly 5 weak/difficult topics from the document
- Each topic must have 2-3 key_points and 2 practice_questions
- revision_schedule should have one session per topic
- general_tips should have 3-5 tips
- Return ONLY the JSON object, no extra text"""

    raw = ""
    try:
        raw = call_gemini(prompt)

        if not raw or len(raw.strip()) == 0:
            return {
                "success": False,
                "error": "AI returned empty response. Try again or use a shorter document.",
                "revision": None,
            }

        cleaned = raw.strip()
        cleaned = re.sub(r"^```json\s*", "", cleaned)
        cleaned = re.sub(r"^```\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
        cleaned = cleaned.strip()

        try:
            revision_data = json.loads(cleaned)
        except json.JSONDecodeError as je:
            # Surface exactly what the model sent back instead of a bare
            # "Expecting value" error with no context.
            preview = cleaned[:500]
            return {
                "success": False,
                "error": f"Model did not return valid JSON ({je}). "
                         f"First 500 chars of raw response: {preview!r}",
                "revision": None,
            }

        return {"success": True, "revision": revision_data}

    except Exception as e:
        return {"success": False, "error": str(e), "revision": None}