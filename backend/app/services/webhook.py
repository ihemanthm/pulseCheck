from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import CallLog, Feedback, Order, AuditLog
from app.services.sentiment import SentimentService
from app.utils.logger import get_logger

logger = get_logger(__name__)


class WebhookProcessor:
    """Service for processing Bolna webhook payloads"""
    
    # Map Bolna statuses to internal values
    STATUS_MAP = {
        "scheduled": "scheduled",
        "queued": "queued",
        "initiated": "initiated",
        "ringing": "ringing",
        "in-progress": "in_progress",
        "call-disconnected": "call_disconnected",
        "completed": "completed"
    }
    
    @staticmethod
    async def process_webhook(
        payload: Dict[str, Any],
        db_session: AsyncSession
    ) -> bool:
        """
        Process incoming Bolna webhook with idempotency.
        
        Args:
            payload: Bolna webhook payload (dict converted from request)
            db_session: Database session
        
        Returns:
            True if processed successfully, False otherwise
        """
        
        # Extract Bolna's call ID (use 'id' field from Bolna)
        bolna_call_id = payload.get("id")
        
        if not bolna_call_id:
            logger.error("webhook_missing_call_id", payload=payload)
            return False
        
        # Find existing call_log by bolna_call_id
        stmt = select(CallLog).where(CallLog.bolna_call_id == bolna_call_id)
        result = await db_session.execute(stmt)
        call_log = result.scalar_one_or_none()
        
        if not call_log:
            logger.warning("webhook_call_not_found", bolna_call_id=bolna_call_id)
            return False
        
        # Idempotency guard: skip if already processed
        if call_log.webhook_received_at:
            logger.info(
                "webhook_already_processed",
                bolna_call_id=bolna_call_id,
                previous_received_at=call_log.webhook_received_at.isoformat()
            )
            return True  # Return True since idempotent
        
        # Map Bolna status to internal status
        bolna_status = payload.get("status", "")
        call_log.call_status = WebhookProcessor._map_bolna_status(bolna_status)
        
        # Store call content and metrics
        call_log.conversation_duration = payload.get("conversation_duration")
        call_log.transcript = payload.get("transcript")
        call_log.summary = payload.get("summary")
        call_log.agent_id = payload.get("agent_id")
        
        # Store extraction data and costs
        call_log.extracted_data = payload.get("extracted_data")
        call_log.total_cost = payload.get("total_cost")
        call_log.cost_breakdown = payload.get("cost_breakdown")
        call_log.usage_breakdown = payload.get("usage_breakdown")
        
        # Mark webhook as received
        call_log.webhook_received_at = datetime.utcnow()
        call_log.retry_count = payload.get("retry_count", 0)
        
        # Get order for status updates
        stmt = select(Order).where(Order.id == call_log.order_id)
        result = await db_session.execute(stmt)
        order = result.scalar_one_or_none()
        
        if not order:
            logger.error("webhook_order_not_found", order_id=call_log.order_id)
            return False
        
        # Process feedback from extracted_data if call completed
        feedback_created = False
        if call_log.call_status == "completed" and call_log.extracted_data:
            feedback_created = await WebhookProcessor._process_feedback(
                payload, call_log, order, db_session
            )
        
        # Update order status based on call outcome
        if call_log.call_status == "completed":
            order.call_status = "completed"
        elif call_log.call_status in ("call_disconnected",):
            order.call_status = "failed"
        
        # Commit all changes
        db_session.add(call_log)
        db_session.add(order)
        await db_session.commit()
        
        # Log audit trail with cost and extraction info
        await WebhookProcessor._log_audit(
            db_session=db_session,
            action="webhook_received",
            resource_type="call_log",
            resource_id=str(call_log.id),
            status="success",
            details={
                "bolna_call_id": bolna_call_id,
                "call_status": call_log.call_status,
                "has_extraction": call_log.extracted_data is not None,
                "conversation_duration": call_log.conversation_duration,
                "total_cost": call_log.total_cost,
                "feedback_created": feedback_created,
                "retry_count": call_log.retry_count
            }
        )
        
        logger.info(
            "webhook_processed",
            bolna_call_id=bolna_call_id,
            call_status=call_log.call_status,
            order_id=str(order.id),
            conversation_duration=call_log.conversation_duration,
            total_cost=call_log.total_cost
        )
        
        return True
    
    @staticmethod
    async def _process_feedback(
        payload: Dict[str, Any],
        call_log: CallLog,
        order: Order,
        db_session: AsyncSession
    ) -> bool:
        """
        Process feedback from extracted_data in completed call.
        
        Args:
            payload: Full Bolna webhook payload
            call_log: Call log record
            order: Order record
            db_session: Database session
        
        Returns:
            True if feedback was created/updated
        """
        
        extracted_data = payload.get("extracted_data", {})
        
        # Extract NPS and sentiment from extracted_data
        feedback_data = {
            "order_id": order.id,
            # NPS & Sentiment from extracted_data
            "nps_score": extracted_data.get("nps_score"),
            "nps_category": WebhookProcessor._categorize_nps(extracted_data.get("nps_score")),
            "overall_sentiment": extracted_data.get("sentiment"),
            # Feedback details
            "primary_feedback": extracted_data.get("primary_feedback"),
            "issue_raised": extracted_data.get("issue_raised"),
            "positive_highlight": extracted_data.get("positive_highlight"),
            # Flags
            "escalation_flag": extracted_data.get("escalation_flag", False),
            "callback_requested": extracted_data.get("callback_requested", False),
            "callback_datetime": extracted_data.get("callback_datetime"),
            # Call metadata
            "call_language": extracted_data.get("call_language"),
            "verbatim_quote": extracted_data.get("verbatim_quote"),
            "transcript": call_log.transcript,
            "call_summary": call_log.summary,
            # Review status
            "review_status": "pending"
        }
        
        # Enrich sentiment analysis
        feedback_data = SentimentService.enrich_feedback(feedback_data)
        
        # Determine if manual review needed
        feedback_data["manual_review_required"] = (
            SentimentService.should_flag_manual_review(feedback_data)
        )
        
        # Check for existing feedback (should not happen with unique call_log_id)
        stmt = select(Feedback).where(Feedback.call_log_id == call_log.id)
        result = await db_session.execute(stmt)
        existing_feedback = result.scalar_one_or_none()
        
        if existing_feedback:
            # Update existing feedback
            for key, value in feedback_data.items():
                setattr(existing_feedback, key, value)
            feedback = existing_feedback
            is_new = False
        else:
            # Create new feedback
            feedback = Feedback(**feedback_data)
            is_new = True
        
        # Link feedback to call_log
        feedback.call_log_id = call_log.id
        call_log.feedback_id = feedback.id if not is_new else None
        
        db_session.add(feedback)
        await db_session.flush()
        
        # Link feedback after feedback is persisted and has an ID
        if is_new:
            call_log.feedback_id = feedback.id
        
        logger.info(
            "feedback_processed",
            call_log_id=str(call_log.id),
            is_new=is_new,
            nps_score=feedback_data.get("nps_score"),
            manual_review_required=feedback_data.get("manual_review_required")
        )
        
        return True
    
    @staticmethod
    def _map_bolna_status(bolna_status: Optional[str]) -> str:
        """
        Map Bolna status to internal call_status.
        
        Bolna statuses: scheduled, queued, initiated, ringing, in-progress, 
                       call-disconnected, completed
        """
        if not bolna_status:
            return "call_disconnected"
        
        return WebhookProcessor.STATUS_MAP.get(bolna_status, "call_disconnected")
    
    @staticmethod
    def _categorize_nps(nps_score: Optional[float]) -> Optional[str]:
        """Categorize NPS score into promoter/passive/detractor"""
        if nps_score is None:
            return None
        
        if nps_score >= 9:
            return "promoter"
        elif nps_score >= 7:
            return "passive"
        else:
            return "detractor"
    
    @staticmethod
    async def _log_audit(
        db_session: AsyncSession,
        action: str,
        resource_type: str,
        resource_id: str,
        status: str,
        details: Dict[str, Any]
    ) -> None:
        """Log action to audit trail"""
        audit_log = AuditLog(
            user_id=None,  # System action
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            status=status,
            details=details
        )
        db_session.add(audit_log)
        await db_session.flush()
