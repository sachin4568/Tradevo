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

    # ─── Milestone 7 Context Builders ───

    def build_dna_context(
        self,
        *,
        user: Any,
        holdings: list[Any],
        transactions: list[Any],
        portfolio: Any,
        companies_by_id: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Build context for the dna.behaviour_analysis prompt."""
        companies = companies_by_id or {}

        # Trade summary
        buy_count = sum(1 for t in transactions if t.transaction_type == "BUY")
        sell_count = sum(1 for t in transactions if t.transaction_type == "SELL")
        trade_summary = f"Total trades: {len(transactions)} (Buy: {buy_count}, Sell: {sell_count})\n"
        for t in transactions[:10]:
            name = companies.get(t.company_id, type('O', (), {'name': t.company_id})()).name if t.company_id in companies else t.company_id
            trade_summary += (
                f"- {t.transaction_type} {int(t.quantity)} shares "
                f"at ₹{float(t.price):,.2f} on {t.created_at.strftime('%Y-%m-%d') if t.created_at else 'N/A'}\n"
            )

        # Holdings summary
        holdings_summary = f"Total holdings: {len(holdings)}\n"
        for h in holdings:
            c = companies.get(h.company_id, type('O', (), {'name': h.company_id, 'sector': 'Unknown', 'current_price': 0})()) if h.company_id in companies else type('O', (), {'name': h.company_id, 'sector': 'Unknown', 'current_price': 0})()
            holdings_summary += (
                f"- {c.name}: {int(h.quantity)} shares at avg ₹{float(h.average_price):,.2f}"
                f" (current ₹{float(c.current_price):,.2f})\n"
            )

        # Sector distribution
        sector_counts: dict[str, int] = {}
        for h in holdings:
            c = companies.get(h.company_id, type('O', (), {'sector': 'Unknown'})()) if h.company_id in companies else type('O', (), {'sector': 'Unknown'})()
            sector_counts[c.sector] = sector_counts.get(c.sector, 0) + 1
        sector_distribution = "\n".join(
            f"- {s}: {c} holding{'s' if c > 1 else ''}" for s, c in sorted(sector_counts.items())
        ) or "No holdings"

        # Cash utilisation
        total_invested = float(portfolio.total_invested)
        virtual_cash = float(portfolio.virtual_cash)
        total_value = total_invested + virtual_cash
        cash_pct = (virtual_cash / total_value * 100) if total_value > 0 else 0
        cash_utilisation = (
            f"Total portfolio value: ₹{total_value:,.2f}\n"
            f"Amount invested: ₹{total_invested:,.2f}\n"
            f"Cash remaining: ₹{virtual_cash:,.2f} ({cash_pct:.1f}% of portfolio)"
        )

        return {
            "trade_summary": trade_summary,
            "holdings_summary": holdings_summary,
            "sector_distribution": sector_distribution,
            "cash_utilisation": cash_utilisation,
        }

    def build_portfolio_observations_context(
        self,
        *,
        holdings: list[Any],
        transactions: list[Any],
        portfolio: Any,
        companies_by_id: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Build context for decision.portfolio_observations prompt."""
        companies = companies_by_id or {}

        holdings_summary = f"Total holdings: {len(holdings)}\n"
        for h in holdings:
            c = companies.get(h.company_id, type('O', (), {'name': h.company_id, 'sector': 'Unknown', 'current_price': 0})()) if h.company_id in companies else type('O', (), {'name': h.company_id, 'sector': 'Unknown', 'current_price': 0})()
            holdings_summary += (
                f"- {c.name} ({c.sector}): {int(h.quantity)} shares "
                f"at avg ₹{float(h.average_price):,.2f}\n"
            )

        sector_counts: dict[str, int] = {}
        for h in holdings:
            c = companies.get(h.company_id, type('O', (), {'sector': 'Unknown'})()) if h.company_id in companies else type('O', (), {'sector': 'Unknown'})()
            sector_counts[c.sector] = sector_counts.get(c.sector, 0) + 1
        sector_distribution = "\n".join(
            f"- {s}: {c} holding{'s' if c > 1 else ''}" for s, c in sorted(sector_counts.items())
        ) or "No holdings"

        virtual_cash = float(portfolio.virtual_cash)
        total_invested = float(portfolio.total_invested)
        cash_utilisation = f"Cash: ₹{virtual_cash:,.2f} | Invested: ₹{total_invested:,.2f}"

        recent_trades = ""
        for t in transactions[:10]:
            name = companies.get(t.company_id, type('O', (), {'name': t.company_id})()).name if t.company_id in companies else t.company_id
            recent_trades += f"- {t.transaction_type} {int(t.quantity)} of {name} at ₹{float(t.price):,.2f}\n"

        return {
            "holdings_summary": holdings_summary,
            "sector_distribution": sector_distribution,
            "cash_utilisation": cash_utilisation,
            "recent_trades": recent_trades or "No trades yet",
        }

    def build_trade_reflection_context(
        self,
        *,
        transaction: Any,
        company: Any,
        holdings: list[Any],
        portfolio: Any,
    ) -> dict[str, Any]:
        """Build context for decision.trade_reflection prompt."""
        trade_details = (
            f"Action: {transaction.transaction_type}\n"
            f"Company: {company.name} ({company.symbol})\n"
            f"Sector: {company.sector}\n"
            f"Quantity: {int(transaction.quantity)} shares\n"
            f"Price: ₹{float(transaction.price):,.2f}\n"
            f"Total: ₹{float(transaction.total):,.2f}\n"
        )
        portfolio_context = (
            f"Portfolio has {len(holdings)} holdings "
            f"with ₹{float(portfolio.virtual_cash):,.2f} cash remaining"
        )
        return {
            "trade_details": trade_details,
            "portfolio_context": portfolio_context,
        }

    def build_learning_guidance_context(
        self,
        *,
        user: Any,
        learning_sessions: list[Any],
        decisions: list[Any],
        holdings: list[Any],
        companies_by_id: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Build context for learning.guidance prompt."""
        companies = companies_by_id or {}

        # Learning progress summary
        completed = [s for s in learning_sessions if s.status == "COMPLETED"]
        learning_progress = (
            f"Completed sessions: {len(completed)}\n"
            f"Total simulated trades: {sum(getattr(s, 'simulated_trades_count', 0) or 0 for s in learning_sessions)}\n"
            f"Companies studied: {len(set(c for s in learning_sessions for c in (s.companies_studied or [])))}\n"
        )
        if completed:
            latest = completed[0]
            progress_data = (latest.lesson_progress or {}).get("data", {})
            completed_lessons = [v.get("moduleId", "") for v in progress_data.values() if v.get("status") == "completed"]
            if completed_lessons:
                learning_progress += f"Completed lesson modules: {', '.join(set(completed_lessons))}\n"

        # Recent decisions
        recent_decisions = f"Recent trades: {len(decisions)}\n"
        for d in decisions[:10]:
            c = companies.get(d.company_id, type('O', (), {'name': d.company_id})()) if d.company_id in companies else type('O', (), {'name': d.company_id})()
            recent_decisions += f"- {d.decision_type} {c.name} on {d.decision_time.strftime('%Y-%m-%d') if d.decision_time else 'N/A'}\n"

        holdings_summary = f"Current holdings: {len(holdings)}\n"
        for h in holdings:
            c = companies.get(h.company_id, type('O', (), {'name': h.company_id})()) if h.company_id in companies else type('O', (), {'name': h.company_id})()
            holdings_summary += f"- {c.name}: {int(h.quantity)} shares\n"

        return {
            "learning_progress": learning_progress,
            "recent_decisions": recent_decisions,
            "holdings_summary": holdings_summary,
        }

    def build_post_trade_feedback_context(
        self,
        *,
        user: Any,
        transaction: Any,
        company: Any,
        holding_count: int,
        sector_count: int,
        remaining_cash: float,
    ) -> dict[str, Any]:
        """Build context for feedback.post_trade prompt."""
        return {
            "experience_level": getattr(user, "experience_level", "beginner"),
            "action": transaction.transaction_type.lower(),
            "quantity": int(transaction.quantity),
            "company_name": company.name,
            "symbol": company.symbol,
            "price": float(transaction.price),
            "holding_count": holding_count,
            "sector_count": sector_count,
            "remaining_cash": remaining_cash,
        }

    def build_post_lesson_feedback_context(
        self,
        *,
        user: Any,
        lesson_id: str,
        module_id: str,
        total_trades: int,
        holding_count: int,
    ) -> dict[str, Any]:
        """Build context for feedback.post_lesson prompt."""
        topic = module_id.replace("_", " ").title()
        return {
            "experience_level": getattr(user, "experience_level", "beginner"),
            "lesson_topic": topic,
            "module_id": module_id,
            "total_trades": total_trades,
            "holding_count": holding_count,
        }