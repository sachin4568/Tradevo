import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchAISections,
  regenerateSection,
} from '@/services/ai/aiResearchService'
import type {
  AIResearchSectionKey,
  AIResearchRequest,
  RegenerateSectionRequest,
} from '@/types/aiResearch'

// ─── AI Research Hooks ───
// TanStack Query hooks for the AI Research Engine.
// M8's DeepResearch page will consume these hooks.

/**
 * Fetch AI-generated sections for a company's research report.
 * Returns per-section loading states via the TanStack Query response.
 */
export function useAIReportSections(
  companyId: string,
  sectionKeys: AIResearchSectionKey[],
) {
  return useQuery({
    queryKey: ['ai-research', companyId, sectionKeys],
    queryFn: async () => {
      const request: AIResearchRequest = { companyId, sectionKeys }
      return fetchAISections(request)
    },
    enabled: !!companyId && sectionKeys.length > 0,
    staleTime: 5 * 60 * 1000, // 5 min
  })
}

/**
 * Mutation hook to regenerate a single AI section.
 * Invalidates the ai-research query on success so the
 * report re-fetches with fresh data.
 */
export function useRegenerateSection(companyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: {
      sectionKey: AIResearchSectionKey
      feedback?: string
    }) => {
      const request: RegenerateSectionRequest = {
        companyId,
        sectionKey: params.sectionKey,
        feedback: params.feedback,
      }
      return regenerateSection(request)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['ai-research', companyId],
      })
    },
  })
}