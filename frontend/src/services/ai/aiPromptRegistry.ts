import type { PromptTemplate, RenderedPrompt, PromptCategory } from '@/types/aiPrompts'
import type { AIContextScope } from '@/types/aiContext'
import type { AIContext } from '@/types/aiContext'

// ─── Prompt Registry ───
// Central registry for prompt template metadata.
// The frontend registers only identifiers, context requirements, and output schemas.
// The backend AI service owns the actual prompt text.
//
// Usage:
//   promptRegistry.register(template)
//   const rendered = promptRegistry.render('research.portfolio-impact', params, context)
//   const templates = promptRegistry.listByCategory('research')

class PromptRegistry {
  private templates = new Map<string, PromptTemplate>()

  /** Register a prompt template. Overwrites if same ID exists. */
  register(template: PromptTemplate): void {
    this.templates.set(template.id, template)
  }

  /** Register multiple templates at once */
  registerAll(templates: PromptTemplate[]): void {
    for (const t of templates) {
      this.register(t)
    }
  }

  /** Get a single template by ID */
  get(templateId: string): PromptTemplate | undefined {
    return this.templates.get(templateId)
  }

  /** Check if a template is registered */
  has(templateId: string): boolean {
    return this.templates.has(templateId)
  }

  /**
   * Render a prompt request into a payload ready for the AI backend.
   * Extracts only the context scopes that the template requires,
   * merges with user-provided params, and attaches rendering metadata.
   *
   * The backend receives this payload and resolves the actual prompt text
   * using the templateId and version.
   */
  render(
    templateId: string,
    params?: Record<string, unknown>,
    context?: AIContext,
  ): RenderedPrompt {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`Unknown prompt template: ${templateId}`)
    }

    const scopedContext = this.extractScopes(context, template.requiredContextScopes)

    return {
      templateId: template.id,
      templateVersion: template.version,
      context: scopedContext,
      params: params ?? {},
      metadata: {
        renderedAt: new Date().toISOString(),
        requiredContextScopes: template.requiredContextScopes,
      },
    }
  }

  /** List all templates in a category */
  listByCategory(category: PromptCategory): PromptTemplate[] {
    return Array.from(this.templates.values()).filter(
      (t) => t.category === category,
    )
  }

  /** List all registered template IDs */
  listIds(): string[] {
    return Array.from(this.templates.keys())
  }

  /** Total number of registered templates */
  get size(): number {
    return this.templates.size
  }

  // ─── Private ───

  private extractScopes(
    context: AIContext | undefined,
    scopes: AIContextScope[],
  ): Record<string, unknown> {
    if (!context) return {}

    const result: Record<string, unknown> = {}
    for (const scope of scopes) {
      const value = (context as unknown as Record<string, unknown>)[scope]
      if (value !== undefined) {
        result[scope] = value
      }
    }
    return result
  }
}

/** Singleton prompt registry. Import and use directly. */
export const promptRegistry = new PromptRegistry()