# Dish Depot

Dish Depot is a recipe management Progressive Web App (PWA) for collecting, organizing, and using recipes in one place across desktop and mobile.

## What it does

- Save recipes manually or extract them from recipe URLs.
- Organize recipes with categories, search, and pinned favorites.
- Build weekly meal plans from your saved recipes.
- Generate and export shopping lists from selected recipes.
- Print recipes or save them as PDF.
- Keep using core app features with offline-friendly behavior.
- Create collaborative Groups with role-based access and shared group recipes.

## Architecture

- **Frontend:** Hosted on **Vercel** (React + Vite app)
- **API:** Hosted on **Render** (Node.js + Express)
- **Data layer:** Hosted on **Supabase** (authentication and application tables)

This split setup keeps the UI, API, and data services independent while staying within free-tier hosting limits.

## API environment variables

The Express API can be configured with these environment variables:

- `CORS_ALLOWED_ORIGINS` — comma-separated list of allowed API origins.
- `AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT` — your Azure Document Intelligence endpoint.
- `AZURE_DOCUMENT_INTELLIGENCE_API_KEY` — your Azure Document Intelligence API key.
- `AZURE_DOCUMENT_INTELLIGENCE_MODEL` — optional Azure model override. Defaults to `prebuilt-read`.
- `OCR_UPLOAD_MAX_BYTES` — optional upload size limit for recipe-card scans. Defaults to `8388608` (8 MB).

Recipe card scanning runs server-side. Keep Azure credentials in the API environment only — never expose them in Vite frontend env vars.
