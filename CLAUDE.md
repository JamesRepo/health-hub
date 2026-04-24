# Health Hub

Personal health metrics tracker. Single-user Next.js app on a Raspberry Pi. Tracks mood, sleep, alcohol, exercise, and sex daily — with Garmin watch data synced nightly and AI-generated insights via Anthropic API.

## Tech Stack

- **Framework:** Next.js 15 (App Router, Server Components, Server Actions)
- **Language:** TypeScript (strict mode)
- **ORM:** Prisma with PostgreSQL (shared instance, `health_hub` schema)
- **UI:** Tailwind CSS + shadcn/ui components
- **Charts:** Recharts
- **AI:** Anthropic SDK (`@anthropic-ai/sdk`)
- **Auth:** NextAuth.js v5 (single-user, credentials provider — password only, no username)
- **Hosting:** Raspberry Pi, PM2, Caddy reverse proxy at `health.hammez.net`

## Commands

```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build (standalone output)
npm run lint             # ESLint
npx prisma migrate dev   # Create/apply migration in dev
npx prisma migrate deploy # Apply migrations in production (Pi)
npx prisma db seed       # Seed activity types
npx prisma studio        # GUI database browser (localhost:5555)
npx prisma generate      # Regenerate Prisma client after schema changes
bash scripts/deploy.sh   # Build + rsync + restart on Pi
```

## Project Structure

```
app/                     → Pages (App Router)
  entry/                 → Daily log entry form (the most-used page)
  history/               → Calendar heat map + table browser
  analytics/             → Alcohol, exercise, mood/sleep, correlations dashboards
  insights/              → AI digest feed, correlation explorer, personal profile, anomalies
  admin/                 → DB stats, Garmin sync status, export
  api/                   → JSON endpoints for charts + insight triggers
components/              → React components (ui/ is shadcn, rest is custom)
lib/                     → Shared logic (prisma client, auth, analytics, insights, correlations, profile)
actions/                 → Server Actions (daily-log CRUD, insight generation, export)
prisma/                  → Schema, migrations, seed
scripts/                 → Python scripts (import-spreadsheet.py, garmin-sync.py)
docs/                    → Project plan, execution plan, design decisions
```

## Architecture Decisions

- **Server Components by default.** Dashboard, analytics, history, and profile pages fetch data via Prisma directly — no API round-trip. Only interactive elements (entry form, chart interactions, toggles) are Client Components.
- **Server Actions for mutations.** Creating/updating daily logs uses Server Actions, not API routes. Keeps form logic co-located with the component.
- **API routes for chart data.** Recharts needs JSON endpoints. These live in `app/api/analytics/`.
- **Shared Postgres instance.** The Pi runs Postgres for other apps. Health Hub uses its own schema (`health_hub`), configured via Prisma's `schemas` option. Never touch tables outside this schema.
- **Garmin sync is a separate Python process.** It writes directly to Postgres via psycopg2, not through the Next.js app. Runs as a cron job at 6am.
- **Manual entries always win.** Garmin data uses `COALESCE(existing, garmin_value)` — manually logged data is never overwritten by sync.

## Code Style

- Use `"use client"` only when the component needs interactivity (hooks, event handlers, browser APIs). Default to Server Components.
- Named exports for components, default export for page components.
- Prisma queries go in Server Components or `lib/` functions — never in Client Components.
- Server Actions live in `actions/` with `"use server"` directive.
- Use shadcn/ui components from `components/ui/` — don't build custom versions of things shadcn already provides.
- Zod for input validation on Server Actions and API routes.
- Date handling with `date-fns`. Dates stored as `Date` type in Prisma, formatted for display.
- Use `revalidatePath` after mutations.
- Toast notifications via Sonner for user feedback on saves/errors.

## Database

- Schema: `health_hub` (Prisma `@@schema("health_hub")` on every model)
- Tables use snake_case (`daily_log`, `exercise_entry`), mapped from camelCase TypeScript via `@@map` and `@map`
- Core table: `daily_log` — one row per day, nullable fields for partial entries
- Exercise: `exercise_entry` — 1:N from daily_log, max 4 slots per day
- Garmin fields are first-class columns on `daily_log` (not in `custom_metric`)
- AI outputs: `ai_digest` (weekly/monthly narratives), `anomaly` (detected deviations)
- Sync tracking: `garmin_sync` (one row per sync run)
- Run `npx prisma generate` after any schema change, then `npx prisma migrate dev --name descriptive-name`

## Colour System

Health metric scale used throughout the app:
- Good/Low: `#22c55e` (green) — Tailwind `green-500`
- OK/Medium: `#eab308` (amber) — Tailwind `yellow-500`
- Warning: `#f97316` (orange) — Tailwind `orange-500`
- Bad/High: `#ef4444` (red) — Tailwind `red-500`

Background: `#0a0a0a`, Surface/cards: `#111111`, Borders: `#222222`, Accent: `#22c55e`

Dark mode is the default.

## Gotchas

- The `health_hub` schema isolation uses Prisma's multi-schema support via `schemas = ["health_hub"]` plus `@@schema("health_hub")`.
- `next.config.ts` must set `output: "standalone"` for Raspberry Pi deployment.
- NextAuth v5 imports differ from v4 — use `import { auth } from "@/lib/auth"`, not `getServerSession`.
- The Garmin sync script (`scripts/garmin-sync.py`) is Python, not TypeScript. Don't try to import it or call it from Next.js.
- Exercise time is stored in seconds (`totalExerciseSeconds`, `durationSeconds`), not minutes. Convert for display.
- Mood and sleep are integers 1-3, not strings. 1=bad, 2=ok, 3=good.
- `alcoholUnits` of `null` means "not logged", `0` means "zero drinks" — these are different for analytics.
- The AI digest uses `@anthropic-ai/sdk` directly, not the API proxy. Needs `ANTHROPIC_API_KEY` env var.

## Environment Variables

```
DATABASE_URL         # PostgreSQL connection string with ?schema=health_hub
AUTH_PASSWORD         # Single-user login password
NEXTAUTH_SECRET       # Generated with openssl rand -base64 32
NEXTAUTH_URL          # https://health.hammez.net (prod) or http://localhost:3000 (dev)
ANTHROPIC_API_KEY     # For AI digest generation
CRON_API_KEY          # For authenticating cron job API calls
```
