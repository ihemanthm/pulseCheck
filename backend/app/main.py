from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.config import settings
from app.middleware import setup_middleware, limiter
from app.utils.logger import setup_logging, get_logger
from app.routers import auth, orders, calls

logger = get_logger(__name__)

# Setup logging
setup_logging()

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="PulseCheck: Voice Feedback Collection & Analytics Platform",
    version="1.0.0"
)


# Startup event
@app.on_event("startup")
async def startup_event():
    """Simple startup - migrations are handled by init script"""
    logger.info("Application startup complete")


# Add state and limiter
app.state.limiter = limiter
app.add_exception_handler(
    Exception,
    lambda request, exc: JSONResponse(
        status_code=500,
        content={"error": "Internal server error"}
    )
)

# Setup middleware (CORS, rate limiting, logging)
setup_middleware(app)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(calls.router, prefix="/api")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "environment": settings.app_env
    }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "app": settings.app_name,
        "version": "1.0.0",
        "docs": "/docs"
    }

# Exception handlers
@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    logger.error("value_error", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=400,
        content={"error": "Bad request", "detail": str(exc)}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error("unhandled_exception", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"}
    )

logger.info("app_started", environment=settings.app_env, version="1.0.0")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
