import type { LearningModule, Achievement } from '@/types/learning'

const modules: LearningModule[] = [
  {
    id: 'mod-001',
    title: 'Market Basics',
    description:
      'Understand how the Indian stock market works, the key exchanges, and the fundamentals every investor should know before placing their first trade.',
    category: 'Beginner',
    icon: 'BookOpen',
    lessons: [
      {
        id: 'les-001',
        moduleId: 'mod-001',
        title: 'Understanding the Stock Market',
        order: 1,
        durationMinutes: 5,
        content: `# What is a Stock Market?

A stock market is a platform where buyers and sellers trade shares of publicly listed companies. In India, the two primary exchanges are the **National Stock Exchange (NSE)** and the **Bombay Stock Exchange (BSE)**.

## How Does It Work?

When a company wants to raise capital, it lists its shares on an exchange through an **Initial Public Offering (IPO)**. Once listed, these shares can be bought and sold by investors during market hours (9:15 AM to 3:30 PM IST).

## Key Participants

- **Retail Investors** — Individuals like you who buy and sell shares
- **Institutional Investors** — Mutual funds, insurance companies, and foreign investors (FIIs/DFIIs)
- **Brokers** — Intermediaries who execute trades on your behalf (e.g., Zerodha, Groww)
- **Market Makers** — Entities that provide liquidity by offering to buy and sell at quoted prices

## Why It Matters

The stock market allows you to own a piece of India's biggest companies. Instead of keeping money idle in a savings account, investing in equities historically offers higher returns over the long term, helping you build wealth and beat inflation.

## NSE vs BSE

The NSE is the larger exchange by trading volume and is home to the **NIFTY 50** index. The BSE, established in 1875, is Asia's oldest exchange and hosts the **SENSEX** index. Most stocks are listed on both exchanges, and prices typically remain in sync.`,
      },
      {
        id: 'les-002',
        moduleId: 'mod-001',
        title: 'How to Read Stock Prices',
        order: 2,
        durationMinutes: 5,
        content: `# Understanding Stock Price Quotes

When you look up a stock, you see several numbers. Understanding each one is essential before making any investment decision.

## Key Price Terms

- **LTP (Last Traded Price)** — The most recent price at which the stock was bought or sold
- **Open / High / Low / Close** — The day's opening price, highest price, lowest price, and previous day's closing price
- **Bid / Ask (Offer)** — The highest price a buyer is willing to pay (bid) and the lowest price a seller is willing to accept (ask)
- **Volume** — The total number of shares traded during the day

## Market Capitalisation

**Market Cap = Current Share Price x Total Number of Outstanding Shares**

This tells you the total value of the company as determined by the stock market. In India, companies are classified as:

- **Large Cap** — Top 100 companies by market cap (e.g., Reliance, TCS, HDFC Bank)
- **Mid Cap** — Companies ranked 101–250
- **Small Cap** — Companies ranked 251 and below

## 52-Week High and Low

These represent the highest and lowest prices the stock has traded at over the past year. They help you understand the current price relative to its recent range. A stock near its 52-week high may indicate strong momentum, while one near its low could signal an opportunity or a warning.`,
      },
      {
        id: 'les-003',
        moduleId: 'mod-001',
        title: 'Types of Securities',
        order: 3,
        durationMinutes: 6,
        content: `# What Can You Invest In?

The Indian market offers various financial instruments. Understanding each type helps you build a diversified portfolio.

## Equities (Shares)

When you buy a stock, you own a small fraction of that company. Equities offer the highest potential returns but also carry higher risk. Returns come from **capital appreciation** (price going up) and **dividends** (company sharing profits).

## Mutual Funds

Mutual funds pool money from many investors and invest in a diversified portfolio of stocks, bonds, or both. They are managed by professional fund managers. **SIP (Systematic Investment Plan)** allows you to invest a fixed amount regularly.

## Bonds and Fixed Income

Government bonds (G-Sec), corporate bonds, and fixed deposits offer fixed returns with lower risk. They are suitable for conservative investors or for the debt portion of your portfolio.

## ETFs (Exchange Traded Funds)

ETFs trade on the stock exchange like individual stocks but hold a basket of securities. **NIFTY 50 ETF**, for example, gives you exposure to all 50 companies in the index with a single purchase.

## Derivatives (Futures and Options)

Futures and Options (F&O) are contracts whose value derives from an underlying asset. They allow leverage but carry significantly higher risk. Beginners should thoroughly understand these before trading.`,
      },
      {
        id: 'les-004',
        moduleId: 'mod-001',
        title: 'Market Sessions and Order Types',
        order: 4,
        durationMinutes: 5,
        content: `# When and How to Trade

Understanding market timings and order types ensures your trades execute the way you intend.

## Trading Sessions

- **Pre-Open Session (9:00 – 9:15 AM)** — Price discovery through order matching. No actual trading happens here; only orders are collected and matched to determine the opening price.
- **Normal Session (9:15 AM – 3:30 PM)** — The main trading window where all buy and sell orders are executed continuously.
- **Closing Session (3:30 – 3:40 PM)** — The closing price is calculated based on a weighted average of the last 30 minutes of trading.
- **Post-Closing Session (3:40 – 4:00 PM)** — Limited trading at the closing price.

## Order Types

- **Market Order** — Executes immediately at the best available price. You get filled quickly but may not get the exact price you see.
- **Limit Order** — Executes only at your specified price or better. You control the price but the order may not get filled if the market doesn't reach your price.
- **Stop Loss Order** — A trigger order that activates only when the stock hits a specified price. Used to limit potential losses.

## Choosing the Right Order

Use **market orders** for highly liquid stocks where the price difference is negligible. Use **limit orders** when you want precise control over your entry or exit price, especially for less liquid stocks or large quantities.`,
      },
    ],
  },
  {
    id: 'mod-002',
    title: 'Fundamental Analysis',
    description:
      'Learn how to evaluate a company\'s financial health and intrinsic value using financial statements, ratios, and valuation methods.',
    category: 'Beginner',
    icon: 'BarChart3',
    lessons: [
      {
        id: 'les-005',
        moduleId: 'mod-002',
        title: 'What is Fundamental Analysis?',
        order: 1,
        durationMinutes: 5,
        content: `# Fundamental Analysis Explained

Fundamental analysis is the process of evaluating a company's intrinsic value by examining its financial statements, management quality, competitive position, and economic conditions.

## The Core Idea

Instead of following price trends or charts, fundamental analysts ask: **"What is this company actually worth?"** If the market price is below the calculated intrinsic value, the stock may be undervalued — a potential buying opportunity.

## Top-Down vs Bottom-Up

- **Top-Down Approach** — Start with the broader economy (GDP growth, interest rates, inflation), then narrow down to sectors, and finally select individual companies.
- **Bottom-Up Approach** — Start directly with individual company analysis regardless of macro conditions. Focus on the company's specific financials and competitive advantages.

## Key Questions to Ask

- Is the company consistently profitable?
- Is revenue growing year over year?
- How much debt does the company carry?
- Does the company have a competitive advantage (moat)?
- Is the management shareholder-friendly?

## Why It Matters in India

Indian markets can be volatile in the short term. Fundamental analysis helps you identify quality companies that can weather market downturns and deliver long-term wealth creation. It is the foundation of value investing, followed by legendary investors like Warren Buffett.`,
      },
      {
        id: 'les-006',
        moduleId: 'mod-002',
        title: 'Reading Financial Statements',
        order: 2,
        durationMinutes: 7,
        content: `# The Three Financial Statements

Every publicly listed company in India publishes three key financial statements. Understanding these is essential for fundamental analysis.

## 1. Balance Sheet (Statement of Financial Position)

A snapshot of what the company **owns** and **owes** at a specific point in time.

- **Assets** — What the company owns (cash, inventory, property, equipment, investments)
- **Liabilities** — What the company owes (loans, payables, bonds)
- **Shareholders' Equity** — Assets minus Liabilities. This is the residual value belonging to shareholders.

**Key Formula: Assets = Liabilities + Shareholders' Equity**

## 2. Profit & Loss Statement (Income Statement)

Shows the company's **revenues, expenses, and profits** over a period (quarter or year).

- **Revenue / Sales** — Total income from core business operations
- **Operating Expenses** — Costs of running the business (salaries, raw materials, marketing)
- **Operating Profit (EBIT)** — Revenue minus operating expenses
- **Net Profit** — The bottom line after taxes and interest. This is what shareholders care about most.

## 3. Cash Flow Statement

Tracks the actual **movement of cash** in and out of the company. It is divided into three sections:

- **Operating Activities** — Cash generated from core business
- **Investing Activities** — Cash spent on or received from buying/selling assets
- **Financing Activities** — Cash from loans, equity issuance, or dividend payments

A company can be profitable on paper but run out of cash. Always check the cash flow statement.`,
      },
      {
        id: 'les-007',
        moduleId: 'mod-002',
        title: 'Key Financial Ratios',
        order: 3,
        durationMinutes: 8,
        content: `# Ratios That Matter

Financial ratios help you quickly assess a company's performance and compare it with peers. Here are the most important ones for Indian equity investors.

## Valuation Ratios

- **P/E Ratio (Price to Earnings)** — How much you pay for each rupee of earnings. Lower P/E may indicate undervaluation, but compare within the same sector. IT companies typically have higher P/E than banks.
- **P/B Ratio (Price to Book)** — Price relative to the company's net asset value. A P/B below 1 may mean the stock is trading below its book value.
- **Dividend Yield** — Annual dividend per share divided by the stock price. Useful for income-focused investors.

## Profitability Ratios

- **ROE (Return on Equity)** — Net profit as a percentage of shareholders' equity. Higher ROE indicates efficient use of shareholder capital. Look for consistently high ROE (above 15% is generally good).
- **ROA (Return on Assets)** — Net profit as a percentage of total assets. Measures how efficiently the company uses its assets.
- **Net Profit Margin** — Net profit as a percentage of revenue. Shows how much of each rupee of revenue becomes profit.

## Leverage Ratios

- **Debt-to-Equity Ratio** — Total debt divided by shareholders' equity. Lower is generally safer. A ratio above 2 may indicate high leverage.
- **Interest Coverage Ratio** — Operating profit divided by interest expense. Shows how easily the company can pay its interest obligations. Above 3 is considered comfortable.

## Where to Find These

All ratios are available on platforms like **Moneycontrol**, **Trendlyne**, and in company annual reports on the BSE/NSE websites.`,
      },
      {
        id: 'les-008',
        moduleId: 'mod-002',
        title: 'Company Valuation Methods',
        order: 4,
        durationMinutes: 7,
        content: `# How to Value a Company

Valuation is both an art and a science. Here are the primary methods used by analysts in the Indian market.

## Relative Valuation (Comparative)

The most common approach. You compare a company's valuation multiples with its peers.

- **P/E Comparison** — Compare the P/E ratio with industry average and direct competitors. If HDFC Bank trades at 20x earnings and ICICI Bank at 18x, which offers better value?
- **P/B Comparison** — Especially useful for asset-heavy sectors like banking and infrastructure.
- **EV/EBITDA** — Enterprise Value divided by EBITDA. Better than P/E for companies with different debt levels because it accounts for the entire capital structure.

## Intrinsic Value (DCF)

**Discounted Cash Flow (DCF)** estimates the present value of all future cash flows a company will generate. While academically rigorous, DCF is highly sensitive to assumptions about growth rates and discount rates.

**Basic DCF Steps:**
1. Estimate future free cash flows (usually 5-10 years)
2. Estimate a terminal value (value beyond the projection period)
3. Discount all future cash flows to present value using a discount rate
4. Compare the intrinsic value with the current market price

## Book Value Approach

For banks and financial companies, **Price to Book Value (P/B)** is often the most relevant metric. Compare the P/B with historical averages and peers to assess if the stock is fairly priced.

## A Practical Note

No single method is perfect. Experienced investors use multiple valuation approaches and look for convergence — if several methods suggest the stock is undervalued, the conviction is stronger.`,
      },
    ],
  },
  {
    id: 'mod-003',
    title: 'Technical Analysis',
    description:
      'An introduction to reading charts, identifying trends, and using common technical indicators to time your entries and exits.',
    category: 'Beginner',
    icon: 'LineChart',
    lessons: [
      {
        id: 'les-009',
        moduleId: 'mod-003',
        title: 'Introduction to Charts',
        order: 1,
        durationMinutes: 6,
        content: `# Reading Stock Charts

Technical analysis uses historical price data to identify patterns and trends that may help predict future price movements.

## Types of Charts

- **Line Chart** — The simplest form. Connects closing prices with a line. Good for seeing the overall trend but hides intra-period detail.
- **Bar Chart** — Shows open, high, low, and close (OHLC) for each period. Each vertical bar represents the price range.
- **Candlestick Chart** — The most popular among traders. Each candle shows OHLC with a body (open to close) and wicks (high and low). **Green** candles indicate the close was higher than the open (bullish); **red** indicates the opposite (bearish).

## Timeframes

Charts can be viewed across different timeframes:

- **Intraday** — 1-minute, 5-minute, 15-minute charts for day trading
- **Short-term** — Daily and weekly charts for swing trading (days to weeks)
- **Long-term** — Monthly charts for positional or investment decisions

## Trends

- **Uptrend** — A series of higher highs and higher lows
- **Downtrend** — A series of lower highs and lower lows
- **Sideways (Consolidation)** — Price moving within a range without a clear direction

The golden rule: **"The trend is your friend."** Align your trades with the prevailing trend rather than fighting it.

## Volume

Volume confirms price movements. A breakout on high volume is more reliable than one on low volume. Always look at volume alongside price action.`,
      },
      {
        id: 'les-010',
        moduleId: 'mod-003',
        title: 'Support and Resistance',
        order: 2,
        durationMinutes: 6,
        content: `# Key Price Levels

Support and resistance are foundational concepts in technical analysis. They represent price levels where buying or selling pressure historically intensifies.

## Support

A **support level** is a price where demand is strong enough to prevent the price from falling further. Think of it as a floor. At support, buyers step in because they believe the price is attractive.

- Previous lows often act as support
- Round numbers (e.g., ₹1000, ₹2000) can act as psychological support
- Moving averages can serve as dynamic support levels

## Resistance

A **resistance level** is a price where selling pressure prevents the price from rising further. Think of it as a ceiling. At resistance, sellers dominate because they believe the price is too high.

- Previous highs often act as resistance
- The same round numbers that act as support can also act as resistance
- A resistance level, once broken, often becomes new support (role reversal)

## How to Use These Levels

- **Buy near support** with a stop loss just below it
- **Sell near resistance** or wait for a breakout above it
- **Breakout trading** — When price closes convincingly above resistance, it may signal the start of a new uptrend. Wait for volume confirmation before entering.

## Drawing Trend Lines

Connect two or more swing lows for an **uptrend line** and two or more swing highs for a **downtrend line**. The more times a trend line is tested, the more significant it becomes.`,
      },
      {
        id: 'les-011',
        moduleId: 'mod-003',
        title: 'Moving Averages',
        order: 3,
        durationMinutes: 7,
        content: `# Moving Averages

Moving averages smooth out price data to reveal the underlying trend. They are among the most widely used technical indicators.

## Simple Moving Average (SMA)

The SMA calculates the average closing price over a specified number of periods. For example, a **50-day SMA** adds up the last 50 closing prices and divides by 50.

**Common SMA periods in India:**
- **20 SMA** — Short-term trend
- **50 SMA** — Medium-term trend
- **200 SMA** — Long-term trend (closely watched by institutions)

## Exponential Moving Average (EMA)

The EMA gives more weight to recent prices, making it more responsive to new information than the SMA. For short-term trading, EMAs are generally preferred.

## Key Signals

- **Golden Cross** — When the 50-day MA crosses above the 200-day MA. Considered a **bullish** signal indicating potential upward momentum.
- **Death Cross** — When the 50-day MA crosses below the 200-day MA. Considered a **bearish** signal.
- **Price above MA** — Bullish, the trend is up
- **Price below MA** — Bearish, the trend is down

## Practical Application

Use moving averages as dynamic support and resistance. When a stock that has been trending above its 50-day MA pulls back to touch it, that can be a buying opportunity. However, moving averages are **lagging indicators** — they confirm trends but do not predict reversals. Always combine them with other analysis methods.`,
      },
    ],
  },
  {
    id: 'mod-004',
    title: 'Risk Management',
    description:
      'Learn how to protect your capital through position sizing, diversification, and disciplined risk control strategies.',
    category: 'Beginner',
    icon: 'Shield',
    lessons: [
      {
        id: 'les-012',
        moduleId: 'mod-004',
        title: 'Types of Investment Risk',
        order: 1,
        durationMinutes: 5,
        content: `# Understanding Risk

Every investment carries some degree of risk. The key is to understand, measure, and manage it — not to eliminate it entirely.

## Market Risk (Systematic Risk)

This is the risk that the overall market may decline, affecting nearly all stocks. Factors include economic downturns, geopolitical events, changes in interest rates, and global market conditions. **Diversification cannot eliminate market risk.**

## Sector Risk

Risk specific to a particular industry. For example, a regulatory change affecting the pharmaceutical sector would impact all pharma stocks, regardless of individual company strength.

## Company-Specific Risk (Unsystematic Risk)

Risk unique to a single company — poor management decisions, accounting fraud, product failures, or loss of a major contract. **Diversification across companies and sectors helps reduce this risk.**

## Liquidity Risk

The risk that you may not be able to sell your shares quickly at a fair price. Small-cap and penny stocks often have low trading volumes, making it hard to exit large positions without significantly impacting the price.

## Currency and Inflation Risk

- **Currency Risk** — For companies with significant foreign revenue, exchange rate fluctuations can impact earnings
- **Inflation Risk** — Rising inflation erodes the real value of your returns. Equities historically offer some inflation protection compared to fixed income.

## Your Risk Profile

Before investing, honestly assess your risk tolerance based on your financial situation, investment horizon, and emotional comfort with market volatility.`,
      },
      {
        id: 'les-013',
        moduleId: 'mod-004',
        title: 'Position Sizing and Diversification',
        order: 2,
        durationMinutes: 6,
        content: `# How Much to Invest

Position sizing and diversification are the two most important decisions you make as an investor, often more impactful than stock selection.

## The 1-2% Rule

Professional risk managers often follow this principle: **never risk more than 1-2% of your total capital on a single trade.** If your portfolio is ₹10,00,000, you should not risk losing more than ₹10,000-₹20,000 on any one position.

This means setting your position size and stop loss such that the maximum loss is within this limit.

## Diversification Principles

- **Across Sectors** — Don't put all your money in one sector. If banking faces a crisis, your IT and pharma holdings should cushion the blow.
- **Across Market Caps** — A mix of large-cap (stable), mid-cap (growth), and small-cap (high potential) stocks balances risk and reward.
- **Across Asset Classes** — Equities, fixed income, and gold respond differently to economic conditions. A diversified portfolio is more resilient.

## How Many Stocks?

For most individual investors, holding **15-25 stocks** across 5-8 sectors provides adequate diversification. Holding too few increases company-specific risk; holding too many makes the portfolio hard to manage and may dilute returns.

## Rebalancing

As markets move, your portfolio's allocation will drift from your original plan. Review and rebalance periodically (quarterly or semi-annually) to maintain your target allocation.`,
      },
      {
        id: 'les-014',
        moduleId: 'mod-004',
        title: 'Stop Loss Strategies',
        order: 3,
        durationMinutes: 6,
        content: `# Protecting Your Capital

A stop loss is a predetermined price level at which you exit a trade to limit your losses. It is one of the most important risk management tools.

## Why Stop Losses Matter

Without a stop loss, emotions take over. You hold a losing position hoping it will recover, and the loss keeps growing. A stop loss removes this emotional decision and enforces discipline.

## Types of Stop Losses

- **Fixed Stop Loss** — Set at a specific price. For example, if you buy at ₹1000, set a stop loss at ₹950 (5% loss).
- **Percentage-Based** — A fixed percentage below your buy price. Common levels: 5%, 8%, or 10% depending on your risk tolerance and the stock's volatility.
- **Trailing Stop Loss** — Moves up with the price but never comes down. If you buy at ₹1000 and the stock goes to ₹1200, a 10% trailing stop would be at ₹1080. If the stock falls to ₹1080, you sell and lock in ₹80 profit.

## Where to Place Your Stop Loss

- **Below Support** — Place your stop just below a clear support level. If support breaks, the thesis is invalidated.
- **Below Moving Averages** — The 50-day or 20-day EMA can serve as a dynamic stop loss level.
- **Based on Volatility** — More volatile stocks need wider stops to avoid being stopped out by normal fluctuations. Use the **Average True Range (ATR)** indicator for volatility-based stops.

## The Golden Rule

**Always set your stop loss before entering a trade.** Never move your stop loss further away to avoid taking a loss. Small, controlled losses are part of successful investing.`,
      },
    ],
  },
  {
    id: 'mod-005',
    title: 'Portfolio Strategies',
    description:
      'Explore different investment approaches — from value investing and growth stocks to dividend strategies and systematic investing.',
    category: 'Beginner',
    icon: 'Briefcase',
    lessons: [
      {
        id: 'les-015',
        moduleId: 'mod-005',
        title: 'Building a Diversified Portfolio',
        order: 1,
        durationMinutes: 6,
        content: `# Constructing Your Portfolio

A well-constructed portfolio is the foundation of long-term investment success. Here is a practical framework for Indian investors.

## Start with Asset Allocation

Before picking stocks, decide how to divide your money across asset classes:

- **Equity** — For growth (recommended 60-80% for young investors with long horizons)
- **Debt / Fixed Income** — For stability and regular income (20-40%)
- **Gold** — As an inflation hedge and diversifier (5-10%)
- **Cash** — For opportunities and emergencies (5-10%)

## Core-Satellite Approach

A popular strategy for individual investors:

- **Core (70-80%)** — Invest in broad index funds or large-cap blue chips. This provides stable, market-linked returns with low effort.
- **Satellite (20-30%)** — Invest in individual stocks, sector bets, or small/mid-cap funds for potential alpha.

## Example Indian Portfolio

- 40% — NIFTY 50 Index Fund (core stability)
- 15% — Mid-cap Fund (growth potential)
- 10% — Selected large-cap stocks (ICICI Bank, TCS, Reliance)
- 15% — Fixed deposits or debt funds (stability)
- 10% — Gold ETF or Sovereign Gold Bonds
- 10% — Cash for opportunities

## Review Regularly

Review your portfolio quarterly. Check if your allocation has drifted, evaluate individual holdings, and rebalance if needed. Don't check daily — that leads to emotional decisions.`,
      },
      {
        id: 'les-016',
        moduleId: 'mod-005',
        title: 'Investment Styles',
        order: 2,
        durationMinutes: 7,
        content: `# Finding Your Style

Different investment styles suit different personalities and goals. Understanding these helps you choose an approach that matches your temperament.

## Value Investing

**Philosophy:** Buy undervalued stocks and wait for the market to recognise their true worth.

- Look for low P/E, low P/B, high dividend yield
- Focus on companies with strong fundamentals trading below intrinsic value
- Requires patience — it may take months or years for the thesis to play out
- Famous practitioners: Warren Buffett, Benjamin Graham

## Growth Investing

**Philosophy:** Buy companies with high revenue and earnings growth, even if they appear expensive.

- Look for high revenue growth (20%+ annually), expanding market share
- Accept higher valuations (high P/E) for superior growth
- Focus on companies disrupting industries or dominating niches
- Works well in bull markets, can be painful in downturns

## Dividend Investing

**Philosophy:** Invest in companies that pay consistent, growing dividends.

- Look for high dividend yield (3%+), consistent payout history
- Focus on profitable, cash-rich companies in mature industries
- Suitable for investors seeking regular income
- In India: ITC, HUL, and PSU banks have historically been strong dividend payers

## Index Investing

**Philosophy:** Don't try to beat the market. Buy the entire market through index funds.

- Lowest effort, lowest cost approach
- NIFTY 50 index has delivered approximately 12-14% CAGR over long periods
- Eliminates stock selection risk
- Ideal for investors who don't have time for research`,
      },
      {
        id: 'les-017',
        moduleId: 'mod-005',
        title: 'Rupee Cost Averaging',
        order: 3,
        durationMinutes: 5,
        content: `# The Power of Consistency

Rupee Cost Averaging (RCA), also known as Systematic Investment Plan (SIP), is one of the most effective strategies for everyday investors.

## How It Works

Instead of investing a lump sum, you invest a **fixed amount at regular intervals** (monthly, for example). When prices are high, you buy fewer units. When prices are low, you buy more units. Over time, your average purchase price tends to be favourable.

**Example:** Invest ₹10,000 every month in a mutual fund
- Month 1: NAV ₹100 — You get 100 units
- Month 2: NAV ₹80 — You get 125 units
- Month 3: NAV ₹110 — You get 90.9 units
- Total invested: ₹30,000 for 315.9 units
- Average cost: ₹94.96 per unit

## Benefits

- **Removes emotion** — You invest regardless of market conditions
- **Disciplined approach** — No temptation to time the market
- **Handles volatility** — Market dips become buying opportunities
- **Accessible** — Can start with as little as ₹500 per month

## When to Use RCA

- When investing regularly from your salary
- When you are unsure about market direction
- For long-term goals (retirement, children's education)
- When you want to reduce the stress of market timing

## When RCA May Not Be Ideal

- If you have a large lump sum and the market is significantly undervalued, investing it all at once may be better
- For short-term goals where market recovery time is limited`,
      },
    ],
  },
  {
    id: 'mod-006',
    title: 'Indian Market Regulations',
    description:
      'Understand SEBI\'s role, the tax implications of your investments, and how demat and trading accounts work.',
    category: 'Beginner',
    icon: 'Scale',
    lessons: [
      {
        id: 'les-018',
        moduleId: 'mod-006',
        title: 'Role of SEBI',
        order: 1,
        durationMinutes: 5,
        content: `# The Market Regulator

The **Securities and Exchange Board of India (SEBI)** is the primary regulator of the Indian securities market. Established in 1992, it protects investor interests and ensures market integrity.

## Key Functions

- **Regulates Stock Exchanges** — Oversees NSE, BSE, and other exchanges to ensure fair and transparent trading
- **Registers and Regulates Intermediaries** — Brokers, mutual funds, portfolio managers, and investment advisors must be SEBI-registered
- **Protects Investors** — Enforces disclosure requirements, prevents insider trading, and handles investor grievances
- **Creates Rules** — Formulates regulations for market participants, IPO processes, and corporate governance

## Important SEBI Regulations

- **Insider Trading Prohibition** — Company insiders (promoters, directors, officers) cannot trade based on unpublished price-sensitive information
- **Disclosure Requirements** — Companies must disclose material events promptly to exchanges
- **Know Your Client (KYC)** — All investors must complete KYC verification before trading
- **Margin Requirements** — SEBI sets margin rules for derivatives and intraday trading to curb excessive speculation

## Investor Protection

If you face issues with a broker or listed company, you can file a complaint through **SEBI's SCORES portal** (Sebi Complaints Redressal System). SEBI has the authority to impose penalties, suspend trading, and even cancel registrations for violations.

## Why It Matters for You

Understanding SEBI's role helps you know your rights as an investor, identify regulated intermediaries, and avoid fraudulent schemes. Always trade through a SEBI-registered broker.`,
      },
      {
        id: 'les-019',
        moduleId: 'mod-006',
        title: 'Understanding Taxes on Investments',
        order: 2,
        durationMinutes: 6,
        content: `# Taxation of Equity Investments

Understanding the tax implications of your investments is crucial for calculating your real returns. Here is what you need to know for Indian equity markets.

## Short-Term Capital Gains (STCG)

- **Applicable when:** You sell equity shares or equity mutual funds held for **less than 12 months**
- **Tax rate:** **20%** (as of recent changes; verify with current rates)
- The gain is calculated as: Selling price minus purchase price (plus any brokerage and charges)

## Long-Term Capital Gains (LTCG)

- **Applicable when:** You sell equity shares or equity mutual funds held for **more than 12 months**
- **Tax rate:** **12.5%** on gains exceeding ₹1.25 lakh per financial year
- The first ₹1.25 lakh of LTCG in a year is exempt
- Indexation benefit is NOT available for equity investments

## Dividend Taxation

- Dividends from domestic companies are **taxable in the hands of the investor** at their applicable income tax slab rate
- Companies deduct TDS (Tax Deducted at Source) at 10% on dividends exceeding ₹5,000 per year

## Intraday Trading Tax

Profits from intraday equity trading (buying and selling on the same day) are classified as **speculative business income** and taxed at your income tax slab rate.

## Securities Transaction Tax (STT)

STT is levied on every buy and sell transaction on exchanges:
- Equity delivery: 0.1% on sell side
- Equity intraday: 0.025% on each side

## Tax-Loss Harvesting

You can offset capital gains against capital losses. Book losses before March 31st to reduce your tax liability. Short-term losses can be offset against both short-term and long-term gains.`,
      },
      {
        id: 'les-020',
        moduleId: 'mod-006',
        title: 'Demat and Trading Accounts',
        order: 3,
        durationMinutes: 5,
        content: `# Your Investment Accounts

To trade in the Indian stock market, you need two accounts. Understanding how they work is the first practical step in your investing journey.

## Demat Account (Dematerialised Account)

Think of this as your **digital locker for shares**. When you buy shares, they are credited to your demat account in electronic form. When you sell, they are debited.

- Held with a **Depository Participant (DP)** — usually your broker or a bank
- India has two depositories: **NSDL** and **CDSL**
- You receive a statement similar to a bank statement showing your holdings
- **No shares can be held in physical form** for most trades since April 2019

## Trading Account

This is your **gateway to the stock exchange**. Your broker provides this account, and all buy/sell orders are routed through it.

- Links your bank account (for funds) and demat account (for shares)
- Choose between full-service brokers (ICICI Direct, HDFC Securities) and discount brokers (Zerodha, Groww)
- Compare brokerage fees, platform quality, research tools, and customer support

## Account Opening Process

1. **Choose a broker** — Compare fees, features, and reviews
2. **Complete KYC** — PAN card, Aadhaar, bank account, and a recent photo
3. **E-sign the agreement** — Using Aadhaar-based e-signature
4. **Account activation** — Usually takes 24-48 hours after verification

## Choosing the Right Broker

- **Discount Brokers** — Lower fees (₹20 per order or zero for equity delivery), good for self-directed investors
- **Full-Service Brokers** — Higher fees but offer research, advisory, and relationship management

For most beginners starting with the virtual trading simulator, understanding this setup prepares you for real-world investing.`,
      },
    ],
  },
]

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach-001',
    title: 'First Lesson',
    description: 'Complete your first lesson',
    icon: 'BookOpen',
  },
  {
    id: 'ach-002',
    title: 'Five Lessons',
    description: 'Complete 5 lessons',
    icon: 'BookCheck',
  },
  {
    id: 'ach-003',
    title: 'First Trade',
    description: 'Make your first virtual trade',
    icon: 'TrendingUp',
  },
  {
    id: 'ach-004',
    title: 'Market Graduate',
    description: 'Complete all Market Basics lessons',
    icon: 'GraduationCap',
  },
]

export function getModules(): LearningModule[] {
  return modules
}

export function getModuleById(id: string): LearningModule | undefined {
  return modules.find((m) => m.id === id)
}

export function getLessonById(
  moduleId: string,
  lessonId: string,
): LearningModule['lessons'][number] | undefined {
  const mod = modules.find((m) => m.id === moduleId)
  return mod?.lessons.find((l) => l.id === lessonId)
}

export function getAllLessons(): { moduleId: string; lessonId: string }[] {
  return modules.flatMap((m) =>
    m.lessons.map((l) => ({ moduleId: m.id, lessonId: l.id })),
  )
}