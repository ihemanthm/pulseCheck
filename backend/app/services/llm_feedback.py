"""LLM-based feedback extraction using Google Gemini API"""
import json
import os
from typing import Dict, Any, Optional
import google.generativeai as genai
from app.utils.logger import get_logger

logger = get_logger(__name__)


class LLMFeedbackExtractor:
    """Extract structured feedback from call transcripts using Gemini API"""
    
    # Gemini model to use
    MODEL = "gemini-2.5-flash"
    
    @staticmethod
    def initialize() -> bool:
        """Initialize Gemini API with API key from environment"""
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.warning("GEMINI_API_KEY not set, LLM feedback extraction disabled")
            return False
        
        try:
            genai.configure(api_key=api_key)
            return True
        except Exception as e:
            logger.error("failed_to_initialize_gemini", error=str(e))
            return False
    
    @staticmethod
    async def extract_feedback(
        transcript: str,
        summary: str,
        customer_context: Optional[Dict[str, str]] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Extract structured feedback from call transcript and summary using Gemini.
        
        Args:
            transcript: Full call transcript
            summary: Call summary from Bolna
            customer_context: Optional context like customer_name, product_name, etc.
        
        Returns:
            Dict with extracted feedback fields, or None if extraction fails
        """
        
        if not os.getenv("GEMINI_API_KEY"):
            logger.info("gemini_disabled_no_api_key")
            return None
        
        try:
            logger.info(
                "starting_llm_extraction",
                transcript_length=len(transcript) if transcript else 0,
                summary_length=len(summary) if summary else 0
            )
            
            # Build context string from customer info
            context_str = ""
            if customer_context:
                context_str = "\n".join(
                    f"- {k}: {v}" for k, v in customer_context.items() if v
                )
            
            # Create detailed extraction prompt
            prompt = f"""Analyze the following customer service call transcript and summary to extract structured feedback.

CALL SUMMARY:
{summary}

FULL TRANSCRIPT:
{transcript}

{f"CUSTOMER CONTEXT:{chr(10)}{context_str}" if context_str else ""}

Extract and return ONLY a JSON object (no markdown, no extra text) with these exact fields:
{{
    "nps_score": <integer 0-10 or null>,
    "sentiment": "<positive|neutral|negative>",
    "primary_feedback": "<main feedback text or null>",
    "issue_raised": "<key issue mentioned or null>",
    "positive_highlight": "<positive aspect mentioned or null>",
    "call_language": "<detected language code like 'en', 'hi', etc.>",
    "verbatim_quote": "<relevant quote from transcript or null>",
    "escalation_flag": <boolean>,
    "callback_requested": <boolean>,
    "callback_reasons": "<reason for callback if requested, or null>",
    "product_satisfaction": "<satisfied|neutral|dissatisfied>",
    "service_quality": "<satisfied|neutral|dissatisfied>",
    "key_actions": ["<action1>", "<action2>"]
}}

IMPORTANT:
- If NPS score is not explicitly mentioned, infer from overall sentiment (9-10=promoter, 7-8=passive, 0-6=detractor)
- Extract from actual conversation content, not assumptions
- Set escalation_flag=true only if customer is clearly upset or issue is severe
- Return null for fields that cannot be determined from the conversation
- Ensure valid JSON output"""

            # Call Gemini API
            logger.info("calling_gemini_api")
            model = genai.GenerativeModel(LLMFeedbackExtractor.MODEL)
            response = model.generate_content(prompt)
            
            if not response.text:
                logger.warning("gemini_empty_response", transcript_length=len(transcript))
                return None
            
            logger.info("gemini_api_response_received")
            
            # Parse JSON response
            response_text = response.text.strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
            response_text = response_text.strip()
            
            extracted = json.loads(response_text)
            
            logger.info(
                "feedback_extracted_successfully",
                nps_score=extracted.get("nps_score"),
                sentiment=extracted.get("sentiment"),
                extraction_success=True
            )
            
            return extracted
            
        except json.JSONDecodeError as e:
            logger.error("failed_to_parse_gemini_json", error=str(e), response_text_preview=response_text[:200] if 'response_text' in locals() else None)
            return None
        except Exception as e:
            logger.error("gemini_extraction_failed", error=str(e), error_type=type(e).__name__)
            return None
    
    @staticmethod
    def map_gemini_to_feedback(gemini_response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Map Gemini extraction response to feedback table columns.
        
        Args:
            gemini_response: Raw response from Gemini extraction
        
        Returns:
            Dict formatted for Feedback model
        """
        
        # Map sentiment to NPS category
        nps_score = gemini_response.get("nps_score")
        sentiment = gemini_response.get("sentiment", "neutral")
        
        nps_category = None
        if nps_score is not None:
            if nps_score >= 9:
                nps_category = "promoter"
            elif nps_score >= 7:
                nps_category = "passive"
            else:
                nps_category = "detractor"
        
        return {
            "nps_score": nps_score,
            "nps_category": nps_category,
            "overall_sentiment": sentiment,
            "primary_feedback": gemini_response.get("primary_feedback"),
            "issue_raised": gemini_response.get("issue_raised"),
            "positive_highlight": gemini_response.get("positive_highlight"),
            "escalation_flag": gemini_response.get("escalation_flag", False),
            "callback_requested": gemini_response.get("callback_requested", False),
            "call_language": gemini_response.get("call_language"),
            "verbatim_quote": gemini_response.get("verbatim_quote"),
            "review_status": "auto_extracted",  # Mark as auto-extracted for later review
            # Store full LLM response for reference
            "llm_extraction_data": gemini_response
        }
