from pydantic import BaseModel, Field
from typing import Optional
import uuid


class ReviewRequest(BaseModel):
    """Review feedback request"""
    status: str = Field(..., pattern="^(approved|rejected)$")
    notes: Optional[str] = Field(None, max_length=1000)


class ReviewResponse(BaseModel):
    """Review feedback response"""
    reviewed: bool
    reviewed_at: str  # ISO datetime
    reviewed_by: str  # username


class PendingReviewResponse(BaseModel):
    """Pending review item response"""
    id: uuid.UUID
    order_id: uuid.UUID
    customer_name: str
    product_name: str
    invoice_number: str
    nps_score: Optional[float] = None
    overall_sentiment: Optional[str] = None
    priority: str  # high, medium, low
    created_at: str
    
    class Config:
        from_attributes = True
