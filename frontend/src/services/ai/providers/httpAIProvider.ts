import axios from 'axios'
import type { AIProvider, AIResponse, AIError } from '@/types/ai'
import { useAuthStore } from '@/stores/authStore'

// ─── HTTP AI Provider ───
// Calls the Tradevo AI backend via HTTP. Swappable at runtime.
// Injects auth token from authStore on every request.

export class HttpAIProvider implements AIProvider {
  readonly name = 'tradevo-ai-http'

  private client = axios.create({
    baseURL: import.meta.env.VITE_AI_URL || '/ai/v1',
    timeout: 30_000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  constructor() {
    // Inject Bearer token from auth store
    this.client.interceptors.request.use((config) => {
      const token = useAuthStore.getState().token
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })
  }

  async request<T>(endpoint: string, payload: unknown): Promise<AIResponse<T>> {
    const start = performance.now()

    try {
      const response = await this.client.post<AIResponse<T>>(endpoint, payload)
      const latencyMs = Math.round(performance.now() - start)

      return {
        ...response.data,
        meta: {
          ...response.data.meta,
          provider: this.name,
          latencyMs,
          timestamp: new Date().toISOString(),
        },
      }
    } catch (error: unknown) {
      const latencyMs = Math.round(performance.now() - start)
      const aiError = this.normalizeError(error)

      throw {
        ...aiError,
        meta: {
          provider: this.name,
          latencyMs,
          timestamp: new Date().toISOString(),
        },
      }
    }
  }

  private normalizeError(error: unknown): AIError & { meta?: object } {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const message =
        error.response?.data?.message ||
        error.message ||
        'AI request failed'

      if (status === 429) {
        return { code: 'RATE_LIMITED', message, retryable: true }
      }
      if (status && status >= 500) {
        return { code: 'AI_SERVER_ERROR', message, retryable: true }
      }
      if (status === 401) {
        return { code: 'AI_UNAUTHORIZED', message, retryable: false }
      }

      return { code: 'AI_REQUEST_ERROR', message, retryable: false }
    }

    if (error instanceof Error) {
      return { code: 'AI_UNKNOWN_ERROR', message: error.message, retryable: false }
    }

    return {
      code: 'AI_UNKNOWN_ERROR',
      message: 'An unknown AI error occurred',
      retryable: false,
    }
  }
}