import type {
  ResearchReport,
  MarketIntelligence,
  SectorInsight,
} from '@/types/research'

// ─── Helper ───

function s(title: string, content: string): { title: string; content: string; generatedBy: 'static' } {
  return { title, content, generatedBy: 'static' }
}

// ─── Reliance Industries (cmp-001) ───

const relianceReport: ResearchReport = {
  companyId: 'cmp-001',
  companyName: 'Reliance Industries Ltd',
  symbol: 'RELIANCE',
  sector: 'Oil & Gas / Conglomerate',
  generatedAt: '2026-06-30T10:30:00Z',
  analysisCoverage: 78,
  outlook: 'bullish',
  sections: {
    executiveSummary: s('Executive Summary', `Reliance Industries remains one of India's most diversified conglomerates, with significant operations spanning petrochemicals, refining, retail, and telecommunications. The company's **Jio Platforms** continues to drive digital adoption across India, while **Reliance Retail** is expanding aggressively into new formats and geographies.

**Key Highlights:**
- Jio's 5G rollout covering 85% of urban India, with ARPU trending upward
- Reliance Retail crossing ₹3 lakh crore annual revenue milestone
- New energy business (green hydrogen, solar) moving from pilot to commercial scale
- Consistent free cash flow generation funding capex without significant leverage increase

**Near-term Catalysts:** Retail IPO timeline clarity, Jio tariff hikes, and new energy venture partnerships are expected to drive re-rating. The stock appears reasonably valued relative to its sum-of-the-parts potential, though near-term refining margins remain a watch area.`),

    companyOverview: s('Company Overview', `**Business Segments:**

**Oil to Chemicals (O2C):** Reliance operates one of the world's largest integrated refining complexes at Jamnagar, Gujarat, with a combined refining capacity of 1.4 million barrels per day. The O2C segment contributed approximately 55% of consolidated revenue in FY26. Key products include polymers, polyester, and specialty chemicals.

**Jio Platforms:** India's largest telecommunications operator with over 480 million subscribers. Jio has invested heavily in 5G infrastructure and is expanding into enterprise solutions, cloud computing, and IoT services. The platform ecosystem includes JioCinema, JioSaavn, and JioPay.

**Reliance Retail:** India's largest retail chain operating over 19,000 stores across grocery, fashion, and electronics formats. Recent acquisitions include brands like Pulse Pharmacy and the franchise expansion of 7-Eleven in India.

**New Energy:** Reliance's green energy ambitions include a 5,000-acre Dhirubhai Ambani Green Energy Giga Complex in Jamnagar, targeting solar panels, green hydrogen, and battery energy storage systems.

**Market Position:** Reliance is India's second-most-valued company by market capitalization and a bellwether stock in the NIFTY 50. It is consistently among the top 5 most traded stocks by volume on NSE.`),

    financialHealth: s('Financial Health', `**Revenue & Profitability (FY26):**
- Consolidated Revenue: **₹10,22,000 crore** (+8.2% YoY)
- EBITDA: **₹1,62,000 crore** (+5.1% YoY)
- Net Profit: **₹79,020 crore** (+11.3% YoY)
- EBITDA Margin: **15.9%** (stable vs FY25)

**Balance Sheet Strength:**
- Net Debt-to-Equity: **0.18x** (conservative for a capex-heavy conglomerate)
- Interest Coverage Ratio: **12.4x** (very comfortable)
- Cash and Cash Equivalents: **₹1,85,000 crore**
- Total Debt: **₹1,32,000 crore**

**Key Ratios:**
- Return on Equity (ROE): **9.8%** — improving as new businesses mature
- Return on Capital Employed (ROCE): **11.2%**
- Free Cash Flow: **₹68,000 crore** (strong, funding new energy capex)

**Dividend:** Reliance paid a dividend of ₹10 per share in FY26, maintaining a modest payout ratio. The company prioritizes reinvestment in growth businesses over shareholder returns through dividends.

**Concern:** O2C segment margins have been under pressure due to global refining overcapacity and softer chemical demand. However, Jio and Retail margins are expanding, partially offsetting this weakness.`),

    technicalAnalysis: s('Technical Analysis', `**Trend:** The stock is in a medium-term **uptrend**, trading above its 50-day and 200-day moving averages. The 50-DMA (₹2,920) recently crossed above the 200-DMA (₹2,840), forming a golden cross — a bullish signal.

**Key Levels:**
- Immediate Support: **₹2,880** (previous swing low + 50-DMA confluence)
- Strong Support: **₹2,780** (200-DMA + demand zone from March 2026)
- Immediate Resistance: **₹3,050** (all-time high zone)
- Extended Target: **₹3,200** (Fibonacci 1.618 extension from May 2026 lows)

**Momentum Indicators:**
- **RSI (14-day):** 62.5 — neutral-to-bullish, not yet in overbought territory
- **MACD:** Above signal line and zero line, indicating positive momentum
- **Volume:** Average daily volume of 12.5 crore shares, with recent sessions showing above-average buying volume

**Pattern:** The stock has formed a **cup-and-handle pattern** over 6 months with the handle near ₹2,900. A breakout above ₹3,050 could trigger a rapid move toward ₹3,200.

**Risk:** A daily close below ₹2,850 would invalidate the current bullish structure and suggest a deeper correction toward ₹2,750.`),

    marketEnvironment: s('Market Environment', `**Indian Equity Markets:** The NIFTY 50 is trading near all-time highs at 25,400, supported by strong FII inflows and robust corporate earnings. India remains one of the fastest-growing major economies with GDP growth projected at 6.8-7.2% for FY27.

**Sector Dynamics:**
- **Oil & Gas:** Crude oil prices have stabilized around $78-82/barrel, providing a favorable backdrop for Reliance's refining margins. However, global refining capacity additions in 2026-27 may compress crack spreads.
- **Telecom:** Industry ARPU is trending upward after Jio's tariff revision. The sector is moving from hyper-competition to oligopolistic pricing, benefiting incumbents.
- **Retail:** India's retail sector is growing at 12-15% annually. Organized retail penetration remains low at 12%, offering significant headroom for growth.

**Macroeconomic Factors:**
- **RBI Policy:** Repo rate at 6.25% with a neutral stance. Rate cuts are expected in H2 FY27, which would benefit growth stocks like Reliance.
- **Rupee:** INR has been relatively stable at 83-84/USD. A weaker rupee benefits Jio's dollar-denominated equipment imports.
- **Government Policy:** PLI schemes for electronics and green energy are tailwinds for Reliance's new energy business.`),

    newsIntelligence: s('News Intelligence', `**Positive Developments:**

- **Jio 5G Monetization:** Jio reported strong enterprise 5G adoption with 200+ B2B contracts signed in Q1 FY27. Industry analysts expect this to be a significant revenue driver.
- **Retail Expansion:** Reliance Retail acquired a controlling stake in a regional pharmacy chain, expanding its footprint to 1,500+ pharmacies. The company also launched quick-commerce in 8 new cities.
- **Green Energy Milestone:** Reliance commissioned its first gigafactory for solar PV modules at the Dhirubhai Ambani Green Energy Giga Complex, ahead of schedule.
- **FII Inflows:** Foreign institutional investors net bought ₹12,000 crore of Reliance shares in June 2026, the highest monthly inflow in 18 months.

**Negative / Watch Areas:**

- **Refining Margin Pressure:** Gross refining margins (GRMs) declined to $8.5/barrel in Q1 FY27, down from $11.2/barrel in Q4 FY26, reflecting global overcapacity.
- **Telecom Regulatory Risk:** TRAI's consultation paper on network usage charges could impact Jio's interconnection revenue.
- **New Energy Capex Risk:** The green energy business requires ₹75,000 crore in capex over 3 years. Any delays in revenue generation could strain cash flows.`),

    riskIntelligence: s('Risk Intelligence', `**Primary Risk Factors:**

**Company-Specific (High Impact):**
- O2C segment margin compression due to global refining overcapacity could reduce annual EBITDA by ₹8,000-12,000 crore
- New energy capex of ₹75,000 crore carries execution risk and uncertain returns timeline
- Key-man risk associated with leadership transition in the next 3-5 years

**Sector-Specific (Medium Impact):**
- Telecom ARPU growth may plateau after the initial tariff hike benefit
- Retail sector facing increased competition from quick-commerce players and e-commerce consolidation
- Regulatory changes in telecom licensing or retail FDI norms

**Macroeconomic (Medium Impact):**
- A sharper-than-expected global slowdown could reduce demand for petrochemicals
- Rising crude oil prices would increase input costs for O2C segment
- Interest rate volatility affecting capex financing costs

**Overall Risk Assessment:** Reliance's diversified business model provides a natural hedge — weakness in one segment is often offset by strength in another. The primary near-term risk is refining margin compression, partially mitigated by Jio and Retail growth.`),

    portfolioImpact: null,
    investmentDNA: null,
    aiExplanation: null,
    confidenceAndLimitations: null,
  },
}

// ─── TCS (cmp-003) ───

const tcsReport: ResearchReport = {
  companyId: 'cmp-003',
  companyName: 'Tata Consultancy Services Ltd',
  symbol: 'TCS',
  sector: 'Information Technology',
  generatedAt: '2026-06-30T11:15:00Z',
  analysisCoverage: 76,
  outlook: 'neutral',
  sections: {
    executiveSummary: s('Executive Summary', `Tata Consultancy Services (TCS) is India's largest IT services company and a global leader in digital transformation, cloud computing, and AI-driven solutions. While the company continues to dominate the Indian IT sector, it faces headwinds from **global tech spending moderation** and **AI disruption** in traditional outsourcing.

**Key Highlights:**
- Revenue growth decelerating to 6-8% range from historic 10%+ levels
- TCS AI.Cloud offering gaining traction with 150+ enterprise clients
- Strong deal pipeline of $12.5 billion TCV in Q1 FY27
- Industry-leading margins at 26.2% operating margin
- Largest employer among Indian listed companies with 600,000+ staff

**Near-term Outlook:** TCS is navigating a transition from volume-driven growth to value-driven growth. The company's deep client relationships, geographic diversification, and investments in AI/Cloud position it well for medium-term recovery. However, near-term revenue growth may remain subdued as clients optimize IT budgets.`),

    companyOverview: s('Company Overview', `**Business Overview:**

TCS is part of the Tata Group and is India's largest IT services company by revenue, market capitalization, and workforce. The company provides IT consulting, systems integration, outsourcing, and digital transformation services to clients across 55 countries.

**Service Lines:**
- **Banking, Financial Services & Insurance (BFSI):** 32% of revenue. TCS serves 15 of the top 20 global banks.
- **Retail & Consumer Business:** 18% of revenue. Strong presence in e-commerce and supply chain.
- **Communications, Media & Technology:** 14% of revenue. Includes telecom and media clients.
- **Manufacturing:** 12% of revenue. Focus on Industry 4.0 and smart manufacturing.
- **Life Sciences & Healthcare:** 11% of revenue. Growing segment with strong deal wins.
- **Other Services:** 13% of revenue including government, energy, and travel.

**Key Differentiators:**
- Proprietary platforms: TCS BaNCS (banking), ignio (AI operations), TCS OmniStore (retail)
- Largest talent pool among global IT services companies
- Strong brand equity and client retention rate above 97%

**Geographic Mix:** North America (52%), Europe (28%), India (8%), Rest of World (12%).`),

    financialHealth: s('Financial Health', `**Revenue & Profitability (FY26):**
- Consolidated Revenue: **₹2,55,000 crore** (+6.8% YoY)
- EBITDA: **₹76,500 crore** (+5.2% YoY)
- Net Profit: **₹48,200 crore** (+4.9% YoY)
- EBITDA Margin: **30.0%** — highest among large-cap Indian IT companies

**Balance Sheet Strength:**
- Net Debt-to-Equity: **0.00** (zero net debt, net cash company)
- Cash and Investments: **₹18,500 crore** in cash + ₹52,000 crore in liquid investments
- Total Debt: **₹4,200 crore** (manageable)
- Working Capital: Strong with negative working capital cycle (client advance payments)

**Key Ratios:**
- Return on Equity (ROE): **47.8%** — exceptionally high, reflecting capital-light model
- Return on Capital Employed (ROCE): **62.3%**
- Free Cash Flow: **₹42,000 crore** (robust, funding dividends and buybacks)
- Dividend Payout Ratio: **68%** (consistent dividend + ₹18,000 crore buyback in FY26)

**Key Concern:** Revenue growth has decelerated for 4 consecutive quarters. Talent utilization at 84.5% suggests room for improvement. Attrition has stabilized at 12.8% after peaking at 20%+ in FY23.`),

    technicalAnalysis: s('Technical Analysis', `**Trend:** TCS is in a **consolidation phase** between ₹3,800 and ₹4,200, having corrected 15% from its all-time high of ₹4,650 in December 2025. The stock is trading near its 200-DMA (₹4,050).

**Key Levels:**
- Immediate Support: **₹3,800** (multi-tested support + horizontal consolidation floor)
- Strong Support: **₹3,600** (gap fill from October 2025 breakout)
- Immediate Resistance: **₹4,200** (consolidation ceiling + 50-DMA)
- Extended Target: **₹4,500** (if breakout above ₹4,200 sustains)

**Momentum Indicators:**
- **RSI (14-day):** 48.2 — neutral, suggesting balanced buying/selling pressure
- **MACD:** Below signal line, approaching zero line — momentum is turning neutral from bearish
- **Volume:** Declining volumes during the consolidation, indicating lack of strong directional conviction

**Pattern:** The stock is forming a **rectangular consolidation** pattern. A breakout above ₹4,200 on high volume would signal a resumption of the uptrend. A breakdown below ₹3,800 would open the door to ₹3,600.

**Risk:** IT sector sentiment is closely tied to global tech spending. Negative guidance from US tech companies could trigger a breakdown.`),

    marketEnvironment: s('Market Environment', `**Global IT Services Market:** The global IT services market is growing at 5-7% annually, down from 8-10% pre-2024. Key trends driving demand include cloud migration, AI/ML adoption, cybersecurity, and digital transformation — areas where TCS has invested heavily.

**Indian IT Sector Dynamics:**
- Deal pipelines remain healthy at $10-15 billion TCV for top-tier Indian IT companies
- Pricing pressure from AI-driven automation reducing per-seat billing for traditional projects
- Talent costs rising 8-10% annually, partially offset by AI-augmented productivity
- Banking and financial services vertical showing signs of recovery after 2025 slowdown

**Macroeconomic Factors:**
- **US Economy:** US GDP growth moderating to 1.8-2.2%. A recession scenario would significantly impact IT spending.
- **EUR/INR:** Euro weakness against the rupee could impact TCS's European revenue in INR terms.
- **AI Disruption:** Generative AI is both a threat (replacing low-end outsourcing work) and an opportunity (new service lines). TCS is investing ₹15,000 crore in AI capabilities over 3 years.

**Regulatory Environment:** US immigration policy changes could impact H-1B visa-dependent delivery models. TCS is mitigating this through local hiring and nearshoring.`),

    newsIntelligence: s('News Intelligence', `**Positive Developments:**

- **Large Deal Wins:** TCS secured a $2.5 billion multi-year digital transformation deal with a European banking consortium, the largest deal in the sector in H1 FY27.
- **AI.Cloud Traction:** TCS's AI.Cloud offering has onboarded 150+ enterprise clients, with an average deal size of $5-15 million. This is emerging as a meaningful growth vector.
- **Shareholder Returns:** TCS announced a ₹18,000 crore share buyback program at ₹4,150 per share, signaling management confidence in intrinsic value.
- **Margin Stability:** Despite revenue growth deceleration, operating margins held steady at 26.2% in Q1 FY27, demonstrating pricing discipline and operational efficiency.

**Negative / Watch Areas:**

- **Revenue Guidance:** Management guided for 6-8% constant-currency revenue growth, below market expectations of 8-10%.
- **Attrition in Key Skills:** Attrition in AI/ML and cloud roles remains elevated at 18%, indicating talent competition.
- **Client Budget Cuts:** Two major BFSI clients (estimated $300 million annual revenue) initiated cost optimization programs that may reduce TCS's scope of work.
- **Currency Headwind:** INR appreciation against the EUR and GBP could reduce reported revenue growth by 50-80 bps.`),

    riskIntelligence: s('Risk Intelligence', `**Primary Risk Factors:**

**Company-Specific (Medium-High Impact):**
- Revenue growth deceleration may persist if global IT spending remains subdued
- AI disruption could erode TCS's traditional application development and maintenance business
- Large dependency on BFSI vertical (32% of revenue) — a sectoral downturn would be disproportionately impactful

**Sector-Specific (Medium Impact):**
- Intense competition from global players (Accenture, Deloitte) and Indian peers (Infosys, Wipro) on pricing
- Rising talent costs in India eroding the labor arbitrage advantage
- Potential for client concentration — top 10 clients account for ~15% of revenue

**Macroeconomic (High Impact):**
- US recession would significantly impact TCS's largest market (52% of revenue)
- Strengthening INR against major currencies would reduce INR-denominated revenue
- Changes in US immigration policy (H-1B visa restrictions) could disrupt the delivery model

**Overall Risk Assessment:** TCS is fundamentally strong with an excellent balance sheet and market-leading margins. The primary risk is top-line growth stagnation rather than financial distress. The company's diversification across geographies and verticals provides some cushion against sector-specific downturns.`),

    portfolioImpact: null,
    investmentDNA: null,
    aiExplanation: null,
    confidenceAndLimitations: null,
  },
}

// ─── HDFC Bank (cmp-004) ───

const hdfcReport: ResearchReport = {
  companyId: 'cmp-004',
  companyName: 'HDFC Bank Ltd',
  symbol: 'HDFCBANK',
  sector: 'Banking / Financial Services',
  generatedAt: '2026-06-30T12:00:00Z',
  analysisCoverage: 80,
  outlook: 'bullish',
  sections: {
    executiveSummary: s('Executive Summary', `HDFC Bank is India's largest private sector bank by market capitalization and the second-largest bank overall after State Bank of India. Following the landmark **HDFC Ltd merger** in July 2023, the bank has successfully integrated the mortgage portfolio and is now a full-spectrum financial services giant. The stock is positioned for strong earnings growth driven by **credit expansion**, **improved net interest margins**, and the **post-merger integration benefits**.

**Key Highlights:**
- Net Interest Income (NII) growing at 18% YoY, outpacing sector average of 12%
- Post-merger integration largely complete with cost synergies of ₹5,200 crore realized
- Retail loan growth accelerating at 22% YoY led by unsecured and vehicle loans
- Asset quality improving — Gross NPA at 1.24%, lowest in 8 quarters
- Credit card base crossing 2 crore, with spend growing 25% YoY

**Near-term Catalysts:** RBI rate cut expectations (which would reduce deposit costs faster than lending rates), continued retail loan growth, and the bank's fintech partnerships (with platforms like Zomato, Paytm) are expected to drive earnings growth of 18-20% in FY27.`),

    companyOverview: s('Company Overview', `**Business Overview:**

HDFC Bank was incorporated in 1994 and has grown to become India's premier private sector bank. The merger with HDFC Ltd (India's largest mortgage company) created a financial behemoth with a combined loan book exceeding ₹38 lakh crore.

**Key Business Segments:**
- **Retail Banking:** 55% of loans. Includes home loans (via merged HDFC Ltd), personal loans, auto loans, credit cards, and business banking. HDFC Bank is the market leader in credit cards and personal loans.
- **Corporate Banking:** 28% of loans. Focus on working capital, term loans, and cash management for mid-to-large corporates.
- **Treasury:** 12% of loans. Government securities, corporate bonds, and forex operations.
- **Other Banking:** 5% of loans including agricultural and microfinance.

**Distribution Network:**
- 8,200+ branches across India (largest among private banks)
- 19,500+ ATMs
- 70 million+ digital banking customers
- Net banking, mobile banking, and UPI as primary transaction channels

**Key Strengths:**
- Strongest retail franchise in Indian banking with consistent market share gains
- Technology leadership — first bank to launch AI-powered chatbot (EVA) and conversational banking
- Lowest cost of funds among private banks due to strong CASA (Current Account Savings Account) ratio
- Diversified loan book with no single sector exceeding 12% of total advances`),

    financialHealth: s('Financial Health', `**Revenue & Profitability (FY26):**
- Net Interest Income: **₹1,42,000 crore** (+18.1% YoY)
- Non-Interest Income: **₹48,500 crore** (+12.3% YoY)
- Net Profit: **₹72,000 crore** (+21.5% YoY)
- Return on Assets (ROA): **2.1%** — best-in-class among large Indian banks

**Key Metrics:**
- **Net Interest Margin (NIM):** 3.65% (+15 bps YoY, benefiting from merger synergies)
- **Cost-to-Income Ratio:** 38.2% (improving from 41.5% pre-merger)
- **CASA Ratio:** 46.5% (strong deposit franchise, though slightly below peak of 50%)
- **Credit Cost:** 0.65% (well-provisioned)

**Asset Quality:**
- Gross NPA: **1.24%** (improved from 1.48% a year ago)
- Net NPA: **0.31%** (among the lowest in the sector)
- Provision Coverage Ratio: **75.2%** (adequate)
- Restructured Loans: 0.8% of total advances (declining)

**Capital Adequacy:**
- CET1 Ratio: **16.8%** (well above RBI minimum of 8%)
- Total Capital Adequacy: **19.5%**
- Tier 1 Capital: ₹4,85,000 crore

**Dividend:** HDFC Bank paid a dividend of ₹19.50 per share in FY26, a 28% increase from FY25, reflecting improved earnings and capital position.`),

    technicalAnalysis: s('Technical Analysis', `**Trend:** HDFC Bank is in a **strong uptrend**, trading at all-time highs above ₹1,750. The stock has broken out of a 14-month consolidation range (₹1,400-₹1,550) with strong volume support.

**Key Levels:**
- Immediate Support: **₹1,680** (previous breakout level + 20-DMA)
- Strong Support: **₹1,580** (38.2% Fibonacci retracement of the breakout move)
- Immediate Resistance: **₹1,780** (psychological level + extension target)
- Extended Target: **₹1,900** (Fibonacci 1.272 extension)

**Momentum Indicators:**
- **RSI (14-day):** 68.4 — approaching overbought zone but not yet there
- **MACD:** Strongly above signal line and zero line with expanding histogram — bullish
- **Volume:** 30-day average volume up 40% from pre-breakout levels, confirming institutional buying
- **Bollinger Bands:** Price riding the upper band — strong momentum

**Pattern:** A **breakout from a large ascending triangle** pattern with the horizontal resistance at ₹1,550. Measured move target is ₹1,850. The stock is exhibiting characteristics of a post-merger re-rating.

**Risk:** RSI above 70 would signal overbought conditions. A weekly close below ₹1,650 would invalidate the breakout structure.`),

    marketEnvironment: s('Market Environment', `**Indian Banking Sector:**
The Indian banking sector is in a strong cyclical upswing driven by robust credit growth (15-16% YoY), improving asset quality across the system, and healthy capital adequacy. The sector is benefiting from India's formalization of credit, government infrastructure spending, and rising consumer demand.

**Key Sector Dynamics:**
- **Credit Growth:** System-wide credit growth at 15.8% YoY, led by retail (20%+) and infrastructure (25%+)
- **NIM Trends:** NIMs stabilizing after 2 years of compression. HDFC Bank's NIM expanding post-merger is an exception.
- **Fintech Competition:** Digital lenders and fintech platforms are competing in unsecured lending, but HDFC Bank's brand and distribution provide a significant moat.
- **Regulatory Changes:** RBI's increased scrutiny on unsecured lending (risk weights raised) may slow growth in personal loans and credit cards.

**Macroeconomic Factors:**
- **RBI Rate Cycle:** Repo rate at 6.25%. Market expects 50-75 bps of cuts in FY27, which would benefit HDFC Bank through lower deposit costs.
- **Deposit Growth:** System-wide deposit growth lagging credit growth (10% vs 16%), creating competitive pressure on deposit rates.
- **India GDP Growth:** 6.8-7.2% projected, supporting loan demand across retail and corporate segments.`),

    newsIntelligence: s('News Intelligence', `**Positive Developments:**

- **Record Quarterly Profit:** HDFC Bank reported ₹20,100 crore net profit in Q1 FY27, beating street estimates by 8%. NII growth of 19% YoY was the key driver.
- **Fintech Partnerships:** The bank partnered with Zomato for co-branded credit cards and with Paytm for merchant lending, expanding its digital ecosystem reach.
- **Credit Card Leadership:** HDFC Bank's credit card base crossed 2 crore with ₹2.8 lakh crore in annual spends, maintaining a 35% market share.
- **RBI Approval:** RBI approved HDFC Bank's plan to set up a separate digital banking unit, allowing the bank to accelerate innovation without regulatory constraints.

**Negative / Watch Areas:**

- **Deposit Mobilization Challenge:** The bank's deposit growth at 11% lagged credit growth at 22%, requiring increased reliance on wholesale funding (CDs, NCDs) which is costlier.
- **Unsecured Loan Provisions:** RBI's increased risk weights on unsecured loans forced HDFC Bank to set aside an additional ₹3,200 crore in provisions.
- **Merger Integration Costs:** While largely complete, some integration-related expenses (systems, branch rationalization) persist at approximately ₹800 crore per quarter.
- **Cybersecurity Incident:** In May 2026, the bank reported a data breach affecting 50,000 customers, requiring a ₹200 crore remediation and compensation provision.`),

    riskIntelligence: s('Risk Intelligence', `**Primary Risk Factors:**

**Company-Specific (Medium Impact):**
- Deposit growth lagging credit growth could compress NIMs if the bank resorts to costly wholesale funding
- Post-merger cultural integration challenges between banking and mortgage teams
- Cybersecurity risk — as India's most digitized bank, the attack surface is large
- Credit card and unsecured loan book growing rapidly — potential asset quality risk if economic conditions worsen

**Sector-Specific (Medium Impact):**
- RBI's tightening stance on unsecured lending could slow the fastest-growing segment
- Competition from fintech players and other private banks (ICICI, Kotak, Axis) in retail banking
- Potential NPAs in the microfinance and SME segments if economic growth slows
- Liquidity tightening in the banking system pushing up short-term funding costs

**Macroeconomic (High Impact):**
- An economic slowdown would directly impact loan demand and increase NPAs across all segments
- Inflation persistence could prevent RBI rate cuts, keeping NIMs from expanding further
- Global risk aversion could trigger FII outflows from Indian financials, pressuring the stock

**Overall Risk Assessment:** HDFC Bank is India's best-managed private bank with a consistent track record. The primary risk is deposit mobilization — if the bank cannot grow deposits at a pace matching credit growth, it may face margin pressure. The strong capital position and diversified loan book provide adequate buffers against most risk scenarios.`),

    portfolioImpact: null,
    investmentDNA: null,
    aiExplanation: null,
    confidenceAndLimitations: null,
  },
}

// ─── Report Lookup ───

const reportsByCompany: Record<string, ResearchReport> = {
  'cmp-001': relianceReport,
  'cmp-003': tcsReport,
  'cmp-004': hdfcReport,
}

// ─── Market Intelligence ───

export const marketIntelligence: MarketIntelligence = {
  summary: `Indian equities remain in a structural bull market, supported by strong domestic institutional flows, robust corporate earnings, and favorable macroeconomic fundamentals. The NIFTY 50 has delivered 14% returns in CY2026 (YTD), outperforming most global indices. However, valuations are elevated — NIFTY 50 P/E at 23.5x versus 10-year average of 20.8x — suggesting selective opportunity rather than broad-based buying.

Key themes driving the market include India's continued GDP outperformance, government capex in infrastructure, the digital economy expansion, and the global re-rating of Indian equities as an alternative to China. Near-term risks include global recession fears, elevated crude oil prices, and geopolitical tensions.`,

  keyIndices: [
    { name: 'NIFTY 50', value: 25423.80, change: 0.72, sentiment: 'positive' },
    { name: 'SENSEX', value: 83412.50, change: 0.68, sentiment: 'positive' },
    { name: 'NIFTY BANK', value: 53102.15, change: -0.31, sentiment: 'negative' },
    { name: 'NIFTY IT', value: 38901.40, change: -0.45, sentiment: 'negative' },
  ],

  economicIndicators: [
    { name: 'GDP Growth (FY27 est.)', value: '6.8-7.2%', trend: 'stable' },
    { name: 'CPI Inflation', value: '4.6%', trend: 'down' },
    { name: 'Repo Rate', value: '6.25%', trend: 'stable' },
    { name: 'USD/INR', value: '₹83.45', trend: 'stable' },
    { name: 'Crude Oil (Brent)', value: '$79.30/bbl', trend: 'down' },
    { name: 'India 10Y G-Sec', value: '7.05%', trend: 'down' },
  ],
}

// ─── Sector Analysis ───

export const sectorInsights: SectorInsight[] = [
  {
    sector: 'Information Technology',
    performance: '-2.4% (MTD)',
    outlook: 'neutral',
    opportunities: [
      'AI/Cloud transformation deals growing 25%+ annually',
      'Cybersecurity demand accelerating post-regulatory mandates',
    ],
    risks: [
      'Global tech spending moderation impacting deal closures',
      'AI automation reducing traditional outsourcing demand',
    ],
    topStocks: ['TCS', 'Infosys', 'HCL Tech'],
  },
  {
    sector: 'Banking & Financial Services',
    performance: '+5.1% (MTD)',
    outlook: 'bullish',
    opportunities: [
      'RBI rate cut expectations to improve NIMs in H2 FY27',
      'Credit growth at 16% YoY with improving asset quality',
    ],
    risks: [
      'Deposit growth lagging credit growth system-wide',
      'Unsecured lending risk weights increased by RBI',
    ],
    topStocks: ['HDFC Bank', 'ICICI Bank', 'SBI'],
  },
  {
    sector: 'Oil & Gas / Energy',
    performance: '+1.8% (MTD)',
    outlook: 'neutral',
    opportunities: [
      'Stable crude prices supporting refining margins',
      'Government push for green energy and hydrogen economy',
    ],
    risks: [
      'Global refining overcapacity pressuring crack spreads',
      'Transition risk from fossil fuels to renewables',
    ],
    topStocks: ['Reliance', 'ONGC', 'IOC'],
  },
  {
    sector: 'Pharmaceuticals',
    performance: '+3.2% (MTD)',
    outlook: 'bullish',
    opportunities: [
      'FDA approval pipeline for complex generics strong',
      'CDMO business growing 30%+ as global pharma outsources manufacturing',
    ],
    risks: [
      'US pricing pressure on generic drugs intensifying',
      'Regulatory observations on India-based manufacturing facilities',
    ],
    topStocks: ['Sun Pharma', 'Dr. Reddys', 'Cipla'],
  },
  {
    sector: 'Automobile',
    performance: '+4.5% (MTD)',
    outlook: 'bullish',
    opportunities: [
      'SUV and premium vehicle demand driving margin expansion',
      'EV transition creating new growth segment for incumbents',
    ],
    risks: [
      'Commodity price volatility (steel, aluminium, lithium)',
      'Intensifying competition from Chinese EV manufacturers',
    ],
    topStocks: ['Maruti Suzuki', 'Tata Motors', 'M&M'],
  },
]

// ─── Export Functions ───

export function getResearchReport(companyId: string): ResearchReport | undefined {
  return reportsByCompany[companyId]
}

export function getAvailableReportCompanies(): Array<{ companyId: string; companyName: string; symbol: string; sector: string }> {
  return Object.values(reportsByCompany).map((r) => ({
    companyId: r.companyId,
    companyName: r.companyName,
    symbol: r.symbol,
    sector: r.sector,
  }))
}