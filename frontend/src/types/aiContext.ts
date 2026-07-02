// ─── AI Context Types ───
// Defines the context scopes that AI requests can request.
// The aiContextBuilder assembles these from Zustand stores.
// No business logic here — pure data contracts.

export type AIContextScope = 'portfolio' | 'learning' | 'market' | 'research' | 'user'

export interface PortfolioContext {
  holdings: Array<{
    companyId: string
    quantity: number
    avgPrice: number
  }>
  virtualCash: number
  transactionCount: number
}

export interface LearningContext {
  completedLessonIds: string[]
  inProgressLessonIds: string[]
  achievements: string[]
  totalProgress: number
}

export interface MarketContext {
  watchlistCompanyIds: string[]
  recentlyViewedCompanyIds: string[]
}

export interface ResearchContext {
  viewedReportCompanyIds: string[]
  sectorsViewed: string[]
}

export interface UserContext {
  userId: string
  experienceLevel: string
  riskPreference: string
}

export interface AIContext {
  portfolio?: PortfolioContext
  learning?: LearningContext
  market?: MarketContext
  research?: ResearchContext
  user?: UserContext
  assembledAt: string
}

/** Valid scope strings for validation */
export const VALID_CONTEXT_SCOPES: AIContextScope[] = [
  'portfolio',
  'learning',
  'market',
  'research',
  'user',
]