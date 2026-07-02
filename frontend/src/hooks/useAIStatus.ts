import { useSyncExternalStore } from 'react'
import type { AIStatus, CircuitState } from '@/types/ai'
import { aiRequestManager } from '@/services/ai/aiRequestManager'

// ─── AI Status Hook ───
// Connected to the AI request manager's circuit breaker state.
// Uses useSyncExternalStore for React-compatible external state.
// Also exposes manual report methods for non-managed AI calls.

const circuitToStatus = (state: CircuitState): AIStatus => {
  switch (state) {
    case 'closed':
      return 'available'
    case 'half-open':
      return 'degraded'
    case 'open':
      return 'unavailable'
  }
}

export function useAIStatus() {
  const snapshot = useSyncExternalStore(
    (callback) => aiRequestManager.subscribe(callback),
    () => aiRequestManager.getSnapshot(),
  )

  const status = circuitToStatus(snapshot.circuitState)

  return {
    status,
    isAvailable: status === 'available',
    isDegraded: status !== 'available',
    circuitState: snapshot.circuitState,
    providerName: snapshot.activeProvider,
    failureCount: snapshot.failureCount,
    requestCount: snapshot.requestCount,

    /** Report a successful AI call from outside the request manager */
    reportSuccess: () => aiRequestManager.manualSuccessReport(),

    /** Report a failed AI call from outside the request manager */
    reportFailure: () => aiRequestManager.manualFailureReport(),

    /** Trigger recovery check (open → half-open transition) */
    checkRecovery: () => aiRequestManager.checkRecovery(),
  }
}