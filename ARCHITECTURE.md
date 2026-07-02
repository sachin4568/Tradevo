# Tradevo Architecture

A concise developer reference for understanding the codebase quickly.

---

## Layered Architecture

Tradevo enforces a strict unidirectional data flow. Each layer has a single responsibility and clear boundaries.

```
┌─────────────────────────────────────────────────────┐
│  Pages (Route Components)                           │
│  - Compose hooks and render UI                       │
│  - Never import services directly                    │
├─────────────────────────────────────────────────────┤
│  Hooks (Data + Computation Layer)                   │
│  - TanStack Query for server state                   │
│  - useMemo for derived computation                   │
│  - Select Zustand state with selectors               │
│  - Only layer that calls services                    │
├─────────────────────────────────────────────────────┤
│  Services (Data Retrieval Layer)                    │
│  - Mock functions reading from static data files     │
│  - Future: HTTP calls to backend API                 │
├─────────────────────────────────────────────────────┤
│  AI Request Manager (Singleton)                     │
│  - Caching, dedup, retry, circuit breaker           │
│  - Provider-agnostic request execution               │
├─────────────────────────────────────────────────────┤
│  AI Provider (Interface)                            │
│  - MockAIProvider: returns canned responses          │
│  - HttpAIProvider: calls backend AI API              │
└─────────────────────────────────────────────────────┘
```

## Folder Structure

```
src/
├── components/
│   ├── auth/          # Route protection (ProtectedRoute)
│   ├── cards/         # Reusable card components
│   ├── charts/        # Recharts-based visualization (memo'd, pure presentation)
│   ├── error/         # ErrorBoundary (class component)
│   ├── layout/        # AppShell (sidebar + topbar + outlet), Sidebar, Topbar
│   ├── learning/      # Learning-specific (LearningReflectionTimeline)
│   ├── modals/        # OrderModal (buy/sell)
│   └── shared/        # Cross-feature: AIInsightCard, AISectionLoader, MarkdownContent
├── data/              # Static mock data files (companies, learning modules, research, AI responses)
├── hooks/             # Custom hooks: data fetching (TanStack Query) + computation
├── lib/               # Shared utilities (chartTheme — colors, formatters, descriptors)
├── pages/             # One component per route
├── services/          # Data retrieval functions
│   └── ai/            # AI engine: provider factory, request manager, context builder,
│                      # prompt registry, domain services (research, decision, learning),
│                      # prompt templates, provider implementations
├── stores/            # Zustand stores (auth, portfolio, watchlist, learning, research)
└── types/             # TypeScript interfaces organized by domain
```

## State Management

Five Zustand stores manage client-side state. All are in-memory except `authStore` which persists to localStorage.

| Store | Key State | Persistence |
|---|---|---|
| `authStore` | `user`, `token`, `isAuthenticated` | localStorage |
| `portfolioStore` | `virtualCash`, `holdings[]`, `transactions[]` | None (resets on refresh) |
| `watchlistStore` | `watchlistIds[]` | None |
| `learningStore` | `lessonProgress{}`, `achievements[]` | None |
| `researchStore` | `viewedReports[]` | None |

**Rule:** Only container components (pages and a few layout components) access stores directly. Presentation components receive data via props.

## Hook Conventions

- **Naming:** `use<Domain>` for data hooks (e.g., `usePortfolio`, `useCompanies`).
- **AI hooks:** `useAI<Domain>` (e.g., `useAIDecision`, `useAIResearch`, `useAILearning`).
- **Computation hooks:** Return derived data via `useMemo` (e.g., `usePortfolioAllocation` aggregates holdings by sector).
- **AI enablement:** AI hooks check `useAIStatus()` and return empty data when AI is unavailable.
- **Query keys:** Follow `[domain, action]` pattern (e.g., `['ai-decision', 'portfolio-review']`).

## Service Layer

Services are plain functions that return data. Currently all services read from static files in `src/data/`.

```
companyService.ts  → reads from data/companies.ts
learningService.ts → reads from data/learning.ts
marketService.ts   → reads from data/market.ts
researchService.ts → reads from data/research.ts
authService.ts     → mock login/register (generates fake token)
```

**Future integration:** Replace mock implementations with `axios` calls to a backend API. The hook layer remains unchanged.

## AI Request Pipeline

The AI engine has a clean separation between infrastructure and domain logic:

1. **`aiProviderFactory`** — creates MockAIProvider or HttpAIProvider based on `VITE_AI_PROVIDER`.
2. **`aiRequestManager`** — singleton that wraps all AI calls with:
   - **Cache:** avoids redundant identical requests within TTL.
   - **Dedup:** coalesces in-flight identical requests.
   - **Retry:** exponential backoff (3 attempts).
   - **Circuit breaker:** opens after 5 consecutive failures, resets after 30s cooldown.
3. **`aiContextBuilder`** — assembles relevant Zustand state into a context object for each AI request.
4. **`aiPromptRegistry`** — stores metadata for all registered prompt templates (ID, category, context requirements).
5. **Domain services** — `aiResearchService`, `aiDecisionService`, `aiLearningService` each call the request manager with domain-specific endpoints.
6. **Prompt templates** — defined in `prompts/` directory; the frontend owns template IDs and context requirements only.

**Key principle:** AI is completely optional. Every AI section uses `AISectionLoader` which handles loading, error, retry, and empty states. The application remains fully functional with all AI features disabled.

## Data Flow Example: Portfolio Review

```
Portfolio.tsx (page)
  └── usePortfolioReview() (hook)
        └── aiDecisionService.fetchPortfolioReview() (service)
              └── aiRequestManager.request('decision/portfolio-review', context)
                    ├── aiContextBuilder.buildContext(['portfolio', 'user'])
                    ├── Check cache / dedup / circuit breaker
                    └── provider.generate(endpoint, context)
                          ├── MockAIProvider → returns canned response
                          └── HttpAIProvider → POST to backend API
```

## Component Organization

- **Pages** (`src/pages/`) — route-level components, may access stores and hooks directly.
- **Layout** (`src/components/layout/`) — AppShell, Sidebar, Topbar. May access `authStore` for user info.
- **Container components** — any component that calls hooks or stores.
- **Presentation components** — receive all data via props. Charts, cards, and shared components fall into this category.
- **Error boundaries** (`src/components/error/`) — class components wrapping sections for error recovery.

## Naming Conventions

- **Files:** PascalCase for components (`CompanyCard.tsx`), camelCase for hooks/services (`usePortfolio.ts`, `companyService.ts`).
- **Types:** PascalCase interfaces in domain-organized files (`types/portfolio.ts`, `types/ai.ts`).
- **CSS:** Tailwind utility classes only. Design tokens defined in `index.css` under `@theme`.
- **Icons:** Lucide React. Decorative icons use `aria-hidden="true"`.

## Future Backend Integration Points

The service layer is designed for straightforward backend replacement:

1. Replace mock service functions with HTTP calls (services already import `api.ts` which is an Axios instance).
2. Set `VITE_AI_PROVIDER=http` to use `HttpAIProvider`.
3. Add authentication token from `authStore` to API headers via the Axios interceptor in `api.ts`.
4. The AI request manager's HTTP provider calls `POST /api/ai/<endpoint>` with the context payload.

No architectural changes are needed — only service implementations.