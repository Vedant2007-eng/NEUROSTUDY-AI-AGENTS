from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ChatMessage(BaseModel):
    question: str
    answer: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class AskDoubtRequest(BaseModel):
    document_id: str
    user_id: str
    question: str


class AskDoubtResponse(BaseModel):
    success: bool
    question: str
    answer: Optional[str] = None
    message: str


class ChatHistoryDocument(BaseModel):
    document_id: str
    document_name: str
    user_id: str
    messages: List[ChatMessage] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)