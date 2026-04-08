# Supabase migrations

This baseline was derived from the tracked `supabase-groups-feature.sql` file and copied into source-controlled migration history as `supabase/migrations/00000000000001_baseline_public_groups.sql`.

## Workflow

- Add future database changes as new timestamped `.sql` files in `supabase/migrations/`.
- Keep each migration scoped to the schema change being introduced.
- Treat this baseline as the repository starting point, not a guarantee that production and repo history fully match.

## Drift note

The live Supabase project may still contain tables, policies, functions, or SQL-editor changes that are not yet captured in repository history.

## Recommended next step

Compare this baseline against a real schema dump from the linked Supabase project before doing broader database cleanup or follow-up migrations.
