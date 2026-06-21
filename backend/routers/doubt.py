from fastapi import APIRouter, HTTPException
from bson import ObjectId
from datetime import datetime

from services.mongo_service import get_db
from agents.doubt_agent import answer_doubt
from models.doubt_model import AskDoubtRequest, AskDoubtResponse

db = get_db()

router = APIRouter(prefix="/doubt", tags=["Doubt Agent"])


def serialize_doc(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


@router.post("/ask", response_model=AskDoubtResponse)
async def ask_doubt(request: AskDoubtRequest):

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

    # 3. Get existing chat history
    chat_doc = db["chat_history"].find_one({
        "document_id": request.document_id,
        "user_id": request.user_id
    })
    chat_history = chat_doc["messages"] if chat_doc else []

    # 4. Call Doubt Agent
    result = await answer_doubt(
        question=request.question,
        document_text=pdf_text,
        document_name=document_name,
        chat_history=chat_history
    )

    if not result["success"]:
        raise HTTPException(status_code=500, detail=f"Agent failed: {result.get('error')}")

    # 5. Save message to chat history
    new_message = {
        "question": request.question,
        "answer": result["answer"],
        "timestamp": datetime.utcnow()
    }

    if chat_doc:
        db["chat_history"].update_one(
            {"_id": chat_doc["_id"]},
            {
                "$push": {"messages": new_message},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
    else:
        db["chat_history"].insert_one({
            "document_id": request.document_id,
            "document_name": document_name,
            "user_id": request.user_id,
            "messages": [new_message],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })

    return AskDoubtResponse(
        success=True,
        question=request.question,
        answer=result["answer"],
        message="Doubt answered successfully."
    )


@router.get("/history/{document_id}")
async def get_chat_history(document_id: str, user_id: str):
    chat_doc = db["chat_history"].find_one({
        "document_id": document_id,
        "user_id": user_id
    })
    if not chat_doc:
        return {"success": True, "messages": []}
    return {
        "success": True,
        "document_name": chat_doc.get("document_name", ""),
        "messages": chat_doc.get("messages", [])
    }


@router.delete("/history/{document_id}")
async def clear_chat_history(document_id: str, user_id: str):
    result = db["chat_history"].delete_one({
        "document_id": document_id,
        "user_id": user_id
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="No chat history found.")
    return {"success": True, "message": "Chat history cleared."}