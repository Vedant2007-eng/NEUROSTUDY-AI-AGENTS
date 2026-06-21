from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ImportantTerm(BaseModel):
    term: str
    definition: str


class NotesContent(BaseModel):
    summary: str
    key_points: List[str]
    important_terms: List[ImportantTerm]
    quick_revision: List[str]
    difficulty_level: str
    estimated_read_time: str
    topic_tags: List[str]


class NotesDocument(BaseModel):
    document_id: str
    document_name: str
    user_id: str
    notes: NotesContent
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class GenerateNotesRequest(BaseModel):
    document_id: str
    user_id: str


class GenerateNotesResponse(BaseModel):
    success: bool
    notes_id: Optional[str] = None
    notes: Optional[NotesContent] = None
    message: str