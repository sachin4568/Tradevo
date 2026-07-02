// ─── AI Decision Types ───
// Feature-specific contracts for the AI Decision Engine.
// All outputs use descriptive language — no numeric scores,
// no labels like "critical", no financial advice phrasing.
// Every response includes provenance metadata.

import type { AIProvenance } from './research'

// ─── Portfolio Review ───

export interface SectorObservation {
  sector: string
  allocationPercent: number
  description: string
}

export interface PortfolioReview {
  /** Descriptive summary of portfolio characteristics */
  characteristics: string
  /** Per-sector observations (not scores) */
  sectorObservations: SectorObservation[]
  /** Noteworthy patterns observed in the portfolio */
  observations: string[]
  /** Educational context about what these patterns mean */
  educationalNote: string
  provenance: AIProvenance
}

// ─── Risk Summary ───

export interface RiskSummary {
  /** Descriptive risk profile (not a numeric score) */
  riskProfile: string
  /** Observations about risk characteristics */
  observations: string[]
  /** Educational considerations for understanding these risk traits */
  considerations: string[]
  provenance: AIProvenance
}

// ─── Opportunity Scan ───

export interface OpportunityItem {
  companyId: string
  companyName: string
  symbol: string
  /** Why this company is educationally relevant to the user */
  reason: string
  /** How it connects to the user's current activity */
  relevance: string
}

export interface OpportunityScan {
  opportunities: OpportunityItem[]
  /** Explanation of why these opportunities were surfaced */
  reasoning: string
  provenance: AIProvenance
}

// ─── Composite Dashboard Insight ───

export interface DashboardInsight {
  /** Short heading for the insight */
  heading: string
  /** Body text of the insight */
  body: string
  /** Category for display grouping */
  category: 'portfolio' | 'risk' | 'opportunity' | 'learning'
  provenance: AIProvenance
}

export interface DashboardInsights {
  insights: DashboardInsight[]
  /** Summary of what was analyzed */
  analysisSummary: string
  provenance: AIProvenance
}