#!/bin/bash
# Simple init script - just run migrations and start the server
set -e

echo "Starting PulseCheck Backend..."
echo "Running database migrations..."

# Ensure we're in the app directory for Python imports to work
cd /app

# Run alembic migrations
# Use absolute path to config and ensure PYTHONPATH includes app directory
PYTHONPATH=/app alembic -c /app/migrations/alembic.ini upgrade head

echo "✓ Migrations complete! Starting server..."

# Start the server
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
