from fastapi import APIRouter, HTTPException
from bson import ObjectId
from datetime import datetime

from services.mongo_service import get_db
from agents.quiz_agent import generate_quiz
from models.quiz_model import GenerateQuizRequest, GenerateQuizResponse

db = get_db()

router = APIRouter(prefix="/quiz", tags=["Quiz Agent"])


def serialize_doc(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


@router.post("/generate", response_model=GenerateQuizResponse)
async def generate_quiz_endpoint(request: GenerateQuizRequest):

    # 1. Fetch document from MongoDB
    try:
        document = db["documents"].find_one({"_id": ObjectId(request.document_id)})
    except Exception:
        document = db["documents"].find_one({"_id": request.document_id})

    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")

    # 2. Get PDF text
    pdf_text = document.get("text", "")
    if not pdf_text or len(pdf_text.strip()) < 50:
        raise HTTPException(status_code=422, detail="Document has no readable text.")

    document_name = document.get("filename", "Untitled")

    # 3. Check cache
    existing = db["quizzes"].find_one({
        "document_id": request.document_id,
        "user_id": request.user_id
    })
    if existing:
        return GenerateQuizResponse(
            success=True,
            quiz_id=str(existing["_id"]),
            quiz=existing["quiz"],
            message="Quiz loaded from cache."
        )

    # 4. Call Quiz Agent
    result = await generate_quiz(pdf_text, document_name, request.num_questions)
    if not result["success"]:
        raise HTTPException(status_code=500, detail=f"Agent failed: {result.get('error')}")

    # 5. Save to MongoDB
    quiz_doc = {
        "document_id": request.document_id,
        "document_name": document_name,
        "user_id": request.user_id,
        "quiz": result["quiz"],
        "created_at": datetime.utcnow()
    }
    insert_result = db["quizzes"].insert_one(quiz_doc)

    return GenerateQuizResponse(
        success=True,
        quiz_id=str(insert_result.inserted_id),
        quiz=result["quiz"],
        message="Quiz generated successfully."
    )


@router.get("/document/{document_id}")
async def get_quiz_by_document(document_id: str, user_id: str):
    quiz = db["quizzes"].find_one({
        "document_id": document_id,
        "user_id": user_id
    })
    if not quiz:
        raise HTTPException(status_code=404, detail="No quiz found.")
    return serialize_doc(quiz)


@router.get("/user/{user_id}")
async def get_all_user_quizzes(user_id: str):
    cursor = db["quizzes"].find({"user_id": user_id}).sort("created_at", -1)
    quiz_list = []
    for quiz in cursor:
        quiz_list.append(serialize_doc(quiz))
    return {"success": True, "count": len(quiz_list), "quizzes": quiz_list}


@router.delete("/{quiz_id}")
async def delete_quiz(quiz_id: str, user_id: str):
    try:
        result = db["quizzes"].delete_one({
            "_id": ObjectId(quiz_id),
            "user_id": user_id
        })
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid quiz ID.")
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Quiz not found.")
    return {"success": True, "message": "Quiz deleted."}