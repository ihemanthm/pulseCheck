import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db import Base


class AuditLog(Base):
    """Audit log model for tracking all critical actions"""
    
    __tablename__ = "audit_log"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)  # csv_upload, call_triggered, webhook_received, etc.
    resource_type = Column(String(50), nullable=False, index=True)  # order, call_log, feedback, csv_upload
    resource_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    status = Column(String(50), default="success")  # success, error
    details = Column(JSONB, nullable=True)  # Context details (old/new values, error messages, etc.)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
