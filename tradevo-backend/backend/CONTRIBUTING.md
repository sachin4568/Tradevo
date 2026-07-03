# Contributing to Tradevo Backend

## Development Setup

### Prerequisites

- Python 3.12+
- PostgreSQL 16+ (or use SQLite for tests)

### Install

```bash
# Clone and enter directory
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Install with dev dependencies
pip install -e ".[dev]"
```

### Configuration

Create `.env` for local development:

```env
DEBUG=true
DATABASE_URL=postgresql+asyncpg://tradevo:tradevo@localhost:5432/tradevo
JWT_SECRET_KEY=local-dev-secret-key-change-in-production!!
AI_PROVIDER=mock
MARKET_PROVIDER=mock
NEWS_PROVIDER=mock
LOG_LEVEL=DEBUG
METRICS_ENABLED=false
RATE_LIMIT_ENABLED=false
SECURITY_HEADERS_ENABLED=false
```

### Database Setup

```bash
# Create database
createdb tradevo

# Run migrations
alembic upgrade head

# Seed data (optional)
python scripts/seed.py
```

### Run Tests

```bash
# Run all tests
pytest tests/ -q

# Run with coverage
pytest tests/ --cov=app --cov-report=term-missing

# Run specific test file
pytest tests/unit/test_portfolio_service.py -v
```

### Lint

```bash
# Check lint
ruff check app/

# Auto-fix
ruff check app/ --fix
```

## Code Style

- **Linter**: Ruff with pyproject.toml config
- **Line length**: 100 characters
- **Target**: Python 3.12
- **Type hints**: Required for all new code

### Logging

Use stdlib `logging` with %-style formatting:

```python
import logging
logger = logging.getLogger(__name__)

# CORRECT — stdlib %-formatting
logger.info("user_registered user_id=%s email=%s", user.id, user.email)

# WRONG — structlog kwargs (causes TypeError with stdlib logger)
logger.info("user_registered", user_id=user.id)
```

### Caching

Always return a copy from cache to prevent mutation:

```python
# CORRECT — copy before returning
cached_data = cache.get(key)
if cached_data:
    result = {**cached_data, "cached": True}
    return result
```

## Architecture

- `app/api/` — FastAPI routers, middleware, request/response schemas
- `app/config/` — Pydantic Settings classes (environment-driven)
- `app/core/` — Database, security, exceptions, utilities
- `app/dependencies.py` — FastAPI dependency injection
- `app/integrations/` — External provider adapters (LLM, market, news)
- `app/modules/` — Domain modules (auth, portfolio, market, etc.)
- `app/observability/` — Logging, metrics, tracing, health checks
- `app/main.py` — Application factory and lifespan

## Git Workflow

1. Create a feature branch from `develop`
2. Make changes with tests
3. Ensure all tests pass: `pytest tests/ -q`
4. Ensure lint passes: `ruff check app/`
5. Commit with descriptive messages
6. Open a pull request to `develop`

## Pull Request Checklist

- [ ] All tests pass (`pytest tests/ -q`)
- [ ] No lint errors (`ruff check app/`)
- [ ] New code has test coverage
- [ ] No secrets or credentials in code
- [ ] API contracts are not broken
- [ ] Documentation updated if needed