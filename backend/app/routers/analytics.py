"""Analytics router for dashboard metrics"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from decimal import Decimal

from app.db import get_db
from app.models import Order, CallLog, Feedback, AuditLog
from app.dependencies import get_current_operator
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary")
async def get_summary(db: AsyncSession = Depends(get_db)):
    """Get dashboard summary statistics"""
    try:
        # Total orders
        total_orders_result = await db.execute(select(func.count(Order.id)))
        total_orders = total_orders_result.scalar() or 0
        
        # Completed calls
        completed_calls_result = await db.execute(
            select(func.count(CallLog.id)).where(CallLog.call_status == "completed")
        )
        calls_completed = completed_calls_result.scalar() or 0
        
        # Pending manual reviews
        pending_reviews_result = await db.execute(
            select(func.count(Feedback.id)).where(
                (Feedback.manual_review_required == True) | (Feedback.review_status == "pending")
            )
        )
        pending_manual_reviews = pending_reviews_result.scalar() or 0
        
        # Average NPS score
        avg_nps_result = await db.execute(
            select(func.avg(Feedback.nps_score)).where(Feedback.nps_score.isnot(None))
        )
        avg_nps_raw = avg_nps_result.scalar()
        avg_nps_score = float(avg_nps_raw) if avg_nps_raw else 0
        
        # Total cost
        total_cost_result = await db.execute(
            select(func.sum(CallLog.total_cost)).where(CallLog.total_cost.isnot(None))
        )
        total_cost_raw = total_cost_result.scalar()
        total_cost = float(total_cost_raw) if total_cost_raw else 0
        
        # Sentiment breakdown
        sentiment_result = await db.execute(
            select(
                Feedback.overall_sentiment,
                func.count(Feedback.id)
            ).group_by(Feedback.overall_sentiment)
        )
        sentiment_data = sentiment_result.all()
        sentiment_breakdown = {
            item[0] or "neutral": item[1] for item in sentiment_data
        }
        
        # NPS category breakdown
        nps_cat_result = await db.execute(
            select(
                Feedback.nps_category,
                func.count(Feedback.id)
            ).group_by(Feedback.nps_category)
        )
        nps_cat_data = nps_cat_result.all()
        nps_category_breakdown = {
            item[0] or "passive": item[1] for item in nps_cat_data
        }
        
        # NPS scores breakdown (1-10)
        nps_scores_result = await db.execute(
            select(
                Feedback.nps_score,
                func.count(Feedback.id)
            ).where(Feedback.nps_score.isnot(None))
            .group_by(Feedback.nps_score)
        )
        nps_scores_data = nps_scores_result.all()
        nps_scores_breakdown = {
            str(int(item[0])): item[1] for item in nps_scores_data
        }
        
        # Call status breakdown
        status_result = await db.execute(
            select(
                CallLog.call_status,
                func.count(CallLog.id)
            ).group_by(CallLog.call_status)
        )
        status_data = status_result.all()
        call_status_breakdown = {
            item[0] or "pending": item[1] for item in status_data
        }
        
        return {
            "total_orders": total_orders,
            "calls_completed": calls_completed,
            "pending_manual_reviews": pending_manual_reviews,
            "avg_nps_score": round(avg_nps_score, 1),
            "total_cost": round(total_cost, 2),
            "sentiment_breakdown": sentiment_breakdown,
            "nps_category_breakdown": nps_category_breakdown,
            "nps_scores_breakdown": nps_scores_breakdown,
            "call_status_breakdown": call_status_breakdown
        }
    except Exception as e:
        logger.error("failed_to_get_summary", error=str(e))
        return {
            "total_orders": 0,
            "calls_completed": 0,
            "pending_manual_reviews": 0,
            "avg_nps_score": 0,
            "total_cost": 0,
            "sentiment_breakdown": {},
            "call_status_breakdown": {}
        }


@router.get("/call-outcomes")
async def get_call_outcomes(db: AsyncSession = Depends(get_db)):
    """Get call outcome distribution"""
    try:
        result = await db.execute(
            select(
                CallLog.call_status,
                func.count(CallLog.id)
            ).group_by(CallLog.call_status)
        )
        data = result.all()
        
        return {
            "outcomes": [
                {"status": item[0], "count": item[1]} 
                for item in data
            ]
        }
    except Exception as e:
        logger.error("failed_to_get_call_outcomes", error=str(e))
        return {"outcomes": []}


@router.get("/nps-trend")
async def get_nps_trend(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db)
):
    """Get NPS trend over time"""
    try:
        from datetime import datetime, timedelta
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        result = await db.execute(
            select(
                func.date(Feedback.created_at).label("date"),
                func.avg(Feedback.nps_score).label("avg_nps"),
                func.count(Feedback.id).label("count")
            ).where(Feedback.created_at >= start_date)
            .group_by(func.date(Feedback.created_at))
            .order_by(func.date(Feedback.created_at))
        )
        data = result.all()
        
        return {
            "trend": [
                {
                    "date": str(item[0]) if item[0] else None,
                    "avg_nps": float(item[1]) if item[1] else 0,
                    "count": item[2]
                }
                for item in data
            ]
        }
    except Exception as e:
        logger.error("failed_to_get_nps_trend", error=str(e))
        return {"trend": []}


@router.get("/sentiment-by-product")
async def get_sentiment_by_product(db: AsyncSession = Depends(get_db)):
    """Get sentiment breakdown by product"""
    try:
        result = await db.execute(
            select(
                Order.product_name,
                Feedback.overall_sentiment,
                func.count(Feedback.id)
            ).join(Feedback, Feedback.order_id == Order.id)
            .group_by(Order.product_name, Feedback.overall_sentiment)
        )
        data = result.all()
        
        products = {}
        for item in data:
            product = item[0] or "Unknown"
            sentiment = item[1] or "neutral"
            count = item[2]
            
            if product not in products:
                products[product] = {}
            products[product][sentiment] = count
        
        return {"sentiment_by_product": products}
    except Exception as e:
        logger.error("failed_to_get_sentiment_by_product", error=str(e))
        return {"sentiment_by_product": {}}


@router.get("/top-issues")
async def get_top_issues(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    """Get top reported issues"""
    try:
        result = await db.execute(
            select(
                Feedback.issue_raised,
                func.count(Feedback.id).label("count")
            ).where(Feedback.issue_raised.isnot(None))
            .group_by(Feedback.issue_raised)
            .order_by(func.count(Feedback.id).desc())
            .limit(limit)
        )
        data = result.all()
        
        return {
            "issues": [
                {"issue": item[0], "count": item[1]}
                for item in data
            ]
        }
    except Exception as e:
        logger.error("failed_to_get_top_issues", error=str(e))
        return {"issues": []}


@router.get("/pending-reviews")
async def get_pending_reviews(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Get pending manual reviews"""
    try:
        skip = (page - 1) * page_size
        
        # Total count
        count_result = await db.execute(
            select(func.count(Feedback.id)).where(
                (Feedback.manual_review_required == True) | (Feedback.review_status == "pending")
            )
        )
        total = count_result.scalar() or 0
        
        # Paginated results
        result = await db.execute(
            select(
                Feedback.id,
                Feedback.order_id,
                Order.customer_name,
                Order.product_name,
                Feedback.overall_sentiment,
                Feedback.nps_score,
                Feedback.primary_feedback,
                Feedback.created_at
            ).join(Order, Order.id == Feedback.order_id)
            .where(
                (Feedback.manual_review_required == True) | (Feedback.review_status == "pending")
            )
            .order_by(Feedback.created_at.desc())
            .offset(skip)
            .limit(page_size)
        )
        data = result.all()
        
        reviews = [
            {
                "id": item[0],
                "order_id": str(item[1]),
                "customer_name": item[2],
                "product_name": item[3],
                "sentiment": item[4],
                "nps_score": float(item[5]) if item[5] else None,
                "feedback": item[6],
                "created_at": str(item[7])
            }
            for item in data
        ]
        
        return {
            "reviews": reviews,
            "total": total,
            "page": page,
            "page_size": page_size
        }
    except Exception as e:
        logger.error("failed_to_get_pending_reviews", error=str(e))
        return {"reviews": [], "total": 0, "page": page, "page_size": page_size}


@router.get("/audit-trail")
async def get_audit_trail(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Get audit trail"""
    try:
        skip = (page - 1) * page_size
        
        # Total count
        count_result = await db.execute(select(func.count(AuditLog.id)))
        total = count_result.scalar() or 0
        
        # Paginated results
        result = await db.execute(
            select(AuditLog)
            .order_by(AuditLog.created_at.desc())
            .offset(skip)
            .limit(page_size)
        )
        logs = result.scalars().all()
        
        return {
            "logs": [
                {
                    "id": str(log.id),
                    "action": log.action,
                    "resource_type": log.resource_type,
                    "status": log.status,
                    "created_at": str(log.created_at),
                    "details": log.details
                }
                for log in logs
            ],
            "total": total,
            "page": page,
            "page_size": page_size
        }
    except Exception as e:
        logger.error("failed_to_get_audit_trail", error=str(e))
        return {"logs": [], "total": 0, "page": page, "page_size": page_size}
