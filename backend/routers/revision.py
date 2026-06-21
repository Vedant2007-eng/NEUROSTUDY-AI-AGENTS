from fastapi import APIRouter, HTTPException
from bson import ObjectId
from datetime import datetime

from services.mongo_service import get_db
from agents.revision_agent import generate_revision
from models.revision_model import GenerateRevisionRequest, GenerateRevisionResponse

db = get_db()

router = APIRouter(prefix="/revision", tags=["Revision Agent"])


def serialize_doc(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


@router.post("/generate", response_model=GenerateRevisionResponse)
async def generate_revision_endpoint(request: GenerateRevisionRequest):

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
    existing = db["revisions"].find_one({
        "document_id": request.document_id,
        "user_id": request.user_id
    })
    if existing:
        return GenerateRevisionResponse(
            success=True,
            revision_id=str(existing["_id"]),
            revision=existing["revision"],
            message="Revision plan loaded from cache."
        )

    # 4. Call Revision Agent
    result = await generate_revision(
        document_text=pdf_text,
        document_name=document_name,
        weak_topics=request.weak_topics
    )
    if not result["success"]:
        raise HTTPException(status_code=500, detail=f"Agent failed: {result.get('error')}")

    # 5. Save to MongoDB
    revision_doc = {
        "document_id": request.document_id,
        "document_name": document_name,
        "user_id": request.user_id,
        "revision": result["revision"],
        "created_at": datetime.utcnow()
    }
    insert_result = db["revisions"].insert_one(revision_doc)

    return GenerateRevisionResponse(
        success=True,
        revision_id=str(insert_result.inserted_id),
        revision=result["revision"],
        message="Revision plan generated successfully."
    )


@router.get("/document/{document_id}")
async def get_revision_by_document(document_id: str, user_id: str):
    revision = db["revisions"].find_one({
        "document_id": document_id,
        "user_id": user_id
    })
    if not revision:
        raise HTTPException(status_code=404, detail="No revision plan found.")
    return serialize_doc(revision)


@router.get("/user/{user_id}")
async def get_all_user_revisions(user_id: str):
    cursor = db["revisions"].find({"user_id": user_id}).sort("created_at", -1)
    revision_list = []
    for revision in cursor:
        revision_list.append(serialize_doc(revision))
    return {"success": True, "count": len(revision_list), "revisions": revision_list}


@router.delete("/{revision_id}")
async def delete_revision(revision_id: str, user_id: str):
    try:
        result = db["revisions"].delete_one({
            "_id": ObjectId(revision_id),
            "user_id": user_id
        })
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid revision ID.")
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Revision plan not found.")
    return {"success": True, "message": "Revision plan deleted."}