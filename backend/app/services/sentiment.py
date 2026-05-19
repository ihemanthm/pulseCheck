from typing import Dict, Tuple
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Keywords that indicate high-impact issues
CRITICAL_KEYWORDS = [
    "defective", "broken", "damaged", "dangerous",
    "hazard", "safety", "malfunction", "not working",
    "crash", "freeze", "stuck", "battery", "overheat"
]


class SentimentService:
    """Service for sentiment enrichment and manual review rules"""
    
    @staticmethod
    def enrich_feedback(feedback_data: Dict) -> Dict:
        """
        Enrich feedback with derived sentiment and NPS category.
        
        Args:
            feedback_data: Raw feedback dict from Bolna
        
        Returns:
            Enriched feedback dict with sentiment and NPS category
        """
        nps_score = feedback_data.get("nps_score")
        
        # Derive overall_sentiment if not set
        if not feedback_data.get("overall_sentiment") and nps_score is not None:
            try:
                nps_float = float(nps_score)
                if nps_float >= 9:
                    feedback_data["overall_sentiment"] = "positive"
                elif nps_float >= 7:
                    feedback_data["overall_sentiment"] = "neutral"
                else:
                    feedback_data["overall_sentiment"] = "negative"
            except (ValueError, TypeError):
                pass
        
        # Derive nps_category if not set
        if not feedback_data.get("nps_category") and nps_score is not None:
            try:
                nps_float = float(nps_score)
                if nps_float >= 9:
                    feedback_data["nps_category"] = "promoter"
                elif nps_float >= 7:
                    feedback_data["nps_category"] = "neutral"
                else:
                    feedback_data["nps_category"] = "detractor"
            except (ValueError, TypeError):
                pass
        
        logger.info(
            "feedback_enriched",
            nps_score=nps_score,
            sentiment=feedback_data.get("overall_sentiment"),
            nps_category=feedback_data.get("nps_category")
        )
        
        return feedback_data
    
    @staticmethod
    def should_flag_manual_review(feedback: Dict) -> bool:
        """
        Determine if feedback should be flagged for manual review.
        
        Rules:
        - escalation_flag = true
        - overall_sentiment = 'negative' AND nps_score < 5
        - callback_requested = true AND callback_datetime is NULL
        - nps_score < 6 AND issue_raised is not empty
        - issue_raised contains critical keywords
        
        Args:
            feedback: Feedback dict
        
        Returns:
            True if manual review should be flagged
        """
        
        # Rule 1: Explicit escalation flag
        if feedback.get("escalation_flag"):
            logger.info("manual_review_flag", reason="escalation_flag")
            return True
        
        # Rule 2: Negative sentiment with very low NPS
        nps_score = feedback.get("nps_score")
        if (feedback.get("overall_sentiment") == "negative" and
                nps_score is not None):
            try:
                if float(nps_score) < 5:
                    logger.info("manual_review_flag", reason="negative_sentiment_low_nps")
                    return True
            except (ValueError, TypeError):
                pass
        
        # Rule 3: Callback requested but no datetime
        if (feedback.get("callback_requested") and
                not feedback.get("callback_datetime")):
            logger.info("manual_review_flag", reason="callback_requested_no_datetime")
            return True
        
        # Rule 4: Low NPS with issue raised
        if nps_score is not None and feedback.get("issue_raised"):
            try:
                if float(nps_score) < 6:
                    logger.info("manual_review_flag", reason="low_nps_with_issue")
                    return True
            except (ValueError, TypeError):
                pass
        
        # Rule 5: Critical keywords in issue
        issue_text = (feedback.get("issue_raised") or "").lower()
        if issue_text:
            for keyword in CRITICAL_KEYWORDS:
                if keyword in issue_text:
                    logger.info(
                        "manual_review_flag",
                        reason="critical_keyword",
                        keyword=keyword
                    )
                    return True
        
        return False
    
    @staticmethod
    def extract_priority_level(feedback: Dict) -> str:
        """
        Determine priority level for manual review.
        
        Args:
            feedback: Feedback dict
        
        Returns:
            Priority level: 'high', 'medium', or 'low'
        """
        nps_score = feedback.get("nps_score")
        
        # High priority
        if feedback.get("escalation_flag"):
            return "high"
        
        if nps_score is not None:
            try:
                nps_float = float(nps_score)
                if nps_float < 4:
                    return "high"
            except (ValueError, TypeError):
                pass
        
        if feedback.get("issue_raised"):
            issue_text = feedback["issue_raised"].lower()
            for keyword in CRITICAL_KEYWORDS:
                if keyword in issue_text:
                    return "high"
        
        # Medium priority
        if nps_score is not None:
            try:
                nps_float = float(nps_score)
                if nps_float < 7:
                    return "medium"
            except (ValueError, TypeError):
                pass
        
        if feedback.get("callback_requested"):
            return "medium"
        
        # Low priority (default)
        return "low"
