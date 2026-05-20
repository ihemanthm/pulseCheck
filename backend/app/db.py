from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings
import ssl

# SSL context for Supabase (self-signed cert)
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# Strip sslmode query param — asyncpg rejects it, we pass ssl via connect_args
database_url = settings.database_url
for param in ["?sslmode=require", "&sslmode=require",
              "?sslmode=prefer", "&sslmode=prefer",
              "?sslmode=disable", "&sslmode=disable"]:
    database_url = database_url.replace(param, "")

# Create async engine
engine = create_async_engine(
    database_url,
    connect_args={"ssl": ssl_context},
    echo=False,
    future=True,
    pool_pre_ping=True,
)

# Create async session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Base for all models
Base = declarative_base()


async def get_db():
    """Dependency to get database session"""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
