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


# Startup event for database migrations and seeding
@app.on_event("startup")
async def startup_event():
    """
    Run database migrations on startup (for local dev)
    In Vercel, migrations run during the build phase via vercel_build.py
    """
    import os
    
    # Only run migrations in local/development environments
    # In Vercel, migrations run during build phase
    if os.getenv("VERCEL") != "1":
        try:
            import sys
            from pathlib import Path
            
            # Add parent directory to path to import scripts and modules
            backend_root = Path(__file__).parent.parent
            if str(backend_root) not in sys.path:
                sys.path.insert(0, str(backend_root))

            # Programmatically run Alembic migrations
            logger.info("Running database migrations programmatically...")
            from alembic.config import Config
            from alembic import command
            
            alembic_cfg = Config(str(backend_root / "migrations" / "alembic.ini"))
            alembic_cfg.set_main_option("script_location", str(backend_root / "migrations"))
            alembic_cfg.set_main_option("sqlalchemy.url", settings.database_url)
            command.upgrade(alembic_cfg, "head")
            logger.info("Database migrations completed successfully!")
            
            # Seed data
            from scripts.seed_data import main as seed_main
            logger.info("Checking if database needs seeding...")
            await seed_main()
        except Exception as e:
            logger.warning(f"Database initialization or seeding skipped/failed: {e}")
    else:
        logger.info("Running in Vercel environment - migrations already handled in build phase")


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
