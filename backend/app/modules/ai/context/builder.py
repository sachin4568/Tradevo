"""AI Context Builder (BA-012).

Assembles structured context dictionaries for AI prompts by pulling
data from multiple modules (company, portfolio, news, market, decisions).
This is the single point where cross-module data is gathered for AI
generation, keeping the AI subsystem decoupled from individual modules.

The builder accepts raw data and returns a context dict that matches
the {variable} placeholders in prompt templates.
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


class AIContextBuilder:
    """Builds context dictionaries for AI prompt rendering.

    Usage:
        builder = AIContextBuilder()
        context = await builder.build_company_research_context(
            company=company,
            user=user,
            holdings=holdings,
            news=news,
        )
    """

    def build_company_research_context(
        self,
        *,
        company: Any,
        user: Any,
        holdings: list[Any] | None = None,
        news: list[Any] | None = None,
        recent_decisions: list[Any] | None = None,
    ) -> dict[str, Any]:
        """Build context for the research.company_analysis prompt.

        Args:
            company: Company SQLAlchemy model.
            user: User SQLAlchemy model.
            holdings: Optional list of Holding models for this company.
            news: Optional list of NewsArticle models.
            recent_decisions: Optional list of DecisionTimeline models.

        Returns:
            Dict with all keys required by the prompt template.
        """
        context: dict[str, Any] = {
            "company_name": company.name,
            "symbol": company.symbol,
            "sector": company.sector,
            "industry": company.industry,
            "market_cap": company.market_cap,
            "current_price": float(company.current_price),
            "pe": float(company.pe),
            "pb": float(company.pb),
            "dividend_yield": float(company.dividend_yield),
            "week52_high": float(company.week52_high),
            "week52_low": float(company.week52_low),
            "day_change": float(company.day_change),
            "day_change_percent": float(company.day_change_percent),
            "revenue": float(company.revenue),
            "net_profit": float(company.net_profit),
            "debt": float(company.debt),
            "cash_flow": float(company.cash_flow),
            "roe": float(company.roe),
            "roa": float(company.roa),
            "promotor_holding": float(company.promotor_holding),
            "institutional_holding": float(company.institutional_holding),
            "experience_level": getattr(user, "experience_level", "beginner"),
            "risk_preference": getattr(user, "risk_preference", "moderate"),
        }

        # Portfolio context — mention if user holds this stock
        portfolio_context = ""
        if holdings:
            h = holdings[0]
            qty = int(h.quantity)
            avg = float(h.average_price)
            current = float(company.current_price)
            pnl = (current - avg) * qty
            pnl_pct = ((current - avg) / avg * 100) if avg > 0 else 0
            portfolio_context = (
                f"\n## Your Position\n"
                f"- You hold {qty} shares at avg price ₹{avg:.2f}\n"
                f"- Current P&L: ₹{pnl:,.2f} ({pnl_pct:+.2f}%)\n\n"
            )
        context["portfolio_context"] = portfolio_context

        # News context — include recent headlines
        news_context = ""
        if news:
            news_context = "## Recent News\n"
            for article in news[:5]:
                news_context += f"- {article.headline} ({article.source})\n"
            news_context += "\n"
        context["news_context"] = news_context

        return context

    def build_quick_summary_context(
        self,
        *,
        company: Any,
    ) -> dict[str, Any]:
        """Build context for the research.quick_summary prompt."""
        return {
            "company_name": company.name,
            "symbol": company.symbol,
            "current_price": float(company.current_price),
            "pe": float(company.pe),
            "sector": company.sector,
            "day_change_percent": float(company.day_change_percent),
            "revenue": float(company.revenue),
            "net_profit": float(company.net_profit),
        }

    def build_sector_overview_context(
        self,
        *,
        sector: str,
        companies: list[Any],
    ) -> dict[str, Any]:
        """Build context for the research.sector_overview prompt."""
        company_list = ""
        for i, c in enumerate(companies[:10], 1):
            company_list += (
                f"{i}. {c.name} ({c.symbol}) — "
                f"₹{float(c.current_price):,.2f} | "
                f"P/E: {float(c.pe)} | "
                f"Mkt Cap: {c.market_cap}\n"
            )
        return {
            "sector": sector,
            "company_list": company_list,
        }