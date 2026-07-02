import type {
  AIProvider,
  AIResponse,
  AIError,
  AIRequestMetadata,
  AIManagerSnapshot,
  RequestConfig,
  CircuitState,
} from '@/types/ai'
import { createProvider } from './aiProviderFactory'

// ─── AI Request Manager ───
// Central nervous system for all AI calls.
// Adds: deduplication, caching, retry with backoff, circuit breaker,
// and execution metadata (requestId, timestamp, provider, duration).
//
// Every AI engine routes through this. Components never call providers directly.

interface CacheEntry {
  data: AIResponse
  expiresAt: number
}

type Listener = () => void

const DEFAULT_CONFIG: Required<RequestConfig> = {
  priority: 'normal',
  cachePolicy: { enabled: false, ttlMs: 60_000 },
  contextScopes: [],
  requestId: '',
}

const RETRY_BASE_DELAY = 1_000
const MAX_RETRIES = 3
const FAILURE_THRESHOLD = 5
const RECOVERY_TIMEOUT = 30_000

function generateRequestId(): string {
  return `ai-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export class AIRequestManager {
  private provider: AIProvider
  private cache = new Map<string, CacheEntry>()
  private inFlight = new Map<string, Promise<AIResponse>>()

  // Circuit breaker
  private _circuitState: CircuitState = 'closed'
  private failureCount = 0
  private successCount = 0
  private requestCount = 0
  private lastFailureAt: number | null = null

  // Pub/sub for React integration (useSyncExternalStore)
  private listeners = new Set<Listener>()

  constructor(provider: AIProvider) {
    this.provider = provider
  }

  // ─── Public API ───

  async request<T>(
    endpoint: string,
    payload: unknown,
    config?: RequestConfig,
  ): Promise<AIResponse<T>> {
    const merged: Required<RequestConfig> = {
      ...DEFAULT_CONFIG,
      ...config,
      cachePolicy: { ...DEFAULT_CONFIG.cachePolicy, ...config?.cachePolicy },
    }

    const requestId = merged.requestId || generateRequestId()
    const executionTimestamp = new Date().toISOString()
    const start = performance.now()
    this.requestCount++

    // 1. Cache check
    if (merged.cachePolicy.enabled) {
      const cached = this.getFromCache<T>(endpoint, payload, merged.cachePolicy.ttlMs)
      if (cached) return cached
    }

    // 2. Dedup: same request in-flight → return same promise
    const dedupKey = this.dedupKey(endpoint, payload)
    const existing = this.inFlight.get(dedupKey)
    if (existing) {
      return existing as Promise<AIResponse<T>>
    }

    // 3. Circuit breaker check
    if (this._circuitState === 'open') {
      this.checkRecovery()
      if (this._circuitState === 'open') {
        const durationMs = Math.round(performance.now() - start)
        throw this.buildError(
          {
            code: 'CIRCUIT_OPEN',
            message: 'AI service temporarily unavailable. Circuit breaker is open.',
            retryable: true,
          },
          { requestId, executionTimestamp, providerName: this.provider.name, executionDurationMs: durationMs },
        )
      }
    }

    // 4. Execute with retry
    const promise = this.executeWithRetry<T>(
      endpoint,
      payload,
      merged,
      requestId,
      executionTimestamp,
      start,
      dedupKey,
    ).finally(() => {
      this.inFlight.delete(dedupKey)
    })

    this.inFlight.set(dedupKey, promise)
    return promise
  }

  /** Swap the underlying provider */
  setProvider(provider: AIProvider): void {
    this.provider = provider
    this.emitChange()
  }

  /** Get current provider name */
  getProviderName(): string {
    return this.provider.name
  }

  // ─── Snapshot (for useSyncExternalStore) ───

  getSnapshot(): AIManagerSnapshot {
    return {
      circuitState: this._circuitState,
      failureCount: this.failureCount,
      successCount: this.successCount,
      requestCount: this.requestCount,
      cacheSize: this.cache.size,
      activeProvider: this.provider.name,
    }
  }

  // ─── Pub/sub ───

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  // ─── Circuit breaker manual controls ───

  getCircuitState(): CircuitState {
    return this._circuitState
  }

  /** External success report (e.g. from non-managed calls) */
  manualSuccessReport(): void {
    this.recordSuccess()
  }

  /** External failure report (e.g. from non-managed calls) */
  manualFailureReport(): void {
    this.recordFailure()
  }

  /** Check if circuit should transition from open → half-open */
  checkRecovery(): void {
    if (this._circuitState !== 'open' || !this.lastFailureAt) return
    if (Date.now() - this.lastFailureAt > RECOVERY_TIMEOUT) {
      this._circuitState = 'half-open'
      this.emitChange()
    }
  }

  /** Clear all cached responses */
  clearCache(): void {
    this.cache.clear()
    this.emitChange()
  }

  // ─── Internals ───

  private async executeWithRetry<T>(
    endpoint: string,
    payload: unknown,
    config: Required<RequestConfig>,
    requestId: string,
    executionTimestamp: string,
    start: number,
    dedupKey: string,
  ): Promise<AIResponse<T>> {
    let lastError: AIError & { meta?: object } | undefined

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await this.provider.request<T>(endpoint, payload)
        const executionDurationMs = Math.round(performance.now() - start)

        // Enhance response with execution metadata
        const enhanced: AIResponse<T> = {
          ...response,
          meta: {
            ...response.meta,
            requestId,
            executionTimestamp,
            executionDurationMs,
            provider: this.provider.getProviderName(),
          },
        }

        // Cache on success if policy allows
        if (config.cachePolicy.enabled) {
          this.setCache(dedupKey, enhanced, config.cachePolicy.ttlMs)
        }

        this.recordSuccess()

        return enhanced
      } catch (error: unknown) {
        const executionDurationMs = Math.round(performance.now() - start)
        const aiError = this.toAIError(error)
        lastError = this.buildError(aiError, {
          requestId,
          executionTimestamp,
          providerName: this.provider.name,
          executionDurationMs,
        })

        this.recordFailure()

        // Don't retry if not retryable or exhausted attempts
        if (!aiError.retryable || attempt >= MAX_RETRIES) {
          throw lastError
        }

        // Exponential backoff: 1s → 2s → 4s
        const delay = RETRY_BASE_DELAY * Math.pow(2, attempt)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    throw lastError ?? this.buildError(
      { code: 'MAX_RETRIES_EXCEEDED', message: 'Max retries exceeded', retryable: false },
      { requestId, executionTimestamp, providerName: this.provider.name, executionDurationMs: Math.round(performance.now() - start) },
    )
  }

  private recordSuccess(): void {
    this.successCount++
    if (this._circuitState !== 'closed') {
      this._circuitState = 'closed'
    }
    this.failureCount = 0
    this.emitChange()
  }

  private recordFailure(): void {
    this.failureCount++
    this.lastFailureAt = Date.now()

    if (this.failureCount >= FAILURE_THRESHOLD) {
      this._circuitState = 'open'
    } else if (this.failureCount >= 1 && this._circuitState === 'closed') {
      this._circuitState = 'half-open'
    }

    this.emitChange()
  }

  // ─── Cache ───

  private getFromCache<T>(
    endpoint: string,
    payload: unknown,
    _ttlMs: number,
  ): AIResponse<T> | null {
    const key = this.dedupKey(endpoint, payload)
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    return entry.data as AIResponse<T>
  }

  private setCache(
    key: string,
    data: AIResponse,
    ttlMs: number,
  ): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    })
  }

  // ─── Dedup ───

  private dedupKey(endpoint: string, payload: unknown): string {
    return `${endpoint}:${typeof payload === 'string' ? payload : JSON.stringify(payload)}`
  }

  // ─── Helpers ───

  private toAIError(error: unknown): AIError {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      return error as AIError
    }
    if (error instanceof Error) {
      return { code: 'AI_UNKNOWN_ERROR', message: error.message, retryable: false }
    }
    return { code: 'AI_UNKNOWN_ERROR', message: 'Unknown error', retryable: false }
  }

  private buildError(
    aiError: AIError,
    meta: AIRequestMetadata,
  ): AIError & { meta: AIRequestMetadata } {
    return { ...aiError, meta }
  }

  private emitChange(): void {
    this.listeners.forEach((l) => l())
  }
}

/** Singleton request manager. Import and use directly from any AI service. */
export const aiRequestManager = new AIRequestManager(createProvider())