# Deployment Guide

## Prerequisites

- Python 3.12+
- PostgreSQL 16+
- Environment variables configured (see `.env.example`)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://tradevo:tradevo@localhost:5432/tradevo` |
| `JWT_SECRET_KEY` | Secret key for JWT tokens (min 32 chars) | `change-me-in-production-min-32-chars-long!!` |
| `AI_PROVIDER` | AI mode: `mock` or `live` | `mock` |
| `LLM_PROVIDER` | LLM backend: `openai`, `anthropic`, `gemini`, `openrouter`, `ollama` | `openai` |
| `MARKET_PROVIDER` | Market data: `mock`, `alpha_vantage`, `yahoo_finance` | `mock` |
| `NEWS_PROVIDER` | News: `mock`, `newsapi` | `mock` |
| `LOG_LEVEL` | Logging level: `DEBUG`, `INFO`, `WARNING`, `ERROR` | `INFO` |
| `LOG_FORMAT` | Log format: `json` or `text` (auto-detected by level) | auto |
| `METRICS_ENABLED` | Enable metrics collection | `false` |
| `TRACING_ENABLED` | Enable distributed tracing | `false` |
| `SECURITY_HEADERS_ENABLED` | Enable security response headers | `true` |
| `RATE_LIMIT_ENABLED` | Enable rate limiting | `true` |
| `RATE_LIMIT_DEFAULT` | Default rate limit | `100/hour` |
| `REQUEST_MAX_SIZE_MB` | Max request body size | `10` |
| `DEBUG` | Enable debug mode (Swagger UI) | `false` |

### AI Provider Keys

| Variable | Provider |
|----------|----------|
| `OPENAI_API_KEY` | OpenAI |
| `ANTHROPIC_API_KEY` | Anthropic |
| `GEMINI_API_KEY` | Google Gemini |
| `OPENROUTER_API_KEY` | OpenRouter |
| `OLLAMA_BASE_URL` | Ollama (local, no key needed) |

### Market/News Provider Keys

| Variable | Provider |
|----------|----------|
| `ALPHA_VANTAGE_API_KEY` | Alpha Vantage |
| `NEWS_API_ORG_KEY` | NewsAPI.org |

## Docker Deployment

### Quick Start

```bash
# Build and start all services
docker compose up -d --build

# View logs
docker compose logs -f tradevo

# Stop
docker compose down
```

### Production Docker

```bash
# Build production image
docker build -t tradevo-backend:1.0.0 .

# Run with environment file
docker run -d \
  --name tradevo \
  -p 8000:8000 \
  --env-file .env.production \
  tradevo-backend:1.0.0
```

### Docker Configuration

The Docker image:
- Uses multi-stage build (builder + runtime)
- Runs as non-root user `tradevo`
- Executes database migrations on startup
- Includes built-in healthcheck
- Exposes port 8000

### Health Checks

Container health is checked via `/health` endpoint:

```bash
# Manual check
curl http://localhost:8000/health

# Readiness (checks database, providers, cache)
curl http://localhost:8000/ready
```

## Manual Deployment

### 1. Install Dependencies

```bash
pip install -e ".[dev]"
```

### 2. Run Migrations

```bash
alembic upgrade head
```

### 3. Start the Application

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 4. Verify

```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/infra/status
```

## Database Operations

```bash
# Run migrations
python scripts/db_ops.py migrate

# Check current revision
python scripts/db_ops.py status

# Verify connectivity
python scripts/db_ops.py verify

# Generate backup command
python scripts/db_ops.py backup --output /backups/tradevo.sql

# Generate restore command
python scripts/db_ops.py restore /backups/tradevo.sql
```

## Reverse Proxy (Nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name api.tradevo.dev;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```