import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Optional section name shown in the error message */
  section?: string
  /** Optional custom fallback UI */
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * React Error Boundary — catches render errors in child components
 * and displays a recovery UI instead of crashing the entire app.
 *
 * Per the M9 approved revisions, this is the primary error handling strategy.
 * Global window.onerror / unhandledrejection are treated as optional.
 */
export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console for developer debugging
    console.error(
      `[Tradevo ErrorBoundary${this.props.section ? ` — ${this.props.section}` : ''}]`,
      error,
      info.componentStack,
    )
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div
          className="flex flex-col items-center justify-center rounded-xl border border-tx-danger/20 bg-surface-1 p-8 text-center"
          role="alert"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-tx-danger/10">
            <AlertTriangle className="h-6 w-6 text-tx-danger" />
          </div>
          <h3 className="mb-1 text-[14px] font-semibold text-tx-primary">
            Something went wrong
          </h3>
          <p className="mb-4 max-w-sm text-[13px] leading-relaxed text-tx-secondary">
            {this.props.section
              ? `An unexpected error occurred while loading the ${this.props.section} section. This won't affect the rest of the application.`
              : 'An unexpected error occurred. This won\'t affect the rest of the application.'}
          </p>
          {this.state.error && (
            <p className="mb-4 max-w-md rounded-lg bg-surface-2 px-3 py-2 text-[11.5px] text-tx-muted">
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={this.handleReset}
            className="flex items-center gap-1.5 rounded-lg bg-accent-subtle px-4 py-2 text-[13px] font-medium text-accent transition-colors hover:bg-accent-subtle-hover"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}