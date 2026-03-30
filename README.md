# Dish Depot

Dish Depot is a recipe management Progressive Web App (PWA) built for collecting, organizing, sharing, and using recipes across desktop and mobile. It combines manual recipe entry, URL extraction, handwritten recipe-card scanning, meal planning, shopping list generation, and collaborative group sharing in a single app experience.

## Features

### Recipe capture and organization
- Add recipes manually.
- Extract recipe details from supported recipe URLs.
- Scan handwritten recipe cards with Azure Document Intelligence and review the extracted result before applying it.
- Save recipe images, notes, directions, ingredients, and categories.
- Search recipes by name, notes, and categories.
- Filter recipes by category and scope.
- Pin favorite recipes for faster access.
- Print recipes or save them as PDFs.

### Meal planning and shopping
- Build a weekly meal plan from saved recipes.
- Generate shopping lists from selected recipes.
- Merge and organize shopping list items.
- Export selected recipe data for backup or transfer.
- Import recipes back into the app.

### Sharing and collaboration
- Share recipes with other users.
- Create collaborative groups with role-based access.
- Invite users into groups and manage pending invites.
- Add recipes to shared groups.
- Manage group members and group recipe visibility.

### Account and sync
- Sign in and manage a user profile with display name, username, and avatar.
- Sync recipes and meal-planner data through Supabase.
- Handle password reset and authentication return flows.
- Show sync status, invite access, and profile controls in-app.

### PWA and offline support
- Install Dish Depot as a PWA on supported devices.
- Continue using saved recipes, planner data, and cached app views while offline.
- Show offline-aware messaging for features that require connectivity.
- Use service-worker caching for the app shell while avoiding stale authenticated data.

## Architecture

Dish Depot uses a split architecture so the UI, API, and cloud data services can evolve independently.

### Frontend
- **Platform:** React 19 + Vite
- **Hosting:** Vercel
- **Responsibilities:**
  - App UI and routing
  - recipe creation/edit flows
  - meal planner and shopping list UX
  - groups, sharing, and profile management
  - PWA install/offline behavior

Primary frontend files:
- `src/App.jsx` — main application logic and UI
- `src/App.css` — application styling and responsive layouts
- `src/lib/supabaseClient.js` — Supabase client setup
- `public/sw.js` — service worker and caching logic

### Backend API
- **Platform:** Node.js + Express
- **Hosting:** Render
- **Responsibilities:**
  - recipe URL extraction endpoint
  - recipe-card OCR endpoint
  - Azure Document Intelligence integration
  - server-side request validation and error handling

Primary backend files:
- `server/index.js` — API server and route definitions
- `server/recipe-extractor.js` — URL extraction pipeline
- `server/recipe-card-extractor.js` — Azure-based handwritten recipe-card OCR pipeline

### Data and auth layer
- **Platform:** Supabase
- **Responsibilities:**
  - authentication
  - user profiles
  - recipes and sharing records
  - collaborative groups and invites
  - cloud-synced meal-planner data

## Technology stack

### Core app
- React
- React DOM
- Vite
- Express

### Data and cloud services
- Supabase (`@supabase/supabase-js`)
- Azure Document Intelligence (`@azure/ai-form-recognizer`)

### Utilities and integrations
- Multer for multipart upload handling
- Cheerio for recipe-page parsing and extraction
- Font Awesome for icons

### Tooling
- ESLint
- Vite React plugin
- Concurrently for local frontend/API development

## Local development

Install dependencies:

```bash
npm install
```

Run the frontend and API together:

```bash
npm run dev
```

Other useful scripts:

```bash
npm run lint
npm run build
npm run preview
```

## Environment variables

### Frontend / Vercel
Typical frontend configuration includes:

- `VITE_API_BASE`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### API / Render
The Express API can be configured with:

- `CORS_ALLOWED_ORIGINS` — comma-separated list of allowed API origins.
- `AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT` — Azure Document Intelligence endpoint.
- `AZURE_DOCUMENT_INTELLIGENCE_API_KEY` — Azure Document Intelligence API key.
- `AZURE_DOCUMENT_INTELLIGENCE_MODEL` — optional model override. Defaults to `prebuilt-read`.
- `OCR_UPLOAD_MAX_BYTES` — optional upload size limit for recipe-card scans. Defaults to `8388608` (8 MB).

Keep Azure OCR credentials on the API only. Do not expose them to the Vite frontend.

## Deployment model

- **Frontend:** Vercel
- **API:** Render
- **Database/Auth:** Supabase

This deployment model keeps static UI delivery, server-side extraction, and hosted data services separate while staying practical for a small production app.
