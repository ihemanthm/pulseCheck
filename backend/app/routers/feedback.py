"""Feedback router for managing and viewing customer feedback"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
import uuid
from typing import Optional, List, Dict, Any

from app.db import get_db
from app.models import Order, CallLog, Feedback, User
from app.schemas.feedback import ReviewRequest, ReviewResponse
from app.dependencies import get_current_operator
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/feedback", tags=["Feedback"])


@router.get("", response_model=dict)
async def list_feedbacks(
    sentiment: Optional[str] = Query(None),
    nps_category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_operator),
    db: AsyncSession = Depends(get_db)
):
    """Get paginated list of all customer feedbacks with filtering"""
    try:
        skip = (page - 1) * page_size
        
        # Build base query joining Feedback and Order
        query = select(Feedback).join(Order, Order.id == Feedback.order_id)
        
        # Apply filters
        if sentiment:
            query = query.where(Feedback.overall_sentiment == sentiment)
        if nps_category:
            query = query.where(Feedback.nps_category == nps_category)
        if search:
            search_term = f"%{search}%"
            query = query.where(
                or_(
                    Order.customer_name.ilike(search_term),
                    Order.invoice_number.ilike(search_term),
                    Feedback.primary_feedback.ilike(search_term),
                    Feedback.issue_raised.ilike(search_term)
                )
            )
            
        # Count total items matching filters
        count_query = select(func.count(Feedback.id)).join(Order, Order.id == Feedback.order_id)
        if sentiment:
            count_query = count_query.where(Feedback.overall_sentiment == sentiment)
        if nps_category:
            count_query = count_query.where(Feedback.nps_category == nps_category)
        if search:
            count_query = count_query.where(
                or_(
                    Order.customer_name.ilike(search_term),
                    Order.invoice_number.ilike(search_term),
                    Feedback.primary_feedback.ilike(search_term),
                    Feedback.issue_raised.ilike(search_term)
                )
            )
            
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0
        
        # Execute paginated query
        query = query.order_by(Feedback.created_at.desc()).offset(skip).limit(page_size)
        result = await db.execute(query)
        feedbacks = result.scalars().all()
        
        # Format response
        items = []
        for f in feedbacks:
            # Fetch associated order details
            order_result = await db.execute(select(Order).where(Order.id == f.order_id))
            order = order_result.scalar_one_or_none()
            
            items.append({
                "id": str(f.id),
                "call_log_id": str(f.call_log_id),
                "order_id": str(f.order_id),
                "customer_name": order.customer_name if order else "Unknown",
                "invoice_number": order.invoice_number if order else "N/A",
                "product_name": order.product_name if order else "N/A",
                "nps_score": float(f.nps_score) if f.nps_score is not None else None,
                "nps_category": f.nps_category,
                "overall_sentiment": f.overall_sentiment,
                "primary_feedback": f.primary_feedback,
                "issue_raised": f.issue_raised,
                "positive_highlight": f.positive_highlight,
                "escalation_flag": f.escalation_flag,
                "manual_review_required": f.manual_review_required,
                "review_status": f.review_status,
                "created_at": f.created_at.isoformat()
            })
            
        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "feedbacks": items
        }
    except Exception as e:
        logger.error("failed_to_list_feedbacks", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing feedback: {str(e)}"
        )


@router.get("/pending", response_model=dict)
async def get_pending_feedbacks(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_operator),
    db: AsyncSession = Depends(get_db)
):
    """Get pending manual feedback reviews (compatibility with frontend API client)"""
    try:
        skip = (page - 1) * page_size
        
        # Query total count
        count_result = await db.execute(
            select(func.count(Feedback.id)).where(
                or_(
                    Feedback.manual_review_required == True,
                    Feedback.review_status == "pending"
                )
            )
        )
        total = count_result.scalar() or 0
        
        # Query paginated pending feedbacks
        query = (
            select(Feedback)
            .where(
                or_(
                    Feedback.manual_review_required == True,
                    Feedback.review_status == "pending"
                )
            )
            .order_by(Feedback.created_at.desc())
            .offset(skip)
            .limit(page_size)
        )
        result = await db.execute(query)
        feedbacks = result.scalars().all()
        
        reviews = []
        for f in feedbacks:
            order_result = await db.execute(select(Order).where(Order.id == f.order_id))
            order = order_result.scalar_one_or_none()
            
            reviews.append({
                "id": str(f.id),
                "order_id": str(f.order_id),
                "customer_name": order.customer_name if order else "Unknown",
                "invoice_number": order.invoice_number if order else "N/A",
                "product_name": order.product_name if order else "N/A",
                "nps_score": float(f.nps_score) if f.nps_score is not None else None,
                "overall_sentiment": f.overall_sentiment,
                "primary_feedback": f.primary_feedback,
                "created_at": f.created_at.isoformat()
            })
            
        return {
            "reviews": reviews,
            "feedback": reviews,
            "total": total,
            "page": page,
            "page_size": page_size
        }
    except Exception as e:
        logger.error("failed_to_get_pending_feedbacks", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting pending reviews: {str(e)}"
        )


@router.get("/{feedback_id}", response_model=dict)
async def get_feedback_detail(
    feedback_id: uuid.UUID,
    current_user: User = Depends(get_current_operator),
    db: AsyncSession = Depends(get_db)
):
    """Get full feedback details, including order info and call logs"""
    try:
        # Get feedback
        feedback_result = await db.execute(select(Feedback).where(Feedback.id == feedback_id))
        feedback = feedback_result.scalar_one_or_none()
        if not feedback:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Feedback record not found"
            )
            
        # Get associated order
        order_result = await db.execute(select(Order).where(Order.id == feedback.order_id))
        order = order_result.scalar_one_or_none()
        
        # Get call logs for this order
        call_logs_result = await db.execute(
            select(CallLog)
            .where(CallLog.order_id == feedback.order_id)
            .order_by(CallLog.triggered_at.desc())
        )
        call_logs = call_logs_result.scalars().all()
        
        # Format logs
        logs_data = []
        for log in call_logs:
            logs_data.append({
                "id": str(log.id),
                "bolna_call_id": log.bolna_call_id,
                "call_status": log.call_status,
                "triggered_at": log.triggered_at.isoformat(),
                "connected_at": log.connected_at.isoformat() if log.connected_at else None,
                "ended_at": log.ended_at.isoformat() if log.ended_at else None,
                "duration_seconds": log.conversation_duration,
                "transcript": log.transcript,
                "summary": log.summary
            })
            
        # Format feedback model
        feedback_data = {
            "id": str(feedback.id),
            "call_log_id": str(feedback.call_log_id),
            "order_id": str(feedback.order_id),
            "nps_score": float(feedback.nps_score) if feedback.nps_score is not None else None,
            "nps_category": feedback.nps_category,
            "overall_sentiment": feedback.overall_sentiment,
            "primary_feedback": feedback.primary_feedback,
            "issue_raised": feedback.issue_raised,
            "positive_highlight": feedback.positive_highlight,
            "escalation_flag": feedback.escalation_flag,
            "manual_review_required": feedback.manual_review_required,
            "callback_requested": feedback.callback_requested,
            "callback_datetime": feedback.callback_datetime.isoformat() if feedback.callback_datetime else None,
            "call_language": feedback.call_language,
            "verbatim_quote": feedback.verbatim_quote,
            "transcript": feedback.transcript,
            "call_summary": feedback.call_summary,
            "review_status": feedback.review_status,
            "review_notes": feedback.review_notes,
            "created_at": feedback.created_at.isoformat()
        }
        
        # Format order details
        order_data = None
        if order:
            order_data = {
                "id": str(order.id),
                "invoice_number": order.invoice_number,
                "sku": order.sku,
                "product_name": order.product_name,
                "customer_name": order.customer_name,
                "customer_phone": order.customer_phone,
                "purchase_date": order.purchase_date.isoformat() if order.purchase_date else None,
                "amount_paid": float(order.amount_paid) if order.amount_paid is not None else None,
                "purchase_qty": order.purchase_qty,
                "purchase_mode": order.purchase_mode,
                "brand": order.brand,
                "extra_fields": order.extra_fields
            }
            
        return {
            "feedback": feedback_data,
            "order": order_data,
            "call_logs": logs_data
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("failed_to_get_feedback_detail", id=str(feedback_id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting feedback detail: {str(e)}"
        )


@router.post("/{feedback_id}/review", response_model=ReviewResponse)
async def review_feedback(
    feedback_id: uuid.UUID,
    review_req: ReviewRequest,
    current_user: User = Depends(get_current_operator),
    db: AsyncSession = Depends(get_db)
):
    """Review customer feedback and change its status"""
    try:
        # Find feedback
        feedback_result = await db.execute(select(Feedback).where(Feedback.id == feedback_id))
        feedback = feedback_result.scalar_one_or_none()
        if not feedback:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Feedback record not found"
            )
            
        # Update fields
        feedback.review_status = review_req.status
        feedback.reviewed_by = current_user.id
        feedback.reviewed_at = datetime.utcnow()
        feedback.review_notes = review_req.notes
        feedback.manual_review_required = False
        
        await db.commit()
        
        logger.info(
            "feedback_reviewed",
            feedback_id=str(feedback_id),
            reviewed_by=current_user.username,
            status=review_req.status
        )
        
        return ReviewResponse(
            reviewed=True,
            reviewed_at=feedback.reviewed_at.isoformat(),
            reviewed_by=current_user.username
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("failed_to_review_feedback", id=str(feedback_id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error reviewing feedback: {str(e)}"
        )
