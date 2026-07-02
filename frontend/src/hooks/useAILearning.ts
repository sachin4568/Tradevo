import { useQuery } from '@tanstack/react-query'
import { fetchCoachingTip, fetchLessonRecommendation, fetchLearningReflection } from '@/services/ai/aiLearningService'
import { usePortfolioStore } from '@/stores/portfolioStore'
import { useLearningStore } from '@/stores/learningStore'

// ─── AI Learning Hooks ───
// TanStack Query hooks for the AI Learning Engine.
// Pages import these hooks — they never import services directly.

/**
 * Fetch a coaching tip connected to the user's current lesson and portfolio.
 * Enabled only when the user has started at least one lesson AND has trading activity.
 */
export function useCoachingTip(lessonId?: string) {
  const hasProgress = useLearningStore((s) =>
    Object.values(s.lessonProgress).some((p) => p === 'in_progress' || p === 'completed'),
  )
  const hasTrades = usePortfolioStore((s) => s.transactions.length > 0)

  return useQuery({
    queryKey: ['ai-learning', 'coaching-tip', lessonId],
    queryFn: () => fetchCoachingTip(lessonId),
    enabled: hasProgress && hasTrades,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}

/**
 * Fetch an AI-recommended next lesson based on trading patterns and progress.
 * Enabled only when the user has started learning AND has trading activity.
 */
export function useLessonRecommendation() {
  const hasProgress = useLearningStore((s) =>
    Object.values(s.lessonProgress).some((p) => p === 'in_progress' || p === 'completed'),
  )
  const hasTrades = usePortfolioStore((s) => s.transactions.length > 0)

  return useQuery({
    queryKey: ['ai-learning', 'lesson-recommendation'],
    queryFn: () => fetchLessonRecommendation(),
    enabled: hasProgress && hasTrades,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })
}

/**
 * Fetch a learning reflection analysing trading decisions.
 * Enabled only when the user has at least 2 transactions (enough data for patterns).
 */
export function useLearningReflection() {
  const transactionCount = usePortfolioStore((s) => s.transactions.length)

  return useQuery({
    queryKey: ['ai-learning', 'learning-reflection'],
    queryFn: () => fetchLearningReflection(),
    enabled: transactionCount >= 2,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}