import type { AIProvider, AIResponse } from '@/types/ai'

// ─── Mock AI Provider ───
// Returns configurable mock responses with simulated latency.
// Used when VITE_AI_PROVIDER=mock (default for development).
// Supports a custom resolver for per-request response routing.

export type MockResponseResolver = (
  endpoint: string,
  payload: unknown,
) => unknown

export class MockAIProvider implements AIProvider {
  readonly name = 'mock-ai'

  private resolver?: MockResponseResolver
  private latencyRange: [number, number]

  constructor(options?: {
    latencyRange?: [number, number]
    resolver?: MockResponseResolver
  }) {
    this.latencyRange = options?.latencyRange ?? [600, 1800]
    this.resolver = options?.resolver
  }

  /** Set a custom resolver that receives (endpoint, payload) and returns mock data */
  setResponseResolver(resolver: MockResponseResolver): void {
    this.resolver = resolver
  }

  async request<T>(endpoint: string, payload: unknown): Promise<AIResponse<T>> {
    const start = performance.now()

    // Simulate network + AI processing latency
    const [min, max] = this.latencyRange
    const delay = min + Math.random() * (max - min)
    await new Promise((resolve) => setTimeout(resolve, delay))

    const latencyMs = Math.round(performance.now() - start)

    let data: unknown
    if (this.resolver) {
      data = this.resolver(endpoint, payload)
    } else {
      data = { _mock: true, endpoint, payload }
    }

    return {
      success: true,
      data: data as T,
      meta: {
        provider: this.name,
        latencyMs,
        timestamp: new Date().toISOString(),
      },
    }
  }
}