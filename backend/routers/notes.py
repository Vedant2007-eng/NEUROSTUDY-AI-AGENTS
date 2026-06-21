from fastapi import APIRouter, HTTPException
from bson import ObjectId
from datetime import datetime

from services.mongo_service import get_db
from agents.notes_agent import generate_notes
from models.notes_model import GenerateNotesRequest, GenerateNotesResponse

db = get_db()

router = APIRouter(prefix="/notes", tags=["Notes Agent"])


def serialize_doc(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


@router.post("/generate", response_model=GenerateNotesResponse)
async def generate_notes_endpoint(request: GenerateNotesRequest):

    # 1. Fetch document from MongoDB
    try:
        document = db["documents"].find_one({"_id": ObjectId(request.document_id)})
    except Exception:
        document = db["documents"].find_one({"_id": request.document_id})

    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")

    # 2. Get extracted PDF text
    pdf_text = document.get("text", "")
    if not pdf_text or len(pdf_text.strip()) < 50:
        raise HTTPException(status_code=422, detail="Document has no readable text.")

    document_name = document.get("filename", "Untitled")

    # 3. Check cache
    existing = db["notes"].find_one({
        "document_id": request.document_id,
        "user_id": request.user_id
    })
    if existing:
        return GenerateNotesResponse(
            success=True,
            notes_id=str(existing["_id"]),
            notes=existing["notes"],
            message="Notes loaded from cache."
        )

    # 4. Call Notes Agent
    result = await generate_notes(pdf_text, document_name)
    if not result["success"]:
        raise HTTPException(status_code=500, detail=f"Agent failed: {result.get('error')}")

    # 5. Save to MongoDB
    notes_doc = {
        "document_id": request.document_id,
        "document_name": document_name,
        "user_id": request.user_id,
        "notes": result["notes"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    insert_result = db["notes"].insert_one(notes_doc)

    return GenerateNotesResponse(
        success=True,
        notes_id=str(insert_result.inserted_id),
        notes=result["notes"],
        message="Notes generated successfully."
    )


@router.get("/document/{document_id}")
async def get_notes_by_document(document_id: str, user_id: str):
    notes = db["notes"].find_one({
        "document_id": document_id,
        "user_id": user_id
    })
    if not notes:
        raise HTTPException(status_code=404, detail="No notes found.")
    return serialize_doc(notes)


@router.get("/user/{user_id}")
async def get_all_user_notes(user_id: str):
    cursor = db["notes"].find({"user_id": user_id}).sort("created_at", -1)
    notes_list = []
    for note in cursor:
        notes_list.append(serialize_doc(note))
    return {"success": True, "count": len(notes_list), "notes": notes_list}


@router.delete("/{notes_id}")
async def delete_notes(notes_id: str, user_id: str):
    try:
        result = db["notes"].delete_one({
            "_id": ObjectId(notes_id),
            "user_id": user_id
        })
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid notes ID.")
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notes not found.")
    return {"success": True, "message": "Notes deleted."}