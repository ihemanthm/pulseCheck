from fastapi import APIRouter, HTTPException, status, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from app.db import get_db
from app.models import User
from app.schemas.auth import LoginRequest, TokenResponse, RefreshRequest, UserResponse
from app.services.auth import AuthService
from app.auth import JWTService
from app.dependencies import get_current_user
from app.utils.logger import get_logger
from slowapi import Limiter
from slowapi.util import get_remote_address

logger = get_logger(__name__)
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(
    request: Request,
    request_data: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Login user and return JWT tokens.
    
    Rate limited to 10 requests per minute.
    """
    
    # Find user by username
    stmt = select(User).where(User.username == request_data.username)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user or not AuthService.verify_password(request_data.password, user.password_hash):
        logger.warning("login_failed", username=request_data.username, reason="invalid_credentials")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    if not user.is_active:
        logger.warning("login_failed", username=request_data.username, reason="user_inactive")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Generate tokens
    access_token = JWTService.create_access_token(
        user_id=str(user.id),
        username=user.username,
        role=user.role
    )
    refresh_token = JWTService.create_refresh_token(user_id=str(user.id))
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.add(user)
    await db.commit()
    
    logger.info("login_successful", username=user.username, role=user.role)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=24 * 60 * 60  # 24 hours in seconds
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request_data: RefreshRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Refresh access token using refresh token.
    """
    
    try:
        # Verify refresh token
        payload = JWTService.verify_token(request_data.refresh_token, token_type="refresh")
        user_id = payload.get("sub")
        
        # Get user
        stmt = select(User).where(User.id == user_id)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Generate new access token
        access_token = JWTService.create_access_token(
            user_id=str(user.id),
            username=user.username,
            role=user.role
        )
        
        # Generate new refresh token
        new_refresh_token = JWTService.create_refresh_token(user_id=str(user.id))
        
        logger.info("token_refreshed", user_id=user_id)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            expires_in=24 * 60 * 60
        )
    
    except Exception as e:
        logger.error("token_refresh_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current authenticated user info"""
    return UserResponse(
        id=str(current_user.id),
        username=current_user.username,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active
    )
