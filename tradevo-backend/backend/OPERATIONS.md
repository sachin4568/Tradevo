# Operations Guide

## Monitoring

### Health Endpoints

| Endpoint | Purpose | Method |
|----------|---------|--------|
| `/health` | Liveness — process is responsive | GET |
| `/ready` | Readiness — all dependencies healthy | GET |
| `/live` | Detailed liveness check | GET |
| `/api/v1/infra/status` | Deep status with configuration | GET |
| `/api/v1/infra/version` | Version and build metadata | GET |
| `/metrics/prometheus` | Prometheus-style metrics | GET |

### Metrics

Enable metrics collection with `METRICS_ENABLED=true`.

Collected metrics:
- **Request metrics**: `requests_total`, `request_duration_ms`, `requests_active`
- **Error metrics**: `errors_total`
- **Application metrics**: `app_info`, `app_uptime_seconds`
- **AI telemetry**: available via `/api/v1/infra/status` under `ai`
- **Cache stats**: available via `/api/v1/infra/status` under `cache`

### Log Format

Production logs are structured JSON when `LOG_LEVEL` is `WARNING`, `ERROR`, or `CRITICAL`, or when `LOG_FORMAT=json` is set.

Each log entry includes:
- `timestamp` — ISO 8601
- `level` — log level
- `event` — log message
- `request_id` — correlation ID (when available)
- `logger` — module name

### Request Correlation

Every request receives a unique `X-Request-ID` header. This ID is:
- Included in all response headers
- Bound to the structlog context for the request lifecycle
- Propagated to all log entries during that request

## Rate Limiting

Rate limiting is enabled by default. Limits are configurable per endpoint category:

| Category | Default Limit |
|----------|--------------|
| Default | 100/hour |
| Auth | 20/minute |
| AI/Research | 30/hour |
| Market data | 60/minute |
| Trading | 30/minute |

Rate limit headers are included in every response:
- `X-RateLimit-Limit` — max requests in the window
- `X-RateLimit-Remaining` — remaining requests
- `X-RateLimit-Reset` — window reset timestamp

## Security

### Security Headers

The following headers are added to all API responses (configurable via `SECURITY_HEADERS_ENABLED`):
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 0`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; form-action 'self'`

### Input Sanitization

All user input passes through the `InputSanitizer`:
- Control characters stripped
- Dangerous patterns detected (script tags, javascript: URIs, etc.)
- Provider output HTML-escaped before returning to clients

### Request Size Limit

Maximum request body size: `REQUEST_MAX_SIZE_MB` (default 10MB). Returns 413 if exceeded.

## Troubleshooting

### 503 on `/ready`

The readiness check reports `unhealthy` when the database is unreachable. Check:
1. `DATABASE_URL` is correct
2. PostgreSQL is running and accepting connections
3. Network/firewall allows the connection

### 429 Rate Limit Exceeded

- Check `X-RateLimit-Reset` header for when the window resets
- Adjust `RATE_LIMIT_*` environment variables for your traffic

### AI Service Unavailable

AI endpoints gracefully return `null` data when the AI provider is down. Check:
1. `AI_PROVIDER` is set correctly (`mock` for development)
2. API key is set for the chosen `LLM_PROVIDER`
3. Circuit breaker state via `/api/v1/infra/status`

### Migration Errors

```bash
# Check current state
python scripts/db_ops.py status

# Verify database connectivity
python scripts/db_ops.py verify

# Run migrations manually
alembic upgrade head
```

### Memory/Performance

- Check `app_uptime_seconds` and `request_duration_ms` in metrics
- Review connection pool settings: `DATABASE_POOL_SIZE`, `DATABASE_MAX_OVERFLOW`
- Adjust `AI_CACHE_MAX_SIZE` and `AI_CACHE_TTL` for cache tuning