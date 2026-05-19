#!/usr/bin/env python
"""
Simple migration script for Vercel build phase
Just run migrations - that's it.
"""
import os
import sys
from pathlib import Path

backend_root = Path(__file__).parent.parent

# Run migrations
print("Running database migrations...")
os.chdir(backend_root)

from alembic.config import Config
from alembic import command

alembic_cfg = Config(str(backend_root / "migrations" / "alembic.ini"))
alembic_cfg.set_main_option("sqlalchemy.url", os.getenv("DATABASE_URL"))

try:
    command.upgrade(alembic_cfg, "head")
    print("✓ Migrations completed successfully")
except Exception as e:
    print(f"✗ Migration failed: {e}")
    sys.exit(1)


