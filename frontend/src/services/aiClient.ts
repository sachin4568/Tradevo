import type { AIResponse } from '@/types/ai'

// ─── AI Client (thin wrapper) ───
// Backward-compatible public API. Internally delegates to the
// AI request manager for managed calls with caching, retry, and circuit breaking.
//
// For M7+ AI engine usage, import aiRequestManager directly.
// This wrapper exists for any code that used aiClient before M7.

import { aiRequestManager } from './ai/aiRequestManager'

class AIClient {
  /** Send a managed AI request (cached, retried, circuit-broken) */
  async request<T>(
    endpoint: string,
    payload: unknown,
  ): Promise<AIResponse<T>> {
    return aiRequestManager.request<T>(endpoint, payload)
  }

  /** Get current provider name */
  getProviderName(): string {
    return aiRequestManager.getProviderName()
  }
}

export const aiClient = new AIClient()