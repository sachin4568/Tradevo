// ─── AI Learning Types ───
// Feature-specific contracts for the AI Learning Engine.
// All outputs use educational language — no evaluation labels,
// no financial advice phrasing.
// Every response includes provenance metadata.

import type { AIProvenance } from './research'

// ─── Coaching Tip ───

export interface CoachingTip {
  /** The lesson this tip relates to */
  lessonId: string
  /** Display title of the lesson */
  lessonTitle: string
  /** The coaching tip content in markdown */
  tip: string
  /** How the tip connects to the user's portfolio activity (if any) */
  connectionToPortfolio: string
  provenance: AIProvenance
}

// ─── Lesson Recommendation ───

export interface LessonRecommendation {
  /** ID of the recommended lesson */
  recommendedLessonId: string
  /** Display title of the recommended lesson */
  recommendedLessonTitle: string
  /** Why this lesson is recommended */
  reason: string
  /** Priority: indicates relevance, not urgency to act */
  priority: 'high' | 'medium' | 'low'
  provenance: AIProvenance
}

// ─── Learning Reflection ───

export interface LearningReflection {
  /** Observed patterns in the user's trading decisions */
  observations: string[]
  /** Areas where the user demonstrates good understanding */
  strengths: string[]
  /** Topics that might benefit from further study */
  areasForImprovement: string[]
  /** Lessons that connect to observed patterns */
  connectedLessons: string[]
  provenance: AIProvenance
}