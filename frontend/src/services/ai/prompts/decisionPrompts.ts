import type { PromptTemplate } from '@/types/aiPrompts'

// ─── Decision Prompt Templates ───
// Frontend metadata only. The backend AI service owns the actual prompt text.

const decisionTemplates: PromptTemplate[] = [
  {
    id: 'decision.portfolio-review',
    version: '1.0.0',
    category: 'decision',
    description:
      'Provides a comprehensive portfolio review including sector concentration, cash utilization, risk distribution, and actionable rebalancing suggestions.',
    requiredContextScopes: ['portfolio', 'user'],
    outputSchema: [
      { name: 'summary', type: 'string', description: 'Overall portfolio health summary' },
      { name: 'sectorAnalysis', type: 'array', description: 'Sector-wise allocation and risk notes' },
      { name: 'suggestions', type: 'array', description: 'Actionable rebalancing recommendations' },
    ],
  },
  {
    id: 'decision.risk-alert',
    version: '1.0.0',
    category: 'decision',
    description:
      'Evaluates portfolio risk factors including concentration, volatility exposure, and downside scenarios. Generates alerts when risk thresholds are breached.',
    requiredContextScopes: ['portfolio', 'market'],
    outputSchema: [
      { name: 'alerts', type: 'array', description: 'Active risk alerts with severity levels' },
      { name: 'riskScore', type: 'number', description: 'Overall portfolio risk score (0-100)' },
      { name: 'mitigation', type: 'string', description: 'Recommended risk mitigation steps' },
    ],
  },
  {
    id: 'decision.opportunity-scan',
    version: '1.0.0',
    category: 'decision',
    description:
      'Scans the user\'s watchlist and market for investment opportunities that align with their profile, risk preference, and current portfolio gaps.',
    requiredContextScopes: ['portfolio', 'market', 'user'],
    outputSchema: [
      { name: 'opportunities', type: 'array', description: 'Ranked list of investment opportunities' },
      { name: 'reasoning', type: 'string', description: 'Why these opportunities match the user' },
    ],
  },
]

/** Call during app init to register decision prompt templates */
export function registerDecisionPrompts(
  registry: { register(template: PromptTemplate): void },
): void {
  for (const t of decisionTemplates) registry.register(t)
}