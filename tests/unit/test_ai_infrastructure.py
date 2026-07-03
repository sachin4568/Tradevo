"""Unit tests for Prompt Registry and AI Context Builder."""

from app.modules.ai.context.builder import AIContextBuilder
from app.modules.ai.prompt_registry import get_prompt, list_prompts
from app.modules.research.models import ResearchReport


class TestPromptRegistry:
    """Tests for the centralized prompt registry."""

    def test_get_known_prompt(self):
        """Test looking up a registered prompt."""
        prompt = get_prompt("research.company_analysis")
        assert prompt.key == "research.company_analysis"
        assert "company_name" in prompt.required_context

    def test_get_unknown_prompt_raises(self):
        """Test that looking up a non-existent prompt raises KeyError."""
        with pytest.raises(KeyError):
            get_prompt("nonexistent.prompt")

    def test_render_prompt(self):
        """Test rendering a prompt template with context."""
        prompt = get_prompt("research.quick_summary")
        result = prompt.render({
            "company_name": "Test Corp",
            "symbol": "TEST",
            "current_price": 100.0,
            "pe": 15.0,
            "sector": "IT",
            "day_change_percent": 2.5,
            "revenue": 5000.0,
            "net_profit": 1000.0,
        })
        assert "Test Corp" in result
        assert "TEST" in result

    def test_list_prompts_returns_all(self):
        """Test that list_prompts returns all registered prompts."""
        prompts = list_prompts()
        assert len(prompts) >= 4
        keys = [p["key"] for p in prompts]
        assert "research.company_analysis" in keys
        assert "research.quick_summary" in keys


class TestAIContextBuilder:
    """Tests for the AI context builder."""

    def _make_company(self, **overrides):
        """Create a mock company object."""
        defaults = dict(
            name="Reliance Industries Ltd",
            symbol="RELIANCE",
            sector="Energy",
            industry="Oil & Gas",
            market_cap="20,00,000 Cr",
            current_price=2945.30,
            pe=28.5,
            pb=2.8,
            dividend_yield=0.35,
            week52_high=3200.0,
            week52_low=2200.0,
            day_change=25.15,
            day_change_percent=0.86,
            revenue=850000.0,
            net_profit=79000.0,
            debt=250000.0,
            cash_flow=95000.0,
            roe=12.5,
            roa=5.2,
            promotor_holding=50.3,
            institutional_holding=27.1,
        )
        defaults.update(overrides)

        class MockCompany:
            pass

        c = MockCompany()
        for k, v in defaults.items():
            setattr(c, k, v)
        return c

    def _make_user(self, experience_level="beginner", risk_preference="moderate"):
        class MockUser:
            pass

        u = MockUser()
        u.experience_level = experience_level
        u.risk_preference = risk_preference
        return u

    def test_build_company_research_context(self):
        """Test building full research context."""
        builder = AIContextBuilder()
        company = self._make_company()
        user = self._make_user()

        ctx = builder.build_company_research_context(
            company=company, user=user
        )

        assert ctx["company_name"] == "Reliance Industries Ltd"
        assert ctx["symbol"] == "RELIANCE"
        assert ctx["experience_level"] == "beginner"
        assert ctx["risk_preference"] == "moderate"
        assert ctx["pe"] == 28.5
        assert ctx["portfolio_context"] == ""
        assert ctx["news_context"] == ""

    def test_build_company_research_context_with_holdings(self):
        """Test context includes portfolio data when user holds the stock."""

        class MockHolding:
            quantity = 10
            average_price = 2500.0

        builder = AIContextBuilder()
        company = self._make_company()
        user = self._make_user()

        ctx = builder.build_company_research_context(
            company=company,
            user=user,
            holdings=[MockHolding()],
        )

        assert "You hold 10 shares" in ctx["portfolio_context"]
        assert "₹2500.00" in ctx["portfolio_context"]

    def test_build_quick_summary_context(self):
        """Test building quick summary context."""
        builder = AIContextBuilder()
        company = self._make_company()

        ctx = builder.build_quick_summary_context(company=company)

        assert ctx["company_name"] == "Reliance Industries Ltd"
        assert ctx["current_price"] == 2945.30
        assert "pe" in ctx

    def test_build_sector_overview_context(self):
        """Test building sector overview context."""
        builder = AIContextBuilder()
        company = self._make_company()

        ctx = builder.build_sector_overview_context(
            sector="Energy",
            companies=[company],
        )

        assert ctx["sector"] == "Energy"
        assert "Reliance" in ctx["company_list"]


import pytest