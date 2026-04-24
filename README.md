# 🫀 Health Hub

Personal health metrics tracker built with Next.js 15. Tracks mood, sleep, alcohol, exercise, and intimacy daily — with Garmin Connect integration and AI-powered insights.

## What it Does

- **Daily logging** — quick entry form (mood, sleep, drinks, exercise, sex) optimised for phone use
- **Garmin sync** — sleep stages, steps, resting HR, stress, Body Battery, HRV pulled from Garmin Connect nightly
- **Calendar heat maps** — visual history of any metric across the year
- **Analytics dashboards** — alcohol trends, exercise breakdown, mood/sleep patterns, cross-metric correlations
- **AI insights** — weekly/monthly AI-generated digests analysing patterns in your data
- **Anomaly detection** — flags when metrics deviate from your personal baselines
- **Correlation explorer** — interactive query builder for compound questions ("Does exercise cancel out a hangover?")
- **Personal profile** — "What Works For Me" summary distilled from your entire dataset
- **Password-protected access** — single-user credentials login with redirect back to the page you were trying to open

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| ORM | Prisma |
| Database | PostgreSQL (`health_hub` schema on shared instance) |
| UI | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| AI | Anthropic SDK |
| Garmin | python-garminconnect (Python cron job) |
| Auth | NextAuth.js v5 (single-user credentials) |
| Hosting | Raspberry Pi, PM2, Caddy |

## Setup

### Prerequisites

- Node.js 20+
- Docker with Compose support
- Python 3.11+ (for Garmin sync and data import scripts)

### Install

```bash
git clone <repo-url> health-hub
cd health-hub
npm install
cp .env.example .env.local  # Edit with your values
npm run db:start
```

### Database

The local Postgres container reads its settings from `.env.local`, so keep these values aligned:

```env
POSTGRES_DB=health_hub
POSTGRES_USER=healthhub_user
POSTGRES_PASSWORD=healthhub_password
POSTGRES_PORT=5432
DATABASE_URL=postgresql://healthhub_user:healthhub_password@localhost:5432/health_hub?schema=health_hub
```

```bash
npm run db:start          # or: docker compose --env-file .env.local up -d postgres
npx prisma migrate dev --name init
npx prisma generate
npx prisma db seed        # Seed activity types
```

### Run

```bash
npm run dev               # http://localhost:3000
```

### Authentication

Health Hub uses a single password via NextAuth credentials auth:

- Unauthenticated requests to app pages are redirected to `/login`
- Protected deep links keep a relative `callbackUrl` so login returns you to the original page
- `/` redirects to `/login` without a callback target
- `/login` and `/api/auth/*` stay public so the sign-in flow can complete
- Sessions use JWTs with a 30-day max age

Add these auth env vars to `.env.local`:

```env
AUTH_PASSWORD=your-single-user-password
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000
```

### Testing

```bash
npm run test:unit         # Vitest unit tests for auth flow and middleware
```

### Stop the Database

```bash
npm run db:stop           # Stop the container
npm run db:down           # Stop and remove the container
```

### Deploy to Pi

```bash
bash scripts/deploy.sh    # Builds, rsyncs, restarts PM2
```

## Data Import

To import existing data from a Numbers/Excel spreadsheet:

```bash
# Export spreadsheet as CSV first
pip install psycopg2-binary python-dateutil
python3 scripts/import-spreadsheet.py --csv data.csv --db "$DATABASE_URL" --dry-run  # Validate
python3 scripts/import-spreadsheet.py --csv data.csv --db "$DATABASE_URL"             # Import
```

## Garmin Sync

```bash
# One-time setup on Pi
pip install garminconnect psycopg2-binary --break-system-packages

# First login (interactive, saves tokens)
python3 scripts/garmin-sync.py  # Syncs yesterday

# Cron job (add to crontab)
0 6 * * * cd /home/pi/health-hub/scripts && python3 garmin-sync.py >> /var/log/garmin-sync.log 2>&1
```

## Project Documentation

Detailed plans and specs live in `docs/`:

- `PROJECT_PLAN.md` — Full project plan (architecture, schema, features, Garmin integration, AI insights)
- `EXECUTION_PLAN.md` — Step-by-step build instructions with AI prompts
- `CLAUDE_DESIGN_ADDENDUM.md` — Claude Design prototyping workflow for each UI page
