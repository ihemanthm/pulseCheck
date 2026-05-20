from pydantic import BaseModel, Field
from typing import Optional, Any, Dict, List
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
    agent_id: Optional[str] = None
    order_id: uuid.UUID
    call_status: str
    triggered_at: datetime
    connected_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    webhook_received_at: Optional[datetime] = None
    conversation_duration: Optional[float] = None
    transcript: Optional[str] = None
    summary: Optional[str] = None
    extracted_data: Optional[Dict[str, Any]] = None
    total_cost: Optional[float] = None
    retry_count: int
    feedback: Optional[FeedbackResponse] = None
    
    class Config:
        from_attributes = True


class BolnaWebhookPayload(BaseModel):
    """Bolna webhook payload schema - matches actual Bolna API response"""
    
    # Call identification
    id: str = Field(..., description="Call ID from Bolna")
    agent_id: str = Field(..., description="Agent ID")
    
    # Status info
    status: str = Field(..., description="Call status: scheduled, queued, initiated, ringing, in-progress, call-disconnected, completed")
    
    # Timing
    created_at: datetime
    updated_at: datetime
    scheduled_at: Optional[datetime] = None
    initiated_at: Optional[datetime] = None
    
    # Call content
    transcript: Optional[str] = None
    summary: Optional[str] = None
    conversation_duration: Optional[float] = None
    
    # Extraction & analysis
    extracted_data: Optional[Dict[str, Any]] = None
    custom_extractions: Optional[Dict[str, Any]] = None
    agent_extraction: Optional[Dict[str, Any]] = None
    
    # Cost information
    total_cost: Optional[float] = None
    cost_breakdown: Optional[Dict[str, Any]] = None
    usage_breakdown: Optional[Dict[str, Any]] = None
    
    # Retry info
    retry_count: int = 0
    retry_history: Optional[List[Dict[str, Any]]] = None
    
    # Additional fields
    answered_by_voice_mail: Optional[bool] = None
    error_message: Optional[str] = None
    
    # Allow extra fields for future Bolna API changes
    class Config:
        extra = "allow"
        from_attributes = True
