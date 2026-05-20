import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Text, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db import Base


class CallLog(Base):
    """Call log model to track Bolna outbound calls"""
    
    __tablename__ = "call_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, index=True)
    bolna_call_id = Column(String(255), unique=True, nullable=False, index=True)  # Bolna's identifier
    agent_id = Column(String(255), nullable=True)  # Bolna agent ID
    
    # Timing
    triggered_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    connected_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    webhook_received_at = Column(DateTime, nullable=True, index=True)  # For idempotency
    
    # Call details
    conversation_duration = Column(Float, nullable=True)  # Duration in seconds (from Bolna)
    call_status = Column(
        String(50),
        default="triggered",
        index=True
    )  # triggered, queued, initiated, ringing, in-progress, call-disconnected, completed
    
    # Call content
    transcript = Column(Text, nullable=True)  # Full conversation transcript
    summary = Column(Text, nullable=True)  # AI-generated call summary
    extracted_data = Column(JSONB, nullable=True)  # Extracted data from call (NPS, sentiment, etc.)
    
    # Billing & Analytics
    total_cost = Column(Float, nullable=True)  # Total cost of the call
    cost_breakdown = Column(JSONB, nullable=True)  # Breakdown: {llm, synthesizer, transcriber}
    usage_breakdown = Column(JSONB, nullable=True)  # Token usage and model info
    
    # Raw response storage
    raw_webhook_payload = Column(JSONB, nullable=True)  # Store entire Bolna webhook response
    
    # Feedback relationship
    feedback_id = Column(UUID(as_uuid=True), ForeignKey("feedback.id"), nullable=True)
    
    # Retry tracking
    retry_count = Column(Integer, default=0)
    last_error = Column(Text, nullable=True)
