// ─── AI Research Types ───
// Feature-specific contracts for the AI Research Engine.
// The service layer maps these to prompt template IDs;
// the request manager handles execution; the provider delivers responses.

import type { ReportSection } from './research'

export type AIResearchSectionKey =
  | 'portfolioImpact'
  | 'investmentDNA'
  | 'aiExplanation'
  | 'confidenceAndLimitations'

export interface AIResearchRequest {
  companyId: string
  sectionKeys: AIResearchSectionKey[]
  /** Override default context scopes */
  contextScopes?: string[]
}

export interface RegenerateSectionRequest {
  companyId: string
  sectionKey: AIResearchSectionKey
  /** Optional user feedback to guide regeneration */
  feedback?: string
  /** Override default context scopes */
  contextScopes?: string[]
}

export interface AIResearchResponse {
  sections: Partial<Record<AIResearchSectionKey, ReportSection>>
  coverageBoost: number
}