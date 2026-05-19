import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db import Base


class CallLog(Base):
    """Call log model to track Bolna outbound calls"""
    
    __tablename__ = "call_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, index=True)
    bolna_call_id = Column(String(255), unique=True, nullable=False, index=True)  # Bolna's identifier
    
    # Timing
    triggered_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    connected_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    webhook_received_at = Column(DateTime, nullable=True, index=True)  # For idempotency
    
    # Call details
    duration_seconds = Column(Integer, nullable=True)
    call_status = Column(
        String(50),
        default="triggered",
        index=True
    )  # triggered, connected, completed, failed, no_answer
    
    # Raw response storage
    raw_webhook_payload = Column(JSONB, nullable=True)  # Store entire Bolna webhook response
    
    # Retry tracking
    retry_count = Column(Integer, default=0)
    last_error = Column(Text, nullable=True)
