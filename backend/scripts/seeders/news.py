"""News seed data.

Inserts company-specific and market-level news articles.
All IDs and company_id references MUST match the company seeder data.

Reference: frontend/src/data/companies.ts — news Record
Reference: frontend/src/data/market.ts — getMarketNews()
"""

from datetime import UTC, datetime

from app.modules.market.models import NewsArticle

# ─── Company-specific news ───
# company_id values match companies.py IDs exactly.

COMPANY_NEWS: list[dict] = [
    {
        "id": "n-001",
        "company_id": "cmp-001",
        "headline": "Reliance Jio adds 8 million subscribers in Q1",
        "source": "Economic Times",
        "url": "",
        "published_at": datetime(2026, 6, 29, 10, 30, tzinfo=UTC),
        "summary": "Reliance Industries telecom arm Jio Platforms reported strong subscriber growth in the first quarter.",
    },
    {
        "id": "n-002",
        "company_id": "cmp-001",
        "headline": "Reliance Retail expands to 500 new stores",
        "source": "Mint",
        "url": "",
        "published_at": datetime(2026, 6, 28, 14, 15, tzinfo=UTC),
        "summary": "The retail arm continues its aggressive expansion across tier-2 and tier-3 cities in India.",
    },
    {
        "id": "n-003",
        "company_id": "cmp-001",
        "headline": "Green energy unit plans 10 GW solar capacity",
        "source": "Business Standard",
        "url": "",
        "published_at": datetime(2026, 6, 27, 9, 0, tzinfo=UTC),
        "summary": "Reliance New Energy Solar is targeting 10 GW of solar module manufacturing capacity by 2027.",
    },
    {
        "id": "n-004",
        "company_id": "cmp-002",
        "headline": "TCS wins $2.5 billion deal with UK-based client",
        "source": "Moneycontrol",
        "url": "",
        "published_at": datetime(2026, 6, 29, 8, 45, tzinfo=UTC),
        "summary": "India's largest IT services provider bagged a significant transformation deal in the banking sector.",
    },
    {
        "id": "n-005",
        "company_id": "cmp-002",
        "headline": "TCS Q1 results: Revenue grows 6.2% YoY",
        "source": "LiveMint",
        "url": "",
        "published_at": datetime(2026, 6, 26, 16, 0, tzinfo=UTC),
        "summary": "Tata Consultancy Services reported consolidated revenue of Rs 64,247 crore for Q1 FY27.",
    },
    {
        "id": "n-006",
        "company_id": "cmp-003",
        "headline": "HDFC Bank credit growth at 16% YoY",
        "source": "Reuters India",
        "url": "",
        "published_at": datetime(2026, 6, 29, 11, 0, tzinfo=UTC),
        "summary": "India's largest private lender reported strong credit growth driven by retail and SME segments.",
    },
    {
        "id": "n-007",
        "company_id": "cmp-003",
        "headline": "RBI approves HDFC Bank merger integration plan",
        "source": "Economic Times",
        "url": "",
        "published_at": datetime(2026, 6, 25, 7, 30, tzinfo=UTC),
        "summary": "The central bank gave its final approval for the integration framework of the merged entity.",
    },
    {
        "id": "n-008",
        "company_id": "cmp-004",
        "headline": "Infosys launches new AI-powered consulting practice",
        "source": "TechCrunch India",
        "url": "",
        "published_at": datetime(2026, 6, 28, 13, 0, tzinfo=UTC),
        "summary": "The IT major expanded its offerings with a dedicated AI consulting practice for enterprise clients.",
    },
    {
        "id": "n-009",
        "company_id": "cmp-005",
        "headline": "ITC Hotels demerger gains SEBI approval",
        "source": "Business Standard",
        "url": "",
        "published_at": datetime(2026, 6, 29, 9, 15, tzinfo=UTC),
        "summary": "The market regulator approved ITC's proposed demerger of its hotels business into a separate listed entity.",
    },
    {
        "id": "n-010",
        "company_id": "cmp-006",
        "headline": "Maruti Suzuki record monthly sales of 2.1 lakh units",
        "source": "Auto News",
        "url": "",
        "published_at": datetime(2026, 6, 28, 10, 0, tzinfo=UTC),
        "summary": "The automaker posted its highest-ever monthly domestic sales driven by strong SUV demand.",
    },
    {
        "id": "n-011",
        "company_id": "cmp-007",
        "headline": "Sun Pharma receives USFDA approval for key drug",
        "source": "LiveMint",
        "url": "",
        "published_at": datetime(2026, 6, 27, 15, 30, tzinfo=UTC),
        "summary": "The pharma giant received approval to market a generic version of a blockbuster oncology drug in the US.",
    },
    {
        "id": "n-012",
        "company_id": "cmp-008",
        "headline": "ICICI Bank emerges as top credit card issuer",
        "source": "Economic Times",
        "url": "",
        "published_at": datetime(2026, 6, 29, 12, 0, tzinfo=UTC),
        "summary": "The private lender surpassed HDFC Bank in total credit cards issued, crossing the 2 crore milestone.",
    },
    {
        "id": "n-013",
        "company_id": "cmp-009",
        "headline": "HPCL reports highest quarterly refining margins in 3 years",
        "source": "Mint",
        "url": "",
        "published_at": datetime(2026, 6, 26, 8, 0, tzinfo=UTC),
        "summary": "Strong crude oil processing margins drove the company's best quarterly performance since FY24.",
    },
    {
        "id": "n-014",
        "company_id": "cmp-010",
        "headline": "Tata Motors JLR posts record quarterly revenue",
        "source": "Financial Express",
        "url": "",
        "published_at": datetime(2026, 6, 28, 11, 30, tzinfo=UTC),
        "summary": "Jaguar Land Rover reported its highest-ever quarterly revenue driven by strong Range Rover and Defender sales.",
    },
]

# ─── Market-level news (company_id = None) ───
# Matches frontend/src/data/market.ts getMarketNews() exactly.

MARKET_NEWS: list[dict] = [
    {
        "id": "mn-001",
        "company_id": None,
        "headline": "RBI keeps repo rate unchanged at 6.5%",
        "source": "Economic Times",
        "url": "",
        "published_at": datetime(2026, 6, 29, 10, 0, tzinfo=UTC),
        "summary": "The central bank maintained the benchmark lending rate, citing stable inflation trends.",
    },
    {
        "id": "mn-002",
        "company_id": None,
        "headline": "FII net buyers for fifth consecutive session",
        "source": "Moneycontrol",
        "url": "",
        "published_at": datetime(2026, 6, 29, 9, 30, tzinfo=UTC),
        "summary": "Foreign institutional investors bought shares worth Rs 3,200 crore in today's session.",
    },
    {
        "id": "mn-003",
        "company_id": None,
        "headline": "India GDP growth projected at 7.2% for FY27",
        "source": "Reuters India",
        "url": "",
        "published_at": datetime(2026, 6, 28, 14, 0, tzinfo=UTC),
        "summary": "The World Bank revised India's growth forecast upward citing strong domestic consumption.",
    },
    {
        "id": "mn-004",
        "company_id": None,
        "headline": "Crude oil prices drop 2% on global demand concerns",
        "source": "Financial Express",
        "url": "",
        "published_at": datetime(2026, 6, 28, 11, 0, tzinfo=UTC),
        "summary": "Brent crude fell below $78 per barrel amid weakening demand from major economies.",
    },
    {
        "id": "mn-005",
        "company_id": None,
        "headline": "SEBI tightens F&O trading norms for retail investors",
        "source": "LiveMint",
        "url": "",
        "published_at": datetime(2026, 6, 27, 16, 0, tzinfo=UTC),
        "summary": "The regulator proposed stricter margin requirements and position limits for individual traders.",
    },
]


async def seed_news(session) -> int:
    """Insert company-specific and market-level news articles.

    Args:
        session: An async SQLAlchemy session (caller manages commit).

    Returns:
        Total number of news articles inserted.
    """
    from sqlalchemy import func, select

    count_result = await session.execute(
        select(func.count()).select_from(NewsArticle)
    )
    count = count_result.scalar()

    if count and count > 0:
        print(f"  News: {count} articles already exist, skipping.")
        return 0

    for n_data in COMPANY_NEWS:
        article = NewsArticle(**n_data)
        session.add(article)

    for n_data in MARKET_NEWS:
        article = NewsArticle(**n_data)
        session.add(article)

    await session.flush()
    total = len(COMPANY_NEWS) + len(MARKET_NEWS)
    print(f"  News: inserted {total} articles ({len(COMPANY_NEWS)} company, {len(MARKET_NEWS)} market).")
    return total
