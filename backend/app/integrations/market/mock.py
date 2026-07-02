"""Mock market data provider for development.

Returns realistic Indian market data (NIFTY 50, SENSEX, sector performance)
matching the seed data. Used when MARKET_PROVIDER=mock.

IMPORTANT: _SEED_COMPANIES must match scripts/seeders/companies.py exactly.
"""

from datetime import datetime
from decimal import Decimal

from app.integrations.market.base import (
    CompanySummary,
    MarketOverview,
    MarketProvider,
    PriceData,
    SectorData,
)

# Hardcoded index data matching frontend/src/data/market.ts
_INDICES = [
    {"name": "NIFTY 50", "value": 24856.70, "change": 128.45, "changePercent": 0.52},
    {"name": "SENSEX", "value": 81542.30, "change": 412.85, "changePercent": 0.51},
    {"name": "NIFTY BANK", "value": 53241.15, "change": 245.60, "changePercent": 0.46},
    {"name": "NIFTY IT", "value": 38452.80, "change": -312.40, "changePercent": -0.81},
]

# Sector performance matching frontend/src/data/market.ts
_SECTOR_PERFORMANCE = [
    {"sector": "Banking", "change": 245.60, "changePercent": 0.46},
    {"sector": "IT", "change": -312.40, "changePercent": -0.81},
    {"sector": "FMCG", "change": 78.20, "changePercent": 0.32},
    {"sector": "Automobile", "change": -156.80, "changePercent": -0.62},
    {"sector": "Pharma", "change": 42.10, "changePercent": 0.18},
    {"sector": "Energy", "change": 189.30, "changePercent": 0.71},
]

# Seed company data used by search and price lookups.
# MUST match scripts/seeders/companies.py EXACTLY (same IDs, symbols, prices).
_SEED_COMPANIES: list[dict] = [
    {"id": "cmp-001", "name": "Reliance Industries Ltd", "symbol": "RELIANCE", "sector": "Energy", "price": Decimal("2945.30"), "change": Decimal("25.15"), "change_pct": Decimal("0.86")},
    {"id": "cmp-002", "name": "Tata Consultancy Services Ltd", "symbol": "TCS", "sector": "IT", "price": Decimal("4056.70"), "change": Decimal("-41.55"), "change_pct": Decimal("-1.01")},
    {"id": "cmp-003", "name": "HDFC Bank Ltd", "symbol": "HDFCBANK", "sector": "Banking", "price": Decimal("1728.45"), "change": Decimal("12.65"), "change_pct": Decimal("0.74")},
    {"id": "cmp-004", "name": "Infosys Ltd", "symbol": "INFY", "sector": "IT", "price": Decimal("1872.60"), "change": Decimal("-17.50"), "change_pct": Decimal("-0.93")},
    {"id": "cmp-005", "name": "ITC Ltd", "symbol": "ITC", "sector": "FMCG", "price": Decimal("475.85"), "change": Decimal("4.65"), "change_pct": Decimal("0.99")},
    {"id": "cmp-006", "name": "Maruti Suzuki India Ltd", "symbol": "MARUTI", "sector": "Automobile", "price": Decimal("12645.80"), "change": Decimal("-134.70"), "change_pct": Decimal("-1.05")},
    {"id": "cmp-007", "name": "Sun Pharmaceutical Industries Ltd", "symbol": "SUNPHARMA", "sector": "Pharma", "price": Decimal("1823.40"), "change": Decimal("12.65"), "change_pct": Decimal("0.70")},
    {"id": "cmp-008", "name": "ICICI Bank Ltd", "symbol": "ICICIBANK", "sector": "Banking", "price": Decimal("1289.30"), "change": Decimal("16.70"), "change_pct": Decimal("1.31")},
    {"id": "cmp-009", "name": "Hindustan Petroleum Corp Ltd", "symbol": "HINDPETRO", "sector": "Energy", "price": Decimal("542.70"), "change": Decimal("4.55"), "change_pct": Decimal("0.85")},
    {"id": "cmp-010", "name": "Tata Motors Ltd", "symbol": "TATAMOTORS", "sector": "Automobile", "price": Decimal("958.25"), "change": Decimal("-9.15"), "change_pct": Decimal("-0.95")},
]

_SYMBOL_MAP = {c["symbol"]: c for c in _SEED_COMPANIES}


class MockMarketProvider(MarketProvider):
    """Development provider that returns hardcoded Indian market data.

    All data is deterministic and matches the frontend seed dataset.
    No external API calls are made.
    """

    async def get_company_price(self, symbol: str) -> PriceData:
        """Return the seed price for a given symbol."""
        company = _SYMBOL_MAP.get(symbol.upper())
        if company is None:
            return PriceData(
                symbol=symbol,
                price=Decimal("0"),
                change=Decimal("0"),
                change_percent=Decimal("0"),
            )
        return PriceData(
            symbol=company["symbol"],
            price=company["price"],
            change=company["change"],
            change_percent=company["change_pct"],
            timestamp=datetime.now().isoformat(),
        )

    async def get_market_overview(self) -> MarketOverview:
        """Return hardcoded NIFTY / SENSEX index data."""
        return MarketOverview(
            indices=_INDICES,
            market_status="open",
        )

    async def get_sector_performance(self) -> list[SectorData]:
        """Return hardcoded sector performance."""
        return [
            SectorData(
                sector=s["sector"],
                change_percent=Decimal(str(s["changePercent"])),
                top_gainers=[],
                top_losers=[],
            )
            for s in _SECTOR_PERFORMANCE
        ]

    async def search_companies(self, query: str) -> list[CompanySummary]:
        """Search seed companies by name or symbol."""
        q = query.upper()
        results = []
        for c in _SEED_COMPANIES:
            if q in c["symbol"].upper() or q in c["name"].upper():
                results.append(
                    CompanySummary(
                        id=c["id"],
                        name=c["name"],
                        symbol=c["symbol"],
                        sector=c["sector"],
                        current_price=c["price"],
                    )
                )
        return results

    def get_provider_name(self) -> str:
        return "mock"

    async def health_check(self) -> bool:
        return True
