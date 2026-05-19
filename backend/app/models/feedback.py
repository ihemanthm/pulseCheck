import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Text, Boolean, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db import Base


class Feedback(Base):
    """Feedback model to store customer voice call feedback"""
    
    __tablename__ = "feedback"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    call_log_id = Column(UUID(as_uuid=True), ForeignKey("call_logs.id"), unique=True, nullable=False, index=True)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, index=True)
    
    # NPS & Sentiment (extracted from Bolna response)
    nps_score = Column(Numeric(3, 1), nullable=True, index=True)  # 1.0 - 10.0
    nps_category = Column(String(50), nullable=True, index=True)  # promoter, neutral, detractor
    overall_sentiment = Column(String(50), nullable=True, index=True)  # positive, neutral, negative
    
    # Feedback details (extracted from Bolna response)
    primary_feedback = Column(Text, nullable=True)
    issue_raised = Column(Text, nullable=True)
    positive_highlight = Column(Text, nullable=True)
    
    # Flags for follow-up
    escalation_flag = Column(Boolean, default=False, index=True)
    manual_review_required = Column(Boolean, default=False, index=True)  # Auto-set based on rules
    callback_requested = Column(Boolean, default=False)
    callback_datetime = Column(DateTime, nullable=True)
    
    # Call metadata (extracted from Bolna response)
    call_language = Column(String(50), nullable=True)  # english, hindi, etc.
    verbatim_quote = Column(Text, nullable=True)
    transcript = Column(Text, nullable=True)  # Full transcript from call
    call_summary = Column(Text, nullable=True)  # Bolna's auto-summary
    
    # Manual review workflow
    review_status = Column(String(50), nullable=True)  # pending_review, approved, rejected
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    review_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Placeholder for raw Bolna feedback (can be JSONB for extended fields)
    raw_bolna_feedback = Column(JSONB, nullable=True)
