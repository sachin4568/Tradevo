# Deployment Guide

Instructions for deploying Tradevo to various hosting platforms.

---

## Build

```bash
cd tradevo/frontend
npm run build
```

This runs TypeScript type checking (`tsc -b`) followed by Vite production build. Output is in `frontend/dist/`.

### Build Output

Vite produces an optimized bundle with manual chunk splitting:

| Chunk | Contents | Approximate Size |
|---|---|---|
| `vendor-react` | React, React DOM, React Router | ~140 KB gzipped |
| `vendor-data` | TanStack Query, Zustand, Axios | ~45 KB gzipped |
| `vendor-charts` | Recharts | ~80 KB gzipped |
| `vendor-forms` | React Hook Form, Zod | ~30 KB gzipped |
| `index` | Application code | ~60 KB gzipped |
| Page chunks | Lazy-loaded route components | ~5-15 KB each |

## Static Hosting (Vercel, Netlify, Cloudflare Pages)

Tradevo is a single-page application that can be deployed to any static hosting provider.

### Vercel

1. Connect your repository to Vercel.
2. Set the **Root Directory** to `frontend`.
3. Set the **Build Command** to `npm run build`.
4. Set the **Output Directory** to `dist`.
5. Add environment variables in the Vercel dashboard:
   - `VITE_DEV_AUTH_BYPASS=false`
   - `VITE_AI_PROVIDER=http`

### Netlify

1. Connect your repository.
2. Set **Base directory** to `frontend`.
3. Set **Build command** to `npm run build`.
4. Set **Publish directory** to `dist`.
5. Add a `_redirects` file in `frontend/public/` with:
   ```
   /*    /index.html   200
   ```

### Cloudflare Pages

1. Connect your repository.
2. Set **Build command** to `npm run build`.
3. Set **Build output directory** to `frontend/dist`.
4. Framework preset: `None`.

## Docker

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Environment Variables in Production

Set these in your hosting platform's environment configuration:

| Variable | Value | Notes |
|---|---|---|
| `VITE_DEV_AUTH_BYPASS` | `false` | Must be false in production |
| `VITE_AI_PROVIDER` | `http` | Set to `mock` if no backend is available yet |

## Backend API (Future)

When a backend is available, configure the API base URL. The Axios instance in `src/services/api.ts` uses relative URLs by default, so the backend should be:

- Hosted on the same domain (e.g., `/api/`), or
- Proxied through the hosting platform's rewrite rules, or
- Configured via an environment variable like `VITE_API_BASE_URL`.

## Post-Deployment Checklist

- [ ] Application loads at the root URL
- [ ] Login page renders and form validation works
- [ ] After login, the dashboard loads with market data
- [ ] Navigation between all pages works
- [ ] Charts render on Dashboard and Portfolio pages
- [ ] AI sections show graceful degradation when backend is unavailable
- [ ] Mobile viewport renders correctly (responsive check)
- [ ] No console errors in production build