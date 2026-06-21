import re
import json
from services.gemini_service import call_gemini


async def generate_planner(
    document_text: str,
    document_name: str,
    study_days: int = 7
) -> dict:

    prompt = f"""You are NeuroStudy AI's Planner Agent — an expert study planner.
You are analyzing a study document titled: "{document_name}"

Here is the document content:
---
{document_text[:6000]}
---

Create a {study_days}-day study plan for this document.

Return ONLY this JSON, no extra text:
{{
  "plan_title": "Study Plan for {document_name}",
  "total_days": {study_days},
  "total_hours": "X hours",
  "difficulty_level": "Beginner | Intermediate | Advanced",
  "days": [
    {{
      "day": 1,
      "title": "Introduction & Basics",
      "topics": [
        {{
          "topic": "Topic name",
          "duration": "30 minutes",
          "priority": "High | Medium | Low",
          "study_tip": "A specific tip for studying this topic"
        }}
      ],
      "daily_goal": "What the student should achieve today",
      "total_time": "X hours Y minutes"
    }}
  ]
}}

Rules:
- Create exactly {study_days} days
- Each day should have 2-4 topics
- Distribute topics evenly and logically across days
- Start with basics and progress to advanced topics
- priority must be High, Medium or Low
- study_tip must be specific and actionable
- daily_goal must be clear and achievable
- Return ONLY the JSON object, no extra text"""

    raw = ""
    try:
        raw = call_gemini(prompt)

        if not raw or len(raw.strip()) == 0:
            return {
                "success": False,
                "error": "AI returned empty response. Try fewer study days.",
                "planner": None,
            }

        cleaned = raw.strip()
        cleaned = re.sub(r"^```json\s*", "", cleaned)
        cleaned = re.sub(r"^```\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
        cleaned = cleaned.strip()

        try:
            planner_data = json.loads(cleaned)
        except json.JSONDecodeError as je:
            # Surface exactly what the model sent back instead of a bare
            # "Expecting value" error with no context.
            preview = cleaned[:500]
            return {
                "success": False,
                "error": f"Model did not return valid JSON ({je}). "
                         f"First 500 chars of raw response: {preview!r}",
                "planner": None,
            }

        return {"success": True, "planner": planner_data}

    except Exception as e:
        return {"success": False, "error": str(e), "planner": None}