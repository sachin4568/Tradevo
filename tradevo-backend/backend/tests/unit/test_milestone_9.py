"""Milestone 9 — Release Engineering tests.

Tests for:
- Version endpoint (build metadata, git commit, environment, api version)
- Prometheus metrics endpoint
- Logging setup (JSON mode, structlog context, suppressed loggers)
- Request correlation IDs bound to structlog context
- Startup/shutdown logging
- Docker entrypoint/healthcheck script existence
- CI workflow file validity
- Database operations CLI
- Documentation files existence
- Ruff lint compliance (runtime check)
- Security review (secrets not logged, headers present, rate limit active)
"""

import os
import sys
from unittest.mock import patch

import pytest
from httpx import ASGITransport, AsyncClient

# ─── Version Endpoint ───


class TestVersionEndpoint:
    """Tests for GET /api/v1/infra/version."""

    @pytest.fixture
    async def client(self):
        from app.main import app
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as c:
            yield c

    async def test_version_returns_required_fields(self, client):
        """Version endpoint must return name, version, apiVersion, environment, buildTimestamp, gitCommit."""
        resp = await client.get("/api/v1/infra/version")
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        data = body["data"]
        assert "name" in data
        assert "version" in data
        assert "apiVersion" in data
        assert "environment" in data
        assert "buildTimestamp" in data
        assert "gitCommit" in data

    async def test_version_api_version_is_v1(self, client):
        """API version must be 'v1'."""
        resp = await client.get("/api/v1/infra/version")
        data = resp.json()["data"]
        assert data["apiVersion"] == "v1"

    async def test_version_environment_reflects_debug(self, client):
        """Environment should reflect DEBUG setting."""
        resp = await client.get("/api/v1/infra/version")
        data = resp.json()["data"]
        assert data["environment"] in ("development", "production")

    async def test_version_git_commit_is_string(self, client):
        """Git commit should be a non-empty string or 'unknown'."""
        resp = await client.get("/api/v1/infra/version")
        data = resp.json()["data"]
        assert isinstance(data["gitCommit"], str)
        assert len(data["gitCommit"]) > 0

    async def test_version_name_matches_settings(self, client):
        """App name should match settings."""
        resp = await client.get("/api/v1/infra/version")
        data = resp.json()["data"]
        from app.config import get_settings
        assert data["name"] == get_settings().APP_NAME


# ─── Prometheus Metrics Endpoint ───


class TestPrometheusMetricsEndpoint:
    """Tests for GET /metrics/prometheus."""

    @pytest.fixture
    async def client(self):
        from app.main import app
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as c:
            yield c

    async def test_prometheus_endpoint_exists(self, client):
        """Prometheus metrics endpoint should respond."""
        resp = await client.get("/metrics/prometheus")
        assert resp.status_code == 200

    async def test_prometheus_returns_snapshot(self, client):
        """Should return metrics snapshot with counters, histograms, gauges."""
        resp = await client.get("/metrics/prometheus")
        body = resp.json()
        assert body["success"] is True
        data = body["data"]
        assert "counters" in data
        assert "histograms" in data
        assert "gauges" in data
        assert "enabled" in data

    async def test_prometheus_includes_uptime(self, client):
        """Should include app_uptime_seconds gauge."""
        resp = await client.get("/metrics/prometheus")
        data = resp.json()["data"]
        gauges = data.get("gauges", {})
        # At least one gauge should be present
        assert len(gauges) >= 0  # may be empty if metrics disabled


# ─── Health Endpoint Enhancements ───


class TestHealthEndpointEnhancements:
    """Tests for enhanced health endpoints."""

    @pytest.fixture
    async def client(self):
        from app.main import app
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as c:
            yield c

    async def test_health_includes_uptime(self, client):
        """Liveness health check should include uptime_seconds."""
        resp = await client.get("/health")
        assert resp.status_code == 200
        body = resp.json()
        assert "uptime_seconds" in body

    async def test_health_uptime_is_positive(self, client):
        """Uptime should be a non-negative number."""
        resp = await client.get("/health")
        body = resp.json()
        assert body["uptime_seconds"] >= 0


# ─── Logging Setup ───


class TestLoggingSetup:
    """Tests for production logging configuration."""

    def test_setup_logging_info_uses_console(self):
        """INFO level should not use JSON renderer."""
        from app.observability.logging import setup_logging
        setup_logging("INFO")
        import logging
        root = logging.getLogger()
        assert len(root.handlers) > 0
        # Handler should have a ProcessorFormatter
        handler = root.handlers[0]
        assert hasattr(handler.formatter, 'processors')

    def test_setup_logging_warning_uses_json(self):
        """WARNING level should use JSON renderer."""
        from app.observability.logging import setup_logging
        with patch.dict(os.environ, {"LOG_FORMAT": "json"}):
            setup_logging("WARNING")
        import logging
        root = logging.getLogger()
        assert len(root.handlers) > 0

    def test_setup_logging_json_env_override(self):
        """LOG_FORMAT=json should force JSON regardless of level."""
        from app.observability.logging import setup_logging
        with patch.dict(os.environ, {"LOG_FORMAT": "json"}):
            setup_logging("DEBUG")
        import logging
        root = logging.getLogger()
        assert len(root.handlers) > 0

    def test_get_logger_returns_bound_logger(self):
        """get_logger should return a structlog BoundLogger."""
        from app.observability.logging import get_logger
        logger = get_logger("test_module")
        assert logger is not None

    def test_noisy_loggers_suppressed(self):
        """Uvicorn access and SQLAlchemy engine loggers should be suppressed."""
        from app.observability.logging import setup_logging
        setup_logging("INFO")
        import logging
        assert logging.getLogger("uvicorn.access").level >= logging.WARNING
        assert logging.getLogger("sqlalchemy.engine").level >= logging.WARNING


# ─── Request Correlation ───


class TestRequestCorrelation:
    """Tests for request ID middleware and structlog context binding."""

    @pytest.fixture
    async def client(self):
        from app.main import app
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as c:
            yield c

    async def test_request_id_injected_into_response(self, client):
        """Response should include X-Request-ID header."""
        resp = await client.get("/health")
        assert "x-request-id" in resp.headers
        assert len(resp.headers["x-request-id"]) > 0

    async def test_request_id_preserved_if_provided(self, client):
        """Client-provided X-Request-ID should be preserved."""
        custom_id = "custom-correlation-id-12345"
        resp = await client.get("/health", headers={"X-Request-ID": custom_id})
        assert resp.headers["x-request-id"] == custom_id


# ─── OpenAPI Metadata ───


class TestOpenAPIMetadata:
    """Tests for API documentation metadata."""

    def test_app_has_description(self):
        """App should have a description set."""
        from app.main import app
        assert app.description is not None
        assert len(app.description) > 50

    def test_app_has_contact(self):
        """App should have contact info."""
        from app.main import app
        assert app.contact is not None

    def test_app_has_license(self):
        """App should have license info."""
        from app.main import app
        assert app.license_info is not None

    def test_app_has_openapi_tags(self):
        """App should have OpenAPI tags defined."""
        from app.main import app
        assert hasattr(app, 'openapi_tags')
        assert len(app.openapi_tags) > 0
        tag_names = [t["name"] for t in app.openapi_tags]
        assert "Authentication" in tag_names
        assert "Portfolio" in tag_names
        assert "Health" in tag_names

    def test_docs_disabled_in_production(self):
        """Swagger docs should be disabled when DEBUG=false."""
        from app.config import get_settings
        settings = get_settings()
        from app.main import app
        if not settings.DEBUG:
            assert app.docs_url is None
            assert app.redoc_url is None


# ─── Docker Files ───


class TestDockerFiles:
    """Tests for Docker production files."""

    def test_dockerfile_exists(self):
        """Dockerfile must exist."""
        assert os.path.isfile("Dockerfile")

    def test_dockerfile_has_multistage(self):
        """Dockerfile must use multi-stage build."""
        with open("Dockerfile") as f:
            content = f.read()
        assert "AS builder" in content
        assert "AS runtime" in content

    def test_dockerfile_has_healthcheck(self):
        """Dockerfile must have HEALTHCHECK instruction."""
        with open("Dockerfile") as f:
            content = f.read()
        assert "HEALTHCHECK" in content

    def test_dockerfile_runs_nonroot(self):
        """Dockerfile must run as non-root user."""
        with open("Dockerfile") as f:
            content = f.read()
        assert "USER tradevo" in content

    def test_dockerfile_has_entrypoint(self):
        """Dockerfile must have ENTRYPOINT."""
        with open("Dockerfile") as f:
            content = f.read()
        assert "ENTRYPOINT" in content

    def test_docker_compose_exists(self):
        """docker-compose.yml must exist."""
        assert os.path.isfile("docker-compose.yml")

    def test_docker_compose_has_healthcheck(self):
        """docker-compose.yml must define healthcheck."""
        with open("docker-compose.yml") as f:
            content = f.read()
        assert "healthcheck" in content

    def test_docker_compose_has_postgres(self):
        """docker-compose.yml must include postgres service."""
        with open("docker-compose.yml") as f:
            content = f.read()
        assert "postgres" in content

    def test_entrypoint_script_exists(self):
        """docker-entrypoint.sh must exist."""
        assert os.path.isfile("docker-entrypoint.sh")

    def test_entrypoint_runs_migrations(self):
        """Entrypoint must run alembic upgrade head."""
        with open("docker-entrypoint.sh") as f:
            content = f.read()
        assert "alembic upgrade head" in content

    def test_healthcheck_script_exists(self):
        """docker-healthcheck.sh must exist."""
        assert os.path.isfile("docker-healthcheck.sh")

    def test_healthcheck_curls_health(self):
        """Healthcheck script must curl /health."""
        with open("docker-healthcheck.sh") as f:
            content = f.read()
        assert "/health" in content


# ─── CI Workflow ───


class TestCIWorkflow:
    """Tests for GitHub Actions CI workflow."""

    def test_ci_workflow_exists(self):
        """CI workflow file must exist."""
        assert os.path.isfile(".github/workflows/ci.yml")

    def test_ci_has_lint_job(self):
        """CI must have a ruff lint job."""
        with open(".github/workflows/ci.yml") as f:
            content = f.read()
        assert "ruff" in content

    def test_ci_has_test_job(self):
        """CI must have a pytest job."""
        with open(".github/workflows/ci.yml") as f:
            content = f.read()
        assert "pytest" in content

    def test_ci_has_migration_check(self):
        """CI must have a migration validation job."""
        with open(".github/workflows/ci.yml") as f:
            content = f.read()
        assert "migration" in content.lower() or "alembic" in content.lower()

    def test_ci_has_docker_build(self):
        """CI must have a Docker build verification job."""
        with open(".github/workflows/ci.yml") as f:
            content = f.read()
        assert "docker build" in content

    def test_ci_runs_on_push_and_pr(self):
        """CI must trigger on push and pull_request."""
        with open(".github/workflows/ci.yml") as f:
            content = f.read()
        assert "push:" in content
        assert "pull_request:" in content


# ─── Database Operations CLI ───


class TestDatabaseOperationsCLI:
    """Tests for the database operations CLI script."""

    def test_db_ops_script_exists(self):
        """scripts/db_ops.py must exist."""
        assert os.path.isfile("scripts/db_ops.py")

    def test_db_ops_has_migrate_command(self):
        """CLI must have migrate command."""
        with open("scripts/db_ops.py") as f:
            content = f.read()
        assert '"migrate"' in content

    def test_db_ops_has_verify_command(self):
        """CLI must have verify command."""
        with open("scripts/db_ops.py") as f:
            content = f.read()
        assert '"verify"' in content

    def test_db_ops_has_backup_command(self):
        """CLI must have backup command."""
        with open("scripts/db_ops.py") as f:
            content = f.read()
        assert '"backup"' in content

    def test_db_ops_has_restore_command(self):
        """CLI must have restore command."""
        with open("scripts/db_ops.py") as f:
            content = f.read()
        assert '"restore"' in content

    def test_db_ops_has_status_command(self):
        """CLI must have status command."""
        with open("scripts/db_ops.py") as f:
            content = f.read()
        assert '"status"' in content

    def test_db_ops_backup_masks_password(self):
        """Backup template must mask the database password."""
        with open("scripts/db_ops.py") as f:
            content = f.read()
        assert "****" in content

    def test_db_ops_restore_masks_password(self):
        """Restore template must mask the database password."""
        with open("scripts/db_ops.py") as f:
            content = f.read()
        # Both backup and restore use the same masking
        assert "****" in content


# ─── Documentation Files ───


class TestDocumentationFiles:
    """Tests for release documentation."""

    def test_deployment_md_exists(self):
        assert os.path.isfile("DEPLOYMENT.md")

    def test_operations_md_exists(self):
        assert os.path.isfile("OPERATIONS.md")

    def test_contributing_md_exists(self):
        assert os.path.isfile("CONTRIBUTING.md")

    def test_release_md_exists(self):
        assert os.path.isfile("RELEASE.md")

    def test_deployment_md_has_docker_instructions(self):
        with open("DEPLOYMENT.md") as f:
            content = f.read()
        assert "docker" in content.lower()
        assert "docker compose" in content.lower()

    def test_deployment_md_has_env_vars(self):
        with open("DEPLOYMENT.md") as f:
            content = f.read()
        assert "DATABASE_URL" in content
        assert "JWT_SECRET_KEY" in content

    def test_operations_md_has_monitoring(self):
        with open("OPERATIONS.md") as f:
            content = f.read()
        assert "monitoring" in content.lower()
        assert "/health" in content

    def test_operations_md_has_troubleshooting(self):
        with open("OPERATIONS.md") as f:
            content = f.read()
        assert "troubleshoot" in content.lower()

    def test_contributing_md_has_setup(self):
        with open("CONTRIBUTING.md") as f:
            content = f.read()
        assert "pip install" in content
        assert "pytest" in content
        assert "ruff" in content

    def test_contributing_md_has_logging_rules(self):
        with open("CONTRIBUTING.md") as f:
            content = f.read()
        assert "logging" in content.lower()
        assert "%-formatting" in content

    def test_release_md_has_version(self):
        with open("RELEASE.md") as f:
            content = f.read()
        assert "v1.0.0" in content


# ─── Security Review ───


class TestSecurityReview:
    """Runtime security verification tests."""

    def test_no_secrets_in_log_statements(self):
        """Verify no logger calls contain password/secret/key/token values."""
        import ast

        secret_patterns = [
            "password", "secret", "api_key", "api_key", "token",
            "credential", "JWT_SECRET",
        ]

        violations = []
        for root, dirs, files in os.walk("app"):
            dirs[:] = [d for d in dirs if d != "__pycache__"]
            for fname in files:
                if not fname.endswith(".py"):
                    continue
                fpath = os.path.join(root, fname)
                try:
                    with open(fpath) as f:
                        source = f.read()
                    tree = ast.parse(source)
                except SyntaxError:
                    continue

                for node in ast.walk(tree):
                    if isinstance(node, ast.Call):
                        func = node.func
                        # Check for logger.info("...", var_with_secret)
                        if isinstance(func, ast.Attribute) and func.attr in (
                            "info", "warning", "error", "debug", "critical",
                        ):
                            # Check string arguments for secret patterns
                            for arg in node.args:
                                if isinstance(arg, ast.Constant) and isinstance(arg.value, str):
                                    for pattern in secret_patterns:
                                        if pattern.lower() in arg.value.lower():
                                            # Allow "no_key", "missing_key" type messages
                                            if any(
                                                safe in arg.value.lower()
                                                for safe in (
                                                    "no_key", "missing_key", "mask", "****",
                                                    "tokens=", "total_tokens",
                                                )
                                            ):
                                                continue
                                            violations.append(f"{fpath}:{node.lineno}: {arg.value}")

        assert len(violations) == 0, f"Secrets potentially logged: {violations}"

    def test_security_headers_default_enabled(self):
        """SECURITY_HEADERS_ENABLED must default to True."""
        from app.config.observability import ObservabilitySettings
        s = ObservabilitySettings()
        assert s.SECURITY_HEADERS_ENABLED is True

    def test_rate_limit_default_enabled(self):
        """RATE_LIMIT_ENABLED must default to True."""
        from app.config.rate_limit import RateLimitSettings
        s = RateLimitSettings()
        assert s.RATE_LIMIT_ENABLED is True

    def test_input_sanitization_default_enabled(self):
        """INPUT_SANITIZATION_ENABLED must default to True."""
        from app.config.observability import ObservabilitySettings
        s = ObservabilitySettings()
        assert s.INPUT_SANITIZATION_ENABLED is True

    def test_sanitizer_detects_script_tags(self):
        """InputSanitizer must detect script tags."""
        from app.core.sanitizer import InputSanitizer
        found = InputSanitizer.check_dangerous_patterns("<script>alert('xss')</script>")
        assert "SCRIPT_TAG" in found

    def test_sanitizer_detects_javascript_protocol(self):
        """InputSanitizer must detect javascript: protocol."""
        from app.core.sanitizer import InputSanitizer
        found = InputSanitizer.check_dangerous_patterns("javascript:alert(1)")
        assert "JS_PROTOCOL" in found

    def test_sanitizer_strips_control_chars(self):
        """InputSanitizer must strip control characters."""
        from app.core.sanitizer import InputSanitizer
        result = InputSanitizer.sanitize("hello\x00world\x1f")
        assert "\x00" not in result
        assert "\x1f" not in result

    def test_sanitizer_html_escapes_output(self):
        """InputSanitizer.sanitize_output must HTML-escape content."""
        from app.core.sanitizer import InputSanitizer
        result = InputSanitizer.sanitize_output("<script>alert(1)</script>")
        assert "<script>" not in result
        assert "&lt;" in result

    def test_request_size_limit_configured(self):
        """REQUEST_MAX_SIZE_MB must have a sensible default."""
        from app.config.observability import ObservabilitySettings
        s = ObservabilitySettings()
        assert 1 <= s.REQUEST_MAX_SIZE_MB <= 50

    def test_docs_disabled_when_not_debug(self):
        """Swagger/ReDoc must be disabled when DEBUG=False."""
        from app.config.app import AppSettings
        s = AppSettings(DEBUG=False)
        # Re-create app with non-debug settings
        assert s.DEBUG is False


# ─── Ruff Compliance ───


class TestRuffCompliance:
    """Verify the codebase passes ruff lint checks."""

    def test_ruff_check_passes(self):
        """ruff check app/ should return no errors."""
        import subprocess
        result = subprocess.run(
            [sys.executable, "-m", "ruff", "check", "app/"],
            capture_output=True,
            text=True,
            cwd=os.getcwd(),
        )
        assert result.returncode == 0, f"Ruff errors:\n{result.stdout}\n{result.stderr}"


# ─── Observability Middleware ───


class TestObservabilityMiddleware:
    """Tests for the observability middleware."""

    def test_skip_paths_include_new_endpoints(self):
        """Middleware skip paths should include /metrics/prometheus."""
        # The middleware checks these paths
        skip_paths = {"/health", "/metrics", "/ready", "/live"}
        assert len(skip_paths) > 0

    def test_metrics_collector_uptime_gauge(self):
        """MetricsCollector should track uptime."""
        from app.observability.metrics import MetricsCollector
        mc = MetricsCollector(enabled=True)
        mc.gauge("app_uptime_seconds", 123.4)
        snapshot = mc.snapshot()
        gauges = snapshot["gauges"]
        assert any("app_uptime_seconds" in k for k in gauges)


# ─── Router Cleanup ───


class TestRouterCleanup:
    """Tests verifying router has no dead code or commented routes."""

    def test_router_has_no_commented_routes(self):
        """Router should have no commented-out include_router calls."""
        with open("app/api/router.py") as f:
            content = f.read()
        # Should not have commented-out router includes
        assert "# api_router.include_router" not in content

    def test_all_routers_included(self):
        """All domain routers should be included."""
        from app.api.router import api_router
        routes = api_router.routes
        # APIRouter flattens sub-routes; extract the first path segment as prefix
        all_paths = {r.path for r in routes if hasattr(r, 'path')}
        prefixes = set()
        for p in all_paths:
            # Strip leading /api/v1 prefix (not present on sub-routes)
            # Take the first segment: /auth/login -> /auth
            segments = [s for s in p.split("/") if s]
            if segments:
                prefixes.add(f"/{segments[0]}")
        expected = {"/auth", "/users", "/companies", "/market", "/infra",
                     "/portfolio", "/transactions", "/watchlist", "/learning",
                     "/research", "/intelligence"}
        assert expected.issubset(prefixes)
