from typing import Optional, NamedTuple
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db import get_db
from app.auth import JWTService
from app.models import User
from app.utils.errors import UnauthorizedError
from app.utils.logger import get_logger

logger = get_logger(__name__)

security = HTTPBearer()


class HTTPAuthCredentials(NamedTuple):
    """HTTP Authentication Credentials"""
    scheme: str
    credentials: str


async def get_current_user(
    credentials: HTTPAuthCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token.
    
    Raises:
        HTTPException: If token is invalid or user not found
    """
    try:
        token = credentials.credentials
        payload = JWTService.verify_token(token, token_type="access")
        user_id = payload.get("sub")
        
        if not user_id:
            raise UnauthorizedError("Invalid token claims")
        
        # Fetch user from database
        stmt = select(User).where(User.id == user_id)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user or not user.is_active:
            raise UnauthorizedError("User not found or inactive")
        
        return user
    
    except UnauthorizedError as e:
        logger.warning("unauthorized_access", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"}
        )
    except Exception as e:
        logger.error("auth_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )


async def get_current_operator(
    user: User = Depends(get_current_user)
) -> User:
    """
    Ensure current user has operator or higher privileges.
    """
    allowed_roles = {"operator", "reviewer", "admin"}
    if user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    return user


async def get_current_reviewer(
    user: User = Depends(get_current_user)
) -> User:
    """
    Ensure current user has reviewer or admin privileges.
    """
    allowed_roles = {"reviewer", "admin"}
    if user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    return user


async def get_current_admin(
    user: User = Depends(get_current_user)
) -> User:
    """
    Ensure current user has admin privileges.
    """
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return user
