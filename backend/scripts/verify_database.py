#!/usr/bin/env python
"""
Database Verification Script
Run this locally to verify your Neon/Supabase database connectivity and schema
"""
import sys
from pathlib import Path

# Add backend root to path
backend_root = Path(__file__).parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

def main():
    print("=" * 70)
    print("DATABASE VERIFICATION SCRIPT")
    print("=" * 70)
    
    try:
        # 1. Load environment
        print("\n[1/4] Loading environment variables...")
        from app.config import settings
        
        if not settings.database_url:
            raise ValueError("DATABASE_URL not set")
        
        print("✓ DATABASE_URL loaded")
        db_url = settings.database_url
        if "@" in db_url:
            host = db_url.split("@")[1].split("/")[0]
            db_name = db_url.split("/")[-1].split("?")[0]
            print(f"  Host: {host}")
            print(f"  Database: {db_name}")
        
        # 2. Test connection
        print("\n[2/4] Testing database connection...")
        import psycopg2
        
        # Convert URL for psycopg2
        test_url = db_url
        if "+asyncpg" in test_url:
            test_url = test_url.replace("+asyncpg://", "://")
        if "?" in test_url:
            test_url = test_url.split("?")[0]
        
        conn = psycopg2.connect(test_url)
        cursor = conn.cursor()
        cursor.execute("SELECT version()")
        version = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        
        print("✓ Connection successful")
        print(f"  PostgreSQL: {version.split(',')[0]}")
        
        # 3. List all tables
        print("\n[3/4] Checking database schema...")
        import psycopg2.extras
        conn = psycopg2.connect(test_url)
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Get all tables
        cursor.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        """)
        tables = cursor.fetchall()
        
        if tables:
            print(f"✓ Found {len(tables)} tables:")
            for table in tables:
                # Get column count
                cursor.execute(f"""
                    SELECT COUNT(*) FROM information_schema.columns 
                    WHERE table_name = '{table['table_name']}'
                """)
                col_count = cursor.fetchone()[0]
                
                # Get row count
                cursor.execute(f"SELECT COUNT(*) FROM {table['table_name']}")
                row_count = cursor.fetchone()[0]
                
                print(f"  • {table['table_name']:25} ({col_count} cols, {row_count} rows)")
        else:
            print("✗ No tables found!")
            print("\n⚠️  SOLUTION:")
            print("  1. Check that DATABASE_URL is set in Vercel environment")
            print("  2. Format: postgresql+asyncpg://user:pass@host:5432/db?sslmode=require")
            print("  3. Redeploy to Vercel: it will run migrations in build phase")
        
        # 4. Check migration status
        print("\n[4/4] Checking migration status...")
        cursor.execute("""
            SELECT * FROM alembic_version
        """)
        versions = cursor.fetchall()
        cursor.close()
        conn.close()
        
        if versions:
            for v in versions:
                print(f"✓ Migration applied: {v[0]}")
        else:
            print("✗ No migration history found")
        
        print("\n" + "=" * 70)
        if tables:
            print("✅ DATABASE LOOKS GOOD!")
            print("=" * 70)
            print("\nYour database schema is set up correctly.")
            return 0
        else:
            print("❌ DATABASE SCHEMA MISSING")
            print("=" * 70)
            return 1
            
    except Exception as e:
        print(f"\n✗ Error: {e}")
        print("\n" + "=" * 70)
        print("❌ VERIFICATION FAILED")
        print("=" * 70)
        print("\nDEBUGGING STEPS:")
        print("1. Verify DATABASE_URL format:")
        print("   postgresql+asyncpg://user:password@host:5432/dbname?sslmode=require")
        print("\n2. For Neon:")
        print("   - Go to https://console.neon.tech")
        print("   - Copy connection string from 'Connection String' tab")
        print("   - Add +asyncpg after postgresql://")
        print("   - Add ?sslmode=require at the end")
        print("\n3. For Supabase:")
        print("   - Go to project settings → Database")
        print("   - Use connection string from 'Connection string' section")
        print("   - Add +asyncpg after postgresql://")
        print("   - Ensure ?sslmode=require is present")
        print("\n4. In Vercel dashboard:")
        print("   - Settings → Environment Variables")
        print("   - Verify DATABASE_URL is set for all environments")
        print("   - Redeploy the project")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
