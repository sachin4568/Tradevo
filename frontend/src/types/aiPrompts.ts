// ─── Prompt Template Types ───
// Frontend registers only identifiers, metadata, required context scopes,
// and expected output schemas. The backend AI service owns the actual
// prompt text (system prompt, user prompt template).

import type { AIContextScope } from './aiContext'

export type PromptCategory = 'research' | 'decision' | 'learning'

export interface PromptOutputField {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array'
  description: string
}

export interface PromptTemplate {
  /** Unique identifier, e.g. 'research.portfolio-impact' */
  id: string
  /** Semantic version, e.g. '1.0.0' */
  version: string
  /** Category for grouping and discovery */
  category: PromptCategory
  /** Human-readable description of what this prompt produces */
  description: string
  /** Which context scopes must be assembled before rendering */
  requiredContextScopes: AIContextScope[]
  /** Schema describing the expected output shape */
  outputSchema: PromptOutputField[]
}

export interface RenderedPromptRequest {
  templateId: string
  params?: Record<string, unknown>
  contextScopes?: AIContextScope[]
}

export interface RenderedPrompt {
  templateId: string
  templateVersion: string
  /** Context data for required scopes, keyed by scope name */
  context: Record<string, unknown>
  params: Record<string, unknown>
  metadata: {
    renderedAt: string
    requiredContextScopes: AIContextScope[]
  }
}