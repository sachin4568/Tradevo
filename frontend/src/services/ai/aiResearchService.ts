import { aiRequestManager } from './aiRequestManager'
import { buildContext } from './aiContextBuilder'
import { promptRegistry } from './aiPromptRegistry'
import type { AIResearchRequest, AIResearchResponse, RegenerateSectionRequest } from '@/types/aiResearch'
import type { ReportSection } from '@/types/research'
import type { AIContextScope } from '@/types/aiContext'

// ─── AI Research Service ───
// Service layer for the AI Research Engine.
// Flow: buildContext → render prompt → requestManager.request
//
// This is the only file that M8's DeepResearch experience needs to import.
// The request manager, context builder, and prompt registry are internal plumbing.

/** Default context scopes for research requests */
const DEFAULT_SCOPES: AIContextScope[] = ['portfolio', 'user', 'research']

/**
 * Fetch AI-generated sections for a research report.
 * Sends a single request that may return multiple sections.
 */
export async function fetchAISections(
  request: AIResearchRequest,
): Promise<AIResearchResponse> {
  const scopes = (request.contextScopes as AIContextScope[] | undefined)
    ?? DEFAULT_SCOPES
  const context = buildContext(scopes)

  // Render a composite research request using the portfolio-impact template
  // as the base template ID. The backend resolves section-specific prompts
  // based on the sectionKeys param.
  const rendered = promptRegistry.render('research.portfolio-impact', {
    companyId: request.companyId,
    sectionKeys: request.sectionKeys,
  }, context)

  const response = await aiRequestManager.request<AIResearchResponse>(
    '/research/ai-sections',
    rendered,
    {
      priority: 'normal',
      cachePolicy: { enabled: true, ttlMs: 5 * 60 * 1000 },
    },
  )

  return response.data
}

/**
 * Regenerate a single AI section with optional user feedback.
 * Bypasses cache to always get fresh content.
 */
export async function regenerateSection(
  request: RegenerateSectionRequest,
): Promise<ReportSection> {
  const scopes = (request.contextScopes as AIContextScope[] | undefined)
    ?? DEFAULT_SCOPES
  const context = buildContext(scopes)

  const rendered = promptRegistry.render(
    `research.${request.sectionKey}`,
    {
      companyId: request.companyId,
      feedback: request.feedback,
    },
    context,
  )

  const response = await aiRequestManager.request<{ section: ReportSection }>(
    `/research/ai-sections/${request.sectionKey}`,
    rendered,
    {
      priority: 'high',
      cachePolicy: { enabled: false, ttlMs: 0 },
    },
  )

  return response.data.section
}