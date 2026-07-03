#!/bin/bash
set -euo pipefail

echo "[tradevo] Running database migrations..."
alembic upgrade head
echo "[tradevo] Migrations complete."

echo "[tradevo] Starting application: $*"
exec "$@"