import type { PromptTemplate } from '@/types/aiPrompts'

// ─── Research Prompt Templates ───
// Frontend metadata only. The backend AI service owns the actual prompt text.
// These templates describe WHAT the AI should produce, not HOW.

const researchTemplates: PromptTemplate[] = [
  {
    id: 'research.portfolio-impact',
    version: '1.0.0',
    category: 'research',
    description:
      'Analyzes how adding a stock to the portfolio would affect composition, sector allocation, concentration risk, and overall risk-return profile.',
    requiredContextScopes: ['portfolio', 'user'],
    outputSchema: [
      { name: 'content', type: 'string', description: 'Markdown analysis of portfolio impact' },
      { name: 'sectorOverlap', type: 'string', description: 'Assessment of sector concentration after adding' },
      { name: 'riskChange', type: 'string', description: 'Expected shift in portfolio risk profile' },
    ],
  },
  {
    id: 'research.investment-dna',
    version: '1.0.0',
    category: 'research',
    description:
      'Maps the user\'s trading patterns, risk tolerance, and investment style to identify their "Investment DNA" and compares it against the stock being researched.',
    requiredContextScopes: ['portfolio', 'user', 'learning'],
    outputSchema: [
      { name: 'content', type: 'string', description: 'Markdown analysis of investment DNA fit' },
      { name: 'styleMatch', type: 'string', description: 'How well this stock fits user style' },
      { name: 'behavioralNotes', type: 'string', description: 'Observed patterns from user\'s trading history' },
    ],
  },
  {
    id: 'research.ai-explanation',
    version: '1.0.0',
    category: 'research',
    description:
      'Provides a plain-language explanation of the research findings tailored to the user\'s experience level. Avoids jargon for beginners, adds depth for advanced users.',
    requiredContextScopes: ['user', 'learning'],
    outputSchema: [
      { name: 'content', type: 'string', description: 'Markdown explanation adapted to user level' },
      { name: 'keyTakeaways', type: 'array', description: '3-5 bullet-point takeaways' },
    ],
  },
  {
    id: 'research.confidence-limitations',
    version: '1.0.0',
    category: 'research',
    description:
      'Discusses the confidence level of the analysis, data limitations, forward-looking caveats, and factors that could change the outlook.',
    requiredContextScopes: ['research'],
    outputSchema: [
      { name: 'content', type: 'string', description: 'Markdown discussion of confidence and limitations' },
      { name: 'confidenceLevel', type: 'string', description: 'Overall confidence rating' },
      { name: 'keyCaveats', type: 'array', description: 'List of primary caveats and assumptions' },
    ],
  },
]

/** Call during app init to register research prompt templates */
export function registerResearchPrompts(
  registry: { register(template: PromptTemplate): void },
): void {
  for (const t of researchTemplates) registry.register(t)
}