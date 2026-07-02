import { Bot, AlertCircle, RefreshCw } from 'lucide-react'

// ─── AI Section Loader ───
// Provides consistent loading, error, and graceful-empty states
// for AI-powered sections. Pages use this to handle the
// "AI optional / graceful degradation" requirement.

interface AISectionLoaderProps {
  isLoading: boolean
  isError: boolean
  error?: Error | null
  /** Retry callback — typically invalidates the query */
  onRetry?: () => void
  /** The loaded content to render */
  children: React.ReactNode
  /** Optional: hide when idle (not loading, no error, no data) */
  showWhenEmpty?: boolean
  /** Optional: empty state message when no data and not loading */
  emptyMessage?: string
  /** Whether data is present */
  hasData?: boolean
  className?: string
}

/**
 * Skeleton loader for AI sections.
 * Renders a pulse-animated placeholder that matches
 * the approximate height of loaded content.
 */
export function AISkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse space-y-3 rounded-xl border border-border bg-surface-1 p-4 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 rounded bg-surface-3" />
        <div className="h-4 w-40 rounded bg-surface-3" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-surface-3" />
        <div className="h-3 w-5/6 rounded bg-surface-3" />
        <div className="h-3 w-4/6 rounded bg-surface-3" />
      </div>
      <div className="h-px bg-border/50" />
      <div className="space-y-1.5">
        <div className="h-2.5 w-full rounded bg-surface-2" />
        <div className="h-2.5 w-3/4 rounded bg-surface-2" />
      </div>
    </div>
  )
}

/**
 * Wraps AI-powered content with consistent loading/error/empty states.
 * When AI is unavailable, shows a graceful message instead of an error.
 */
export function AISectionLoader({
  isLoading,
  isError,
  onRetry,
  children,
  showWhenEmpty = false,
  emptyMessage = 'AI insights will appear as you build your portfolio',
  hasData = true,
  className = '',
}: AISectionLoaderProps) {
  // Loading state
  if (isLoading) {
    return <AISkeleton className={className} />
  }

  // Error state — graceful degradation
  if (isError) {
    return (
      <div className={`rounded-xl border border-dashed border-border bg-surface-1/50 p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-tx-muted" />
          <div className="flex-1">
            <p className="text-[13px] font-medium text-tx-secondary">
              AI analysis is temporarily unavailable
            </p>
            <p className="mt-1 text-[12px] text-tx-muted">
              This section relies on AI-generated content which is not available right now. The rest of the application continues to work normally.
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-surface-2 px-3 py-1.5 text-[12px] font-medium text-tx-secondary transition-colors hover:bg-surface-3 hover:text-tx-primary"
              >
                <RefreshCw className="h-3 w-3" />
                Try again
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // No data and not loading — empty state
  if (!hasData) {
    if (!showWhenEmpty) return null
    return (
      <div className={`rounded-xl border border-border bg-surface-1/50 p-4 ${className}`}>
        <div className="flex items-center gap-2 text-tx-muted">
          <Bot className="h-4 w-4" />
          <p className="text-[13px] text-tx-muted">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  // Data loaded — render children
  return <div className={className}>{children}</div>
}