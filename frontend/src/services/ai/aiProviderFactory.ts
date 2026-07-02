import type { AIProvider } from '@/types/ai'
import { MockAIProvider } from './providers/mockAIProvider'
import { HttpAIProvider } from './providers/httpAIProvider'

// ─── Provider Factory ───
// Creates the correct AIProvider based on VITE_AI_PROVIDER env var.
// Default is 'mock' for development safety.

export function createProvider(): AIProvider {
  const type = import.meta.env.VITE_AI_PROVIDER || 'mock'

  switch (type) {
    case 'http':
      return new HttpAIProvider()
    case 'mock':
    default:
      return new MockAIProvider()
  }
}

/** Create a MockAIProvider with a custom response resolver */
export function createMockProvider(
  resolver: MockAIProvider['setResponseResolver'] extends (r: infer R) => void ? R : never,
): MockAIProvider {
  const provider = new MockAIProvider()
  provider.setResponseResolver(resolver)
  return provider
}

/** Currently active provider. Set via setActiveProvider() or replace at module level. */
export let activeProvider: AIProvider = createProvider()

/** Swap the active provider at runtime (testing, fallback) */
export function setActiveProvider(provider: AIProvider): void {
  activeProvider = provider
}