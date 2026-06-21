from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime


class MCQQuestion(BaseModel):
    question_number: int
    question: str
    options: Dict[str, str]
    correct_answer: str
    explanation: str
    difficulty: str


class QuizContent(BaseModel):
    quiz_title: str
    total_questions: int
    questions: List[MCQQuestion]


class QuizDocument(BaseModel):
    document_id: str
    document_name: str
    user_id: str
    quiz: QuizContent
    created_at: datetime = Field(default_factory=datetime.utcnow)


class GenerateQuizRequest(BaseModel):
    document_id: str
    user_id: str
    num_questions: int = 10


class GenerateQuizResponse(BaseModel):
    success: bool
    quiz_id: Optional[str] = None
    quiz: Optional[QuizContent] = None
    message: str