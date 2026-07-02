"""Prompt Registry — centralized AI prompt management with versioning (BA-011).

Stores all prompt templates used across the application. Prompts are
looked up by key and rendered with context variables. This decouples
prompt content from business logic and enables A/B testing, versioning,
and prompt engineering without code changes.

Versioning:
- Each prompt has a version number (starts at 1).
- Multiple versions of a prompt can coexist.
- get_prompt() returns the latest version by default.
- get_prompt_version() returns a specific version.
- register_version() adds a new version to an existing key.

The registry is populated at module load time from _PROMPTS dict.
Adding a new prompt requires only adding an entry to _PROMPTS.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class PromptTemplate:
    """A registered prompt template.

    Attributes:
        key: Unique identifier for lookup.
        system_prompt: The system message sent to the LLM.
        user_template: A Python format string with {variable} placeholders.
        description: Human-readable description of what this prompt does.
        required_context: List of context keys that must be present.
        version: Version number (1-based). Multiple versions can coexist.
    """

    key: str
    system_prompt: str
    user_template: str
    description: str
    required_context: list[str]
    version: int = 1

    def render(self, context: dict[str, Any]) -> str:
        """Render the user template with the provided context.

        Raises:
            KeyError: If a required context variable is missing.
        """
        return self.user_template.format(**context)


@dataclass
class PromptVersionChain:
    """A chain of versions for a single prompt key."""

    key: str
    versions: dict[int, PromptTemplate] = field(default_factory=dict)

    @property
    def latest_version(self) -> int:
        """The highest version number in the chain."""
        if not self.versions:
            return 0
        return max(self.versions.keys())

    def get_latest(self) -> PromptTemplate:
        """Get the latest version of the prompt."""
        if not self.versions:
            raise KeyError(f"Prompt '{self.key}' has no versions")
        return self.versions[self.latest_version]

    def get_version(self, version: int) -> PromptTemplate:
        """Get a specific version of the prompt."""
        if version not in self.versions:
            raise KeyError(
                f"Prompt '{self.key}' version {version} not found "
                f"(available: {sorted(self.versions.keys())})"
            )
        return self.versions[version]

    def add_version(self, template: PromptTemplate) -> int:
        """Add a new version to the chain. Returns the assigned version."""
        next_ver = self.latest_version + 1
        new_template = PromptTemplate(
            key=template.key,
            system_prompt=template.system_prompt,
            user_template=template.user_template,
            description=template.description,
            required_context=template.required_context,
            version=next_ver,
        )
        self.versions[next_ver] = new_template
        logger.info("prompt_version_registered key=%s version=%d", template.key, next_ver)
        return next_ver


# ─── Prompt Definitions (v1) ───

_PROMPTS: dict[str, PromptTemplate] = {
    "research.company_analysis": PromptTemplate(
        key="research.company_analysis",
        system_prompt=(
            "You are an expert equity research analyst specializing in Indian markets. "
            "Provide clear, actionable investment analysis based on the data provided. "
            "Structure your response with clear sections. Use data points to support "
            "your analysis. Be balanced — highlight both opportunities and risks."
        ),
        user_template=(
            "Analyze {company_name} ({symbol}) for a {experience_level} investor "
            "with a {risk_preference} risk profile.\n\n"
            "## Company Data\n"
            "- Sector: {sector}\n"
            "- Industry: {industry}\n"
            "- Market Cap: {market_cap}\n"
            "- Current Price: ₹{current_price}\n"
            "- P/E Ratio: {pe}\n"
            "- P/B Ratio: {pb}\n"
            "- Dividend Yield: {dividend_yield}%\n"
            "- 52-Week High: ₹{week52_high}\n"
            "- 52-Week Low: ₹{week52_low}\n"
            "- Day Change: ₹{day_change} ({day_change_percent}%)\n\n"
            "## Financial Data\n"
            "- Revenue: ₹{revenue} Cr\n"
            "- Net Profit: ₹{net_profit} Cr\n"
            "- Debt: ₹{debt} Cr\n"
            "- Cash Flow: ₹{cash_flow} Cr\n"
            "- ROE: {roe}%\n"
            "- ROA: {roa}%\n"
            "- Promoter Holding: {promotor_holding}%\n"
            "- Institutional Holding: {institutional_holding}%\n\n"
            "{portfolio_context}"
            "{news_context}"
            "Provide a comprehensive analysis covering:\n"
            "1. Business Overview\n"
            "2. Financial Health\n"
            "3. Valuation Assessment\n"
            "4. Key Risks\n"
            "5. Investment Recommendation (Buy/Hold/Sell with reasoning)\n"
        ),
        description="Full company research analysis for investors",
        required_context=[
            "company_name", "symbol", "sector", "industry", "current_price",
            "pe", "pb", "dividend_yield", "week52_high", "week52_low",
            "day_change", "day_change_percent", "revenue", "net_profit",
            "debt", "cash_flow", "roe", "roa", "promotor_holding",
            "institutional_holding", "experience_level", "risk_preference",
        ],
    ),
    "research.quick_summary": PromptTemplate(
        key="research.quick_summary",
        system_prompt=(
            "You are an expert equity research analyst. Provide a concise "
            "2-3 sentence investment summary. Be direct and actionable."
        ),
        user_template=(
            "Provide a brief investment summary for {company_name} ({symbol}).\n\n"
            "Price: ₹{current_price} | P/E: {pe} | Sector: {sector}\n"
            "Day Change: {day_change_percent}%\n"
            "Revenue: ₹{revenue} Cr | Net Profit: ₹{net_profit} Cr\n"
        ),
        description="Quick one-paragraph company summary",
        required_context=[
            "company_name", "symbol", "current_price", "pe",
            "sector", "day_change_percent", "revenue", "net_profit",
        ],
    ),
    "research.comparison": PromptTemplate(
        key="research.comparison",
        system_prompt=(
            "You are an expert equity research analyst. Compare the provided "
            "companies and recommend the better investment based on fundamentals."
        ),
        user_template=(
            "Compare these companies for a {experience_level} investor:\n\n"
            "{company_summaries}\n\n"
            "Provide a comparison covering valuation, growth, and risk."
        ),
        description="Side-by-side comparison of multiple companies",
        required_context=["experience_level", "company_summaries"],
    ),
    "research.sector_overview": PromptTemplate(
        key="research.sector_overview",
        system_prompt=(
            "You are a sector research analyst covering Indian markets. "
            "Provide insights on sector trends, opportunities, and risks."
        ),
        user_template=(
            "Provide an overview of the {sector} sector in Indian markets.\n\n"
            "Top companies by market cap:\n{company_list}\n\n"
            "Cover: sector trends, key drivers, regulatory environment, "
            "and top picks."
        ),
        description="Sector-level research overview",
        required_context=["sector", "company_list"],
    ),
    # ─── Milestone 7: Investment DNA ───
    "dna.behaviour_analysis": PromptTemplate(
        key="dna.behaviour_analysis",
        system_prompt=(
            "You are an educational investment behaviour analyst. "
            "Based on the user's trading history and portfolio data, "
            "describe their investing behaviour patterns. "
            "Be observational and educational only. "
            "Do NOT provide any buy/sell recommendations, numeric scores, or financial advice. "
            "Describe patterns in plain language."
        ),
        user_template=(
            "Analyse this investor's behaviour patterns:\n\n"
            "## Trading History\n{trade_summary}\n\n"
            "## Current Holdings\n{holdings_summary}\n\n"
            "## Sector Distribution\n{sector_distribution}\n\n"
            "## Cash Utilisation\n{cash_utilisation}\n\n"
            "Describe the investor's behaviour patterns across:\n"
            "1. Diversification approach\n"
            "2. Sector preferences\n"
            "3. Trading frequency and timing patterns\n"
            "4. Cash management habits\n"
            "5. Position sizing tendencies\n"
            "Do NOT give scores or recommendations. Only describe what you observe."
        ),
        description="Investment DNA behaviour pattern analysis",
        required_context=[
            "trade_summary", "holdings_summary", "sector_distribution",
            "cash_utilisation",
        ],
    ),
    # ─── Milestone 7: Decision Intelligence ───
    "decision.portfolio_observations": PromptTemplate(
        key="decision.portfolio_observations",
        system_prompt=(
            "You are an educational portfolio analyst. "
            "Generate observations about portfolio characteristics. "
            "Do NOT generate BUY or SELL recommendations. "
            "Only explain portfolio characteristics in plain language. "
            "This is for educational purposes only."
        ),
        user_template=(
            "Generate observations about this portfolio:\n\n"
            "## Holdings\n{holdings_summary}\n\n"
            "## Sector Allocation\n{sector_distribution}\n\n"
            "## Cash Position\n{cash_utilisation}\n\n"
            "## Recent Trades\n{recent_trades}\n\n"
            "Provide observations covering:\n"
            "1. Diversification characteristics\n"
            "2. Concentration patterns\n"
            "3. Cash utilisation approach\n"
            "4. Portfolio composition observations\n"
            "Do NOT recommend any actions. Only describe what you see."
        ),
        description="Portfolio observations (no recommendations)",
        required_context=[
            "holdings_summary", "sector_distribution",
            "cash_utilisation", "recent_trades",
        ],
    ),
    "decision.trade_reflection": PromptTemplate(
        key="decision.trade_reflection",
        system_prompt=(
            "You are an educational trading coach. "
            "Reflect on a completed trade from a learning perspective. "
            "Connect it to concepts like diversification, risk management, "
            "and market behaviour. Do NOT evaluate the trade outcome as good or bad. "
            "Do NOT suggest future trades."
        ),
        user_template=(
            "Reflect on this completed trade from a learning perspective:\n\n"
            "## Trade Details\n{trade_details}\n\n"
            "## Portfolio Context\n{portfolio_context}\n\n"
            "Provide educational reflections on:\n"
            "1. What market concept does this trade illustrate?\n"
            "2. How does this trade relate to diversification principles?\n"
            "3. What risk management considerations apply?\n"
            "Do NOT evaluate whether the trade was good or bad."
        ),
        description="Educational reflection on a completed trade",
        required_context=["trade_details", "portfolio_context"],
    ),
    # ─── Milestone 7: Learning Intelligence ───
    "learning.guidance": PromptTemplate(
        key="learning.guidance",
        system_prompt=(
            "You are a patient investment education guide. "
            "Based on the user's learning activity and trading history, "
            "suggest relevant lesson topics and provide educational explanations. "
            "Do NOT evaluate or grade the user. "
            "Do NOT provide financial advice. "
            "Focus on connecting their activity to educational concepts."
        ),
        user_template=(
            "Generate learning guidance for this investor:\n\n"
            "## Learning Progress\n{learning_progress}\n\n"
            "## Recent Trading Activity\n{recent_decisions}\n\n"
            "## Current Holdings\n{holdings_summary}\n\n"
            "Provide:\n"
            "1. Lesson suggestions based on their activity (2-3 topics)\n"
            "2. Brief educational explanations connecting their trades to concepts\n"
            "3. Concept reinforcement based on their learning progress\n"
            "Do NOT evaluate the user's performance."
        ),
        description="Contextual learning guidance",
        required_context=[
            "learning_progress", "recent_decisions", "holdings_summary",
        ],
    ),
    # ─── Milestone 7: Runtime Feedback ───
    "feedback.post_trade": PromptTemplate(
        key="feedback.post_trade",
        system_prompt=(
            "You are a brief educational assistant. "
            "After a trade, provide a short 1-2 sentence educational reminder. "
            "Connect the trade to an investing concept (diversification, risk, etc.). "
            "Do NOT evaluate the trade. Do NOT suggest future actions."
        ),
        user_template=(
            "A {experience_level} investor just executed a {action} of {quantity} "
            "shares of {company_name} ({symbol}) at ₹{price}.\n"
            "Their portfolio has {holding_count} holdings across {sector_count} sectors "
            "with ₹{remaining_cash:,.0f} cash remaining.\n\n"
            "Provide ONE short educational insight connecting this trade to "
            "a relevant investing concept (1-2 sentences max)."
        ),
        description="Short post-trade educational feedback",
        required_context=[
            "experience_level", "action", "quantity", "company_name",
            "symbol", "price", "holding_count", "sector_count",
            "remaining_cash",
        ],
    ),
    "feedback.post_lesson": PromptTemplate(
        key="feedback.post_lesson",
        system_prompt=(
            "You are a brief educational assistant. "
            "After a user completes a learning lesson, provide a short "
            "1-2 sentence reinforcement connecting the lesson topic "
            "to practical trading. Do NOT evaluate the user."
        ),
        user_template=(
            "A {experience_level} investor just completed a lesson on "
            "'{lesson_topic}' (module: {module_id}).\n"
            "They have {total_trades} total trades and {holding_count} holdings.\n\n"
            "Provide ONE short insight connecting this lesson topic "
            "to practical application (1-2 sentences max)."
        ),
        description="Short post-lesson educational feedback",
        required_context=[
            "experience_level", "lesson_topic", "module_id",
            "total_trades", "holding_count",
        ],
    ),
}

# Module-level versioned registry
_chains: dict[str, PromptVersionChain] = {}


def _initialize_registry() -> None:
    """Populate the registry from _PROMPTS dict."""
    global _chains
    _chains = {}
    for _key, _template in _PROMPTS.items():
        chain = PromptVersionChain(key=_key)
        chain.versions[1] = _template
        _chains[_key] = chain


# Initialize at module load
_initialize_registry()


def get_prompt(key: str) -> PromptTemplate:
    """Look up the latest version of a prompt template by key.

    Args:
        key: The prompt registry key (e.g., 'research.company_analysis').

    Returns:
        The latest PromptTemplate instance.

    Raises:
        KeyError: If the key is not found in the registry.
    """
    if key not in _chains:
        raise KeyError(f"Prompt '{key}' not found in registry")
    return _chains[key].get_latest()


def get_prompt_version(key: str, version: int) -> PromptTemplate:
    """Look up a specific version of a prompt template.

    Args:
        key: The prompt registry key.
        version: The desired version number.

    Returns:
        The PromptTemplate at the specified version.

    Raises:
        KeyError: If the key or version is not found.
    """
    if key not in _chains:
        raise KeyError(f"Prompt '{key}' not found in registry")
    return _chains[key].get_version(version)


def get_prompt_latest_version(key: str) -> int:
    """Get the latest version number for a prompt key.

    Args:
        key: The prompt registry key.

    Returns:
        The latest version number.

    Raises:
        KeyError: If the key is not found.
    """
    if key not in _chains:
        raise KeyError(f"Prompt '{key}' not found in registry")
    return _chains[key].latest_version


def register_version(
    key: str,
    system_prompt: str,
    user_template: str,
    description: str,
    required_context: list[str],
) -> int:
    """Register a new version of an existing prompt.

    Args:
        key: Must already exist in the registry.
        system_prompt: The new system message.
        user_template: The new user template.
        description: Human-readable description.
        required_context: List of required context keys.

    Returns:
        The new version number.

    Raises:
        KeyError: If the key does not exist.
    """
    if key not in _chains:
        raise KeyError(
            f"Cannot register version — prompt '{key}' not found. "
            f"Use the _PROMPTS dict to add new prompts."
        )
    template = PromptTemplate(
        key=key,
        system_prompt=system_prompt,
        user_template=user_template,
        description=description,
        required_context=required_context,
        version=1,  # Will be reassigned by the chain
    )
    return _chains[key].add_version(template)


def list_prompts() -> list[dict]:
    """List all registered prompt templates with metadata.

    Returns only the latest version of each prompt.
    """
    return [
        {
            "key": chain.get_latest().key,
            "description": chain.get_latest().description,
            "requiredContext": chain.get_latest().required_context,
            "version": chain.latest_version,
        }
        for chain in _chains.values()
    ]


def list_prompt_versions(key: str) -> list[dict]:
    """List all versions of a specific prompt.

    Args:
        key: The prompt registry key.

    Returns:
        List of version metadata dicts, ordered by version ascending.

    Raises:
        KeyError: If the key is not found.
    """
    if key not in _chains:
        raise KeyError(f"Prompt '{key}' not found in registry")
    chain = _chains[key]
    return [
        {
            "key": t.key,
            "version": t.version,
            "description": t.description,
            "requiredContext": t.required_context,
        }
        for t in sorted(chain.versions.values(), key=lambda x: x.version)
    ]