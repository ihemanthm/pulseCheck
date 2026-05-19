from datetime import datetime
from typing import Optional, Dict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import CallLog, Feedback, Order, AuditLog
from app.services.sentiment import SentimentService
from app.utils.logger import get_logger

logger = get_logger(__name__)


class WebhookProcessor:
    """Service for processing Bolna webhook payloads"""
    
    @staticmethod
    async def process_webhook(
        payload: Dict,
        db_session: AsyncSession
    ) -> bool:
        """
        Process incoming Bolna webhook with idempotency.
        
        Args:
            payload: Bolna webhook payload
            db_session: Database session
        
        Returns:
            True if processed successfully, False otherwise
        """
        
        # Extract Bolna's call ID (may be 'call_id' or 'id')
        bolna_call_id = payload.get("call_id") or payload.get("id")
        
        if not bolna_call_id:
            logger.error("webhook_missing_call_id", payload=payload)
            return False
        
        # Find existing call_log
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
        
        # Store raw payload FIRST (before processing)
        call_log.raw_webhook_payload = payload
        
        # Update call_log with webhook info
        call_log.call_status = WebhookProcessor._map_bolna_status(payload.get("status"))
        call_log.duration_seconds = payload.get("duration")
        call_log.ended_at = datetime.utcnow()
        call_log.webhook_received_at = datetime.utcnow()
        
        # Get order for status updates (manually fetch instead of using relationship)
        stmt = select(Order).where(Order.id == call_log.order_id)
        result = await db_session.execute(stmt)
        order = result.scalar_one()
        
        # Process feedback if call completed
        if call_log.call_status == "completed" and payload.get("extractions"):
            await WebhookProcessor._process_feedback(
                payload, call_log, order, db_session
            )
        
        # Update order status
        elif call_log.call_status in ("failed", "no_answer"):
            order.call_status = call_log.call_status
        
        # Commit all changes
        db_session.add(call_log)
        db_session.add(order)
        await db_session.commit()
        
        # Log audit trail
        await WebhookProcessor._log_audit(
            db_session=db_session,
            action="webhook_received",
            resource_type="call_log",
            resource_id=call_log.id,
            status="success",
            details={
                "bolna_call_id": bolna_call_id,
                "call_status": call_log.call_status,
                "has_feedback": payload.get("extractions") is not None,
                "duration_seconds": call_log.duration_seconds
            }
        )
        
        logger.info(
            "webhook_processed",
            bolna_call_id=bolna_call_id,
            call_status=call_log.call_status,
            order_id=str(order.id)
        )
        
        return True
    
    @staticmethod
    async def _process_feedback(
        payload: Dict,
        call_log: CallLog,
        order: Order,
        db_session: AsyncSession
    ) -> None:
        """Process feedback from completed call"""
        
        extractions = payload.get("extractions", {})
        
        feedback_data = {
            "call_log_id": call_log.id,
            "order_id": order.id,
            # NPS & Sentiment
            "nps_score": extractions.get("nps_score"),
            "overall_sentiment": extractions.get("overall_sentiment"),
            # Feedback details
            "primary_feedback": extractions.get("primary_feedback"),
            "issue_raised": extractions.get("issue_raised"),
            "positive_highlight": extractions.get("positive_highlight"),
            # Flags
            "escalation_flag": extractions.get("escalation_flag", False),
            "callback_requested": extractions.get("callback_requested", False),
            "callback_datetime": extractions.get("callback_datetime"),
            # Call metadata
            "call_language": extractions.get("call_language"),
            "verbatim_quote": extractions.get("verbatim_quote"),
            "transcript": payload.get("transcript"),
            "call_summary": payload.get("summary"),
            # Store raw Bolna feedback for later analysis
            "raw_bolna_feedback": extractions
        }
        
        # Enrich sentiment
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
        else:
            # Create new feedback
            feedback = Feedback(**feedback_data)
        
        db_session.add(feedback)
        await db_session.flush()
        
        # Update order status
        order.call_status = "completed"
        
        logger.info(
            "feedback_processed",
            call_log_id=str(call_log.id),
            nps_score=feedback_data.get("nps_score"),
            manual_review_required=feedback_data.get("manual_review_required")
        )
    
    @staticmethod
    def _map_bolna_status(bolna_status: Optional[str]) -> str:
        """Map Bolna status to internal call_status"""
        if not bolna_status:
            return "failed"
        
        status_map = {
            "completed": "completed",
            "failed": "failed",
            "no_answer": "no_answer",
            "busy": "no_answer",
            "connected": "connected",
        }
        
        return status_map.get(bolna_status, "failed")
    
    @staticmethod
    async def _log_audit(
        db_session: AsyncSession,
        action: str,
        resource_type: str,
        resource_id: str,
        status: str,
        details: Dict
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
