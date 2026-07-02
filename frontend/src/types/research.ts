/** Provenance metadata attached to every AI-generated insight */
export interface AIProvenance {
  /** Why this insight was generated */
  reason: string
  /** Data sources that contributed to this insight */
  dataSources: string[]
}

export interface ReportSection {
  title: string
  content: string
  generatedBy: 'static' | 'ai'
  /** Provenance metadata for AI-generated sections */
  provenance?: AIProvenance
}

export type Outlook = 'bullish' | 'bearish' | 'neutral'

export interface ResearchReport {
  companyId: string
  companyName: string
  symbol: string
  sector: string
  generatedAt: string
  analysisCoverage: number
  outlook: Outlook
  sections: {
    executiveSummary: ReportSection
    companyOverview: ReportSection
    financialHealth: ReportSection
    technicalAnalysis: ReportSection
    marketEnvironment: ReportSection
    newsIntelligence: ReportSection
    riskIntelligence: ReportSection
    portfolioImpact: ReportSection | null
    investmentDNA: ReportSection | null
    aiExplanation: ReportSection | null
    confidenceAndLimitations: ReportSection | null
  }
}

export interface IndexSentiment {
  name: string
  value: number
  change: number
  sentiment: 'positive' | 'negative' | 'neutral'
}

export interface EconomicIndicator {
  name: string
  value: string
  trend: 'up' | 'down' | 'stable'
}

export interface MarketIntelligence {
  summary: string
  keyIndices: IndexSentiment[]
  economicIndicators: EconomicIndicator[]
}

export interface SectorInsight {
  sector: string
  performance: string
  outlook: Outlook
  opportunities: string[]
  risks: string[]
  topStocks: string[]
}

export interface ResearchHistoryItem {
  companyId: string
  viewedAt: string
}