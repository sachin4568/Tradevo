import { useQuery } from '@tanstack/react-query'
import { fetchPortfolioReview, fetchRiskSummary, fetchOpportunityScan, fetchDashboardInsights } from '@/services/ai/aiDecisionService'
import { usePortfolioStore } from '@/stores/portfolioStore'

// ─── AI Decision Hooks ───
// TanStack Query hooks for the AI Decision Engine.
// Pages import these hooks — they never import services directly.

/**
 * Fetch AI-powered portfolio review with sector observations.
 * Enabled only when the user has at least one holding.
 */
export function usePortfolioReview() {
  const holdings = usePortfolioStore((s) => s.holdings)

  return useQuery({
    queryKey: ['ai-decision', 'portfolio-review'],
    queryFn: () => fetchPortfolioReview(),
    enabled: holdings.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}

/**
 * Fetch AI-powered risk summary with descriptive characteristics.
 * Enabled only when the user has at least one holding.
 */
export function useRiskSummary() {
  const holdings = usePortfolioStore((s) => s.holdings)

  return useQuery({
    queryKey: ['ai-decision', 'risk-summary'],
    queryFn: () => fetchRiskSummary(),
    enabled: holdings.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}

/**
 * Fetch AI-powered opportunity scan based on portfolio and watchlist.
 * Enabled only when the user has at least one holding.
 */
export function useOpportunityScan() {
  const holdings = usePortfolioStore((s) => s.holdings)

  return useQuery({
    queryKey: ['ai-decision', 'opportunity-scan'],
    queryFn: () => fetchOpportunityScan(),
    enabled: holdings.length > 0,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })
}

/**
 * Fetch dashboard-level AI insights.
 * Enabled only when the user has at least one holding.
 */
export function useDashboardInsights() {
  const holdings = usePortfolioStore((s) => s.holdings)

  return useQuery({
    queryKey: ['ai-decision', 'dashboard-insights'],
    queryFn: () => fetchDashboardInsights(),
    enabled: holdings.length > 0,
    staleTime: 3 * 60 * 1000,
    retry: 1,
  })
}