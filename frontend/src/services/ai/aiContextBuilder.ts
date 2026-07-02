import type { AIContext, PortfolioContext, LearningContext, MarketContext, ResearchContext, UserContext } from '@/types/aiContext'
import type { AIContextScope } from '@/types/aiContext'
import { usePortfolioStore } from '@/stores/portfolioStore'
import { useLearningStore } from '@/stores/learningStore'
import { useWatchlistStore } from '@/stores/watchlistStore'
import { useResearchStore } from '@/stores/researchStore'
import { useAuthStore } from '@/stores/authStore'

// ─── AI Context Builder ───
// Assembles rich context from Zustand stores for AI requests.
// Each scope is lazy — only the requested scopes are read.
// Returns a plain object suitable for serialization into AI payloads.

type ScopeBuilder = () => Record<string, unknown>

const scopeBuilders: Record<AIContextScope, ScopeBuilder> = {
  portfolio: () => {
    const state = usePortfolioStore.getState()
    const ctx: PortfolioContext = {
      holdings: state.holdings.map((h) => ({
        companyId: h.companyId,
        quantity: h.quantity,
        avgPrice: h.avgPrice,
      })),
      virtualCash: state.virtualCash,
      transactionCount: state.transactions.length,
    }
    return { portfolio: ctx }
  },

  learning: () => {
    const state = useLearningStore.getState()
    const inProgressIds = Object.entries(state.lessonProgress)
      .filter(([, v]) => v === 'in_progress')
      .map(([k]) => k)
    const completedIds = Object.entries(state.lessonProgress)
      .filter(([, v]) => v === 'completed')
      .map(([k]) => k)
    const totalLessons = 24 // Known from data/learning.ts
    const completedCount = completedIds.length

    const ctx: LearningContext = {
      completedLessonIds: completedIds,
      inProgressLessonIds: inProgressIds,
      achievements: state.achievements,
      totalProgress: totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0,
    }
    return { learning: ctx }
  },

  market: () => {
    const watchlistState = useWatchlistStore.getState()
    const ctx: MarketContext = {
      watchlistCompanyIds: watchlistState.watchlistIds,
      recentlyViewedCompanyIds: [], // Could be populated from router history in future
    }
    return { market: ctx }
  },

  research: () => {
    const state = useResearchStore.getState()
    const ctx: ResearchContext = {
      viewedReportCompanyIds: state.viewedReports.map((v) => v.companyId),
      sectorsViewed: [], // Could be derived from company data in future
    }
    return { research: ctx }
  },

  user: () => {
    const state = useAuthStore.getState()
    if (!state.user) return { user: undefined }
    const ctx: UserContext = {
      userId: state.user.id,
      experienceLevel: state.user.experienceLevel,
      riskPreference: state.user.riskPreference,
    }
    return { user: ctx }
  },
}

/**
 * Build AI context for the requested scopes.
 * Only reads stores for the specified scopes (lazy).
 * Merges into a single AIContext object with assembledAt timestamp.
 */
export function buildContext(scopes: AIContextScope[]): AIContext {
  const partial: Partial<AIContext> = {}

  for (const scope of scopes) {
    const builder = scopeBuilders[scope]
    if (builder) {
      Object.assign(partial, builder())
    }
  }

  return {
    ...partial,
    assembledAt: new Date().toISOString(),
  } as AIContext
}

/** Validate that an array of scope strings are valid AIContextScope values */
export function validateScopes(scopes: string[]): AIContextScope[] {
  const valid: AIContextScope[] = ['portfolio', 'learning', 'market', 'research', 'user']
  return scopes.filter((s): s is AIContextScope => valid.includes(s as AIContextScope))
}