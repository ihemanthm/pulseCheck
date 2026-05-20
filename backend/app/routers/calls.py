from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks, Query, Request
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from datetime import datetime

from app.db import get_db
from app.models import User, Order, CallLog, Feedback
from app.schemas.orders import BulkTriggerRequest, BulkTriggerResponse
from app.schemas.calls import CallLogResponse, BolnaWebhookPayload
from app.services.bolna import BolnaService
from app.services.webhook import WebhookProcessor
from app.dependencies import get_current_operator
from app.utils.errors import BolnaAPIError, CallAlreadyExistsError
from app.utils.logger import get_logger
from slowapi import Limiter
from slowapi.util import get_remote_address

logger = get_logger(__name__)
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/calls", tags=["Calls"])


@router.post("/trigger", response_model=BulkTriggerResponse)
@limiter.limit("100/minute")
async def trigger_calls(
    request: Request,
    bulk_request: BulkTriggerRequest,
    background_tasks: BackgroundTasks = None,
    current_user: User = Depends(get_current_operator),
    db: AsyncSession = Depends(get_db)
):
    """
    Trigger outbound calls for selected orders.
    
    Implements duplicate call guard to prevent re-triggering.
    """
    
    triggered = []
    skipped = []
    failed = []
    
    bolna_service = BolnaService()
    
    for order_id in bulk_request.order_ids:
        try:
            # Fetch order
            stmt = select(Order).where(Order.id == order_id)
            result = await db.execute(stmt)
            order = result.scalar_one_or_none()
            
            if not order:
                skipped.append({
                    "order_id": str(order_id),
                    "reason": "Order not found"
                })
                continue
            
            # DUPLICATE GUARD: Check for active calls
            stmt = select(CallLog).where(
                and_(
                    CallLog.order_id == order_id,
                    CallLog.call_status.notin_(["failed", "no_answer"])
                )
            )
            result = await db.execute(stmt)
            existing_call = result.scalar_one_or_none()
            
            if existing_call:
                skipped.append({
                    "order_id": str(order_id),
                    "invoice_number": order.invoice_number,
                    "reason": f"Active call exists: {existing_call.bolna_call_id}"
                })
                logger.info(
                    "call_skipped_duplicate",
                    order_id=str(order_id),
                    existing_call_id=existing_call.bolna_call_id
                )
                continue
            
            # Generate call ID
            call_id = uuid.uuid4()
            
            # Trigger Bolna call
            try:
                bolna_response = await bolna_service.trigger_call(order, str(call_id))
                
                # Extract execution_id from Bolna response
                bolna_call_id = bolna_response.get("execution_id")
                
                if not bolna_call_id:
                    raise BolnaAPIError("Bolna API response missing execution_id field")
                
                logger.info(
                    "call_triggered_success",
                    order_id=str(order_id),
                    bolna_call_id=bolna_call_id,
                    bolna_status=bolna_response.get("status")
                )
                
                # Create call_log record
                call_log = CallLog(
                    order_id=order_id,
                    bolna_call_id=bolna_call_id,
                    call_status="triggered",
                    triggered_at=datetime.utcnow()
                )
                db.add(call_log)
                
                # Update order status
                order.call_status = "scheduled"
                order.updated_at = datetime.utcnow()
                db.add(order)
                
                await db.commit()
                triggered.append(str(order_id))
                
                logger.info(
                    "call_triggered",
                    order_id=str(order_id),
                    bolna_call_id=bolna_call_id
                )
            
            except BolnaAPIError as e:
                failed.append({
                    "order_id": str(order_id),
                    "invoice_number": order.invoice_number,
                    "error": str(e)
                })
                logger.error(
                    "call_trigger_failed",
                    order_id=str(order_id),
                    error=str(e)
                )
        
        except Exception as e:
            failed.append({
                "order_id": str(order_id),
                "error": f"Unexpected error: {str(e)}"
            })
            logger.error(
                "call_processing_error",
                order_id=str(order_id),
                error=str(e)
            )
    
    logger.info(
        "bulk_trigger_completed",
        total=len(bulk_request.order_ids),
        triggered=len(triggered),
        skipped=len(skipped),
        failed=len(failed)
    )
    
    return BulkTriggerResponse(
        triggered=triggered,
        skipped=skipped,
        failed=failed
    )


@router.get("")
async def list_calls(
    status: str = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_operator),
    db: AsyncSession = Depends(get_db)
):
    """Get paginated list of call logs"""
    
    stmt = select(CallLog)
    
    if status:
        stmt = stmt.where(CallLog.call_status == status)
    
    # Get total
    from sqlalchemy import func
    count_stmt = select(func.count()).select_from(CallLog)
    if status:
        count_stmt = count_stmt.where(CallLog.call_status == status)
    
    count_result = await db.execute(count_stmt)
    total = count_result.scalar()
    
    # Paginate
    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size).order_by(CallLog.triggered_at.desc())
    
    result = await db.execute(stmt)
    calls = result.scalars().all()
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "calls": [CallLogResponse.model_validate(call) for call in calls]
    }


@router.post("/webhook", status_code=200)
async def receive_webhook(
    payload: dict,
    background_tasks: BackgroundTasks = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Receive webhook from Bolna API.
    
    No authentication required - webhook is called from Bolna servers.
    Returns 200 immediately, processes in background for idempotency.
    """
    
    async def process_webhook_async():
        try:
            await WebhookProcessor.process_webhook(payload, db)
        except Exception as e:
            logger.error("webhook_processing_error", error=str(e), payload=payload)
    
    if background_tasks:
        background_tasks.add_task(process_webhook_async)
    else:
        # Fallback: process immediately if no background tasks
        await process_webhook_async()
    
    return {"status": "received"}
