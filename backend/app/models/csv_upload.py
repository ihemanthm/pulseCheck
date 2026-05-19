import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from app.db import Base


class CSVUpload(Base):
    """CSV upload tracking"""
    
    __tablename__ = "csv_uploads"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String(255), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    row_count = Column(Integer, nullable=False)
    status = Column(String(50), default="processing")  # processing, done, error
    s3_key = Column(String(500), nullable=True)
    s3_upload_status = Column(String(50), default="pending")  # pending, uploaded, failed
    s3_error_message = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
