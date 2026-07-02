# Tradevo

**AI-Powered Financial Learning Platform**

Tradevo is an educational platform designed to help users learn about investing in the Indian stock market through structured lessons, virtual trading with ₹10,00,000 in simulated capital, and AI-assisted insights that explain concepts rather than recommend actions.

> **Educational Disclaimer:** Tradevo is a learning tool, not a financial advisor. All trading occurs with virtual money. AI insights are for educational purposes only and do not constitute investment advice.

---

## Overview

Tradevo combines three core experiences into a single platform:

- **Structured Learning** — 8 modules covering market basics, fundamental analysis, technical analysis, risk management, and more, with 24 lessons and achievement tracking.
- **Virtual Trading** — Buy and sell shares of 10 major Indian companies (Reliance, TCS, HDFC Bank, etc.) using simulated capital. No real money is involved.
- **AI-Assisted Understanding** — Optional AI features (coaching tips, portfolio observations, research insights, learning reflections) that degrade gracefully and remain fully unavailable if the AI backend is not connected.

## Architecture

Tradevo follows a strict layered architecture:

```
Pages → Hooks → Services → AI Request Manager → AI Provider
```

- **Pages** are the only components that compose hooks and render UI. They never import services directly.
- **Hooks** handle data fetching (via TanStack Query), computation, and state selection. They are the only layer that calls services.
- **Services** are responsible for data retrieval. In the current version, all services read from static data files.
- **AI Request Manager** is a singleton that manages caching, deduplication, retry with backoff, and circuit breaking for all AI calls.
- **AI Provider** is an interface with two implementations: `MockAIProvider` (for development) and `HttpAIProvider` (for production with a real backend).

State management uses **Zustand** stores for auth, portfolio, watchlist, learning progress, and research history.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for a detailed developer reference.

## Technology Stack

| Category | Technology |
|---|---|
| Framework | React 19 + TypeScript 6 |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS 4 (with custom dark theme) |
| Routing | React Router 7 |
| State Management | Zustand 5 |
| Data Fetching | TanStack React Query 5 |
| Forms | React Hook Form 7 + Zod 4 |
| HTTP | Axios |
| Charts | Recharts |
| Icons | Lucide React |
| Linting | oxlint |

## Folder Structure

```
tradevo/
├── frontend/
│   ├── public/                  # Static assets (favicon, icons)
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── auth/            # ProtectedRoute
│   │   │   ├── cards/           # CompanyCard, ResearchCard
│   │   │   ├── charts/          # AllocationDonut, PerformanceAreaChart, Sparkline
│   │   │   ├── error/           # ErrorBoundary
│   │   │   ├── layout/          # AppShell, Sidebar, Topbar
│   │   │   ├── learning/        # LearningReflectionTimeline
│   │   │   ├── modals/          # OrderModal
│   │   │   └── shared/          # AIInsightCard, AISectionLoader, MarkdownContent
│   │   ├── data/                # Static mock data (companies, learning, research, AI)
│   │   ├── hooks/               # Custom React hooks (data fetching + computation)
│   │   ├── lib/                 # Shared utilities (chartTheme)
│   │   ├── pages/               # Page-level route components
│   │   ├── services/            # Data retrieval layer + AI engine
│   │   │   └── ai/              # AI provider, request manager, context, prompts
│   │   ├── stores/              # Zustand state stores
│   │   └── types/               # TypeScript type definitions
│   ├── .env.development         # Development environment variables
│   ├── .env.production          # Production environment variables
│   ├── index.html               # HTML entry point
│   ├── package.json
│   ├── vite.config.ts           # Vite configuration with manual chunks
│   └── tsconfig.json            # TypeScript configuration
├── ARCHITECTURE.md              # Developer reference for contributors
├── CHANGELOG.md                 # Version history
├── ENVIRONMENT.md               # Environment setup guide
└── DEPLOYMENT.md                # Deployment instructions
```

## Installation

### Prerequisites

- **Node.js** 20+ (recommended: 22 LTS)
- **npm** 10+

### Steps

```bash
# Clone the repository
git clone <repository-url>
cd tradevo

# Navigate to the frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`.

## Environment Variables

Tradevo uses two environment files:

| Variable | Development | Production | Description |
|---|---|---|---|
| `VITE_DEV_AUTH_BYPASS` | `true` | `false` | Bypasses login in development |
| `VITE_AI_PROVIDER` | `mock` | `http` | AI provider: `mock` (local) or `http` (backend API) |

See [ENVIRONMENT.md](./ENVIRONMENT.md) for the complete guide.

## Development Workflow

```bash
# Development server with HMR
npm run dev

# Type checking
npm run build  # runs tsc -b && vite build

# Linting
npm run lint

# Preview production build
npm run preview
```

### Key Conventions

1. **Pages never import services** — always go through hooks.
2. **Container vs. presentation** — only container components access Zustand stores directly; chart and display components receive data as props.
3. **AI is always optional** — every AI section must degrade gracefully and the app must remain fully functional without AI.
4. **Educational language only** — no "critical", no "mistake", no financial advice. AI explains decisions; it does not make them.
5. **Path alias** — use `@/` for imports from `src/` (e.g., `@/hooks/usePortfolio`).

## Build Instructions

```bash
npm run build
```

Output is generated in `frontend/dist/`. The build uses Vite's manual chunks to split vendor libraries (React, TanStack Query, Recharts, form libraries) into separate cached bundles.

## Running Tests

Tradevo's initial version focuses on the production-ready UI and architecture. Automated tests are a planned addition for the next development cycle.

## License

This project is proprietary. All rights reserved.