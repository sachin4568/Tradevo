# ─── Stage 1: Builder ───
FROM python:3.12-slim AS builder

WORKDIR /install

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency manifests first for layer caching
COPY pyproject.toml ./

# Install dependencies only (no app code)
RUN pip install --no-cache-dir --prefix=/install .

# ─── Stage 2: Runtime ───
FROM python:3.12-slim AS runtime

WORKDIR /app

# Install only runtime libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r tradevo \
    && useradd -r -g tradevo -d /app -s /sbin/nologin tradevo

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application source
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini ./
COPY scripts/ ./scripts/
COPY docker-entrypoint.sh ./
COPY docker-healthcheck.sh ./

# Create non-root directories
RUN mkdir -p /app/logs && chown -R tradevo:tradevo /app

USER tradevo

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD ["/app/docker-healthcheck.sh"]

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]