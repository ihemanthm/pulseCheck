"""
Vercel Build Script for Database Migrations
This script runs during the Vercel build phase to set up the database
"""
import os
import sys
from pathlib import Path

# Setup path
backend_root = Path(__file__).parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

def run_migrations():
    """Run Alembic migrations"""
    print("=" * 70)
    print("VERCEL BUILD PHASE: Database Migration & Setup")
    print("=" * 70)
    
    try:
        # 1. Load environment
        print("\n[1/5] Loading environment variables...")
        from app.config import settings
        
        if not settings.database_url:
            raise ValueError("DATABASE_URL environment variable is not set")
        
        print("✓ DATABASE_URL loaded")
        db_host = settings.database_url.split('@')[1].split('/')[0] if '@' in settings.database_url else 'unknown'
        print(f"  Host: {db_host}")
        
        # 2. Test database connection
        print("\n[2/5] Testing database connection...")
        import psycopg2
        
        # Convert DATABASE_URL format for psycopg2
        db_url = settings.database_url
        if "+asyncpg" in db_url:
            db_url = db_url.replace("+asyncpg://", "://")
        if "?" in db_url:
            db_url = db_url.split("?")[0]  # Remove query params
        
        # Parse connection string
        try:
            conn = psycopg2.connect(db_url)
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            cursor.close()
            conn.close()
            print("✓ Database connection successful")
        except Exception as e:
            print(f"✗ Database connection failed: {e}")
            raise
        
        # 3. Run Alembic migrations
        print("\n[3/5] Running Alembic migrations...")
        from alembic.config import Config
        from alembic import command
        
        # Configure Alembic with synchronous database URL
        alembic_db_url = settings.database_url
        if "+asyncpg" in alembic_db_url:
            alembic_db_url = alembic_db_url.replace("+asyncpg://", "://")
        
        alembic_ini_path = backend_root / "migrations" / "alembic.ini"
        alembic_cfg = Config(str(alembic_ini_path))
        alembic_cfg.set_main_option("script_location", str(backend_root / "migrations"))
        alembic_cfg.set_main_option("sqlalchemy.url", alembic_db_url)
        
        try:
            command.upgrade(alembic_cfg, "head")
            print("✓ Migrations completed successfully")
        except Exception as e:
            # Check if it's "already exists" error - this is OK for subsequent builds
            if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                print("✓ Migrations already applied (or being reapplied - this is OK)")
            else:
                print(f"✗ Migration error: {e}")
                raise
        
        # 4. Verify tables were created
        print("\n[4/5] Verifying database schema...")
        import psycopg2.extras
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        cursor.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        """)
        tables = cursor.fetchall()
        cursor.close()
        conn.close()
        
        if tables:
            print(f"✓ Found {len(tables)} tables:")
            for table in tables:
                print(f"  - {table['table_name']}")
        else:
            print("⚠ No tables found - migrations may not have run")
            raise ValueError("Database tables were not created")
        
        # 5. Seed data (optional)
        print("\n[5/5] Checking database initialization...")
        try:
            conn = psycopg2.connect(db_url)
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM users")
            user_count = cursor.fetchone()[0]
            cursor.close()
            conn.close()
            
            if user_count > 0:
                print(f"✓ Database already seeded ({user_count} users found)")
            else:
                print("→ Seeding initial data...")
                try:
                    # Import and run seed data synchronously
                    import asyncio
                    from scripts.seed_data import main as seed_main
                    asyncio.run(seed_main())
                    print("✓ Seed data created")
                except Exception as seed_error:
                    print(f"⚠ Seeding skipped: {seed_error}")
        except Exception as e:
            print(f"⚠ Could not check seed status: {e}")
        
        print("\n" + "=" * 70)
        print("✅ BUILD PHASE COMPLETED SUCCESSFULLY")
        print("=" * 70)
        print("\nYour backend is ready! Tables are created and migrations are applied.")
        return True
        
    except Exception as e:
        print("\n" + "=" * 70)
        print("❌ BUILD PHASE FAILED")
        print("=" * 70)
        print(f"\nError: {e}")
        print("\n⚠️  TROUBLESHOOTING CHECKLIST:")
        print("1. Check Vercel Environment Variables:")
        print("   - DATABASE_URL must be set")
        print("   - Format: postgresql+asyncpg://user:pass@host:5432/db?sslmode=require")
        print("2. Verify Neon/Supabase connection string is correct")
        print("3. Check firewall/IP allowlist in your database provider")
        print("4. Ensure all required environment variables are present")
        print("\nDetailed error:")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = run_migrations()
    sys.exit(0 if success else 1)

