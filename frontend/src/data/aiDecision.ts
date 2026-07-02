import type { MockResponseResolver } from '@/services/ai/providers/mockAIProvider'
import type {
  PortfolioReview,
  RiskSummary,
  OpportunityScan,
  DashboardInsights,
} from '@/types/aiDecision'
import { getCompanies } from '@/data/companies'

// ─── Mock AI Decision Responses ───
// All outputs use descriptive language — no numeric scores,
// no labels like "critical", no financial advice phrasing.
// Every response includes provenance metadata.

const portfolioReview: PortfolioReview = {
  characteristics:
    'Your portfolio currently reflects a growth-oriented approach with exposure to the technology and financial services sectors. The allocation pattern suggests interest in India\'s digital economy and banking sector themes. Your virtual cash reserve indicates a measured approach — you are deploying capital gradually rather than committing all available funds at once.',
  sectorObservations: [
    {
      sector: 'Information Technology',
      allocationPercent: 40,
      description:
        'IT sector exposure is the largest allocation. In educational terms, this means your portfolio returns are likely to be more influenced by trends in global technology spending and the US dollar-rupee exchange rate. IT stocks tend to have lower volatility compared to sectors like auto or real estate.',
    },
    {
      sector: 'Financial Services',
      allocationPercent: 35,
      description:
        'Financial services represent the second-largest allocation. Banking stocks are influenced by RBI policy decisions, interest rate movements, and credit growth trends. This sector tends to perform well during economic expansion periods.',
    },
    {
      sector: 'Diversified / Other',
      allocationPercent: 25,
      description:
        'The remaining allocation spans energy, consumer goods, and other sectors. This portion provides some diversification benefit, as these sectors respond to different economic factors than IT and financial services.',
    },
  ],
  observations: [
    'The portfolio is concentrated in two primary sectors (IT and Financial Services), which means performance will be closely tied to these sectors\' dynamics.',
    'Virtual cash represents a significant portion of total capital, indicating a gradual deployment strategy.',
    'Trading activity shows interest in large-cap, well-established companies — a pattern often associated with a focus on liquidity and reduced volatility.',
  ],
  educationalNote:
    'Sector allocation is a fundamental concept in portfolio management. When a portfolio is heavily weighted toward one or two sectors, its returns will closely follow those sectors\' performance. Diversification across sectors can potentially reduce the impact of any single sector\'s downturn, though it may also moderate upside during sector-specific rallies. Understanding this trade-off is key to developing your own investment framework.',
  provenance: {
    reason:
      'This portfolio review was generated to help you understand the composition characteristics of your current holdings and the educational concepts behind sector allocation.',
    dataSources: [
      'Current portfolio holdings and transaction history',
      'Sector classification of held companies',
      'Virtual cash balance',
    ],
  },
}

const riskSummary: RiskSummary = {
  riskProfile:
    'Your portfolio displays characteristics associated with moderate concentration risk due to its sector weighting. The focus on IT and financial services means that adverse developments in either sector could have a noticeable effect on overall portfolio value. However, the large-cap nature of the held companies and the substantial cash reserve provide some buffer against sharp market movements.',
  observations: [
    'Sector concentration in IT and financial services means portfolio performance is more sensitive to sector-specific events.',
    'The substantial virtual cash reserve acts as a natural buffer — it is not exposed to market volatility and provides flexibility.',
    'Large-cap holdings tend to be more liquid and less volatile than mid-cap or small-cap alternatives.',
  ],
  considerations: [
    'Concentration risk is a concept worth understanding: when multiple holdings respond to similar economic factors, they tend to move together, which can amplify both gains and losses.',
    'Cash reserves provide optionality — the ability to invest when opportunities arise — but holding too much cash for extended periods can mean missing out on market returns.',
    'Understanding the difference between systematic risk (market-wide movements) and unsystematic risk (company or sector-specific events) helps in thinking about portfolio construction.',
  ],
  provenance: {
    reason:
      'This risk summary was generated to describe the risk characteristics of your portfolio in educational terms, helping you understand the concepts behind portfolio risk.',
    dataSources: [
      'Current portfolio sector allocation',
      'Individual stock volatility profiles',
      'Virtual cash balance as a percentage of total capital',
    ],
  },
}

const opportunityScan: OpportunityScan = {
  opportunities: [
    {
      companyId: 'cmp-006',
      companyName: 'Sun Pharmaceutical Industries',
      symbol: 'SUNPHARMA',
      reason:
        'Sun Pharma operates in the pharmaceutical sector, which is not represented in your current portfolio. Learning about pharma sector dynamics — such as how drug approvals, patent expiries, and FDA regulations affect stock prices — can broaden your understanding of different market drivers.',
      relevance:
        'Adding exposure to a non-correlated sector like healthcare/pharma could illustrate the concept of diversification in practice.',
    },
    {
      companyId: 'cmp-005',
      companyName: 'ITC Limited',
      symbol: 'ITC',
      reason:
        'ITC is a diversified conglomerate spanning FMCG, hotels, paper, and agri-business. Studying a company with multiple business segments provides an opportunity to learn about conglomerate analysis and how to evaluate businesses with different growth profiles.',
      relevance:
        'ITC\'s FMCG business has different economic drivers than your current IT and banking holdings, making it educationally relevant for understanding sector diversification.',
    },
    {
      companyId: 'cmp-008',
      companyName: 'ICICI Bank',
      symbol: 'ICICIBANK',
      reason:
        'If you hold HDFC Bank, studying ICICI Bank provides a comparative analysis opportunity. Understanding how two large private banks differ in strategy, loan mix, and growth drivers is a valuable exercise in sector analysis.',
      relevance:
        'Comparing companies within the same sector helps develop analytical skills and illustrates how different management strategies can lead to different outcomes.',
    },
  ],
  reasoning:
    'These opportunities were surfaced based on your current portfolio composition and learning progress. The selection prioritises educational value — each suggestion introduces a concept (sector diversification, conglomerate analysis, comparative analysis) that connects to your existing holdings while expanding your analytical toolkit.',
  provenance: {
    reason:
      'This opportunity scan was generated to suggest educationally relevant companies that connect to your current portfolio and learning journey, not as investment recommendations.',
    dataSources: [
      'Current portfolio sector allocation',
      'Learning module progress',
      'Available company research reports',
    ],
  },
}

const dashboardInsights: DashboardInsights = {
  insights: [
    {
      heading: 'Sector Concentration Pattern',
      body: 'Your portfolio shows a strong tilt toward IT and financial services. In educational terms, this means understanding exchange rates (for IT) and interest rate cycles (for banking) will be particularly relevant to tracking your portfolio\'s performance.',
      category: 'portfolio',
      provenance: {
        reason:
          'This insight was generated because your portfolio allocation shows a notable sector pattern worth understanding.',
        dataSources: ['Current portfolio sector allocation', 'Historical transaction data'],
      },
    },
    {
      heading: 'Cash Deployment Approach',
      body: 'A significant portion of your virtual capital remains uninvested. This gradual deployment approach is a common strategy that provides flexibility to take advantage of price movements, though it also means less capital is working in the market.',
      category: 'portfolio',
      provenance: {
        reason:
          'This insight was generated to highlight a notable characteristic of your capital allocation pattern.',
        dataSources: ['Virtual cash balance', 'Total portfolio value'],
      },
    },
  ],
  analysisSummary:
    'Based on your current portfolio of {holdings} stocks across {sectors} sectors, your investment activity shows interest in India\'s technology and banking sectors. These insights are generated to support your learning journey by connecting your actual trading decisions to educational concepts.',
  provenance: {
    reason:
      'Dashboard insights are generated to connect your portfolio activity to educational concepts, making your learning journey more relevant and personalised.',
    dataSources: [
      'Current portfolio holdings',
      'Transaction history',
      'Sector classification data',
    ],
  },
}

/** Mock resolver for decision AI endpoints */
export function createDecisionMockResolver(): MockResponseResolver {
  return (_endpoint: string, payload: unknown) => {
    const p = payload as Record<string, unknown> | undefined

    // Route by endpoint
    if (_endpoint.includes('portfolio-review')) {
      return portfolioReview
    }

    if (_endpoint.includes('risk-summary')) {
      return riskSummary
    }

    if (_endpoint.includes('opportunity-scan')) {
      return opportunityScan
    }

    if (_endpoint.includes('dashboard-insights')) {
      // Customise summary with actual counts
      const context = p?.context as Record<string, unknown> | undefined
      const portfolioCtx = context?.portfolio as Record<string, unknown> | undefined
      const holdings = portfolioCtx?.holdings as Array<{ companyId: string }> | undefined
      const holdingCount = holdings?.length ?? 0

      // Count unique sectors
      const companies = getCompanies()
      const sectors = new Set(
        (holdings ?? []).map((h) => companies.find((c) => c.id === h.companyId)?.sector).filter(Boolean),
      )

      return {
        ...dashboardInsights,
        analysisSummary: dashboardInsights.analysisSummary
          .replace('{holdings}', String(holdingCount))
          .replace('{sectors}', String(sectors.size)),
      }
    }

    return { _mock: true, endpoint: _endpoint }
  }
}