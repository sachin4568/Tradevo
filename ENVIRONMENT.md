# Environment Setup Guide

This guide covers how to configure the environment for Tradevo development and production deployment.

---

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 20+ (recommended: 22 LTS) | JavaScript runtime |
| npm | 10+ | Package manager |
| Git | 2.x | Version control |

## Quick Start

```bash
cd tradevo/frontend
npm install
npm run dev
```

The dev server starts at `http://localhost:5173` with hot module replacement.

## Environment Variables

Tradevo uses Vite's `VITE_` prefix for environment variables. Only variables prefixed with `VITE_` are exposed to the client bundle.

### `.env.development`

```env
# Bypass authentication — auto-login as a demo user
VITE_DEV_AUTH_BYPASS=true

# Use mock AI provider (returns canned responses, no backend needed)
VITE_AI_PROVIDER=mock
```

### `.env.production`

```env
# Require real authentication
VITE_DEV_AUTH_BYPASS=false

# Use HTTP AI provider (calls backend API)
VITE_AI_PROVIDER=http
```

### Variable Reference

| Variable | Type | Default | Description |
|---|---|---|---|
| `VITE_DEV_AUTH_BYPASS` | `boolean` | `false` | When `true`, skips login and auto-authenticates as a demo user. Only use in development. |
| `VITE_AI_PROVIDER` | `"mock" \| "http"` | `"mock"` | Which AI provider to use. `mock` returns static responses; `http` calls a backend API endpoint. |

## Development Mode

In development mode:

1. **Auth bypass** is enabled (`VITE_DEV_AUTH_BYPASS=true`). You'll be logged in automatically as "Demo User" with a fake token.
2. **Mock AI provider** returns predefined responses from `src/data/ai*.ts` files with simulated latency (300-800ms).
3. **All data is static** — companies, market data, learning modules, and research reports are defined in TypeScript files under `src/data/`.
4. **Portfolio state is not persisted** — refreshing the page resets virtual cash to ₹10,00,000 and clears all holdings/transactions.

## Production Mode

In production:

1. **Auth bypass is disabled** — users must log in via the Login page.
2. **AI provider** should be set to `http` to connect to a real backend.
3. **The `HttpAIProvider`** expects a backend API at the base URL configured in `src/services/api.ts`.
4. **Static data** (companies, learning modules) continues to serve from the bundled files until backend endpoints are implemented.

## Adding a New Environment Variable

1. Add it to both `.env.development` and `.env.production` with appropriate values.
2. Access it in code as `import.meta.env.VITE_YOUR_VAR`.
3. For TypeScript support, add a reference in a `.d.ts` file:
   ```typescript
   interface ImportMetaEnv {
     readonly VITE_YOUR_VAR: string
   }
   ```

## Troubleshooting

| Issue | Solution |
|---|---|
| `npm install` fails | Ensure Node.js 20+ is installed. Try `rm -rf node_modules package-lock.json && npm install`. |
| Port 5173 in use | Vite will auto-select the next available port (5174, 5175, etc.). |
| Blank page after login | Check browser console for errors. Ensure `.env.development` has `VITE_DEV_AUTH_BYPASS=true`. |
| AI sections don't load | Verify `VITE_AI_PROVIDER=mock` in `.env.development`. Check that AI prompt registration in `main.tsx` completes without errors. |