from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class TerminologyItem(BaseModel):
    term: str
    definition: str


class PaperSummaryStructured(BaseModel):
    title: Optional[str] = None
    plain_language_overview: str = ""
    research_problem: str = ""
    research_question: Optional[str] = None
    motivation_significance: str = ""
    methodology: str = ""
    findings_contributions: str = ""
    techniques_models: str = ""
    limitations_author: str = ""
    limitations_assumptions: str = ""
    key_terminology: List[TerminologyItem] = Field(default_factory=list)
    prerequisite_knowledge: List[str] = Field(default_factory=list)
    open_questions: List[str] = Field(default_factory=list)
    next_steps: List[str] = Field(default_factory=list)
    discussion_questions: List[str] = Field(default_factory=list)


class PaperSummaryResponse(PaperSummaryStructured):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    document_id: UUID
    document_hash: str
    model_used: str
    prompt_version: str
    created_at: datetime
    updated_at: datetime


class AIChatRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    message: str = Field(..., min_length=1, max_length=4000)
    conversation_id: Optional[UUID] = None
    document_id: Optional[UUID] = None
    context_type: Optional[str] = None
    context_id: Optional[str] = None


class AIMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    conversation_id: UUID
    sender_type: str
    content: str
    citations: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime


class AIChatResponse(BaseModel):
    conversation_id: UUID
    message: str
    reply: Optional[str] = None
    sender_type: str = "assistant"
    citations: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime

    def __init__(self, **data):
        if "reply" not in data and "message" in data:
            data["reply"] = data["message"]
        elif "message" not in data and "reply" in data:
            data["message"] = data["reply"]
        super().__init__(**data)


class AIConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    document_id: Optional[UUID] = None
    document_title: Optional[str] = None
    title: str
    messages: List[AIMessageResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
