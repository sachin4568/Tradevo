import type { AIResearchResponse, AIResearchSectionKey } from '@/types/aiResearch'
import type { ReportSection } from '@/types/research'
import type { MockResponseResolver } from '@/services/ai/providers/mockAIProvider'

// ─── Mock AI Research Responses ───
// All content uses educational language — no scores, no "critical" labels,
// no financial advice phrasing. Every section includes provenance metadata.

function s(title: string, content: string, reason: string, dataSources: string[]): ReportSection {
  return {
    title,
    content,
    generatedBy: 'ai',
    provenance: { reason, dataSources },
  }
}

const reports: Record<string, Record<AIResearchSectionKey, ReportSection>> = {
  'cmp-001': {
    portfolioImpact: s(
      'Portfolio Impact Analysis',
      `**How Reliance Industries Could Affect a Portfolio**

Adding Reliance Industries introduces exposure to three distinct business segments — oil and chemicals, telecommunications (Jio), and retail — through a single position. This is worth understanding because the risk and return characteristics of each segment differ significantly.

**Sector Diversification Considerations:**

Reliance operates across energy, telecom, and retail. In educational terms, this means a single stock provides access to multiple sectors. However, if a portfolio already holds energy-sector companies (such as HPCL or Tata Motors), adding Reliance would increase the overall energy allocation. Understanding sector weight is a foundational concept in portfolio construction — it helps explain why a portfolio might move more or less with broader market trends.

**Risk and Return Characteristics:**

- The oil and chemicals segment tends to move with global commodity prices, which are influenced by geopolitical events and supply-demand dynamics.
- Jio's revenue is more domestic and subscription-driven, offering a different growth pattern than commodity-linked businesses.
- Reliance Retail's growth is tied to consumer spending trends in India.

This diversification within one company is what analysts call a "conglomerate discount" or "conglomerate premium" depending on whether the market values the combined businesses more or less than the sum of their parts.

**Educational Note:** Position sizing — how much of your total portfolio to allocate to a single stock — is one of the most important concepts in investing. There is no universal correct answer, but understanding the relationship between position size and potential impact on your portfolio is a valuable skill to develop.`,

      'This section was generated because you are viewing a research report for Reliance Industries, and understanding how a stock fits alongside existing holdings is a key part of investment education.',
      ['Current portfolio holdings and sector allocation', 'Reliance Industries segment revenue breakdown', 'Historical sector performance data'],
    ),

    investmentDNA: s(
      'Investment Style Reflection',
      `**Reflecting on How Reliance Industries Relates to Trading Patterns**

This section explores how Reliance Industries' characteristics compare to common investment approaches. It is designed to help you think about your own style rather than prescribe a specific action.

**What Reliance Represents:**

Reliance is a blend of different investment characteristics. The oil and chemicals business tends to be value-oriented — it generates cash steadily and trades at lower valuation multiples. Jio and Retail are growth-oriented — they are investing heavily for future revenue expansion and may not be profitable on a standalone basis yet.

**Holding Period Considerations:**

Different investment styles tend to have different typical holding periods:

- **Day trading:** Positions held for minutes to hours
- **Swing trading:** Positions held for days to weeks
- **Position trading:** Positions held for weeks to months
- **Long-term investing:** Positions held for years

Reliance's multi-catalyst story (Jio tariff changes, retail expansion, new energy investments) tends to unfold over quarters rather than days. In educational terms, this means the thesis for owning Reliance is based on fundamental business developments that take time to materialise.

**Educational Note:** There is no single "correct" holding period. What matters is understanding why you enter a position and what would need to change for you to reconsider. This concept is sometimes called having an "investment thesis" — a clear articulation of your reasoning before committing capital.`,

      'This section was generated to help you connect company characteristics to different investment styles, supporting the learning objective of understanding your own approach.',
      ['User trading history and holding patterns', 'Reliance Industries business segment analysis', 'Common investment style frameworks'],
    ),

    aiExplanation: s(
      'Understanding This Research',
      `**Breaking Down the Reliance Industries Report**

Reliance Industries can be thought of as three companies operating under one stock ticker. Understanding each part helps make sense of the full research report.

**Oil and Chemicals (O2C):**

This is Reliance's original business — refining crude oil into petroleum products and manufacturing petrochemicals. Think of a refinery as a large processing facility that transforms raw crude oil into usable products like petrol, diesel, and chemical feedstocks. The key concept here is **refining margins** — the difference between the cost of crude oil and the selling price of refined products. When this margin is wide, the O2C business generates strong cash flow.

**Jio (Telecom and Digital):**

Jio is India's largest telecom operator with approximately 480 million subscribers. Beyond phone calls and data, Jio is expanding into cloud computing, enterprise software, and internet-of-things (IoT) services. The important concept here is **Average Revenue Per User (ARPU)** — how much money Jio earns from each subscriber per month. A rising ARPU indicates customers are spending more on data and services.

**Reliance Retail:**

This is India's largest retail chain by revenue, operating supermarkets, digital stores, and fashion outlets. The key concept is **same-store growth** — whether existing stores are generating more revenue over time, which indicates organic demand rather than just expansion.

**Why These Matter Together:**

The research report covers all three segments because each contributes differently to Reliance's overall value. The O2C business provides financial stability, while Jio and Retail represent growth potential. Understanding how to weigh these different contributions is a valuable analytical skill.`,

      'This section was generated to make the research report more accessible by explaining key concepts in plain language, connecting to the learning objective of building financial literacy.',
      ['Reliance Industries annual report and segment disclosures', 'Industry reports on telecom ARPU trends', 'Retail sector growth data'],
    ),

    confidenceAndLimitations: s(
      'Analysis Context and Limitations',
      `**Understanding the Boundaries of This Analysis**

Every analysis has limitations, and understanding them is an important part of interpreting research critically. This section explains what this analysis is based on and where its boundaries lie.

**Strengths of This Analysis:**

- Financial metrics are sourced from official quarterly and annual filings, which are audited and publicly available.
- Market data (share prices, trading volumes) reflects real exchange data.
- Sector-level analysis is based on widely followed industry classifications.

**Areas with More Uncertainty:**

- Projections about Jio's enterprise revenue and retail expansion are based on management guidance and industry trends rather than confirmed outcomes. Management guidance represents the company's own expectations, which may or may not materialise.
- New Energy business (green hydrogen, solar) is in early stages with limited operational data, making projections inherently less certain.
- Macro factors (interest rates, crude oil prices, consumer spending) can change rapidly and are difficult to predict.

**What This Analysis Does NOT Include:**

- Real-time market conditions or intraday data
- Proprietary broker research or institutional flow data
- Tax implications or individual financial circumstances
- A recommendation to buy, sell, or hold any security

**How to Use This Information:**

This analysis is designed to support learning and informed thinking about Reliance Industries. It provides context and framework rather than conclusions. The value is in understanding *how* to think about a company, not just *what* to think about it.`,

      'This section was generated to provide transparency about the analysis methodology and data sources, supporting the educational goal of developing critical evaluation skills.',
      ['Public financial filings and regulatory disclosures', 'Management commentary from earnings calls', 'Industry analyst consensus estimates', 'Market price and volume data'],
    ),
  },

  'cmp-002': {
    portfolioImpact: s(
      'Portfolio Impact Analysis',
      `**How TCS Could Affect a Portfolio**

Tata Consultancy Services (TCS) is India's largest IT services company. Understanding its portfolio impact involves looking at its role as a potential stabilising component.

**Sector Diversification Considerations:**

TCS operates in the IT services sector. If a portfolio already holds other IT companies (such as Infosys), adding TCS would increase the overall IT sector weight. In educational terms, this is relevant because IT sector stocks on the Indian market tend to be correlated — they often move in similar directions based on factors like the US dollar-rupee exchange rate and global technology spending trends.

An important concept here is **geographic revenue diversification**. TCS earns roughly 52% of its revenue from North America, 28% from Europe, and 8% from India. This means its performance is influenced by economic conditions in multiple regions, which is different from a company that operates only in the domestic Indian market.

**Risk and Return Characteristics:**

- IT services companies typically have lower volatility (price fluctuation) compared to sectors like auto or real estate.
- TCS has a consistent dividend payment history, which provides income in addition to potential price appreciation.
- The company's revenue is driven by long-term contracts, which means earnings tend to be more predictable quarter-to-quarter.

**Educational Note:** Understanding how a stock's characteristics (volatility, dividend yield, revenue predictability) might complement or overlap with your existing holdings is a core portfolio management concept called **asset allocation**.`,

      'This section was generated because you are viewing a research report for TCS, and understanding how an IT services company fits alongside other holdings is relevant to portfolio construction education.',
      ['Current portfolio holdings and sector allocation', 'TCS geographic revenue breakdown', 'IT services sector correlation data', 'Historical volatility comparisons'],
    ),

    investmentDNA: s(
      'Investment Style Reflection',
      `**Reflecting on How TCS Relates to Trading Patterns**

This section explores how TCS's characteristics connect to different investment approaches.

**What TCS Represents:**

TCS is often described as a "defensive growth" stock — it offers growth potential (expanding services, new technology adoption) while also providing defensive qualities (predictable revenue, strong balance sheet). Understanding this combination is useful because it illustrates how not all stocks fit neatly into a single category.

**The Role of Holding Period:**

TCS's business model is built on long-term client contracts, typically lasting 1 to 5 years. This means the company's revenue tends to evolve gradually rather than change dramatically from quarter to quarter. In educational terms, this aligns more naturally with longer holding periods where investors can observe how contract pipeline converts to revenue over time.

**Quarterly Earnings Cycles:**

IT services companies like TCS report earnings every quarter. These earnings reports include metrics like deal wins (Total Contract Value), employee utilisation rates, and operating margins. For someone studying how to interpret company results, TCS provides a rich dataset because of its detailed disclosures.

**Educational Note:** There is no universally correct holding period for any stock. What is educationally valuable is understanding *why* certain stocks lend themselves to different time horizons based on their business characteristics. This awareness can help you develop a more deliberate approach to position management.`,

      'This section was generated to help you think about how TCS fits different investment timeframes, supporting the learning objective of understanding investment styles.',
      ['User trading history and average holding periods', 'TCS quarterly earnings disclosure patterns', 'IT services business model characteristics'],
    ),

    aiExplanation: s(
      'Understanding This Research',
      `**Breaking Down the TCS Research Report**

Tata Consultancy Services provides technology services to businesses around the world. Understanding its business model helps make sense of the research report.

**What IT Services Means:**

TCS helps other companies use technology effectively. This can include building custom software, managing a company's cloud infrastructure, providing cybersecurity services, or offering business consulting. The key concept is that TCS's clients are other businesses (B2B), not individual consumers. This matters because business spending on technology tends to be more stable than consumer spending during economic cycles.

**The Contract-Based Model:**

TCS operates primarily on long-term contracts. When a company hires TCS to manage its IT systems, they typically sign a multi-year agreement. This creates **recurring revenue** — income that can be reasonably expected to continue. This concept is important because recurring revenue businesses tend to have more predictable earnings.

**Key Metrics Explained:**

- **Deal TCV (Total Contract Value):** The total value of new contracts signed in a quarter. A higher TCV indicates strong demand for TCS's services.
- **Utilisation Rate:** The percentage of employees who are currently billed to client projects. Higher utilisation means the workforce is being used productively.
- **Operating Margin:** Revenue minus operating costs, expressed as a percentage. It indicates how efficiently TCS converts revenue into profit.

**Why the US Dollar Matters:**

TCS earns a significant portion of its revenue in US dollars but incurs most of its costs (employee salaries) in Indian rupees. When the dollar strengthens against the rupee, TCS's revenue in rupee terms increases without any change in actual business performance. This is called **currency tailwind** and it works in reverse when the rupee strengthens.`,

      'This section was generated to explain key TCS concepts in accessible language, connecting to the learning objective of building financial and business literacy.',
      ['TCS annual report and segment disclosures', 'IT services industry reports', 'Currency exchange rate data', 'TCS investor presentations'],
    ),

    confidenceAndLimitations: s(
      'Analysis Context and Limitations',
      `**Understanding the Boundaries of This Analysis**

**Strengths of This Analysis:**

- TCS provides detailed quarterly disclosures, making financial metrics relatively reliable.
- As one of India's most followed companies, there is extensive analyst coverage and public information available.
- Management commentary from earnings calls provides additional context for financial trends.

**Areas with More Uncertainty:**

- AI and automation are transforming the IT services industry. While demand for AI-related services is growing, it is not yet clear how this will affect traditional service margins over the long term.
- Revenue recognition timelines for large deals can vary — a signed contract may not translate to revenue immediately.
- Currency movements (USD/INR) are unpredictable and can significantly impact reported financials from quarter to quarter.

**What This Analysis Does NOT Include:**

- Real-time currency rates or intraday market data
- Proprietary broker research or institutional order flow
- Sub-segment performance (banking vertical vs. retail vertical vs. manufacturing)
- Tax implications, transaction costs, or individual financial circumstances
- A recommendation to buy, sell, or hold TCS

**How to Use This Information:**

This analysis provides a framework for thinking about TCS as a business and understanding the key drivers of its performance. The educational value lies in learning *how* to evaluate a large-cap IT services company — the metrics that matter, the concepts to understand, and the limitations to keep in mind.`,

      'This section was generated to provide transparency about the analysis scope and data sources, supporting the educational goal of developing critical evaluation skills.',
      ['TCS quarterly and annual financial filings', 'Management earnings call transcripts', 'Industry analyst consensus estimates', 'Currency market data'],
    ),
  },

  'cmp-003': {
    portfolioImpact: s(
      'Portfolio Impact Analysis',
      `**How HDFC Bank Could Affect a Portfolio**

HDFC Bank is India's largest private sector bank by market capitalisation. Understanding its portfolio impact involves considering the unique dynamics of the recent merger with HDFC Limited (a housing finance company).

**Sector Diversification Considerations:**

HDFC Bank operates in the financial services sector. If a portfolio already holds other banking stocks (such as ICICI Bank), adding HDFC Bank would increase the financial sector weight. In educational terms, this is relevant because banking stocks tend to be correlated — they often respond to the same macro factors like interest rate changes, RBI policy decisions, and credit growth trends.

**The Merger Factor:**

The merger with HDFC Limited created India's largest combined banking and housing finance entity. This is educationally significant because mergers create a period of integration where the combined entity's financial metrics may not directly compare to historical data. Key concepts to understand:

- **Deposit Mobilisation:** The merged entity needs to gather more deposits to fund the expanded loan book. This is a core banking concept — banks lend out a portion of the deposits they collect.
- **Net Interest Margin (NIM):** The difference between what a bank earns on loans and pays on deposits. Post-merger, there may be temporary pressure on NIM as the integration proceeds.

**Risk and Return Characteristics:**

- Banking stocks tend to be sensitive to interest rate cycles and economic growth.
- HDFC Bank's large and diversified loan portfolio provides exposure to retail (home loans, personal loans, credit cards) and corporate lending.
- The stock's price movement tends to correlate with the broader market (NIFTY) due to its high index weight.

**Educational Note:** Banking sector analysis introduces concepts like NIM, credit costs, and deposit growth that are different from the metrics used to analyse technology or energy companies. Learning to evaluate a bank requires understanding these distinct financial concepts.`,

      'This section was generated because you are viewing a research report for HDFC Bank, and understanding how a large-cap bank fits alongside other holdings is relevant to portfolio education.',
      ['Current portfolio holdings and sector allocation', 'HDFC Bank post-merger financial disclosures', 'Banking sector correlation data', 'NIFTY index composition and weights'],
    ),

    investmentDNA: s(
      'Investment Style Reflection',
      `**Reflecting on How HDFC Bank Relates to Trading Patterns**

This section explores how HDFC Bank's characteristics connect to different investment approaches.

**What HDFC Bank Represents:**

HDFC Bank is often characterised as a **quality compounder** — a company that consistently grows earnings over time by reinvesting profits and expanding its business. Understanding this concept is valuable because compounding is one of the most important principles in investing. The idea is that a company which grows earnings at a steady rate can deliver significant returns over long periods, even if annual growth appears modest.

**The Post-Merger Timeline:**

The merger with HDFC Limited is expected to take 18-24 months to fully integrate. During this period, financial metrics may be temporarily affected. In educational terms, this illustrates the concept of **implementation risk** — the risk that the expected benefits of a strategic decision (like a merger) may take time to materialise or may not fully materialise.

**Banking-Specific Considerations:**

Banking stocks are influenced by factors that may not affect other sectors:
- **RBI Policy Rate Changes:** When the RBI adjusts interest rates, it affects both what banks earn on loans and what they pay on deposits.
- **Credit Cycle Position:** Whether the economy is in an expansion or contraction phase affects loan demand and default rates.
- **Regulatory Requirements:** Banks must maintain minimum capital ratios and liquidity coverage ratios set by the RBI.

**Educational Note:** Understanding how macro factors (interest rates, economic cycles, regulation) affect a specific sector is a key analytical skill. HDFC Bank provides a clear example of how these forces interact with a company's fundamentals.`,

      'This section was generated to help you think about how HDFC Bank fits different investment timeframes, especially considering the post-merger context.',
      ['User trading history and holding patterns', 'HDFC Bank merger integration milestones', 'Banking sector dynamics and regulatory framework'],
    ),

    aiExplanation: s(
      'Understanding This Research',
      `**Breaking Down the HDFC Bank Research Report**

HDFC Bank recently completed India's largest-ever bank merger, combining with its parent company HDFC Limited. Understanding this event is essential for interpreting the research report.

**What the Merger Means:**

Before the merger, HDFC Bank and HDFC Limited were separate companies. HDFC Bank focused on banking services (savings accounts, credit cards, business loans), while HDFC Limited focused on housing finance (home loans). After the merger, the combined entity offers all of these services under one entity.

Think of it like two overlapping toolkits being combined into one larger, more comprehensive toolkit. The potential benefit is that customers can now access both banking and housing finance from a single institution. The challenge is that combining two large organisations involves aligning technology systems, merging teams, and consolidating operations.

**Key Banking Concepts in This Report:**

- **Net Interest Margin (NIM):** This is the bank's equivalent of a profit margin. It measures the difference between interest earned on loans and interest paid on deposits. A higher NIM generally indicates better profitability.
- **Credit Cost Ratio:** The percentage of loans that are not being repaid (non-performing assets, or NPAs). A lower credit cost ratio indicates healthier loan quality.
- **CASA Ratio:** The proportion of deposits that are in Current Account and Savings Account (CASA). These are low-cost deposits, so a higher CASA ratio means the bank can lend at a larger spread.

**The Integration Phase:**

Currently, the combined entity is in what might be called a "construction phase" — the long-term structure is being built, but there may be temporary noise in the metrics. Understanding this context helps avoid misinterpreting short-term financial fluctuations as long-term trends.`,

      'This section was generated to explain key banking and merger concepts in accessible language, connecting to the learning objective of building financial literacy.',
      ['HDFC Bank post-merger financial filings', 'RBI banking sector reports', 'HDFC Bank merger scheme document', 'Management commentary from earnings calls'],
    ),

    confidenceAndLimitations: s(
      'Analysis Context and Limitations',
      `**Understanding the Boundaries of This Analysis**

**Strengths of This Analysis:**

- Pre-merger financial metrics for both HDFC Bank and HDFC Limited are well-documented and publicly available.
- HDFC Bank has a long track record of transparent disclosures and consistent management communication.
- Banking sector data (credit growth, deposit trends) is regularly published by the RBI.

**Areas with More Uncertainty:**

- Post-merger financial comparisons are complicated by different accounting treatments between the bank and the housing finance company.
- The integration timeline and its impact on profitability are based on management guidance, which represents expectations rather than confirmed outcomes.
- Deposit competition from small finance banks and fintech companies is an evolving dynamic that is difficult to quantify.
- Regulatory changes (risk weight adjustments, capital requirements) could materially affect the banking sector.

**What This Analysis Does NOT Include:**

- Real-time deposit or credit growth data
- Stress testing scenarios (how the bank would perform under adverse economic conditions)
- Proprietary broker research or institutional assessments
- Tax implications, transaction costs, or individual financial circumstances
- A recommendation to buy, sell, or hold HDFC Bank

**How to Use This Information:**

This analysis provides a framework for understanding HDFC Bank in the context of India's banking sector and the ongoing merger integration. The educational value lies in learning *how* to evaluate a large bank — understanding the metrics that matter, the concepts behind them, and the limitations inherent in any analysis of a post-merger entity.`,

      'This section was generated to provide transparency about the analysis scope and limitations, supporting the educational goal of developing critical evaluation skills.',
      ['HDFC Bank and HDFC Limited pre-merger financial filings', 'Post-merger combined financial disclosures', 'RBI banking sector statistics', 'Management commentary and investor presentations'],
    ),
  },
}

/** Mock resolver for MockAIProvider — routes by companyId in the payload */
export function createResearchMockResolver(): MockResponseResolver {
  return (_endpoint: string, payload: unknown) => {
    const p = payload as Record<string, unknown> | undefined
    const companyId = (p?.params as Record<string, unknown>)?.companyId as string
      ?? (p?.companyId as string)
      ?? ''

    const companyReport = reports[companyId]
    if (!companyReport) {
      return {
        sections: {},
        coverageBoost: 0,
      } satisfies AIResearchResponse
    }

    // Return only requested section keys if specified
    const requestedKeys = (p?.params as Record<string, unknown>)?.sectionKeys as AIResearchSectionKey[] | undefined

    if (requestedKeys && Array.isArray(requestedKeys)) {
      const filtered: Record<string, ReportSection> = {}
      for (const key of requestedKeys) {
        if (companyReport[key]) {
          filtered[key] = companyReport[key]
        }
      }
      return {
        sections: filtered,
        coverageBoost: 22,
      } satisfies AIResearchResponse
    }

    return {
      sections: companyReport,
      coverageBoost: 22,
    } satisfies AIResearchResponse
  }
}