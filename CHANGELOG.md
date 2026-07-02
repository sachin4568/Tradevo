# Changelog

All notable changes to Tradevo are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/) and this project adheres to Semantic Versioning.

---

## [1.0.0] - 2026-07-01

### Added — Milestone 9: Production Readiness & Analytics

**Part A: Visualization & Analytics**
- Added Recharts-based chart components: `AllocationDonut` (sector allocation), `PerformanceAreaChart` (invested vs. portfolio value), `Sparkline` (inline trend).
- Added `chartTheme.ts` utility with consistent chart colors, tooltip styles, and currency formatters aligned with the Tailwind dark theme.
- Added `types/chart.ts` with typed interfaces for chart data points.
- Added data hooks: `usePortfolioAllocation` (sector aggregation), `usePortfolioPerformance` (time-series from transactions), `useLearningReflection` (per-trade outcome observations).
- Added `LearningReflectionTimeline` component with educational outcome descriptions (no evaluative language — uses terms like "Strong upward movement" instead of "mistake" or "error").
- Integrated `AllocationDonut` into Dashboard (Sector Allocation card).
- Integrated `AllocationDonut` and `PerformanceAreaChart` into Portfolio page.
- Integrated `LearningReflectionTimeline` and `PerformanceAreaChart` into Learning page.

**Part B: Performance**
- Converted all page imports in `App.tsx` to `React.lazy()` with a shared `Suspense` boundary and `PageLoader` fallback.
- Configured Vite manual chunks to split vendor bundles: `vendor-react`, `vendor-data`, `vendor-charts`, `vendor-forms`.
- Wrapped chart components (`AllocationDonut`, `PerformanceAreaChart`, `Sparkline`) with `React.memo`.

**Part C: Quality**
- Added `ErrorBoundary` class component with recovery UI (Try Again button) and `section` prop for contextual error messages.
- Wrapped the entire application in `ErrorBoundary` in `App.tsx`.
- Added skip-to-content link in `AppShell` for keyboard navigation accessibility.
- Added `aria-label="Primary navigation"` and `role="list"` to sidebar navigation.
- Added `aria-hidden="true"` to decorative icons in sidebar.
- Added `role="main"` and `id="main-content"` to the main content area.
- Added `role="img"` and `aria-label` attributes to chart components.
- Added `role="list"` and `role="listitem"` to the Learning Reflection Timeline.
- Fixed unused imports across codebase (authStore, aiClient, useLearning, Dashboard).
- Added `unlocked` optional field to `Achievement` type.

**Part D: Documentation**
- Created root `README.md` with project overview, architecture summary, technology stack, folder structure, installation, environment variables, development workflow, and build instructions.
- Created `ARCHITECTURE.md` — concise developer reference covering layered architecture, folder structure, state management, hook conventions, service layer, AI request pipeline, data flow example, component organization, naming conventions, and future backend integration points.
- Created `ENVIRONMENT.md` — environment setup guide covering prerequisites, environment variables, development vs. production modes, and troubleshooting.
- Created `DEPLOYMENT.md` — deployment instructions for Vercel, Netlify, Cloudflare Pages, and Docker, including nginx configuration, environment variable setup, and post-deployment checklist.

---

## [0.9.0] - 2026-06-30

### Added — Milestone 8: AI Engine Integration

- Built complete AI request pipeline: `AIRequestManager` (singleton) with caching, deduplication, retry with exponential backoff, and circuit breaker.
- Implemented `MockAIProvider` and `HttpAIProvider` with provider factory.
- Created `AIContextBuilder` to assemble Zustand store state into AI request context.
- Implemented `AIPromptRegistry` for prompt template metadata.
- Built domain AI services: `aiResearchService`, `aiDecisionService`, `aiLearningService`.
- Created 10 prompt templates across research, decision, and learning categories.
- Added AI hooks: `useAIDecision`, `useAIResearch`, `useAILearning`, `useAIStatus`.
- Added `AISectionLoader` component for graceful AI degradation (loading, error, retry, empty states).
- Added `AIInsightCard` with provenance metadata display.
- Integrated AI sections into Dashboard (insights), Portfolio (review, risk), Learning (coaching, recommendations, reflection), and Research (opportunity scan).

---

## [0.8.0] - 2026-06-30

### Added — Milestone 7: Research & AI Foundation

- Added Research page with market intelligence and sector analysis.
- Added DeepResearch page with full research reports (static + AI sections).
- Created research data with 3 complete company research reports.
- Added research history tracking in `researchStore`.
- Built `ResearchCard` component.

---

## [0.7.0] - 2026-06-29

### Added — Milestone 6: Learning System

- Built Learning page with 8 modules, 24 lessons across 4 difficulty levels.
- Implemented lesson progress tracking and achievement system.
- Added ModuleDetails and LessonView pages.
- Created comprehensive educational content covering market basics, fundamental analysis, technical analysis, and risk management.

---

## [0.6.0] - 2026-06-28

### Added — Milestone 5: Portfolio & Trading

- Built Portfolio page with holdings table and P&L calculations.
- Implemented virtual trading with `OrderModal` (buy/sell).
- Added Transactions and Watchlist pages.
- Created `portfolioStore` with buy/sell logic, virtual cash management.

---

## [0.5.0] - 2026-06-27

### Added — Milestone 4: Market & Company Details

- Built Market page with company listing, search, and sector filters.
- Added CompanyDetails page with financial data, news, and buy/sell actions.
- Created `CompanyCard` component with watchlist star.

---

## [0.4.0] - 2026-06-26

### Added — Milestone 3: Navigation & Layout

- Built AppShell with Sidebar and Topbar.
- Implemented protected routing with `ProtectedRoute`.
- Added Login and Register pages with form validation (React Hook Form + Zod).
- Created auth system with `authStore` (localStorage persistence).

---

## [0.3.0] - 2026-06-25

### Added — Milestone 2: Foundation & Data

- Set up Vite + React 19 + TypeScript project.
- Configured Tailwind CSS 4 with custom dark theme tokens.
- Created 10 Indian company profiles with financial data and news.
- Implemented market overview data with indices, top movers, and news.
- Set up Zustand stores, Axios instance, and base type definitions.

---

## [0.2.0] - 2026-06-24

### Added — Milestone 1: Project Initialization

- Repository setup with initial configuration files.
- Project planning and architecture design.