from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime
from decimal import Decimal
import uuid


class FeedbackResponse(BaseModel):
    """Feedback response schema"""
    id: uuid.UUID
    nps_score: Optional[Decimal] = None
    nps_category: Optional[str] = None
    overall_sentiment: Optional[str] = None
    primary_feedback: Optional[str] = None
    issue_raised: Optional[str] = None
    positive_highlight: Optional[str] = None
    escalation_flag: bool
    manual_review_required: bool
    callback_requested: bool
    callback_datetime: Optional[datetime] = None
    call_language: Optional[str] = None
    verbatim_quote: Optional[str] = None
    transcript: Optional[str] = None
    call_summary: Optional[str] = None
    review_status: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class CallLogResponse(BaseModel):
    """Call log response schema"""
    id: uuid.UUID
    bolna_call_id: str
    call_status: str
    triggered_at: datetime
    connected_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    webhook_received_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    retry_count: int
    feedback: Optional[FeedbackResponse] = None
    
    class Config:
        from_attributes = True


class BolnaWebhookPayload(BaseModel):
    """Bolna webhook payload schema - flexible for raw storage"""
    call_id: Optional[str] = None
    id: Optional[str] = None
    status: Optional[str] = None
    duration: Optional[int] = None
    transcript: Optional[str] = None
    summary: Optional[str] = None
    extractions: Optional[Dict[str, Any]] = None
    
    # Allow extra fields for future Bolna API changes
    class Config:
        extra = "allow"
