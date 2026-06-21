from services.gemini_service import call_gemini


async def answer_doubt(
    question: str,
    document_text: str,
    document_name: str,
    chat_history: list = []
) -> dict:

    # Build conversation context from history
    history_context = ""
    if chat_history:
        history_context = "\n\nPrevious conversation:\n"
        for msg in chat_history[-6:]:  # last 3 exchanges
            history_context += f"Student: {msg['question']}\n"
            history_context += f"Assistant: {msg['answer']}\n"

    prompt = f"""You are NeuroStudy AI's Doubt Agent — a helpful academic tutor.
You are helping a student understand the document titled: "{document_name}"

Here is the document content:
---
{document_text[:10000]}
---
{history_context}

The student asks: "{question}"

Rules:
- Answer ONLY based on the document content above
- If the question is not related to the document, politely say so
- Give clear, student-friendly explanations
- Use examples from the document when possible
- Keep answers concise but complete (3-5 sentences max)
- If you're unsure, say so honestly

Answer:"""

    try:
        answer = call_gemini(prompt)
        return {
            "success": True,
            "answer": answer.strip(),
            "question": question
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "answer": None
        }