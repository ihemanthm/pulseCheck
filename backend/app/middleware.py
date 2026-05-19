from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.responses import JSONResponse
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Create rate limiter
limiter = Limiter(key_func=get_remote_address)


def setup_middleware(app: FastAPI):
    """Configure CORS and other middleware"""
    
    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Add rate limiter error handler
    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
        logger.warning(
            "rate_limit_exceeded",
            client=request.client.host if request.client else None,
            path=request.url.path
        )
        return JSONResponse(
            status_code=429,
            content={"error": "Too many requests", "detail": "Rate limit exceeded"}
        )
    
    # Request/Response logging middleware
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        logger.info(
            "request_started",
            method=request.method,
            path=request.url.path,
            client=request.client.host if request.client else None
        )
        response = await call_next(request)
        logger.info(
            "request_completed",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code
        )
        return response
