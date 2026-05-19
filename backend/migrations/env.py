"""Alembic environment configuration."""
import os
import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine

from alembic import context
from app.db import Base
import app.models  # noqa: F401

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# Get database URL from environment or config
database_url = os.getenv("DATABASE_URL")
if not database_url:
    from app.config import settings
    database_url = settings.database_url

# Normalize URL: Supabase gives "postgres://", SQLAlchemy needs "postgresql://"
database_url = database_url.replace("postgres://", "postgresql://", 1)

# Ensure asyncpg driver is specified for create_async_engine
if "postgresql+asyncpg://" not in database_url:
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    context.configure(
        url=database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = create_async_engine(
        database_url,
        poolclass=pool.NullPool,
    )
    async with connectable.begin() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())