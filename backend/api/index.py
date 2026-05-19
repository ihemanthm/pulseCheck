"""
Vercel ASGI Handler
Entry point for Vercel serverless deployment
"""
import os
import sys
from pathlib import Path

# Add parent directory to path
backend_root = Path(__file__).parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from app.main import app

# Export for Vercel
__all__ = ["app"]
