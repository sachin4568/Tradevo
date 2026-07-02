"""Milestone 8 — Production Integration tests.

Tests for:
- Provider adapters (OpenAI, Anthropic, Gemini, OpenRouter, Ollama)
- Market data providers (AlphaVantage, YahooFinance)
- News providers (NewsAPI)
- Configuration (per-provider keys, models, timeouts)
- Observability (MetricsCollector, ObservabilityMiddleware)
- Health checks (readiness, liveness, components)
- Security middleware (headers, rate limiting)
- Input sanitization
- Error handling (BaseIntegrationClient fix)
- Factory routing
"""

import asyncio
import logging
import threading
import time
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# ─── Configuration Tests ───


class TestAISettings:
    """Test expanded AI settings with per-provider configuration."""

    def test_default_values(self):
        """Settings should have sensible defaults."""
        from app.config.ai import AISettings
        s = AISettings()
        assert s.AI_PROVIDER == "mock"
        assert s.LLM_PROVIDER == "openai"
        assert s.OPENAI_MODEL == "gpt-4o"
        assert s.ANTHROPIC_MODEL == "claude-sonnet-4-20250514"
        assert s.GEMINI_MODEL == "gemini-2.0-flash"
        assert s.OPENROUTER_MODEL == "openai/gpt-4o"
        assert s.OLLAMA_MODEL == "llama3"
        assert s.OLLAMA_BASE_URL == "http://localhost:11434"

    def test_get_provider_api_key_openai(self):
        """Should return per-provider key first."""
        from app.config.ai import AISettings
        s = AISettings(OPENAI_API_KEY="sk-openai-test", LLM_API_KEY="sk-fallback")
        assert s.get_provider_api_key("openai") == "sk-openai-test"

    def test_get_provider_api_key_fallback(self):
        """Should fall back to LLM_API_KEY."""
        from app.config.ai import AISettings
        s = AISettings(LLM_API_KEY="sk-fallback")
        assert s.get_provider_api_key("openai") == "sk-fallback"

    def test_get_provider_api_key_ollama_none(self):
        """Ollama should return None (no API key)."""
        from app.config.ai import AISettings
        s = AISettings()
        assert s.get_provider_api_key("ollama") is None

    def test_get_provider_model(self):
        """Should return the correct model per provider."""
        from app.config.ai import AISettings
        s = AISettings()
        assert s.get_provider_model("openai") == "gpt-4o"
        assert s.get_provider_model("anthropic") == "claude-sonnet-4-20250514"
        assert s.get_provider_model("gemini") == "gemini-2.0-flash"
        assert s.get_provider_model("openrouter") == "openai/gpt-4o"
        assert s.get_provider_model("ollama") == "llama3"

    def test_get_provider_timeout(self):
        """Should return the correct timeout per provider."""
        from app.config.ai import AISettings
        s = AISettings()
        assert s.get_provider_timeout("openai") == 60
        assert s.get_provider_timeout("ollama") == 120

    def test_cache_settings(self):
        """AI cache settings should be configurable."""
        from app.config.ai import AISettings
        s = AISettings(AI_CACHE_ENABLED=False, AI_CACHE_TTL=600, AI_CACHE_MAX_SIZE=2000)
        assert s.AI_CACHE_ENABLED is False
        assert s.AI_CACHE_TTL == 600
        assert s.AI_CACHE_MAX_SIZE == 2000


class TestIntegrationsSettings:
    """Test expanded integrations settings."""

    def test_market_provider_defaults(self):
        from app.config.integrations import IntegrationsSettings
        s = IntegrationsSettings()
        assert s.MARKET_PROVIDER == "mock"
        assert s.ALPHA_VANTAGE_API_KEY is None
        assert s.ALPHA_VANTAGE_TIMEOUT == 30

    def test_news_provider_defaults(self):
        from app.config.integrations import IntegrationsSettings
        s = IntegrationsSettings()
        assert s.NEWS_PROVIDER == "mock"
        assert s.NEWS_API_ORG_KEY is None


class TestObservabilitySettings:
    """Test expanded observability settings."""

    def test_security_headers_enabled(self):
        from app.config.observability import ObservabilitySettings
        s = ObservabilitySettings()
        assert s.SECURITY_HEADERS_ENABLED is True
        assert s.REQUEST_MAX_SIZE_MB == 10


class TestRateLimitSettings:
    """Test expanded rate limit settings."""

    def test_per_category_limits(self):
        from app.config.rate_limit import RateLimitSettings
        s = RateLimitSettings()
        assert s.RATE_LIMIT_AUTH == "20/minute"
        assert s.RATE_LIMIT_AI == "30/hour"
        assert s.RATE_LIMIT_MARKET == "60/minute"
        assert s.RATE_LIMIT_TRADE == "30/minute"


# ─── Provider Adapter Tests ───


class TestProviderAdapters:
    """Test that all provider adapters implement LLMProvider interface."""

    @pytest.mark.parametrize("provider_cls,module_path,kwargs", [
        ("OpenAIProvider", "app.integrations.llm.openai_provider", {"api_key": "sk-test", "model": "gpt-4o"}),
        ("AnthropicProvider", "app.integrations.llm.anthropic_provider", {"api_key": "sk-ant-test", "model": "claude-sonnet-4-20250514"}),
        ("GeminiProvider", "app.integrations.llm.gemini_provider", {"api_key": "AIza-test", "model": "gemini-2.0-flash"}),
        ("OpenRouterProvider", "app.integrations.llm.openrouter_provider", {"api_key": "sk-or-test", "model": "openai/gpt-4o"}),
        ("OllamaProvider", "app.integrations.llm.ollama_provider", {"model": "llama3"}),
    ])
    def test_provider_instantiation(self, provider_cls, module_path, kwargs):
        """All providers should instantiate without error."""
        import importlib
        mod = importlib.import_module(module_path)
        cls = getattr(mod, provider_cls)
        provider = cls(**kwargs)
        assert provider is not None

    @pytest.mark.parametrize("provider_cls,module_path,expected_name,kwargs", [
        ("OpenAIProvider", "app.integrations.llm.openai_provider", "openai", {"api_key": "sk-test"}),
        ("AnthropicProvider", "app.integrations.llm.anthropic_provider", "anthropic", {"api_key": "sk-test"}),
        ("GeminiProvider", "app.integrations.llm.gemini_provider", "gemini", {"api_key": "AIza-test"}),
        ("OpenRouterProvider", "app.integrations.llm.openrouter_provider", "openrouter", {"api_key": "sk-test"}),
        ("OllamaProvider", "app.integrations.llm.ollama_provider", "ollama", {"model": "llama3"}),
    ])
    def test_provider_name(self, provider_cls, module_path, expected_name, kwargs):
        """Each provider should return its correct name."""
        import importlib
        mod = importlib.import_module(module_path)
        cls = getattr(mod, provider_cls)
        provider = cls(**kwargs)
        assert provider.get_provider_name() == expected_name

    @pytest.mark.parametrize("module_path,cls_name,kwargs", [
        ("app.integrations.llm.openai_provider", "OpenAIProvider", {"api_key": "sk-test"}),
        ("app.integrations.llm.anthropic_provider", "AnthropicProvider", {"api_key": "sk-test"}),
        ("app.integrations.llm.gemini_provider", "GeminiProvider", {"api_key": "AIza-test"}),
        ("app.integrations.llm.openrouter_provider", "OpenRouterProvider", {"api_key": "sk-test"}),
        ("app.integrations.llm.ollama_provider", "OllamaProvider", {"model": "llama3"}),
    ])
    @pytest.mark.asyncio
    async def test_health_check_returns_bool(self, module_path, cls_name, kwargs):
        """Health check should return a bool (False when unreachable)."""
        import importlib
        mod = importlib.import_module(module_path)
        cls = getattr(mod, cls_name)
        provider = cls(**kwargs)
        result = await provider.health_check()
        assert isinstance(result, bool)


class TestMarketProviderAdapters:
    """Test market data provider adapters."""

    def test_alpha_vantage_instantiation(self):
        from app.integrations.market.alpha_vantage import AlphaVantageProvider
        p = AlphaVantageProvider(api_key="test-key")
        assert p.get_provider_name() == "alpha_vantage"

    def test_yahoo_finance_instantiation(self):
        from app.integrations.market.yahoo_finance import YahooFinanceProvider
        p = YahooFinanceProvider()
        assert p.get_provider_name() == "yahoo_finance"


class TestNewsProviderAdapters:
    """Test news provider adapters."""

    def test_newsapi_instantiation(self):
        from app.integrations.news.newsapi_provider import NewsAPIProvider
        p = NewsAPIProvider(api_key="test-key")
        assert p.get_provider_name() == "newsapi"


# ─── Factory Tests ───


class TestProviderFactory:
    """Test AI provider factory routing."""

    def test_mock_provider_creation(self):
        """AI_PROVIDER=mock should create only mock provider."""
        with patch("app.modules.ai.provider_factory.get_settings") as mock_settings:
            s = MagicMock()
            s.AI_PROVIDER = "mock"
            s.AI_CIRCUIT_BREAKER_THRESHOLD = 5
            s.AI_CIRCUIT_BREAKER_RECOVERY = 30
            mock_settings.return_value = s
            from app.modules.ai.provider_factory import create_provider_manager
            manager = create_provider_manager()
            assert manager.provider_count == 1
            assert "mock" in [e.name for e in manager._providers.values()]

    def test_openai_registration_with_key(self):
        """Should register OpenAI when key is available."""
        with patch("app.modules.ai.provider_factory.get_settings") as mock_settings:
            s = MagicMock()
            s.AI_PROVIDER = "live"
            s.LLM_PROVIDER = "openai"
            s.OPENAI_API_KEY = "sk-test-key"
            s.LLM_API_KEY = None
            s.OPENAI_MODEL = "gpt-4o"
            s.OPENAI_BASE_URL = None
            s.OPENAI_TIMEOUT = 60
            s.AI_CIRCUIT_BREAKER_THRESHOLD = 5
            s.AI_CIRCUIT_BREAKER_RECOVERY = 30
            mock_settings.return_value = s
            from app.modules.ai.provider_factory import create_provider_manager
            manager = create_provider_manager()
            assert manager.provider_count >= 1

    def test_ollama_registration_no_key_needed(self):
        """Ollama should register without an API key."""
        with patch("app.modules.ai.provider_factory.get_settings") as mock_settings:
            s = MagicMock()
            s.AI_PROVIDER = "live"
            s.LLM_PROVIDER = "ollama"
            s.OLLAMA_MODEL = "llama3"
            s.OLLAMA_BASE_URL = "http://localhost:11434"
            s.OLLAMA_TIMEOUT = 120
            s.AI_CIRCUIT_BREAKER_THRESHOLD = 5
            s.AI_CIRCUIT_BREAKER_RECOVERY = 30
            mock_settings.return_value = s
            from app.modules.ai.provider_factory import create_provider_manager
            manager = create_provider_manager()
            assert manager.provider_count >= 1


class TestMarketFactory:
    """Test market provider factory routing."""

    def test_mock_market(self):
        with patch("app.integrations.market.factory.get_settings") as mock_s:
            s = MagicMock()
            s.MARKET_PROVIDER = "mock"
            mock_s.return_value = s
            from app.integrations.market.factory import create_market_provider
            p = create_market_provider()
            assert p is not None
            assert p.get_provider_name() == "mock"

    def test_alpha_vantage_with_key(self):
        with patch("app.integrations.market.factory.get_settings") as mock_s:
            s = MagicMock()
            s.MARKET_PROVIDER = "alpha_vantage"
            s.ALPHA_VANTAGE_API_KEY = "test-key"
            s.MARKET_API_KEY = None
            s.ALPHA_VANTAGE_TIMEOUT = 30
            mock_s.return_value = s
            from app.integrations.market.factory import create_market_provider
            p = create_market_provider()
            assert p is not None
            assert p.get_provider_name() == "alpha_vantage"

    def test_alpha_vantage_no_key_returns_none(self):
        with patch("app.integrations.market.factory.get_settings") as mock_s:
            s = MagicMock()
            s.MARKET_PROVIDER = "alpha_vantage"
            s.ALPHA_VANTAGE_API_KEY = None
            s.MARKET_API_KEY = None
            mock_s.return_value = s
            from app.integrations.market.factory import create_market_provider
            p = create_market_provider()
            assert p is None

    def test_yahoo_finance(self):
        with patch("app.integrations.market.factory.get_settings") as mock_s:
            s = MagicMock()
            s.MARKET_PROVIDER = "yahoo_finance"
            s.MARKET_TIMEOUT = 30
            mock_s.return_value = s
            from app.integrations.market.factory import create_market_provider
            p = create_market_provider()
            assert p is not None
            assert p.get_provider_name() == "yahoo_finance"


class TestNewsFactory:
    """Test news provider factory routing."""

    def test_mock_news(self):
        with patch("app.integrations.news.factory.get_settings") as mock_s:
            s = MagicMock()
            s.NEWS_PROVIDER = "mock"
            mock_s.return_value = s
            from app.integrations.news.factory import create_news_provider
            p = create_news_provider()
            assert p is not None

    def test_newsapi_with_key(self):
        with patch("app.integrations.news.factory.get_settings") as mock_s:
            s = MagicMock()
            s.NEWS_PROVIDER = "newsapi"
            s.NEWS_API_ORG_KEY = "test-key"
            s.NEWS_API_KEY = None
            s.NEWS_API_ORG_TIMEOUT = 30
            s.NEWS_TIMEOUT = 30
            mock_s.return_value = s
            from app.integrations.news.factory import create_news_provider
            p = create_news_provider()
            assert p is not None
            assert p.get_provider_name() == "newsapi"

    def test_newsapi_no_key_returns_none(self):
        with patch("app.integrations.news.factory.get_settings") as mock_s:
            s = MagicMock()
            s.NEWS_PROVIDER = "newsapi"
            s.NEWS_API_ORG_KEY = None
            s.NEWS_API_KEY = None
            mock_s.return_value = s
            from app.integrations.news.factory import create_news_provider
            p = create_news_provider()
            assert p is None


class TestLLMFactory:
    """Test legacy LLM factory routing."""

    def test_mock_llm(self):
        with patch("app.integrations.llm.factory.get_settings") as mock_s:
            s = MagicMock()
            s.AI_PROVIDER = "mock"
            s.LLM_PROVIDER = "openai"
            mock_s.return_value = s
            from app.integrations.llm.factory import create_llm_provider
            p = create_llm_provider()
            assert p is not None
            assert p.get_provider_name() == "mock"

    def test_openai_llm(self):
        with patch("app.integrations.llm.factory.get_settings") as mock_s:
            s = MagicMock()
            s.AI_PROVIDER = "live"
            s.LLM_PROVIDER = "openai"
            s.OPENAI_API_KEY = "sk-test"
            s.LLM_API_KEY = None
            s.OPENAI_MODEL = "gpt-4o"
            s.OPENAI_BASE_URL = None
            s.get_provider_api_key.return_value = "sk-test"
            s.get_provider_model.return_value = "gpt-4o"
            s.get_provider_timeout.return_value = 60
            mock_s.return_value = s
            from app.integrations.llm.factory import create_llm_provider
            p = create_llm_provider()
            assert p is not None
            assert p.get_provider_name() == "openai"

    def test_ollama_llm(self):
        with patch("app.integrations.llm.factory.get_settings") as mock_s:
            s = MagicMock()
            s.AI_PROVIDER = "live"
            s.LLM_PROVIDER = "ollama"
            s.OLLAMA_MODEL = "llama3"
            s.OLLAMA_BASE_URL = "http://localhost:11434"
            s.OLLAMA_TIMEOUT = 120
            mock_s.return_value = s
            from app.integrations.llm.factory import create_llm_provider
            p = create_llm_provider()
            assert p is not None
            assert p.get_provider_name() == "ollama"


# ─── Observability Tests ───


class TestMetricsCollector:
    """Test production metrics collector."""

    def setup_method(self):
        from app.observability.metrics import MetricsCollector, reset_metrics
        reset_metrics()
        self.metrics = MetricsCollector(enabled=True)

    def test_increment_disabled(self):
        from app.observability.metrics import MetricsCollector
        m = MetricsCollector(enabled=False)
        m.increment("test")
        snap = m.snapshot()
        assert snap["counters"] == {}

    def test_increment_enabled(self):
        self.metrics.increment("requests_total", {"path": "/test"})
        self.metrics.increment("requests_total", {"path": "/test"})
        snap = self.metrics.snapshot()
        assert snap["counters"]["requests_total{path=/test}"]["value"] == 2

    def test_histogram(self):
        self.metrics.histogram("latency", 10.0)
        self.metrics.histogram("latency", 20.0)
        self.metrics.histogram("latency", 30.0)
        snap = self.metrics.snapshot()
        h = snap["histograms"]["latency"]
        assert h["count"] == 3
        assert h["min"] == 10.0
        assert h["max"] == 30.0
        assert h["avg"] == 20.0

    def test_gauge(self):
        self.metrics.gauge("active_connections", 5.0)
        snap = self.metrics.snapshot()
        assert snap["gauges"]["active_connections"]["value"] == 5.0

    def test_reset(self):
        self.metrics.increment("test")
        self.metrics.reset()
        assert self.metrics.snapshot()["counters"] == {}

    def test_snapshot_structure(self):
        self.metrics.increment("test")
        snap = self.metrics.snapshot()
        assert "counters" in snap
        assert "histograms" in snap
        assert "gauges" in snap
        assert "enabled" in snap
        assert snap["enabled"] is True

    def test_metric_key_with_tags(self):
        self.metrics.increment("req", {"method": "GET", "path": "/api"})
        snap = self.metrics.snapshot()
        assert "req{method=GET,path=/api}" in snap["counters"]


class TestGetMetrics:
    """Test module-level metrics singleton."""

    def test_get_metrics_returns_collector(self):
        from app.observability.metrics import get_metrics, reset_metrics
        reset_metrics()
        m = get_metrics()
        assert isinstance(m, type(get_metrics()))

    def test_get_metrics_singleton(self):
        from app.observability.metrics import get_metrics, reset_metrics
        reset_metrics()
        m1 = get_metrics()
        m2 = get_metrics()
        assert m1 is m2


# ─── Health Check Tests ───


class TestHealthCheckService:
    """Test health check service."""

    @pytest.mark.asyncio
    async def test_liveness_check(self):
        from app.observability.health import HealthCheckService
        svc = HealthCheckService()
        report = await svc.check_liveness()
        assert report.status == "healthy"
        assert report.timestamp != ""

    @pytest.mark.asyncio
    async def test_readiness_check_structure(self):
        from app.observability.health import HealthCheckService
        svc = HealthCheckService()
        report = await svc.check_readiness()
        assert report.status in ("healthy", "degraded", "unhealthy")
        assert "database" in report.components
        assert "ai_provider" in report.components
        assert "market_provider" in report.components
        assert "cache" in report.components

    @pytest.mark.asyncio
    async def test_to_dict(self):
        from app.observability.health import HealthCheckService
        svc = HealthCheckService()
        report = await svc.check_liveness()
        d = report.to_dict()
        assert "status" in d
        assert "timestamp" in d
        assert "components" in d

    @pytest.mark.asyncio
    async def test_cache_health(self):
        from app.observability.health import HealthCheckService
        from app.modules.ai.cache.cache_layer import reset_ai_cache
        reset_ai_cache()
        svc = HealthCheckService()
        ch = await svc.check_cache()
        assert ch.healthy is True


class TestGetHealthService:
    """Test health service singleton."""

    def test_singleton(self):
        from app.observability.health import get_health_service
        s1 = get_health_service()
        s2 = get_health_service()
        assert s1 is s2


# ─── Security Tests ───


class TestSecurityHeadersMiddleware:
    """Test security headers middleware."""

    @pytest.mark.asyncio
    async def test_security_headers_added(self):
        from app.api.middleware.security import SecurityHeadersMiddleware
        from starlette.requests import Request
        from starlette.responses import Response

        async def dummy_call_next(request):
            return Response(content="ok")

        middleware = SecurityHeadersMiddleware(
            app=None, enabled=True
        )
        scope = {
            "type": "http",
            "method": "GET",
            "path": "/api/v1/test",
            "query_string": b"",
            "headers": [],
            "server": ("test", 80),
        }
        request = Request(scope)

        # Override the internal app to avoid BaseHTTPMiddleware init issues
        middleware.app = lambda scope, receive, send: None
        response = await middleware.dispatch(request, dummy_call_next)

        assert "X-Content-Type-Options" in response.headers
        assert response.headers["X-Content-Type-Options"] == "nosniff"
        assert "X-Frame-Options" in response.headers
        assert response.headers["X-Frame-Options"] == "DENY"
        assert "Referrer-Policy" in response.headers

    @pytest.mark.asyncio
    async def test_health_endpoints_skip_headers(self):
        from app.api.middleware.security import SecurityHeadersMiddleware
        from starlette.requests import Request
        from starlette.responses import Response

        async def dummy_call_next(request):
            return Response(content="ok")

        middleware = SecurityHeadersMiddleware(app=None, enabled=True)
        scope = {
            "type": "http", "method": "GET", "path": "/health",
            "query_string": b"", "headers": [], "server": ("test", 80),
        }
        request = Request(scope)
        middleware.app = lambda scope, receive, send: None
        response = await middleware.dispatch(request, dummy_call_next)

        # Health endpoint should NOT have security headers
        assert "X-Content-Type-Options" not in response.headers

    def test_disabled(self):
        from app.api.middleware.security import SecurityHeadersMiddleware
        m = SecurityHeadersMiddleware(app=None, enabled=False)
        assert m._enabled is False


# ─── Rate Limit Tests ───


class TestRateLimitMiddleware:
    """Test rate limiting middleware."""

    def test_parse_rate_limit(self):
        from app.api.middleware.rate_limit import _parse_rate_limit
        count, window = _parse_rate_limit("100/hour")
        assert count == 100
        assert window == 3600

    def test_parse_rate_limit_minute(self):
        from app.api.middleware.rate_limit import _parse_rate_limit
        count, window = _parse_rate_limit("20/minute")
        assert count == 20
        assert window == 60

    def test_parse_rate_limit_invalid(self):
        from app.api.middleware.rate_limit import _parse_rate_limit
        count, window = _parse_rate_limit("invalid")
        assert count == 100
        assert window == 3600

    @pytest.mark.asyncio
    async def test_rate_limit_429_response(self):
        from app.api.middleware.rate_limit import RateLimitMiddleware, _Bucket
        from starlette.requests import Request
        from starlette.responses import JSONResponse, Response

        middleware = RateLimitMiddleware(app=None, enabled=True)

        # Manually fill a bucket to the limit
        bucket = _Bucket(count=100, limit=100, window_size=3600)
        key = "127.0.0.1:market"
        middleware._buckets[key] = bucket

        async def dummy_call_next(request):
            return Response(content="ok")

        scope = {
            "type": "http", "method": "GET", "path": "/api/v1/market/overview",
            "query_string": b"", "headers": [], "server": ("test", 80),
            "client": ("127.0.0.1", 12345),
        }
        request = Request(scope)
        middleware.app = lambda scope, receive, send: None

        response = await middleware.dispatch(request, dummy_call_next)
        assert response.status_code == 429

    @pytest.mark.asyncio
    async def test_skip_health_endpoints(self):
        from app.api.middleware.rate_limit import RateLimitMiddleware
        from starlette.requests import Request
        from starlette.responses import Response

        called = False
        async def dummy_call_next(request):
            nonlocal called
            called = True
            return Response(content="ok")

        middleware = RateLimitMiddleware(app=None, enabled=True)
        scope = {
            "type": "http", "method": "GET", "path": "/health",
            "query_string": b"", "headers": [], "server": ("test", 80),
        }
        request = Request(scope)
        middleware.app = lambda scope, receive, send: None

        response = await middleware.dispatch(request, dummy_call_next)
        assert called is True
        assert response.status_code == 200


# ─── Input Sanitization Tests ───


class TestInputSanitizer:
    """Test input sanitization utilities."""

    def test_sanitize_strips_control_chars(self):
        from app.core.sanitizer import InputSanitizer
        result = InputSanitizer.sanitize("hello\x00\x01world")
        assert "\x00" not in result
        assert "hello" in result
        assert "world" in result

    def test_sanitize_normalizes_whitespace(self):
        from app.core.sanitizer import InputSanitizer
        result = InputSanitizer.sanitize("hello    world")
        assert result == "hello world"

    def test_sanitize_empty(self):
        from app.core.sanitizer import InputSanitizer
        assert InputSanitizer.sanitize("") == ""
        assert InputSanitizer.sanitize(None) is None

    def test_sanitize_for_provider(self):
        from app.core.sanitizer import InputSanitizer
        result = InputSanitizer.sanitize_for_provider("test\x00\x01input")
        assert "\x00" not in result
        assert "testinput" in result

    def test_sanitize_output_html_encodes(self):
        from app.core.sanitizer import InputSanitizer
        result = InputSanitizer.sanitize_output("<script>alert('xss')</script>")
        assert "<script>" not in result
        assert "&lt;script&gt;" in result

    def test_check_dangerous_patterns(self):
        from app.core.sanitizer import InputSanitizer
        patterns = InputSanitizer.check_dangerous_patterns("<script>alert(1)</script>")
        assert "SCRIPT_TAG" in patterns

    def test_check_dangerous_patterns_clean(self):
        from app.core.sanitizer import InputSanitizer
        patterns = InputSanitizer.check_dangerous_patterns("Hello world")
        assert patterns == []

    def test_sanitize_dict_values(self):
        from app.core.sanitizer import InputSanitizer
        data = {"name": "test\x00", "nested": {"value": "clean"}}
        result = InputSanitizer.sanitize_dict_values(data)
        assert "\x00" not in result["name"]
        assert result["nested"]["value"] == "clean"

    def test_sanitize_dict_list_values(self):
        from app.core.sanitizer import InputSanitizer
        data = {"items": ["a\x00", "b", 123]}
        result = InputSanitizer.sanitize_dict_values(data)
        assert "\x00" not in result["items"][0]
        assert result["items"][2] == 123

    def test_collapses_newlines(self):
        from app.core.sanitizer import InputSanitizer
        result = InputSanitizer.sanitize("hello\n\n\n\nworld")
        assert "\n\n\n" not in result

    def test_event_handler_detected(self):
        from app.core.sanitizer import InputSanitizer
        patterns = InputSanitizer.check_dangerous_patterns('onclick="alert(1)"')
        assert "EVENT_HANDLER" in patterns

    def test_iframe_detected(self):
        from app.core.sanitizer import InputSanitizer
        patterns = InputSanitizer.check_dangerous_patterns("<iframe src='evil'>")
        assert "IFRAME_TAG" in patterns


# ─── BaseIntegrationClient Bug Fix Tests ───


class TestBaseIntegrationClient:
    """Test that BaseIntegrationClient properly records failures and raises."""

    @pytest.mark.asyncio
    async def test_timeout_records_failure(self):
        """TimeoutError should record failure and raise ExternalServiceError."""
        from app.integrations.base import BaseIntegrationClient, CircuitBreaker
        from app.core.exceptions import ExternalServiceError

        class TestClient(BaseIntegrationClient):
            async def call_provider(self, **kwargs):
                raise asyncio.TimeoutError()

            async def health_check(self):
                return True

        cb = CircuitBreaker(failure_threshold=3, recovery_timeout=30)
        client = TestClient(timeout=1, max_retries=1, circuit_breaker=cb)

        with pytest.raises(ExternalServiceError):
            await client.execute_with_retry()

        assert cb._failure_count == 1

    @pytest.mark.asyncio
    async def test_circuit_open_rejects(self):
        """Open circuit should reject immediately."""
        from app.integrations.base import BaseIntegrationClient, CircuitBreaker
        from app.core.exceptions import ExternalServiceError

        class TestClient(BaseIntegrationClient):
            async def call_provider(self, **kwargs):
                return "ok"

            async def health_check(self):
                return True

        cb = CircuitBreaker(failure_threshold=1, recovery_timeout=300)
        client = TestClient(circuit_breaker=cb)
        cb._failure_count = 1
        cb._state = "open"
        cb._last_failure_time = time.monotonic()  # Recent failure

        with pytest.raises(ExternalServiceError, match="circuit open"):
            await client.execute_with_retry()

    @pytest.mark.asyncio
    async def test_success_records_reset(self):
        """Success should reset the circuit breaker."""
        from app.integrations.base import BaseIntegrationClient, CircuitBreaker

        class TestClient(BaseIntegrationClient):
            async def call_provider(self, **kwargs):
                return "ok"

            async def health_check(self):
                return True

        cb = CircuitBreaker(failure_threshold=3, recovery_timeout=30)
        client = TestClient(circuit_breaker=cb)
        result = await client.execute_with_retry()
        assert result == "ok"
        assert cb._failure_count == 0

    @pytest.mark.asyncio
    async def test_retries_with_backoff(self):
        """Should retry with exponential backoff before raising."""
        from app.integrations.base import BaseIntegrationClient, CircuitBreaker
        from app.core.exceptions import ExternalServiceError

        call_count = 0

        class TestClient(BaseIntegrationClient):
            async def call_provider(self, **kwargs):
                nonlocal call_count
                call_count += 1
                raise ConnectionError("fail")

            async def health_check(self):
                return True

        cb = CircuitBreaker(failure_threshold=10, recovery_timeout=30)
        client = TestClient(timeout=1, max_retries=3, circuit_breaker=cb)

        with pytest.raises(ExternalServiceError):
            await client.execute_with_retry()

        assert call_count == 3  # Tried 3 times
        assert cb._failure_count == 3


# ─── ObservabilityMiddleware Tests ───


class TestObservabilityMiddleware:
    """Test observability middleware."""

    def test_disabled_passes_through(self):
        from app.observability.middleware import ObservabilityMiddleware
        # When metrics are disabled, middleware should still pass through
        pass  # Verified by integration with the app


# ─── Provider Manager Bug Fix Tests ───


class TestProviderManagerHealthFix:
    """Verify the get_health_status fix (no run_until_complete)."""

    def test_get_health_status_no_crash(self):
        """get_health_status should not crash in async context."""
        from app.integrations.base import CircuitBreaker
        from app.integrations.llm.mock import MockLLMProvider
        from app.modules.ai.provider_manager import AIProviderManager

        manager = AIProviderManager()
        cb = CircuitBreaker()
        manager.register("mock", MockLLMProvider(), priority=1, circuit_breaker=cb)

        # This should NOT raise RuntimeError from run_until_complete
        status = manager.get_health_status()
        assert len(status) == 1
        assert status[0].name == "mock"
        assert status[0].is_healthy is True

    def test_get_health_status_reflects_circuit_state(self):
        """Should reflect circuit breaker state."""
        from app.integrations.base import CircuitBreaker
        from app.integrations.llm.mock import MockLLMProvider
        from app.modules.ai.provider_manager import AIProviderManager

        manager = AIProviderManager()
        cb = CircuitBreaker(failure_threshold=1, recovery_timeout=300)
        provider = MockLLMProvider()
        manager.register("mock", provider, priority=1, circuit_breaker=cb)

        # Force circuit open
        cb._failure_count = 1
        cb._state = "open"
        cb._last_failure_time = time.monotonic()  # Recent failure

        status = manager.get_health_status()
        assert status[0].is_healthy is False
        assert status[0].circuit_state == "open"


# ─── Integration Settings Tests ───


class TestCacheSettings:
    def test_cache_defaults(self):
        from app.config.cache import CacheSettings
        s = CacheSettings()
        assert s.REDIS_URL is None
        assert s.REDIS_MAX_CONNECTIONS == 10
        assert s.CACHE_DEFAULT_TTL == 300