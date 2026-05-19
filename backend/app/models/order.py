import uuid
from datetime import date, datetime
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Numeric, Date, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db import Base


class Order(Base):
    """Order model for customer purchases"""
    
    __tablename__ = "orders"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    upload_id = Column(UUID(as_uuid=True), ForeignKey("csv_uploads.id"), nullable=False, index=True)
    invoice_number = Column(String(255), unique=True, nullable=False, index=True)
    sku = Column(String(255), nullable=True)
    product_name = Column(String(255), nullable=False)
    customer_name = Column(String(255), nullable=False)
    customer_phone = Column(String(20), nullable=False, index=True)  # E.164 format
    purchase_date = Column(Date, nullable=True)
    amount_paid = Column(Numeric(12, 2), nullable=True)
    purchase_mode = Column(String(50), nullable=True)  # store, online
    brand = Column(String(255), nullable=True)
    purchase_qty = Column(Integer, nullable=True)
    extra_fields = Column(JSONB, nullable=True)  # Additional CSV columns
    
    # Call status tracking
    call_status = Column(
        String(50),
        default="pending",
        index=True
    )  # pending, scheduled, in_progress, completed, failed, no_answer
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
