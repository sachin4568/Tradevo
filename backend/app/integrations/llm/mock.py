"""Mock LLM provider for development.

Returns canned responses simulating AI-generated research content.
Used when AI_PROVIDER=mock. No external API calls are made.
"""

from app.integrations.llm.base import (
    GenerateConfig,
    LLMProvider,
    LLMResponse,
    Message,
    Tool,
)


class MockLLMProvider(LLMProvider):
    """Development LLM provider that returns realistic canned responses.

    Recognizes prompt keys from the prompt registry and returns
    appropriate mock content.
    """

    async def generate(
        self,
        prompt: str,
        context: dict,
        config: GenerateConfig | None = None,
    ) -> LLMResponse:
        """Generate a mock response based on the prompt content."""
        company_name = context.get("company_name", "the company")
        symbol = context.get("symbol", "STOCK")
        sector = context.get("sector", "General")
        current_price = context.get("current_price", 0)
        pe = context.get("pe", 0)

        # Determine response type from prompt content
        if "brief" in prompt.lower() or "quick" in prompt.lower() or "summary" in prompt.lower():
            content = self._generate_quick_summary(company_name, symbol, current_price, pe)
        elif "compare" in prompt.lower() or "comparison" in prompt.lower():
            content = (
                f"## Comparison Summary\n\n"
                f"Based on the fundamental data provided, {company_name} presents "
                f"a {self._valuation_word(pe)} valuation profile within the {sector} sector. "
                f"Key differentiators include the company's revenue growth trajectory, "
                f"return on equity metrics, and institutional holding patterns.\n\n"
                f"**Key Takeaway**: Evaluate based on your risk profile and investment horizon."
            )
        elif "sector" in prompt.lower() and "overview" in prompt.lower():
            sec = context.get("sector", "the sector")
            content = (
                f"## {sec} Sector Overview\n\n"
                f"The {sec} sector is currently experiencing moderate activity driven by "
                f"domestic consumption trends and regulatory developments. Key companies in "
                f"this sector show mixed performance with leaders maintaining strong fundamentals.\n\n"
                f"**Trends**: Digital transformation, regulatory reforms, and increasing "
                f"institutional interest are shaping the sector's trajectory.\n\n"
                f"**Risks**: Policy changes, global economic slowdown, and sector-specific "
                f"regulatory headwinds remain key concerns.\n"
            )
        else:
            content = self._generate_full_analysis(company_name, symbol, sector, current_price, pe, context)

        return LLMResponse(
            content=content,
            model="mock-gpt-4o",
            provider="mock",
            usage={
                "prompt_tokens": len(prompt.split()),
                "completion_tokens": len(content.split()),
                "total_tokens": len(prompt.split()) + len(content.split()),
            },
        )

    async def chat(
        self,
        messages: list[Message],
        tools: list[Tool] | None = None,
        config: GenerateConfig | None = None,
    ) -> LLMResponse:
        """Generate a mock response from a conversation."""
        last_user_msg = ""
        for msg in reversed(messages):
            if msg.role == "user":
                last_user_msg = msg.content
                break

        content = (
            f"## Mock AI Response\n\n"
            f"Based on your query about '{last_user_msg[:100]}', here is a preliminary analysis. "
            f"This is a mock response — connect a real LLM provider for production use.\n\n"
            f"**Recommendation**: Configure LLM_PROVIDER in your .env file to enable "
            f"real AI-powered research analysis."
        )
        return LLMResponse(
            content=content,
            model="mock-gpt-4o",
            provider="mock",
            usage={"prompt_tokens": 50, "completion_tokens": 80, "total_tokens": 130},
        )

    def get_provider_name(self) -> str:
        return "mock"

    async def health_check(self) -> bool:
        return True

    @staticmethod
    def _generate_quick_summary(name: str, symbol: str, price: float, pe: float) -> str:
        return (
            f"## Investment Summary\n\n"
            f"{name} ({symbol}) at ₹{price:,.2f} offers a "
            f"{'reasonable' if 10 <= pe <= 30 else 'stretched' if pe > 30 else 'attractive'} "
            f"valuation with a P/E of {pe:.1f}. "
            f"The company's financial metrics suggest "
            f"{'strong' if pe < 20 else 'moderate'} fundamental health. "
            f"This is a mock analysis — connect a real LLM for production insights."
        )

    @staticmethod
    def _generate_full_analysis(name: str, symbol: str, sector: str, price: float, pe: float, context: dict) -> str:
        risk_pref = context.get("risk_preference", "moderate")
        revenue = context.get("revenue", 0)
        net_profit = context.get("net_profit", 0)
        roe = context.get("roe", 0)
        debt = context.get("debt", 0)

        risk_level = "higher" if risk_pref == "aggressive" else "lower" if risk_pref == "conservative" else "moderate"

        return (
            f"# Research Report: {name} ({symbol})\n\n"
            f"## 1. Business Overview\n\n"
            f"{name} operates in the {sector} sector. "
            f"The company has established a significant market presence with "
            f"revenue of ₹{revenue:,.2f} Cr and net profit of ₹{net_profit:,.2f} Cr.\n\n"
            f"## 2. Financial Health\n\n"
            f"- **Revenue**: ₹{revenue:,.2f} Cr\n"
            f"- **Net Profit**: ₹{net_profit:,.2f} Cr\n"
            f"- **ROE**: {roe:.2f}%\n"
            f"- **Debt**: ₹{debt:,.2f} Cr\n"
            f"- **P/E Ratio**: {pe:.2f}\n\n"
            f"The company demonstrates {'strong' if roe > 15 else 'moderate'} return on equity "
            f"and {'manageable' if debt < revenue else 'elevated'} debt levels.\n\n"
            f"## 3. Valuation Assessment\n\n"
            f"At a P/E of {pe:.2f}, the stock appears "
            f"{'attractively valued' if pe < 15 else 'fairly valued' if pe < 25 else 'premium valued'}. "
            f"Consider the sector average and growth trajectory when evaluating this metric.\n\n"
            f"## 4. Key Risks\n\n"
            f"- Market volatility in the {sector} sector\n"
            f"- Regulatory changes affecting operations\n"
            f"- Global economic headwinds impacting growth\n"
            f"- Currency fluctuation risk for export-oriented segments\n\n"
            f"## 5. Investment Recommendation\n\n"
            f"For a {risk_pref} risk profile investor, {name} presents a {risk_level}-risk opportunity. "
            f"The stock could be considered for a {'growth-oriented' if pe > 20 else 'value-oriented'} portfolio. "
            f"**Recommendation: Hold** — monitor quarterly results and sector trends before "
            f"increasing position size.\n\n"
            f"*This is a mock analysis generated for development purposes. "
            f"Connect a real LLM provider for production-quality research.*"
        )

    @staticmethod
    def _valuation_word(pe: float) -> str:
        if pe < 15:
            return "attractive"
        if pe < 25:
            return "reasonable"
        return "premium"