from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class WeakTopic(BaseModel):
    topic: str
    reason: str
    priority: str
    revision_time: str
    key_points: List[str]
    practice_questions: List[str]
    revision_tip: str


class RevisionSession(BaseModel):
    session: int
    topic: str
    duration: str
    activity: str


class RevisionContent(BaseModel):
    revision_title: str
    total_topics: int
    estimated_time: str
    weak_topics: List[WeakTopic]
    revision_schedule: List[RevisionSession]
    general_tips: List[str]


class RevisionDocument(BaseModel):
    document_id: str
    document_name: str
    user_id: str
    revision: RevisionContent
    created_at: datetime = Field(default_factory=datetime.utcnow)


class GenerateRevisionRequest(BaseModel):
    document_id: str
    user_id: str
    weak_topics: List[str] = []


class GenerateRevisionResponse(BaseModel):
    success: bool
    revision_id: Optional[str] = None
    revision: Optional[RevisionContent] = None
    message: str