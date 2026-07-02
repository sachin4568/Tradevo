import type { PromptTemplate } from '@/types/aiPrompts'

// ─── Learning Prompt Templates ───
// Frontend metadata only. The backend AI service owns the actual prompt text.

const learningTemplates: PromptTemplate[] = [
  {
    id: 'learning.coaching-tip',
    version: '1.0.0',
    category: 'learning',
    description:
      'Generates an AI coaching tip relevant to a specific lesson, optionally connecting it to the user\'s actual trading decisions and portfolio patterns.',
    requiredContextScopes: ['learning', 'portfolio'],
    outputSchema: [
      { name: 'tip', type: 'string', description: 'Coaching tip in markdown, tailored to lesson topic' },
      { name: 'relatedTrade', type: 'string', description: 'Reference to a relevant user trade, if applicable' },
      { name: 'lessonId', type: 'string', description: 'ID of the lesson this tip relates to' },
    ],
  },
  {
    id: 'learning.lesson-recommendation',
    version: '1.0.0',
    category: 'learning',
    description:
      'Recommends the next best lesson based on the user\'s learning progress, trading mistakes, and knowledge gaps identified from their portfolio activity.',
    requiredContextScopes: ['learning', 'portfolio', 'user'],
    outputSchema: [
      { name: 'recommendedLessonId', type: 'string', description: 'ID of the recommended lesson' },
      { name: 'reason', type: 'string', description: 'Why this lesson is recommended for this user' },
      { name: 'priority', type: 'string', description: 'Recommendation urgency: high, medium, or low' },
    ],
  },
  {
    id: 'learning.learning-reflection',
    version: '1.0.0',
    category: 'learning',
    description:
      'Analyzes the user\'s trading decisions to identify patterns, mistakes, and learning opportunities. Connects specific trades to relevant lesson concepts.',
    requiredContextScopes: ['portfolio', 'learning', 'user'],
    outputSchema: [
      { name: 'reflections', type: 'array', description: 'Analysis of trading patterns and lessons' },
      { name: 'strengths', type: 'array', description: 'Areas where the user shows good decision-making' },
      { name: 'areasForImprovement', type: 'array', description: 'Specific areas needing attention' },
    ],
  },
]

/** Call during app init to register learning prompt templates */
export function registerLearningPrompts(
  registry: { register(template: PromptTemplate): void },
): void {
  for (const t of learningTemplates) registry.register(t)
}