from fastapi import APIRouter, HTTPException, status, Depends, File, UploadFile, Query, BackgroundTasks, Request
from fastapi.responses import JSONResponse
from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from io import BytesIO
from datetime import datetime
import uuid

from app.db import get_db
from app.models import User, CSVUpload, Order, CallLog, Feedback
from app.schemas.orders import OrderResponse, CSVUploadResponse, BulkTriggerRequest, BulkTriggerResponse
from app.services.csv_processor import CSVProcessor
from app.services.s3 import S3Service
from app.services.bolna import BolnaService
from app.utils.phone import normalize_phone
from app.dependencies import get_current_operator
from app.utils.logger import get_logger
from slowapi import Limiter
from slowapi.util import get_remote_address

logger = get_logger(__name__)
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/upload", response_model=CSVUploadResponse)
@limiter.limit("10/minute")
async def upload_csv(
    request: Request,
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    current_user: User = Depends(get_current_operator),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload CSV file with customer orders.
    
    Processes CSV, deduplicates orders, and uploads to S3 in background.
    """
    
    # Validate file
    if file.content_type not in ["text/csv", "application/vnd.ms-excel"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be CSV format"
        )
    
    if file.size > 10 * 1024 * 1024:  # 10 MB
        raise HTTPException(
            status_code=status.HTTP_413_PAYLOAD_TOO_LARGE,
            detail="File size must be less than 10 MB"
        )
    
    upload_id = uuid.uuid4()
    phone_validation_errors = []
    
    try:
        # Read file
        content = await file.read()
        file_obj = BytesIO(content)
        
        # Parse CSV
        parsed_result = CSVProcessor.parse(file_obj)
        parsed_rows = parsed_result["parsed_rows"]
        csv_errors = parsed_result["errors"]
        
        # Check duplicates
        invoice_numbers = [row["invoice_number"] for row in parsed_rows]
        existing_invoices, new_invoices = await CSVProcessor.check_duplicates(
            invoice_numbers, db
        )
        
        # Create CSV upload record
        csv_upload = CSVUpload(
            id=upload_id,
            filename=file.filename,
            row_count=len(parsed_rows) + len(csv_errors),
            status="processing",
            created_by=current_user.id
        )
        db.add(csv_upload)
        await db.flush()
        
        # Insert new orders
        new_order_count = 0
        for row in parsed_rows:
            if row["invoice_number"] in new_invoices:
                try:
                    # Normalize phone again (safety check)
                    normalized_phone = normalize_phone(row["customer_phone"])
                    
                    order = Order(
                        upload_id=upload_id,
                        invoice_number=row["invoice_number"],
                        sku=row.get("sku"),
                        product_name=row["product_name"],
                        customer_name=row["customer_name"],
                        customer_phone=normalized_phone,
                        purchase_date=row.get("purchase_date"),
                        amount_paid=row.get("amount_paid"),
                        purchase_mode=row.get("purchase_mode"),
                        brand=row.get("brand"),
                        purchase_qty=row.get("purchase_qty"),
                        extra_fields=row.get("extra_fields"),
                        call_status="pending"
                    )
                    db.add(order)
                    new_order_count += 1
                
                except Exception as e:
                    logger.error(
                        "order_creation_error",
                        invoice=row.get("invoice_number"),
                        error=str(e)
                    )
        
        # Update CSV upload status
        csv_upload.status = "done"
        
        # Commit database changes
        await db.commit()
        
        # Trigger S3 upload in background
        s3_service = S3Service()
        file_obj.seek(0)
        
        async def upload_to_s3():
            result = await s3_service.upload_csv(file_obj, str(upload_id), datetime.utcnow())
            if result["status"] == "uploaded":
                # Update database with S3 key
                stmt = select(CSVUpload).where(CSVUpload.id == upload_id)
                result = await db.execute(stmt)
                csv_record = result.scalar_one()
                csv_record.s3_key = result["s3_key"]
                csv_record.s3_upload_status = "uploaded"
                await db.commit()
            else:
                # Log S3 error but don't fail
                stmt = select(CSVUpload).where(CSVUpload.id == upload_id)
                result = await db.execute(stmt)
                csv_record = result.scalar_one()
                csv_record.s3_upload_status = "failed"
                csv_record.s3_error_message = result.get("error")
                await db.commit()
        
        if background_tasks:
            background_tasks.add_task(upload_to_s3)
        
        logger.info(
            "csv_upload_completed",
            upload_id=str(upload_id),
            total_rows=len(parsed_rows) + len(csv_errors),
            new_orders=new_order_count,
            duplicates=len(existing_invoices)
        )
        
        return CSVUploadResponse(
            upload_id=upload_id,
            total_rows=len(parsed_rows) + len(csv_errors),
            new_orders=new_order_count,
            skipped_duplicates=len(existing_invoices),
            phone_validation_errors=csv_errors,
            s3_upload_status="pending"  # Will be updated in background
        )
    
    except Exception as e:
        logger.error("csv_upload_error", upload_id=str(upload_id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error uploading CSV: {str(e)}"
        )


@router.get("", response_model=dict)
async def list_orders(
    status: str = Query(None),
    search: str = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_operator),
    db: AsyncSession = Depends(get_db)
):
    """
    Get paginated list of orders with optional filtering.
    """
    
    # Build query
    query = select(Order)
    
    # Apply filters
    if status:
        query = query.where(Order.call_status == status)
    
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Order.customer_name.ilike(search_term),
                Order.invoice_number.ilike(search_term)
            )
        )
    
    # Get total count
    count_stmt = select(func.count()).select_from(Order)
    if status:
        count_stmt = count_stmt.where(Order.call_status == status)
    if search:
        count_stmt = count_stmt.where(
            or_(
                Order.customer_name.ilike(search_term),
                Order.invoice_number.ilike(search_term)
            )
        )
    
    count_result = await db.execute(count_stmt)
    total = count_result.scalar()
    
    # Paginate
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(Order.created_at.desc())
    
    result = await db.execute(query)
    orders = result.scalars().all()
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "orders": [OrderResponse.model_validate(order) for order in orders]
    }


@router.get("/{order_id}")
async def get_order_detail(
    order_id: uuid.UUID,
    current_user: User = Depends(get_current_operator),
    db: AsyncSession = Depends(get_db)
):
    """Get full order detail with call logs and feedback"""
    
    stmt = select(Order).where(Order.id == order_id)
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
        
    # Fetch call logs for this order
    call_logs_result = await db.execute(
        select(CallLog)
        .where(CallLog.order_id == order_id)
        .order_by(CallLog.triggered_at.desc())
    )
    call_logs = call_logs_result.scalars().all()
    
    # Fetch feedback for this order
    feedback_result = await db.execute(
        select(Feedback)
        .where(Feedback.order_id == order_id)
    )
    feedback = feedback_result.scalar_one_or_none()
    
    # Format call logs
    formatted_call_logs = [
        {
            "id": str(log.id),
            "bolna_call_id": log.bolna_call_id,
            "call_status": log.call_status,
            "triggered_at": log.triggered_at.isoformat(),
            "connected_at": log.connected_at.isoformat() if log.connected_at else None,
            "ended_at": log.ended_at.isoformat() if log.ended_at else None,
            "duration_seconds": log.conversation_duration,
            "transcript": log.transcript,
            "summary": log.summary
        }
        for log in call_logs
    ]
    
    # Format feedback
    formatted_feedback = None
    if feedback:
        formatted_feedback = {
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
            "call_language": feedback.call_language,
            "verbatim_quote": feedback.verbatim_quote,
            "transcript": feedback.transcript,
            "call_summary": feedback.call_summary,
            "review_status": feedback.review_status,
            "created_at": feedback.created_at.isoformat()
        }
    
    return {
        "order": OrderResponse.model_validate(order),
        "call_logs": formatted_call_logs,
        "feedback": formatted_feedback
    }
