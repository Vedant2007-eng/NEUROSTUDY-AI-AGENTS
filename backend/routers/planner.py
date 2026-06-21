from fastapi import APIRouter, HTTPException
from bson import ObjectId
from datetime import datetime

from services.mongo_service import get_db
from agents.planner_agent import generate_planner
from models.planner_model import GeneratePlannerRequest, GeneratePlannerResponse

db = get_db()

router = APIRouter(prefix="/planner", tags=["Planner Agent"])


def serialize_doc(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


@router.post("/generate", response_model=GeneratePlannerResponse)
async def generate_planner_endpoint(request: GeneratePlannerRequest):

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
    existing = db["planners"].find_one({
        "document_id": request.document_id,
        "user_id": request.user_id
    })
    if existing:
        return GeneratePlannerResponse(
            success=True,
            planner_id=str(existing["_id"]),
            planner=existing["planner"],
            message="Study plan loaded from cache."
        )

    # 4. Call Planner Agent
    result = await generate_planner(pdf_text, document_name, request.study_days)
    if not result["success"]:
        raise HTTPException(status_code=500, detail=f"Agent failed: {result.get('error')}")

    # 5. Save to MongoDB
    planner_doc = {
        "document_id": request.document_id,
        "document_name": document_name,
        "user_id": request.user_id,
        "planner": result["planner"],
        "created_at": datetime.utcnow()
    }
    insert_result = db["planners"].insert_one(planner_doc)

    return GeneratePlannerResponse(
        success=True,
        planner_id=str(insert_result.inserted_id),
        planner=result["planner"],
        message="Study plan generated successfully."
    )


@router.get("/document/{document_id}")
async def get_planner_by_document(document_id: str, user_id: str):
    planner = db["planners"].find_one({
        "document_id": document_id,
        "user_id": user_id
    })
    if not planner:
        raise HTTPException(status_code=404, detail="No study plan found.")
    return serialize_doc(planner)


@router.get("/user/{user_id}")
async def get_all_user_planners(user_id: str):
    cursor = db["planners"].find({"user_id": user_id}).sort("created_at", -1)
    planner_list = []
    for planner in cursor:
        planner_list.append(serialize_doc(planner))
    return {"success": True, "count": len(planner_list), "planners": planner_list}


@router.delete("/{planner_id}")
async def delete_planner(planner_id: str, user_id: str):
    try:
        result = db["planners"].delete_one({
            "_id": ObjectId(planner_id),
            "user_id": user_id
        })
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid planner ID.")
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Study plan not found.")
    return {"success": True, "message": "Study plan deleted."}