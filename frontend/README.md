# Tradevo Frontend

This directory contains the Tradevo frontend application.

For the full project documentation including architecture, setup, and deployment, see the **root README.md** at `../README.md`.

## Quick Start

```bash
npm install
npm run dev
```

## Frontend-Specific Notes

- **Path alias:** `@/` maps to `src/` (configured in `vite.config.ts` and `tsconfig.app.json`).
- **Styling:** Tailwind CSS 4 with custom design tokens in `src/index.css`. No component library is used.
- **Dark theme:** The app uses a dark color scheme defined in `@theme` variables (`surface-0` through `surface-3`, `accent`, `tx-*`).
- **Charts:** Recharts is tree-shaken — only imported components are bundled. Chart components are memoized with `React.memo`.
- **Lazy loading:** All page components are lazy-loaded via `React.lazy()` with a shared `Suspense` boundary.
- **Bundle splitting:** Vite manual chunks separate vendor-react, vendor-data, vendor-charts, and vendor-forms.
- **AI degradation:** Every AI section uses `AISectionLoader` which handles loading, error, retry, and empty states. The app is fully functional without AI.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | TypeScript check + Vite production build |
| `npm run lint` | Run oxlint |
| `npm run preview` | Preview production build locally |