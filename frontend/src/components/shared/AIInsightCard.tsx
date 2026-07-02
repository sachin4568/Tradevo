import { Bot, Database, Info } from 'lucide-react'
import type { AIProvenance } from '@/types/research'

// ─── AI Insight Card ───
// Reusable component for displaying an AI-generated insight
// with provenance metadata (why it was generated + data sources).

interface AIInsightCardProps {
  heading: string
  body: string
  provenance: AIProvenance
  /** Optional category badge */
  category?: 'portfolio' | 'risk' | 'opportunity' | 'learning'
  className?: string
}

const categoryConfig: Record<string, { label: string; color: string }> = {
  portfolio: { label: 'Portfolio', color: 'text-cyan-400 bg-cyan-400/10' },
  risk: { label: 'Risk', color: 'text-amber-400 bg-amber-400/10' },
  opportunity: { label: 'Opportunity', color: 'text-emerald-400 bg-emerald-400/10' },
  learning: { label: 'Learning', color: 'text-violet-400 bg-violet-400/10' },
}

export function AIInsightCard({ heading, body, provenance, category, className = '' }: AIInsightCardProps) {
  const cat = category ? categoryConfig[category] : null

  return (
    <div className={`rounded-xl border border-border bg-surface-1 p-4 ${className}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 shrink-0 text-cyan-400" />
          <h4 className="text-sm font-semibold text-tx-primary">{heading}</h4>
        </div>
        {cat && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${cat.color}`}>
            {cat.label}
          </span>
        )}
      </div>

      {/* Body */}
      <p className="mt-2.5 text-[13px] leading-relaxed text-tx-secondary">{body}</p>

      {/* Provenance */}
      <div className="mt-3 space-y-1.5 border-t border-border/50 pt-2.5">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-3 w-3 shrink-0 text-tx-muted" />
          <p className="text-[11.5px] leading-relaxed text-tx-muted">{provenance.reason}</p>
        </div>
        <div className="flex items-start gap-2">
          <Database className="mt-0.5 h-3 w-3 shrink-0 text-tx-muted" />
          <p className="text-[11.5px] leading-relaxed text-tx-muted">
            Data sources: {provenance.dataSources.join(', ')}
          </p>
        </div>
      </div>
    </div>
  )
}