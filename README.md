# Dish Depot

## Production Deployment

This app can be deployed at a root domain like `https://dishdepot.app/` or under a subfolder like `https://your-domain.com/dishdepot/`.

### Build settings

Set `VITE_API_BASE` when building:

- `VITE_API_BASE=/dishdepot/api` (or `/api` if your host proxies API at the domain root)
- If frontend is static-hosted and API is hosted separately, use full URL (example):
  - `VITE_API_BASE=https://api.dishdepot.app/api`

Example build command:

```bash
VITE_API_BASE=/dishdepot/api npm run build
```

Upload `dist/` contents to your web root folder for the app path (for example, `F:\public_html\dishdepot`).

### API requirements

URL import uses an Express API (`server/index.js`) and requires a running Node process.

- If your host supports Node apps: run the API continuously and reverse proxy `/dishdepot/api` (or `/api`) to port `8787`.
- If your host is static-only: host the API elsewhere (VPS, container, serverless function), then set `VITE_API_BASE` to that API base URL.

### Pre-live checklist

- Enable HTTPS (required for reliable service worker and install behavior).
- Confirm API proxy route works for `POST /api/recipes/extract`.
- Add API rate limiting and request logging.
- Validate blocked-host protections still work in production.
- Verify PWA install, offline page, and icon set on mobile + desktop.
- Keep cache version bumps in `public/sw.js` when app-shell assets change.

## Render Deployment (Recommended)

This repo is now configured to run on Render as a single Node web service that serves both:

- API routes (`/api/*`) from Express
- Built frontend (`dist/`) from the same process

### Render service settings

- Build Command: `npm install --include=dev && npm run build`
- Start Command: `npm start`
- Health Check Path: `/api/health`

### Environment variables

- `NODE_ENV=production`
- `VITE_API_BASE=/api`
- `CORS_ALLOWED_ORIGINS=https://dishdepot.app,https://www.dishdepot.app`

### Notes

- `server/index.js` reads `process.env.PORT` automatically (Render injects this).
- Unknown API routes return JSON 404 and do not fall through to the SPA page.
- Non-API routes fall back to `dist/index.html` for client-side routing.

You can deploy with `render.yaml` from this repository, or set the same values manually in the Render dashboard.

### Static-host frontend + Render API

If your frontend is hosted on Vercel and your API is hosted on Render, build with:

```bash
VITE_API_BASE=https://your-render-service.onrender.com/api npm run build
```

Then publish `dist/` to `F:\public_html\dishdepot`.

Without this, the app defaults to `/api` on Apache and you will get `404 /api/recipes/extract`.

If Render shows `sh: 1: vite: not found` during build, it means dev dependencies were skipped. Use the build command above (with `--include=dev`) and redeploy.
