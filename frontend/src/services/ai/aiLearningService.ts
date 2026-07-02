import { aiRequestManager } from './aiRequestManager'
import { buildContext } from './aiContextBuilder'
import { promptRegistry } from './aiPromptRegistry'
import type {
  CoachingTip,
  LessonRecommendation,
  LearningReflection,
} from '@/types/aiLearning'
import type { AIContextScope } from '@/types/aiContext'

// ─── AI Learning Service ───
// Service layer for the AI Learning Engine.
// Flow: buildContext → render prompt → requestManager.request
//
// Pages MUST use hooks from useAILearning.ts — never import this directly.

const DEFAULT_SCOPES: AIContextScope[] = ['learning', 'portfolio', 'user']

/** Fetch a coaching tip connected to the user's current lesson and portfolio */
export async function fetchCoachingTip(
  lessonId?: string,
  contextScopes?: AIContextScope[],
): Promise<CoachingTip> {
  const scopes = contextScopes ?? DEFAULT_SCOPES
  const context = buildContext(scopes)

  const rendered = promptRegistry.render(
    'learning.coaching-tip',
    { lessonId },
    context,
  )

  const response = await aiRequestManager.request<CoachingTip>(
    '/learning/coaching-tip',
    rendered,
    {
      priority: 'normal',
      cachePolicy: { enabled: true, ttlMs: 5 * 60 * 1000 },
    },
  )

  return response.data
}

/** Fetch an AI-recommended lesson based on trading patterns and progress */
export async function fetchLessonRecommendation(
  contextScopes?: AIContextScope[],
): Promise<LessonRecommendation> {
  const scopes = contextScopes ?? ['learning', 'portfolio', 'user']
  const context = buildContext(scopes)

  const rendered = promptRegistry.render(
    'learning.lesson-recommendation',
    {},
    context,
  )

  const response = await aiRequestManager.request<LessonRecommendation>(
    '/learning/lesson-recommendation',
    rendered,
    {
      priority: 'low',
      cachePolicy: { enabled: true, ttlMs: 10 * 60 * 1000 },
    },
  )

  return response.data
}

/** Fetch a learning reflection analysing trading decisions and connecting to lessons */
export async function fetchLearningReflection(
  contextScopes?: AIContextScope[],
): Promise<LearningReflection> {
  const scopes = contextScopes ?? DEFAULT_SCOPES
  const context = buildContext(scopes)

  const rendered = promptRegistry.render(
    'learning.learning-reflection',
    {},
    context,
  )

  const response = await aiRequestManager.request<LearningReflection>(
    '/learning/learning-reflection',
    rendered,
    {
      priority: 'normal',
      cachePolicy: { enabled: true, ttlMs: 5 * 60 * 1000 },
    },
  )

  return response.data
}