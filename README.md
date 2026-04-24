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
- PostgreSQL instance with a `health_hub` schema created
- Python 3.11+ (for Garmin sync and data import scripts)

### Install

```bash
git clone <repo-url> health-hub
cd health-hub
npm install
cp .env.example .env.local  # Edit with your values
```

### Database

```sql
-- Run on your PostgreSQL instance
CREATE SCHEMA IF NOT EXISTS health_hub;
CREATE USER healthhub_user WITH PASSWORD 'your-password';
GRANT ALL ON SCHEMA health_hub TO healthhub_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA health_hub GRANT ALL ON TABLES TO healthhub_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA health_hub GRANT ALL ON SEQUENCES TO healthhub_user;
```

```bash
npx prisma migrate dev    # Create tables
npx prisma db seed        # Seed activity types
```

### Run

```bash
npm run dev               # http://localhost:3000
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
