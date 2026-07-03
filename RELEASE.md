# Release Notes

## v1.0.0 — Final Production Release

### Release Date: 2026-07-02

### What's Included

This is the final production release of the Tradevo backend platform.

### Milestones Delivered

| Milestone | Description |
|-----------|-------------|
| M1 | User authentication (JWT, registration, login, profile) |
| M2 | Market data & company information (providers, search, filtering) |
| M3 | Portfolio management & trade execution (virtual cash, buy/sell) |
| M4 | Learning system (sessions, progress, statistics) |
| M5 | Research & watchlist (AI reports, company tracking) |
| M6 | AI Execution Platform (request manager, provider manager, caching, telemetry) |
| M7 | AI engines (portfolio analysis, educational feedback, learning guidance) |
| M7.1 | Backend architecture refinement |
| M8 | Production integration (provider adapters, health checks, security hardening) |
| M9 | Release engineering (CI/CD, Docker, documentation, cleanup) |

### API Version

All endpoints are versioned under `/api/v1/`. The API version is available at:

```
GET /api/v1/infra/version
```

### Upgrade Process

#### From Development to Production

1. Set environment variables in production (see DEPLOYMENT.md)
2. Run `alembic upgrade head` to apply all migrations
3. Build Docker image: `docker build -t tradevo-backend:1.0.0 .`
4. Deploy with `docker compose up -d`

#### Database Migrations

```bash
# Check current state
python scripts/db_ops.py status

# Apply migrations
python scripts/db_ops.py migrate

# Verify connectivity
python scripts/db_ops.py verify
```

### Breaking Changes

None. All API contracts are backward-compatible from M1 through M9.

### Dependencies

Core:
- Python 3.12+
- FastAPI >= 0.115
- SQLAlchemy >= 2.0 (async)
- PostgreSQL (asyncpg driver)
- Pydantic >= 2.10

Optional:
- `openai`, `anthropic`, `google-genai` for live AI
- `prometheus-client`, `opentelemetry-*` for observability

### Security

- JWT dual-token authentication
- bcrypt password hashing (12 rounds)
- Input sanitization (XSS, injection prevention)
- Security headers on all responses
- Per-endpoint rate limiting
- Request size limits
- Circuit breakers on external providers
- API keys never logged