#!/bin/bash
# Simple init script - just run migrations and start the server
set -e

echo "Starting PulseCheck Backend..."
echo "Running database migrations..."

# Run alembic migrations
cd /app
alembic upgrade head

echo "Migrations complete! Starting server..."

# Start the server
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
