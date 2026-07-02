import { aiRequestManager } from './aiRequestManager'
import { buildContext } from './aiContextBuilder'
import { promptRegistry } from './aiPromptRegistry'
import type {
  PortfolioReview,
  RiskSummary,
  OpportunityScan,
  DashboardInsights,
} from '@/types/aiDecision'
import type { AIContextScope } from '@/types/aiContext'

// ─── AI Decision Service ───
// Service layer for the AI Decision Engine.
// Flow: buildContext → render prompt → requestManager.request
//
// Pages MUST use hooks from useAIDecision.ts — never import this directly.

const DEFAULT_SCOPES: AIContextScope[] = ['portfolio', 'user', 'market']

/** Fetch a portfolio review with sector observations and descriptive characteristics */
export async function fetchPortfolioReview(
  contextScopes?: AIContextScope[],
): Promise<PortfolioReview> {
  const scopes = contextScopes ?? DEFAULT_SCOPES
  const context = buildContext(scopes)

  const rendered = promptRegistry.render(
    'decision.portfolio-review',
    {},
    context,
  )

  const response = await aiRequestManager.request<PortfolioReview>(
    '/decision/portfolio-review',
    rendered,
    {
      priority: 'normal',
      cachePolicy: { enabled: true, ttlMs: 5 * 60 * 1000 },
    },
  )

  return response.data
}

/** Fetch a descriptive risk summary (no numeric score) */
export async function fetchRiskSummary(
  contextScopes?: AIContextScope[],
): Promise<RiskSummary> {
  const scopes = contextScopes ?? DEFAULT_SCOPES
  const context = buildContext(scopes)

  const rendered = promptRegistry.render(
    'decision.risk-alert',
    {},
    context,
  )

  const response = await aiRequestManager.request<RiskSummary>(
    '/decision/risk-summary',
    rendered,
    {
      priority: 'normal',
      cachePolicy: { enabled: true, ttlMs: 5 * 60 * 1000 },
    },
  )

  return response.data
}

/** Fetch opportunity scan results based on portfolio and watchlist */
export async function fetchOpportunityScan(
  contextScopes?: AIContextScope[],
): Promise<OpportunityScan> {
  const scopes = contextScopes ?? ['portfolio', 'market', 'user']
  const context = buildContext(scopes)

  const rendered = promptRegistry.render(
    'decision.opportunity-scan',
    {},
    context,
  )

  const response = await aiRequestManager.request<OpportunityScan>(
    '/decision/opportunity-scan',
    rendered,
    {
      priority: 'low',
      cachePolicy: { enabled: true, ttlMs: 10 * 60 * 1000 },
    },
  )

  return response.data
}

/** Fetch dashboard-level insights summarising portfolio, risk, and opportunities */
export async function fetchDashboardInsights(
  contextScopes?: AIContextScope[],
): Promise<DashboardInsights> {
  const scopes = contextScopes ?? DEFAULT_SCOPES
  const context = buildContext(scopes)

  const rendered = promptRegistry.render(
    'decision.portfolio-review',
    {},
    context,
  )

  const response = await aiRequestManager.request<DashboardInsights>(
    '/decision/dashboard-insights',
    rendered,
    {
      priority: 'normal',
      cachePolicy: { enabled: true, ttlMs: 3 * 60 * 1000 },
    },
  )

  return response.data
}