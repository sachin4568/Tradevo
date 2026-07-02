// ─── Core AI Contracts ───

export interface AIProvider {
  readonly name: string
  request<T>(endpoint: string, payload: unknown): Promise<AIResponse<T>>
}

export interface AIRequest {
  type: string
  payload: unknown
}

export interface AIResponse<T = unknown> {
  success: boolean
  data: T
  meta?: AIResponseMeta
}

export interface AIResponseMeta {
  provider: string
  latencyMs: number
  timestamp: string
  /** Unique identifier for this specific AI request execution */
  requestId?: string
  /** When this request began execution */
  executionTimestamp?: string
  /** Total wall-clock duration of this request in milliseconds */
  executionDurationMs?: number
}

export interface AIError {
  code: string
  message: string
  retryable: boolean
}

export type AIStatus = 'available' | 'degraded' | 'unavailable'

// ─── Request Management ───

export type RequestPriority = 'high' | 'normal' | 'low'

export type CircuitState = 'closed' | 'open' | 'half-open'

export interface CachePolicy {
  enabled: boolean
  ttlMs: number
}

export interface RequestConfig {
  priority?: RequestPriority
  cachePolicy?: CachePolicy
  /** Context scopes to attach (validated by aiContextBuilder) */
  contextScopes?: string[]
  /** Auto-generated if not provided */
  requestId?: string
}

/** Attached to every AI request for debugging and monitoring */
export interface AIRequestMetadata {
  requestId: string
  executionTimestamp: string
  providerName: string
  executionDurationMs: number
}

/** Snapshot of the request manager's runtime state */
export interface AIManagerSnapshot {
  circuitState: CircuitState
  failureCount: number
  successCount: number
  requestCount: number
  cacheSize: number
  activeProvider: string
}