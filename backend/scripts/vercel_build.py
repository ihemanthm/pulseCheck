"""
Vercel Build Script for Database Migrations
This script runs during the Vercel build phase to set up the database
"""
import os
import sys
import asyncio
from pathlib import Path

# Setup path
backend_root = Path(__file__).parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

async def run_migrations():
    """Run Alembic migrations"""
    print("=" * 60)
    print("VERCEL BUILD: Running Database Migrations")
    print("=" * 60)
    
    try:
        from app.config import settings
        from alembic.config import Config
        from alembic import command
        
        # Verify database connection
        print(f"\n✓ Database URL loaded from environment")
        print(f"  DB Host: {settings.database_url.split('@')[1].split('/')[0] if '@' in settings.database_url else 'N/A'}")
        
        # Configure Alembic
        alembic_cfg = Config(str(backend_root / "migrations" / "alembic.ini"))
        alembic_cfg.set_main_option("script_location", str(backend_root / "migrations"))
        alembic_cfg.set_main_option("sqlalchemy.url", settings.database_url)
        
        # Run migrations
        print("\n→ Upgrading database to head version...")
        command.upgrade(alembic_cfg, "head")
        print("✓ Migrations completed successfully!")
        
        # Seed data
        try:
            print("\n→ Checking if database needs seeding...")
            from scripts.seed_data import main as seed_main
            await seed_main()
            print("✓ Database seeding completed!")
        except Exception as e:
            print(f"⚠ Seeding skipped/failed (this is OK if DB already has data): {e}")
        
        print("\n" + "=" * 60)
        print("BUILD PHASE COMPLETED SUCCESSFULLY")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ ERROR during build phase: {e}")
        print("\nIMPORTANT: Check your environment variables in Vercel dashboard:")
        print("  - DATABASE_URL must be set")
        print("  - All other required env vars must be present")
        raise

if __name__ == "__main__":
    asyncio.run(run_migrations())
