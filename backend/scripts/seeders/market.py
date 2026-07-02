"""Market snapshot seed data.

Inserts the initial market snapshot (indices + sector performance)
for graceful degradation when the market provider is unavailable.

Reference: frontend/src/data/market.ts — getMarketOverview()
"""


from app.modules.market.models import MarketSnapshot

INITIAL_SNAPSHOT: dict = {
    "id": "snap-initial001",
    "status": "open",
    "indices": [
        {"name": "NIFTY 50", "value": 24856.70, "change": 128.45, "changePercent": 0.52},
        {"name": "SENSEX", "value": 81542.30, "change": 412.85, "changePercent": 0.51},
        {"name": "NIFTY BANK", "value": 53241.15, "change": 245.60, "changePercent": 0.46},
        {"name": "NIFTY IT", "value": 38452.80, "change": -312.40, "changePercent": -0.81},
    ],
    "sector_performance": [
        {"sector": "Banking", "change": 245.60, "changePercent": 0.46},
        {"sector": "IT", "change": -312.40, "changePercent": -0.81},
        {"sector": "FMCG", "change": 78.20, "changePercent": 0.32},
        {"sector": "Automobile", "change": -156.80, "changePercent": -0.62},
        {"sector": "Pharma", "change": 42.10, "changePercent": 0.18},
        {"sector": "Energy", "change": 189.30, "changePercent": 0.71},
    ],
}


async def seed_market(session) -> int:
    """Insert the initial market snapshot.

    Args:
        session: An async SQLAlchemy session (caller manages commit).

    Returns:
        Number of snapshots inserted (0 or 1).
    """
    from sqlalchemy import func, select

    count_result = await session.execute(
        select(func.count()).select_from(MarketSnapshot)
    )
    count = count_result.scalar()

    if count and count > 0:
        print(f"  Market snapshots: {count} already exist, skipping.")
        return 0

    snapshot = MarketSnapshot(**INITIAL_SNAPSHOT)
    session.add(snapshot)
    await session.flush()
    print("  Market snapshots: inserted 1 record.")
    return 1
