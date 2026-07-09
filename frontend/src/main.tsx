import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// ─── Theme Hydration ───
import { useThemeStore } from './stores/themeStore'

// Apply theme class before React renders to avoid flash
const theme = useThemeStore.getState().theme
document.documentElement.classList.toggle('light', theme === 'light')

// Subscribe to theme changes
useThemeStore.subscribe((state) => {
  document.documentElement.classList.toggle('light', state.theme === 'light')
})

// ─── AI Platform Initialization ───
// Configure the mock provider (if needed) and register prompt templates.
// The aiRequestManager singleton is already created in its own module.

import { aiRequestManager } from './services/ai/aiRequestManager'
import { MockAIProvider } from './services/ai/providers/mockAIProvider'
import { promptRegistry } from './services/ai/aiPromptRegistry'
import { registerResearchPrompts } from './services/ai/prompts/researchPrompts'
import { registerDecisionPrompts } from './services/ai/prompts/decisionPrompts'
import { registerLearningPrompts } from './services/ai/prompts/learningPrompts'
import { createResearchMockResolver } from './data/aiResearch'
import { createDecisionMockResolver } from './data/aiDecision'
import { createLearningMockResolver } from './data/aiLearning'
import type { MockResponseResolver } from './services/ai/providers/mockAIProvider'

/** Combined mock resolver that routes by endpoint to the appropriate domain resolver */
function createCombinedMockResolver(): MockResponseResolver {
  const researchResolver = createResearchMockResolver()
  const decisionResolver = createDecisionMockResolver()
  const learningResolver = createLearningMockResolver()

  return (endpoint: string, payload: unknown) => {
    if (endpoint.includes('/research/')) return researchResolver(endpoint, payload)
    if (endpoint.includes('/decision/')) return decisionResolver(endpoint, payload)
    if (endpoint.includes('/learning/')) return learningResolver(endpoint, payload)
    return { _mock: true, endpoint, payload }
  }
}

if (
  import.meta.env.VITE_AI_PROVIDER === 'mock' ||
  !import.meta.env.VITE_AI_PROVIDER
) {
  const mockProvider = new MockAIProvider({
    resolver: createCombinedMockResolver(),
  })
  aiRequestManager.setProvider(mockProvider)
}

// Register all prompt template metadata
registerResearchPrompts(promptRegistry)
registerDecisionPrompts(promptRegistry)
registerLearningPrompts(promptRegistry)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)