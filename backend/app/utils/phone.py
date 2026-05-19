import re
from app.utils.errors import InvalidPhoneError


def normalize_phone(phone_str: str) -> str:
    """
    Normalize phone number to E.164 format.
    
    Args:
        phone_str: Raw phone number string
    
    Returns:
        Normalized phone in E.164 format (e.g., +919876543210)
    
    Raises:
        InvalidPhoneError: If phone is invalid
    """
    if not phone_str:
        raise InvalidPhoneError("Phone number cannot be empty")
    
    # Remove leading/trailing whitespace
    phone_str = phone_str.strip()
    
    # Remove all non-digit characters except leading +
    if phone_str.startswith('+'):
        phone_str = '+' + re.sub(r'\D', '', phone_str)
    else:
        phone_str = re.sub(r'\D', '', phone_str)
    
    # Remove leading + if present for length check
    digits_only = phone_str.replace('+', '')
    
    # Validate length (10-15 digits per international standard)
    if len(digits_only) < 10 or len(digits_only) > 15:
        raise InvalidPhoneError(
            f"Phone number must have 10-15 digits, got {len(digits_only)}"
        )
    
    # Add country code if not present (assume +91 for India if 10 digits)
    if not phone_str.startswith('+'):
        if len(digits_only) == 10:
            phone_str = '+91' + digits_only
        else:
            # Add + for other cases
            phone_str = '+' + digits_only
    
    return phone_str


def validate_phone(phone_str: str) -> bool:
    """
    Validate phone number format.
    
    Args:
        phone_str: Raw phone number string
    
    Returns:
        True if valid, False otherwise
    """
    try:
        normalize_phone(phone_str)
        return True
    except InvalidPhoneError:
        return False
