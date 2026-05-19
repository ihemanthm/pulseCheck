#!/bin/bash
# Simple init script - just run migrations and start the server
set -e

echo "Starting PulseCheck Backend..."
echo "Running database migrations..."

# Set working directory
cd /app

# Run alembic migrations with explicit config file location
alembic upgrade head

echo "✓ Migrations complete! Starting server..."

# Start the server
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
