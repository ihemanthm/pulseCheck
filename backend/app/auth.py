import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
from app.config import settings
from app.utils.errors import UnauthorizedError


class JWTService:
    """JWT token generation and verification"""
    
    @staticmethod
    def create_access_token(user_id: str, username: str, role: str) -> str:
        """Create JWT access token"""
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(hours=settings.jwt_expiration_hours)
        
        payload = {
            "sub": user_id,
            "username": username,
            "role": role,
            "type": "access",
            "iat": now,
            "exp": expires_at,
        }
        
        return jwt.encode(
            payload,
            settings.jwt_secret,
            algorithm=settings.jwt_algorithm
        )
    
    @staticmethod
    def create_refresh_token(user_id: str) -> str:
        """Create JWT refresh token"""
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(days=settings.jwt_refresh_expiration_days)
        
        payload = {
            "sub": user_id,
            "type": "refresh",
            "iat": now,
            "exp": expires_at,
        }
        
        return jwt.encode(
            payload,
            settings.jwt_secret,
            algorithm=settings.jwt_algorithm
        )
    
    @staticmethod
    def verify_token(token: str, token_type: str = "access") -> dict:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(
                token,
                settings.jwt_secret,
                algorithms=[settings.jwt_algorithm]
            )
            
            if payload.get("type") != token_type:
                raise UnauthorizedError("Invalid token type")
            
            return payload
        
        except jwt.ExpiredSignatureError:
            raise UnauthorizedError("Token has expired")
        except jwt.InvalidTokenError as e:
            raise UnauthorizedError(f"Invalid token: {str(e)}")
