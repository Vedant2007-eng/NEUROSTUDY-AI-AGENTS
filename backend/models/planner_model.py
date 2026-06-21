from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class TopicPlan(BaseModel):
    topic: str
    duration: str
    priority: str
    study_tip: str


class StudyDay(BaseModel):
    day: int
    title: str
    topics: List[TopicPlan]
    daily_goal: str
    total_time: str


class PlannerContent(BaseModel):
    plan_title: str
    total_days: int
    total_hours: str
    difficulty_level: str
    days: List[StudyDay]


class PlannerDocument(BaseModel):
    document_id: str
    document_name: str
    user_id: str
    planner: PlannerContent
    created_at: datetime = Field(default_factory=datetime.utcnow)


class GeneratePlannerRequest(BaseModel):
    document_id: str
    user_id: str
    study_days: int = 7


class GeneratePlannerResponse(BaseModel):
    success: bool
    planner_id: Optional[str] = None
    planner: Optional[PlannerContent] = None
    message: str