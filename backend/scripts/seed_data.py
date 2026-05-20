"""
Seed initial data to the database.
This script only runs if the database is empty (no users exist).
"""

import asyncio
import csv
import os
import sys
from datetime import datetime
from decimal import Decimal
from pathlib import Path

# Add parent directory to path so we can import app modules
# Handle both local (backend/scripts/) and Docker (/app/scripts/) execution
backend_dir = Path(__file__).parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.models import Order, User, CSVUpload
from app.db import Base
from app.utils.logger import get_logger

logger = get_logger(__name__)


# Get project root - handles both local and Docker environments
def get_sample_data_dir() -> Path:
    """Get the sample data directory path"""
    # __file__ is /app/scripts/seed_data.py inside Docker or {project}/backend/scripts/seed_data.py locally
    backend_dir = Path(__file__).parent.parent  # Get /app or {project}/backend
    sample_data_path = backend_dir / "sample_data"
    
    if sample_data_path.exists():
        return sample_data_path
    
    # Fallback for other possible locations
    possible_paths = [
        Path("/app/sample_data"),  # Docker fallback
    ]
    
    for path in possible_paths:
        if path.exists():
            return path
    
    logger.warning(f"Sample data directory not found at {sample_data_path}")
    return sample_data_path  # Return the expected path anyway


SAMPLE_DATA_DIR = get_sample_data_dir()


async def check_database_empty(session: AsyncSession) -> bool:
    """Check if database is empty by checking if any users exist."""
    try:
        result = await session.execute(sa.select(sa.func.count(User.id)))
        user_count = result.scalar()
        return user_count == 0
    except Exception as e:
        logger.error(f"Error checking database: {e}")
        return False


async def seed_users(session: AsyncSession) -> bool:
    """
    Seed sample users from SQL file.
    Returns True if successful, False otherwise.
    """
    try:
        sql_file = SAMPLE_DATA_DIR / "sample_users.sql"
        
        if not sql_file.exists():
            logger.error(f"Sample users file not found: {sql_file}")
            return False
        
        with open(sql_file, 'r') as f:
            sql_content = f.read()
        
        # Execute raw SQL for user inserts
        # Split by semicolon to handle multiple statements
        statements = [s.strip() for s in sql_content.split(';') if s.strip()]
        
        for statement in statements:
            if statement:
                await session.execute(sa.text(statement))
        
        await session.commit()
        logger.info("Successfully seeded sample users")
        return True
        
    except Exception as e:
        logger.error(f"Error seeding users: {e}")
        await session.rollback()
        return False


async def seed_orders(session: AsyncSession) -> bool:
    """
    Seed sample orders from CSV file.
    Returns True if successful, False otherwise.
    """
    try:
        csv_file = SAMPLE_DATA_DIR / "sample_orders.csv"
        
        if not csv_file.exists():
            logger.error(f"Sample orders file not found: {csv_file}")
            return False
        
        # Create a CSV upload record
        csv_upload = CSVUpload(
            filename="sample_orders.csv",
            row_count=0,  # Will update after counting
            status="done",
            s3_upload_status="pending"
        )
        session.add(csv_upload)
        await session.flush()  # Get the ID without committing yet
        
        # Read CSV and create orders
        orders = []
        row_count = 0
        
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                row_count += 1
                try:
                    order = Order(
                        upload_id=csv_upload.id,
                        invoice_number=row['invoice_number'],
                        sku=row.get('sku', ''),
                        product_name=row['product_name'],
                        customer_name=row['customer_name'],
                        customer_phone=row['customer_phone'],
                        purchase_date=datetime.strptime(row['purchase_date'], '%Y-%m-%d').date() if row.get('purchase_date') else None,
                        amount_paid=Decimal(row['amount_paid']) if row.get('amount_paid') else None,
                        purchase_mode=row.get('purchase_mode', ''),
                        brand=row.get('brand', ''),
                        purchase_qty=int(row['purchase_qty']) if row.get('purchase_qty') else None,
                        call_status='pending'
                    )
                    orders.append(order)
                except Exception as e:
                    logger.warning(f"Error processing row {row_count}: {e}")
                    continue
        
        # Update row count
        csv_upload.row_count = row_count
        
        # Add all orders
        session.add_all(orders)
        await session.commit()
        
        logger.info(f"Successfully seeded {len(orders)} sample orders from {row_count} CSV rows")
        return True
        
    except Exception as e:
        logger.error(f"Error seeding orders: {e}")
        await session.rollback()
        return False


async def main():
    """Main seed function."""
    try:
        # Strip sslmode query param — asyncpg rejects it
        database_url = settings.database_url
        for param in ["?sslmode=require", "&sslmode=require",
                      "?sslmode=prefer", "&sslmode=prefer",
                      "?sslmode=disable", "&sslmode=disable"]:
            database_url = database_url.replace(param, "")
        
        # SSL context for Supabase
        import ssl
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        # Create async engine
        engine = create_async_engine(
            database_url,
            connect_args={"ssl": ssl_context},
            echo=False,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
        )
        
        # Create tables if they don't exist
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        # Create session
        AsyncSessionLocal = sessionmaker(
            engine, 
            class_=AsyncSession, 
            expire_on_commit=False,
            autocommit=False,
            autoflush=False
        )
        
        async with AsyncSessionLocal() as session:
            # Check if database is empty
            is_empty = await check_database_empty(session)
            
            if not is_empty:
                logger.info("Database already contains data. Skipping seed.")
                await engine.dispose()
                return
            
            logger.info("Database is empty. Starting seed process...")
            
            # Seed users
            if await seed_users(session):
                logger.info("✓ Users seeded successfully")
            else:
                logger.error("✗ Failed to seed users")
            
            # Seed orders
            if await seed_orders(session):
                logger.info("✓ Orders seeded successfully")
            else:
                logger.error("✗ Failed to seed orders")
            
            logger.info("Seed process completed!")
        
        await engine.dispose()
        
    except Exception as e:
        logger.error(f"Seed failed with error: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
