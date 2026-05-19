from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from decimal import Decimal
import uuid


class OrderResponse(BaseModel):
    """Order response schema"""
    id: uuid.UUID
    invoice_number: str
    sku: Optional[str] = None
    product_name: str
    customer_name: str
    customer_phone: str
    purchase_date: Optional[date] = None
    amount_paid: Optional[Decimal] = None
    purchase_mode: Optional[str] = None
    brand: Optional[str] = None
    purchase_qty: Optional[int] = None
    call_status: str
    extra_fields: Optional[Dict[str, Any]] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class BulkTriggerRequest(BaseModel):
    """Bulk call trigger request"""
    order_ids: List[uuid.UUID] = Field(..., min_items=1)


class BulkTriggerResponse(BaseModel):
    """Bulk trigger response"""
    triggered: List[uuid.UUID]
    skipped: List[Dict[str, str]]  # [{"order_id": "...", "reason": "..."}]
    failed: List[Dict[str, str]]   # [{"order_id": "...", "error": "..."}]


class CSVUploadResponse(BaseModel):
    """CSV upload response"""
    upload_id: uuid.UUID
    total_rows: int
    new_orders: int
    skipped_duplicates: int
    phone_validation_errors: List[Dict[str, Any]]
    s3_upload_status: str
    s3_error_message: Optional[str] = None
