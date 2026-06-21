from fastapi import APIRouter, UploadFile, File, HTTPException
from services.pdf_parser import extract_text_from_pdf
from services.mongo_service import documents_collection
from datetime import datetime

router = APIRouter()

@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    
    # Check if file is a PDF
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
    
    # Read file bytes
    file_bytes = await file.read()
    
    # Extract text from PDF
    extracted_text = extract_text_from_pdf(file_bytes)
    
    # Save to MongoDB
    document = {
        "filename": file.filename,
        "text": extracted_text,
        "created_at": datetime.utcnow(),
        "user_id": "test_user"
    }
    
    result = documents_collection.insert_one(document)
    
    return {
        "message": "PDF uploaded successfully!",
        "document_id": str(result.inserted_id),
        "filename": file.filename,
        "text_preview": extracted_text[:300]
    }

@router.get("/documents")
async def get_documents():
    documents = list(documents_collection.find({}, {"text": 0}))
    for doc in documents:
        doc["_id"] = str(doc["_id"])
    return {"documents": documents}