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