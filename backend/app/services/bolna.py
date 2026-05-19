import httpx
import json
from typing import Optional
from app.config import settings
from app.utils.errors import BolnaAPIError
from app.utils.logger import get_logger

logger = get_logger(__name__)


class BolnaService:
    """Service for interacting with Bolna API"""
    
    def __init__(self):
        self.base_url = settings.bolna_base_url
        self.api_key = settings.bolna_api_key
        self.agent_id = settings.bolna_agent_id
    
    async def trigger_call(self, order: 'Order', call_id: str) -> dict:
        """
        Trigger an outbound call via Bolna API.
        
        Args:
            order: Order object with customer details
            call_id: Internal call ID to track webhook responses
        
        Returns:
            Bolna API response containing call_id
        
        Raises:
            BolnaAPIError: If API call fails
        """
        
        # Sanitize phone number - ensure +91 country code for Indian numbers
        phone_number = order.customer_phone
        # Extract digits only
        digits_only = ''.join(c for c in phone_number if c.isdigit())
        
        # Add +91 if 10 digits (India) or not starting with +
        if len(digits_only) == 10:
            phone_number = '+91' + digits_only
        elif not phone_number.startswith('+'):
            phone_number = '+91' + digits_only
        
        # Build payload with user_data containing order variables (specific fields only)
        payload = {
            "agent_id": self.agent_id,
            "recipient_phone_number": phone_number,
            "user_data": {
                "customer_name": order.customer_name,
                "product_name": order.product_name,
                "purchase_channel": order.purchase_mode or "unknown",
                "purchase_date": order.purchase_date.isoformat() if order.purchase_date else "",
                "brand_name": order.brand or ""
            }
        }
        
        try:
            # Strip and validate API key
            api_key = self.api_key.strip() if isinstance(self.api_key, str) else self.api_key
            auth_header = f"Bearer {api_key}"
            
            logger.info(
                "call_api_debug",
                base_url=self.base_url,
                agent_id=self.agent_id,
                phone_number=phone_number,
                api_key_start=api_key[:10] if api_key else "NONE"
            )
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/call",
                    json=payload,
                    headers={"Authorization": auth_header},
                    timeout=30.0
                )
            
            # Only return response if status is 200
            if response.status_code == 200:
                result = response.json()
                # Log full response to understand structure
                logger.info(
                    "bolna_api_response",
                    order_id=str(order.id),
                    response=result
                )
                return result
            
            # Handle error responses
            error_text = response.text
            logger.error(
                "bolna_api_error",
                status_code=response.status_code,
                error=error_text,
                order_id=str(order.id)
            )
            raise BolnaAPIError(f"Bolna API error: {response.status_code} - {error_text}")
        
        except httpx.RequestError as e:
            logger.error(
                "bolna_request_error",
                error=str(e),
                order_id=str(order.id)
            )
            raise BolnaAPIError(f"Failed to connect to Bolna API: {str(e)}")
    
    async def get_call_status(self, bolna_call_id: str) -> Optional[dict]:
        """
        Get call status from Bolna API.
        
        Args:
            bolna_call_id: Bolna's call identifier
        
        Returns:
            Call status or None if not found
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/call/{bolna_call_id}/status",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    timeout=10.0
                )
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 404:
                return None
            else:
                logger.warning(
                    "bolna_status_error",
                    status_code=response.status_code,
                    bolna_call_id=bolna_call_id
                )
                return None
        
        except httpx.RequestError as e:
            logger.error(
                "bolna_status_request_error",
                error=str(e),
                bolna_call_id=bolna_call_id
            )
            return None
