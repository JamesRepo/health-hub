# Health Hub — Next.js Project Plan

## 1. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router) | Full-stack — API routes + server components + client UI |
| ORM | Prisma | Type-safe queries, migrations, schema-as-code |
| Database | PostgreSQL (existing shared instance on Raspberry Pi) | New `health_hub` schema, separate from other apps |
| Styling | Tailwind CSS + shadcn/ui | Utility-first, dark mode, polished components |
| Charts | Recharts or Apache ECharts | Calendar heat maps, trend lines, correlations |
| AI Insights | Anthropic SDK (`@anthropic-ai/sdk`) | Weekly/monthly digests, anomaly narratives |
| Garmin Sync | `python-garminconnect` (Python cron job) | Sleep, steps, activities, HR, HRV, stress |
| Auth | NextAuth.js (single-user, credentials provider) | Layered with Cloudflare Access |
| Hosting | Raspberry Pi (PM2 or systemd) | `health.hammez.net` via Route 53 |
| Dev tooling | Claude Design + Claude Code + Codex | Design → prototype → code pipeline |

---

## 2. Architecture

```
┌─────────────────────────────────────────────────┐
│                  Raspberry Pi                    │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │          Next.js Application             │    │
│  │                                          │    │
│  │  ┌────────────┐  ┌──────────────────┐    │    │
│  │  │   React    │  │   API Routes     │    │    │
│  │  │   (RSC +   │  │   /api/*         │    │    │
│  │  │   Client)  │  │                  │    │    │
│  │  └────────────┘  └──────────────────┘    │    │
│  │                                          │    │
│  │  ┌────────────┐  ┌──────────────────┐    │    │
│  │  │  NextAuth  │  │   Server         │    │    │
│  │  │            │  │   Actions        │    │    │
│  │  └────────────┘  └──────────────────┘    │    │
│  │                                          │    │
│  │  ┌────────────────────────────────────┐  │    │
│  │  │          Prisma Client             │  │    │
│  │  └────────────────────────────────────┘  │    │
│  └──────────────────────────────────────────┘    │
│                       │                          │
│  ┌──────────────────────────────────────────┐    │
│  │    PostgreSQL (shared instance)           │    │
│  │    └── health_hub schema                  │    │
│  └──────────────────────────────────────────┘    │
│                       ▲                          │
│  ┌──────────────────────────────────────────┐    │
│  │   Garmin Sync (Python cron, 6am daily)   │    │
│  │   garmin-sync.py → Postgres direct       │    │
│  └──────────────────────────────────────────┘    │
│                       │                          │
│  ┌──────────────────────────────────────────┐    │
│  │   Reverse Proxy (Caddy or nginx)         │    │
│  │   health.hammez.net → localhost:3000      │    │
│  └──────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
           │                          │
    ┌──────────────┐           ┌──────────────┐
    │  Route 53     │           │  Garmin       │
    │  (DNS A/CNAME │           │  Connect      │
    │   record)     │           │  (API)        │
    └──────────────┘           └──────────────┘
```

### Key Architectural Decisions

**Server Components by default.** Dashboard pages, analytics, and history views are all server components — they fetch data directly via Prisma, no API round-trip. Only interactive elements (the daily entry form, chart interactions, toggles) are client components.

**Server Actions for mutations.** Creating/updating daily logs uses Next.js Server Actions rather than API routes. This keeps the form logic co-located with the component and gives you automatic revalidation.

**API routes for chart data.** ECharts/Recharts needs JSON endpoints to feed the client-side charting library. These live in `app/api/analytics/`.

**Shared Postgres instance.** Your Pi already runs Postgres for finance.hammez.net. Health Hub gets its own schema (`health_hub`) in the same database, configured via Prisma's `schema` option. No extra Postgres instance needed.

---

## 3. Project Structure

```
health-hub/
├── app/
│   ├── layout.tsx                    # Root layout (nav, theme provider, auth)
│   ├── page.tsx                      # Dashboard (today + streaks + weekly summary)
│   ├── globals.css
│   ├── entry/
│   │   ├── page.tsx                  # Daily entry form (today)
│   │   └── [date]/
│   │       └── page.tsx              # Entry form for a specific date
│   ├── history/
│   │   ├── page.tsx                  # Calendar heat map + table browser
│   │   └── [year]/
│   │       └── [month]/
│   │           └── page.tsx          # Month detail view
│   ├── analytics/
│   │   ├── page.tsx                  # Analytics overview
│   │   ├── alcohol/page.tsx
│   │   ├── exercise/page.tsx
│   │   ├── mood-sleep/page.tsx
│   │   └── correlations/page.tsx
│   ├── insights/
│   │   ├── page.tsx                  # AI digest feed (weekly/monthly summaries)
│   │   ├── explore/page.tsx          # Multi-factor correlation explorer
│   │   ├── profile/page.tsx          # "What works for me" personal health profile
│   │   └── anomalies/page.tsx        # Trend anomaly log
│   ├── admin/
│   │   ├── page.tsx                  # DB stats, data completeness
│   │   └── export/page.tsx           # CSV/JSON export
│   ├── api/
│   │   ├── auth/[...nextauth]/
│   │   │   └── route.ts
│   │   ├── insights/
│   │   │   ├── generate/route.ts     # Trigger AI digest generation
│   │   │   ├── explore/route.ts      # Multi-factor query endpoint
│   │   │   └── profile/route.ts      # Personal profile computation
│   │   └── analytics/
│   │       ├── weekly/route.ts       # Weekly summary JSON
│   │       ├── monthly/route.ts      # Monthly summary JSON
│   │       ├── heatmap/route.ts      # Calendar heat map data
│   │       ├── correlations/route.ts # Correlation calculations
│   │       └── streaks/route.ts      # Current streak data
│   └── login/
│       └── page.tsx
├── components/
│   ├── ui/                           # shadcn/ui components
│   ├── entry-form.tsx                # Daily entry form (client component)
│   ├── mood-selector.tsx             # Radio-button toggle group
│   ├── sleep-selector.tsx
│   ├── alcohol-selector.tsx
│   ├── sex-selector.tsx
│   ├── exercise-slots.tsx            # Activity dropdowns + time/steps
│   ├── calendar-heatmap.tsx          # ECharts calendar view
│   ├── dashboard-cards.tsx           # Summary stat cards
│   ├── streak-display.tsx
│   ├── nav.tsx                       # Sidebar/top navigation
│   ├── insights/
│   │   ├── ai-digest-card.tsx        # Single AI insight display
│   │   ├── digest-feed.tsx           # Scrollable digest history
│   │   ├── factor-explorer.tsx       # Multi-factor correlation builder
│   │   ├── anomaly-banner.tsx        # Anomaly alert display
│   │   └── health-profile.tsx        # Personal profile summary
│   └── charts/
│       ├── alcohol-trends.tsx
│       ├── exercise-breakdown.tsx
│       ├── mood-sleep-trends.tsx
│       └── correlation-matrix.tsx
├── lib/
│   ├── prisma.ts                     # Prisma client singleton
│   ├── auth.ts                       # NextAuth config
│   ├── analytics.ts                  # Shared analytics computation
│   ├── insights.ts                   # AI digest generation + anomaly detection
│   ├── correlations.ts               # Multi-factor + time-lagged correlation engine
│   ├── profile.ts                    # "What works for me" profile builder
│   └── utils.ts                      # Date helpers, formatters
├── actions/
│   ├── daily-log.ts                  # Server actions: create, update, delete
│   ├── insights.ts                   # Generate/refresh AI digest
│   └── export.ts                     # Export action
├── prisma/
│   ├── schema.prisma
│   ├── seed.mjs                      # Activity type seed data
│   └── migrations/
├── scripts/
│   ├── import-spreadsheet.py         # One-off migration from Numbers
│   └── garmin-sync.py                # Nightly Garmin Connect sync (cron job)
├── public/
│   ├── manifest.json                 # PWA manifest
│   └── icons/
├── .env.local
├── .env.production
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["health_hub"]
}

model ActivityType {
  id        Int      @id @default(autoincrement())
  name      String   @unique @db.VarChar(50)
  emoji     String?  @db.VarChar(10)
  createdAt DateTime @default(now()) @map("created_at")

  exercises ExerciseEntry[]

  @@map("activity_type")
  @@schema("health_hub")
}

model DailyLog {
  id       Int      @id @default(autoincrement())
  logDate  DateTime @unique @map("log_date") @db.Date

  // Mood: 1=bad, 2=ok, 3=good
  mood          Int?  @db.SmallInt
  // Sleep quality: 1=bad, 2=ok, 3=good
  sleepQuality  Int?  @map("sleep_quality") @db.SmallInt
  // Alcohol: number of drinks (0–10+)
  alcoholUnits  Int?  @map("alcohol_units") @db.SmallInt
  // Sex activity category
  sexActivity   String? @map("sex_activity") @db.VarChar(20)

  // Exercise summary (denormalised)
  totalExerciseSeconds Int?     @map("total_exercise_seconds")
  stepCount            Int?     @map("step_count")
  didStretch           Boolean  @default(false) @map("did_stretch")

  // Garmin-sourced fields (auto-populated by sync script)
  garminSleepScore     Int?     @map("garmin_sleep_score")      // Garmin's 0-100 sleep score
  garminSleepSeconds   Int?     @map("garmin_sleep_seconds")    // Total sleep duration
  garminDeepSeconds    Int?     @map("garmin_deep_seconds")     // Deep sleep duration
  garminLightSeconds   Int?     @map("garmin_light_seconds")    // Light sleep duration
  garminRemSeconds     Int?     @map("garmin_rem_seconds")      // REM sleep duration
  garminAwakeSeconds   Int?     @map("garmin_awake_seconds")    // Awake during sleep
  garminRestingHr      Int?     @map("garmin_resting_hr")       // Resting heart rate
  garminStressAvg      Int?     @map("garmin_stress_avg")       // Average stress level (0-100)
  garminBodyBattery    Int?     @map("garmin_body_battery")     // End-of-day Body Battery
  garminHrvStatus      Int?     @map("garmin_hrv_status")       // HRV status (ms)

  notes     String?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at")

  exercises    ExerciseEntry[]
  tags         DailyTag[]
  customMetrics CustomMetric[]

  @@map("daily_log")
  @@schema("health_hub")
}

model ExerciseEntry {
  id             Int  @id @default(autoincrement())
  dailyLogId     Int  @map("daily_log_id")
  activityTypeId Int  @map("activity_type_id")
  slotNumber     Int  @map("slot_number") @db.SmallInt
  durationSeconds Int? @map("duration_seconds")
  notes          String?

  dailyLog     DailyLog     @relation(fields: [dailyLogId], references: [id], onDelete: Cascade)
  activityType ActivityType @relation(fields: [activityTypeId], references: [id])

  @@unique([dailyLogId, slotNumber])
  @@map("exercise_entry")
  @@schema("health_hub")
}

model DailyTag {
  id         Int    @id @default(autoincrement())
  dailyLogId Int    @map("daily_log_id")
  tag        String @db.VarChar(50)

  dailyLog DailyLog @relation(fields: [dailyLogId], references: [id], onDelete: Cascade)

  @@unique([dailyLogId, tag])
  @@map("daily_tag")
  @@schema("health_hub")
}

model CustomMetric {
  id          Int      @id @default(autoincrement())
  dailyLogId  Int      @map("daily_log_id")
  metricName  String   @map("metric_name") @db.VarChar(100)
  metricValue Decimal? @map("metric_value")
  metricText  String?  @map("metric_text")

  dailyLog DailyLog @relation(fields: [dailyLogId], references: [id], onDelete: Cascade)

  @@unique([dailyLogId, metricName])
  @@map("custom_metric")
  @@schema("health_hub")
}

/// AI-generated insight digests (weekly, monthly, ad-hoc)
model AiDigest {
  id          Int      @id @default(autoincrement())
  periodType  String   @map("period_type") @db.VarChar(20)  // 'weekly', 'monthly', 'adhoc'
  periodStart DateTime @map("period_start") @db.Date
  periodEnd   DateTime @map("period_end") @db.Date
  summary     String                                         // The AI-generated narrative
  highlights  Json?                                          // Structured findings (for UI cards)
  model       String   @db.VarChar(50)                       // Which Claude model generated this
  createdAt   DateTime @default(now()) @map("created_at")

  @@unique([periodType, periodStart])
  @@map("ai_digest")
  @@schema("health_hub")
}

/// Detected anomalies — when a metric deviates from personal baseline
model Anomaly {
  id          Int      @id @default(autoincrement())
  detectedAt  DateTime @map("detected_at") @db.Date
  metric      String   @db.VarChar(50)                       // 'alcohol', 'mood', 'sleep', 'exercise'
  description String                                         // Human-readable anomaly description
  severity    String   @db.VarChar(20)                       // 'info', 'notable', 'significant'
  value       Decimal?                                       // The anomalous value
  baseline    Decimal?                                       // What the baseline was
  dismissed   Boolean  @default(false)
  createdAt   DateTime @default(now()) @map("created_at")

  @@map("anomaly")
  @@schema("health_hub")
}

/// Garmin sync log — tracks each sync run for debugging/monitoring
model GarminSync {
  id         Int      @id @default(autoincrement())
  syncDate   DateTime @map("sync_date") @db.Date           // Which day's data was synced
  status     String   @db.VarChar(20)                       // 'success', 'partial', 'failed'
  sleepSync  Boolean  @default(false) @map("sleep_sync")
  stepsSync  Boolean  @default(false) @map("steps_sync")
  actSync    Boolean  @default(false) @map("act_sync")      // Activities synced
  metricsSync Boolean @default(false) @map("metrics_sync")  // HR, stress, HRV, BB
  errors     String?                                        // Error details if any
  createdAt  DateTime @default(now()) @map("created_at")

  @@unique([syncDate])
  @@map("garmin_sync")
  @@schema("health_hub")
}
```

### Schema Notes

The data model is identical to the original design — one `DailyLog` row per day, a separate `ExerciseEntry` table for the 1:N relationship (up to 4 activities per day), tags for contextual notes, and `CustomMetric` as the escape hatch for future tracking categories.

Prisma's `@@map` directives keep the database using snake_case table/column names (matching PostgreSQL conventions) while TypeScript code uses camelCase.

The `schemas = ["health_hub"]` config in the datasource isolates this app's tables from whatever else lives in your shared Postgres instance. You'll need to create the schema before running migrations:

```sql
CREATE SCHEMA health_hub;
GRANT ALL ON SCHEMA health_hub TO your_db_user;
```

---

## 5. Core Features

### 5.1 Daily Entry Form

Exactly as specified in the original design — optimised for speed since you're filling this in every day.

**Implementation approach:**
- Client component (`"use client"`) for the interactive toggle groups
- Pre-populated with today's date, navigable via `←` / `→` buttons
- Mood / Sleep / Alcohol use radio-button-style toggle groups (shadcn `ToggleGroup`) — not dropdowns
- Sex activity as a toggle group
- Exercise as up to 4 activity slots with a searchable `Combobox` for activity type
- Total time as a single `HH:MM:SS` input, steps as number input, stretch as checkbox
- Notes as a text input
- Submit via Server Action → `revalidatePath`
- Toast confirmation on save (shadcn `Sonner`)
- All fields optional — partial entries are fine

### 5.2 History Browser

- **Calendar heat map** — an ECharts calendar component showing one metric at a time (mood, alcohol, exercise frequency, etc.), colour-coded to match your original spreadsheet's emoji colour scheme (green → yellow → red)
- **Table view** — server component with shadcn `DataTable`, sortable/filterable columns, click-to-edit via client-side modal
- Clicking a day in the heat map navigates to `/entry/[date]` for editing

### 5.3 Authentication

Two layers, same as the original plan:

1. **Cloudflare Access / Tunnel** (or direct exposure via your existing reverse proxy setup for finance.hammez.net) — first line of defence, blocks unauthenticated traffic before it reaches the Pi.

2. **NextAuth.js with Credentials provider** — defence in depth:

```typescript
// lib/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        password: { label: "Password", type: "password" },
      },
      authorize(credentials) {
        if (credentials.password === process.env.AUTH_PASSWORD) {
          return { id: "1", name: "James" };
        }
        return null;
      },
    }),
  ],
  pages: { signIn: "/login" },
});
```

Single-password login. No username needed — it's a single-user app. Session persists via a secure cookie (30-day expiry). Middleware protects all routes except `/login`.

### 5.4 Admin Features

- **Export** — CSV and JSON download endpoints via API routes
- **DB stats page** — row counts, date range coverage, data completeness % per metric
- **Import** — the Python script runs directly on the Pi (one-off), not through the UI

---

## 6. Analytics & Dashboards

All five dashboards from the original design carry over unchanged. The compute strategy shifts slightly:

### Compute Strategy (Next.js Edition)

**Server Components + Prisma (replaces SQL views):**
- Weekly/monthly aggregates computed via Prisma's `groupBy` and aggregate queries
- Streak calculations in TypeScript (current dry-day streak, exercise streak, etc.)
- Rolling averages (7-day, 30-day) via raw SQL through `prisma.$queryRaw` where Prisma's API is too verbose
- Data completeness and period-over-period comparisons

**API Routes → Client Charts:**
- Analytics pages are server components that pre-render summary cards
- Chart data is fetched client-side from `/api/analytics/*` endpoints (JSON)
- Charts render via Recharts or ECharts in client components

**Optional: Postgres Views for Heavy Queries:**
You can still create the materialised views from the original design (weekly_summary, monthly_summary, alcohol_mood_correlation) as raw SQL migrations. Prisma can query views via `prisma.$queryRaw`. This is worth doing once you have enough data that the aggregation queries get slow — unlikely for a single user's data, but it's free performance.

### Dashboard Summary

| Dashboard | Key Visualisations |
|---|---|
| **Today / This Week** | Streak cards, weekly sparklines, quick-entry shortcuts |
| **Alcohol Insights** | Calendar heat map (green→red), monthly totals bar chart, day-of-week distribution, dry-days streak, rolling averages, YoY comparison |
| **Exercise Analysis** | Activity frequency donut, weekly volume trend, step count with 7-day MA, stretch compliance |
| **Mood & Sleep** | Calendar heat maps, distribution stacked bars, rolling averages, day-of-week patterns |
| **Correlations** | Alcohol → next-day mood, exercise → sleep quality, mood × sleep scatter, weekly exercise vs mood |

---

## 6B. Deep Analysis & AI Insights

This is where the data becomes genuinely interesting. The dashboards above answer questions you already know to ask. This section covers the features that surface patterns you'd never think to look for.

### 6B.1 AI-Powered Digests

A weekly and monthly narrative generated by Claude that analyses your recent data against your full historical baseline. This is the highest-value feature in the entire app.

**How it works:**

1. A Server Action (`actions/insights.ts`) gathers the raw data for the period — every daily_log row for the week/month, plus rolling averages and baselines computed from all historical data.

2. It sends this as structured context to the Anthropic API:

```typescript
// lib/insights.ts
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function generateWeeklyDigest(weekData: WeekData, baselines: Baselines) {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    system: `You are a personal health analyst. You have access to the user's complete
health tracking data going back to 2023. Be specific, cite actual numbers,
and focus on actionable patterns — not generic health advice. The user tracks:
mood (1-3), sleep quality (1-3), alcohol (drink count), exercise (activities,
duration, steps), and sex activity. Be direct and conversational.`,
    messages: [{
      role: "user",
      content: `Here is my health data for the week of ${weekData.weekStart}:

${JSON.stringify(weekData.days, null, 2)}

My historical baselines (all-time averages):
- Avg mood: ${baselines.avgMood}, Avg sleep: ${baselines.avgSleep}
- Avg drinks/week: ${baselines.avgWeeklyDrinks}, Avg dry days/week: ${baselines.avgDryDaysPerWeek}
- Avg exercise days/week: ${baselines.avgExerciseDaysPerWeek}
- Avg steps/day: ${baselines.avgDailySteps}

Recent trends (last 30 days):
${JSON.stringify(baselines.last30Days, null, 2)}

Same week last year:
${JSON.stringify(baselines.sameWeekLastYear, null, 2)}

Analyse this week. What stands out? What patterns do you see compared to my
baselines and recent trends? What connections between different metrics are
worth noting? Be specific with numbers and comparisons.`
    }],
  });

  return message.content[0].text;
}
```

3. The digest is stored in the `ai_digest` table so it's generated once and cached. The UI shows a chronological feed of past digests.

4. Triggered two ways: automatically via a cron job (Sunday night for weekly, 1st of month for monthly), or manually via a "Generate Insight" button.

**What the AI can surface that charts can't:**
- "Your mood has averaged 2.1 this month, down from 2.6 last month. This drop coincides with zero football sessions — you played football 3 times in March and your mood on football days averaged 2.8. Might be worth getting a game organised."
- "You drank on 5 of the last 7 days. The last time you had a stretch like this was December 2024 (holiday period). Your sleep quality during these stretches drops to 1.4 vs your baseline of 2.2."
- "Interesting pattern: your best mood weeks (avg ≥ 2.7) almost always include at least 3 exercise days AND ≤ 2 drinking days. This week had 4 exercise days but 4 drinking days — the exercise didn't offset the alcohol's mood impact."

### 6B.2 Multi-Factor Correlation Explorer

An interactive tool that lets you ask compound questions of your data. The current correlations page is pairwise (alcohol vs mood). This goes deeper.

**UI concept:** A query builder where you select factors, conditions, and a time window:

```
Show me [mood average] ─────────────── metric to measure
  on days where [alcohol ≥ 3] ──────── condition 1
  AND [exercised = no] ────────────── condition 2
  compared to days where
  [alcohol ≥ 3] AND [exercised = yes]
  over [last 12 months] ───────────── time window
```

**Pre-built queries** (one-click):
- "Does exercise cancel out a hangover?" — mood on heavy-drinking days with vs without exercise the same day or day before
- "What's my best day of the week?" — average mood by day of week, with ability to filter by other factors
- "Weekend warrior effect" — compare weeks with 5+ exercise days vs 1-2 exercise days: does total weekly volume matter or just frequency?
- "Alcohol and sleep: is there a threshold?" — sleep quality grouped by 0, 1, 2, 3, 4+ drinks
- "Does stretching matter?" — mood/sleep on exercise days with vs without stretching

**Implementation:** An API route (`/api/insights/explore`) that accepts a structured query object and translates it to a Prisma/raw SQL query. The query builder UI is a client component with dropdowns for metric, conditions, and time range. Results render as a comparison chart (grouped bar or side-by-side distributions).

### 6B.3 Trend Anomaly Detection

Automated flagging when a metric deviates significantly from your personal baseline. Runs nightly (or on each new entry) and stores anomalies in the `anomaly` table.

**Detection logic (`lib/insights.ts`):**

```typescript
export async function detectAnomalies(date: Date) {
  const last7 = await getLast7Days(date);
  const last30 = await getLast30Days(date);
  const allTime = await getAllTimeBaselines();
  const anomalies: NewAnomaly[] = [];

  // Rolling window anomalies
  if (last7.avgAlcohol > allTime.avgWeeklyAlcohol * 1.5) {
    anomalies.push({
      metric: "alcohol",
      severity: "notable",
      description: `You've averaged ${last7.avgAlcohol.toFixed(1)} drinks/day this week — ` +
        `50% above your all-time average of ${allTime.avgWeeklyAlcohol.toFixed(1)}/day`,
      value: last7.avgAlcohol,
      baseline: allTime.avgWeeklyAlcohol,
    });
  }

  // Streak anomalies
  const consecutiveBadSleep = await getConsecutiveDays(date, "sleep_quality", 1);
  if (consecutiveBadSleep >= 3) {
    const lastTime = await lastStreakOfLength("sleep_quality", 1, 3);
    anomalies.push({
      metric: "sleep",
      severity: "significant",
      description: `${consecutiveBadSleep} consecutive poor sleep days — ` +
        `last time this happened: ${lastTime ? format(lastTime, "MMMM yyyy") : "never"}`,
      value: consecutiveBadSleep,
      baseline: null,
    });
  }

  // Year-over-year comparison
  const thisMonthAlcohol = last30.totalDrinks;
  const sameMonthLastYear = await getMonthTotal(subYears(date, 1), "alcohol_units");
  if (sameMonthLastYear && thisMonthAlcohol > sameMonthLastYear * 1.3) {
    anomalies.push({
      metric: "alcohol",
      severity: "info",
      description: `${thisMonthAlcohol} drinks this month vs ${sameMonthLastYear} same month last year (+${Math.round((thisMonthAlcohol / sameMonthLastYear - 1) * 100)}%)`,
      value: thisMonthAlcohol,
      baseline: sameMonthLastYear,
    });
  }

  return anomalies;
}
```

**Types of anomalies detected:**
- **Rolling window spikes/dips**: 7-day average significantly above/below all-time average for any metric
- **Consecutive streaks**: X days in a row of bad sleep / bad mood / drinking / no exercise, with "last time this happened" context
- **Year-over-year drift**: "You drank 40% more this April than last April"
- **Month-over-month change**: "Exercise frequency dropped from 5.2 days/week last month to 2.8 this month"
- **Record breakers**: "This is your longest dry streak since you started tracking" / "Highest step count week ever"

**UI:** Anomalies appear as dismissible alert cards on the dashboard. An `/insights/anomalies` page shows the full anomaly log with filters.

### 6B.4 Time-Lagged Analysis

Many health effects have a delay. The correlations page currently does same-day and next-day. This extends the analysis window.

**Pre-computed lags:**
- **Alcohol → sleep (same night)**: already captured since both are logged on the same day's entry
- **Alcohol → mood (next day)**: join daily_log d1 with d1.log_date + 1
- **Exercise consistency → sleep quality (weekly)**: does a week with 4+ exercise days predict better average sleep the *following* week?
- **Exercise → mood (2-3 day window)**: average mood in the 2 days after an exercise day vs 2 days after a rest day
- **Alcohol-free stretches → cumulative mood lift**: after 3, 5, 7, 14 dry days in a row, what's the average mood trajectory?

**Implementation:** Raw SQL queries via `prisma.$queryRaw` with self-joins on `daily_log` at various offsets. Results rendered as line charts showing the lagged effect over time.

```sql
-- Example: mood trajectory after heavy drinking (3+ drinks)
SELECT
  offset_days,
  ROUND(AVG(d2.mood), 2) AS avg_mood,
  COUNT(*) AS sample_size
FROM daily_log d1
CROSS JOIN generate_series(0, 3) AS offset_days
JOIN daily_log d2 ON d2.log_date = d1.log_date + offset_days
WHERE d1.alcohol_units >= 3
  AND d2.mood IS NOT NULL
GROUP BY offset_days
ORDER BY offset_days;
-- Shows: Day 0 avg mood, Day 1 avg mood, Day 2 avg mood, Day 3 avg mood
-- after every heavy drinking day. You'll likely see a dip on Day 1.
```

### 6B.5 Seasonal & Cyclical Patterns

With 3+ years of data, you can answer genuinely interesting long-range questions.

**Visualisations:**
- **Year-over-year overlay**: pick a metric (e.g. weekly alcohol total), see 2023, 2024, 2025, 2026 as overlapping lines on the same Jan–Dec axis. Instantly shows if December is always your heaviest month, if you always exercise more in spring, etc.
- **Month-of-year averages**: bar chart of average mood/sleep/alcohol/exercise by calendar month, aggregated across all years. Shows seasonal patterns.
- **Day-of-week deep dive**: not just "which day do you drink most" but a full heatmap — day of week × metric, with ability to filter by year or season.
- **Holiday/event impact**: using the tags system (Holiday, Unwell, etc.), aggregate mood/alcohol/exercise during tagged periods vs untagged periods.

**Questions this answers:**
- "Is my alcohol consumption going up or down year-over-year?" — the YoY overlay answers this at a glance
- "Which month do I drink the most?" — month-of-year average, with per-year breakdown
- "Do I always get into a fitness slump in winter?" — exercise frequency by month, overlaid across years
- "Am I actually happier in summer?" — mood by month with confidence intervals
- "Has my sleep improved since I started tracking?" — sleep quality trend line across the full date range with a linear regression overlay

### 6B.6 "What Works For Me" Personal Health Profile

A computed summary page that distils your entire dataset into actionable personal findings. This is the output of running all the correlation, anomaly, and seasonal analyses and presenting the strongest signals in plain language.

**Structure:**

```
┌─────────────────────────────────────────────────────┐
│  🏆 YOUR BEST DAYS                                  │
│                                                      │
│  Your highest-mood days (score 3) share these        │
│  patterns:                                           │
│  • Exercised that day (82% of good mood days)        │
│  • Slept well the night before (74%)                 │
│  • Had ≤1 drink the night before (71%)               │
│  • Most common day: Saturday (28%)                   │
├─────────────────────────────────────────────────────┤
│  🍺 ALCOHOL PROFILE                                  │
│                                                      │
│  • Average: 1.4 drinks/day, 9.8 drinks/week          │
│  • Heaviest day: Saturday (avg 2.3 drinks)           │
│  • Heaviest month: December (avg 14.2/week)          │
│  • Trend: ↓ 12% year-over-year (2025 vs 2024)       │
│  • After 3+ drinks, next-day mood drops by 0.8       │
│  • After 0 drinks, next-day mood is 2.6 (vs 2.1     │
│    baseline)                                         │
│  • Your longest dry streak: 14 days (March 2025)     │
├─────────────────────────────────────────────────────┤
│  🏃 EXERCISE PROFILE                                 │
│                                                      │
│  • Average: 4.2 sessions/week, 312 min/week          │
│  • Top activities: Run (40%), Gym (20%), Football     │
│    (15%), Core (15%)                                 │
│  • Best months: March–May (5.1 sessions/week)        │
│  • Worst months: Nov–Dec (3.1 sessions/week)         │
│  • Weeks with 4+ sessions → avg mood 2.6 (vs 2.1)   │
│  • Steps trend: ↑ 8% year-over-year                  │
├─────────────────────────────────────────────────────┤
│  😴 SLEEP INSIGHTS                                   │
│                                                      │
│  • Average quality: 2.2/3                            │
│  • Best sleep follows: exercise day + 0 drinks       │
│  • Worst sleep follows: 3+ drinks (avg 1.4/3)        │
│  • Day-of-week pattern: worst on Sunday nights       │
│  • Trend: stable year-over-year                      │
├─────────────────────────────────────────────────────┤
│  🔗 STRONGEST CORRELATIONS                           │
│                                                      │
│  1. Alcohol (3+) → next-day mood drop (r = -0.42)   │
│  2. Exercise → same-day mood boost (r = 0.38)        │
│  3. Sleep quality → next-day mood (r = 0.35)         │
│  4. Alcohol (3+) → same-night sleep drop (r = -0.31)│
│  5. Weekly exercise volume → weekly mood avg (r=0.29)│
└─────────────────────────────────────────────────────┘
```

**Implementation:** A server component that runs a battery of queries on page load (cached and refreshed weekly). Each section is a self-contained analysis function in `lib/profile.ts`. The correlation coefficients use Pearson's r computed via raw SQL.

**Refresh strategy:** Recomputed weekly via the same cron job that generates the AI digest. The profile page shows the last-computed date and has a manual refresh button.

---

## 7. Deployment

### 7.1 Build & Run on Raspberry Pi

Next.js runs as a Node.js process. Use PM2 for process management (you may already have this for finance.hammez.net):

```bash
# On the Pi
cd /home/pi/health-hub
npm ci --production
npx prisma migrate deploy
npx prisma db seed
npm run build
pm2 start npm --name "health-hub" -- start -- -p 3001
pm2 save
```

Port 3001 avoids conflicts with finance hub (presumably on 3000 or another port).

**Memory considerations:** Next.js is heavier than a Spring Boot JAR in terms of baseline memory. On a Pi 4 (4GB+) this is fine. On a Pi 3 or 2GB model, set `NODE_OPTIONS=--max-old-space-size=512` and ensure standalone output mode:

```typescript
// next.config.ts
const nextConfig = {
  output: "standalone",  // Produces a minimal self-contained build
};
```

### 7.2 Reverse Proxy

You likely already have Caddy or nginx in front of finance.hammez.net. Add a server block for health:

**Caddy (recommended — auto-TLS with Let's Encrypt):**
```
health.hammez.net {
    reverse_proxy localhost:3001
}
```

**nginx:**
```nginx
server {
    listen 443 ssl;
    server_name health.hammez.net;

    ssl_certificate /etc/letsencrypt/live/hammez.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hammez.net/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 7.3 Route 53

Add an A record (if your Pi has a static public IP) or CNAME (if behind a tunnel/DDNS):

```
health.hammez.net → A → <your-pi-public-ip>
```

Same pattern as `finance.hammez.net`.

### 7.4 Environment Variables

```bash
# .env.production
DATABASE_URL="postgresql://healthhub_user:password@localhost:5432/your_shared_db?schema=health_hub"
AUTH_PASSWORD="your-strong-password"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://health.hammez.net"
ANTHROPIC_API_KEY="sk-ant-..."
GARMIN_EMAIL="your-garmin-email@example.com"
GARMIN_PASSWORD="your-garmin-password"
```

### 7.5 Backup

Same strategy as the original plan — nightly `pg_dump` via cron, keeping 30 days of backups. Since you're sharing a Postgres instance, you might already have a backup strategy for the finance DB. If so, health_hub is included automatically if you're dumping the full database. If you dump per-schema:

```bash
pg_dump -n health_hub your_shared_db | gzip > ~/backups/health_hub_$(date +%Y%m%d).sql.gz
```

---

## 8. Data Migration

The Python import script from the original design works identically — it talks directly to Postgres, not through the application layer. The only change is the schema prefix:

```python
# Connection string targets the health_hub schema
conn = psycopg2.connect("postgresql://user:pass@localhost:5432/shared_db")
conn.cursor().execute("SET search_path TO health_hub")
```

Everything else (emoji parsing, date reconstruction, exercise format handling) is unchanged. Run the script once on the Pi after `prisma migrate deploy` creates the tables.

---

## 9. Garmin Integration

### 9.1 Overview

Garmin doesn't offer a public API for personal use — their official Health API is gated behind a business application process. Instead, the integration uses [`python-garminconnect`](https://github.com/cyberjunky/python-garminconnect), a mature community library with 130+ API methods that authenticates via Garmin's mobile SSO flow. It obtains OAuth bearer tokens that auto-refresh indefinitely, so after a one-time login on the Pi, the sync runs unattended.

### 9.2 What Gets Synced

| Garmin Data | Health Hub Field | Notes |
|---|---|---|
| Daily step count | `daily_log.step_count` | Replaces manual entry entirely |
| Sleep score (0–100) | `daily_log.garmin_sleep_score` | Objective score alongside your subjective 1–3 rating |
| Sleep duration | `daily_log.garmin_sleep_seconds` | Total time asleep |
| Sleep stages | `daily_log.garmin_deep_seconds`, `garmin_light_seconds`, `garmin_rem_seconds`, `garmin_awake_seconds` | Deep/light/REM/awake breakdown |
| Recorded activities | `exercise_entry` rows | Type, duration, HR — mapped to your activity_type enum |
| Resting heart rate | `daily_log.garmin_resting_hr` | Daily RHR trend |
| Average stress | `daily_log.garmin_stress_avg` | Garmin's 0–100 stress score |
| Body Battery | `daily_log.garmin_body_battery` | End-of-day charge level |
| HRV status | `daily_log.garmin_hrv_status` | Heart rate variability in ms |

### 9.3 Sync Script

A Python script (`scripts/garmin-sync.py`) that runs as a nightly cron job on the Pi. It pulls yesterday's data and upserts into the database.

```python
#!/usr/bin/env python3
"""
Nightly Garmin Connect → Health Hub sync.

Usage:
    pip install garminconnect psycopg2-binary
    python garmin-sync.py                    # Sync yesterday
    python garmin-sync.py --date 2026-04-20  # Sync specific date
    python garmin-sync.py --backfill 30      # Backfill last 30 days

Cron (run at 6am daily — Garmin data finalises overnight):
    0 6 * * * cd /home/pi/health-hub/scripts && python3 garmin-sync.py >> /var/log/garmin-sync.log 2>&1
"""

import os
import argparse
import psycopg2
from datetime import date, timedelta
from garminconnect import Garmin

# --- Authentication ---

def get_garmin_client() -> Garmin:
    """Login or resume session from saved tokens."""
    client = Garmin(
        os.environ["GARMIN_EMAIL"],
        os.environ["GARMIN_PASSWORD"],
    )
    client.login("~/.garminconnect")  # Saves/loads tokens automatically
    return client


# --- Data Extraction ---

ACTIVITY_TYPE_MAP = {
    # Garmin activity type name → Health Hub activity_type.name
    "running": "Run",
    "treadmill_running": "Run",
    "trail_running": "Run",
    "cycling": "Cycle",
    "indoor_cycling": "Cycle",
    "swimming": "Swim",
    "pool_swimming": "Swim",
    "open_water_swimming": "Swim",
    "strength_training": "Gym",
    "hiking": "Hike",
    "walking": "Walk",
    "golf": "Golf",
    "tennis": "Tennis",
    "football": "Football",  # soccer
    "pilates": "Pilates",
    "yoga": "Yoga",
    # Add more mappings as needed — unmapped types logged as warnings
}


def sync_sleep(client: Garmin, cur, log_id: int, day: str):
    """Pull sleep data and update daily_log."""
    sleep = client.get_sleep_data(day)
    if not sleep or not sleep.get("dailySleepDTO"):
        return False

    dto = sleep["dailySleepDTO"]
    cur.execute("""
        UPDATE health_hub.daily_log SET
            garmin_sleep_score = %(score)s,
            garmin_sleep_seconds = %(total)s,
            garmin_deep_seconds = %(deep)s,
            garmin_light_seconds = %(light)s,
            garmin_rem_seconds = %(rem)s,
            garmin_awake_seconds = %(awake)s,
            -- Only set step_count / sleep_quality if not already manually entered
            step_count = COALESCE(step_count, %(steps)s)
        WHERE id = %(id)s
    """, {
        "id": log_id,
        "score": dto.get("sleepScores", {}).get("overall", {}).get("value"),
        "total": dto.get("sleepTimeInSeconds"),
        "deep": dto.get("deepSleepSeconds"),
        "light": dto.get("lightSleepSeconds"),
        "rem": dto.get("remSleepSeconds"),
        "awake": dto.get("awakeSleepSeconds"),
        "steps": None,  # Steps come from get_steps_data, not sleep
    })
    return True


def sync_steps(client: Garmin, cur, log_id: int, day: str):
    """Pull step count and update daily_log (only if not manually entered)."""
    steps_data = client.get_steps_data(day)
    if not steps_data:
        return False

    total_steps = sum(s.get("steps", 0) for s in steps_data)
    cur.execute("""
        UPDATE health_hub.daily_log
        SET step_count = COALESCE(step_count, %(steps)s)
        WHERE id = %(id)s
    """, {"id": log_id, "steps": total_steps})
    return True


def sync_activities(client: Garmin, cur, log_id: int, day: str):
    """Pull recorded activities and insert as exercise_entry rows."""
    activities = client.get_activities_by_date(day, day)
    if not activities:
        return False

    # Don't overwrite manually entered exercises
    cur.execute(
        "SELECT COUNT(*) FROM health_hub.exercise_entry WHERE daily_log_id = %s",
        (log_id,)
    )
    if cur.fetchone()[0] > 0:
        return False  # Manual entries exist, don't touch

    total_seconds = 0
    for slot, act in enumerate(activities[:4], start=1):  # Max 4 slots
        garmin_type = act.get("activityType", {}).get("typeKey", "").lower()
        hub_type = ACTIVITY_TYPE_MAP.get(garmin_type)

        if not hub_type:
            print(f"  WARNING: unmapped Garmin activity type '{garmin_type}' — skipping")
            continue

        # Look up activity_type_id
        cur.execute(
            "SELECT id FROM health_hub.activity_type WHERE name = %s", (hub_type,)
        )
        row = cur.fetchone()
        if not row:
            print(f"  WARNING: activity type '{hub_type}' not in DB — skipping")
            continue

        duration = int(act.get("duration", 0))
        total_seconds += duration

        cur.execute("""
            INSERT INTO health_hub.exercise_entry
                (daily_log_id, activity_type_id, slot_number, duration_seconds, notes)
            VALUES (%(log_id)s, %(type_id)s, %(slot)s, %(dur)s, %(notes)s)
            ON CONFLICT (daily_log_id, slot_number) DO NOTHING
        """, {
            "log_id": log_id,
            "type_id": row[0],
            "slot": slot,
            "dur": duration,
            "notes": act.get("activityName"),
        })

    # Update total exercise seconds on daily_log
    if total_seconds > 0:
        cur.execute("""
            UPDATE health_hub.daily_log
            SET total_exercise_seconds = COALESCE(total_exercise_seconds, %(total)s)
            WHERE id = %(id)s
        """, {"id": log_id, "total": total_seconds})

    return True


def sync_health_metrics(client: Garmin, cur, log_id: int, day: str):
    """Pull HR, stress, Body Battery, HRV and update daily_log."""
    try:
        hr = client.get_rhr_day(day)
        resting_hr = hr.get("restingHeartRate") if hr else None
    except Exception:
        resting_hr = None

    try:
        stress = client.get_stress_data(day)
        stress_avg = stress.get("overallStressLevel") if stress else None
    except Exception:
        stress_avg = None

    try:
        bb = client.get_body_battery(day, day)
        # Body Battery is a time series — take the last (end-of-day) value
        body_battery = bb[-1].get("bodyBatteryLevel") if bb else None
    except Exception:
        body_battery = None

    try:
        hrv = client.get_hrv_data(day)
        hrv_status = hrv.get("hrvSummary", {}).get("weeklyAvg") if hrv else None
    except Exception:
        hrv_status = None

    cur.execute("""
        UPDATE health_hub.daily_log SET
            garmin_resting_hr = %(rhr)s,
            garmin_stress_avg = %(stress)s,
            garmin_body_battery = %(bb)s,
            garmin_hrv_status = %(hrv)s
        WHERE id = %(id)s
    """, {
        "id": log_id,
        "rhr": resting_hr,
        "stress": stress_avg,
        "bb": body_battery,
        "hrv": hrv_status,
    })
    return True


# --- Orchestration ---

def sync_day(client: Garmin, conn, target_date: date):
    """Sync all Garmin data for a single day."""
    day_str = target_date.isoformat()
    cur = conn.cursor()

    # Ensure daily_log row exists
    cur.execute("""
        INSERT INTO health_hub.daily_log (log_date)
        VALUES (%s)
        ON CONFLICT (log_date) DO NOTHING
    """, (target_date,))

    cur.execute(
        "SELECT id FROM health_hub.daily_log WHERE log_date = %s", (target_date,)
    )
    log_id = cur.fetchone()[0]

    # Sync each category independently — don't let one failure block the rest
    sleep_ok = steps_ok = act_ok = metrics_ok = False
    errors = []

    try:
        sleep_ok = sync_sleep(client, cur, log_id, day_str)
    except Exception as e:
        errors.append(f"sleep: {e}")

    try:
        steps_ok = sync_steps(client, cur, log_id, day_str)
    except Exception as e:
        errors.append(f"steps: {e}")

    try:
        act_ok = sync_activities(client, cur, log_id, day_str)
    except Exception as e:
        errors.append(f"activities: {e}")

    try:
        metrics_ok = sync_health_metrics(client, cur, log_id, day_str)
    except Exception as e:
        errors.append(f"metrics: {e}")

    # Log the sync result
    status = "success" if not errors else ("partial" if any([sleep_ok, steps_ok, act_ok, metrics_ok]) else "failed")
    cur.execute("""
        INSERT INTO health_hub.garmin_sync
            (sync_date, status, sleep_sync, steps_sync, act_sync, metrics_sync, errors)
        VALUES (%(date)s, %(status)s, %(sleep)s, %(steps)s, %(act)s, %(metrics)s, %(errors)s)
        ON CONFLICT (sync_date) DO UPDATE SET
            status = %(status)s, sleep_sync = %(sleep)s, steps_sync = %(steps)s,
            act_sync = %(act)s, metrics_sync = %(metrics)s, errors = %(errors)s
    """, {
        "date": target_date, "status": status,
        "sleep": sleep_ok, "steps": steps_ok,
        "act": act_ok, "metrics": metrics_ok,
        "errors": "; ".join(errors) if errors else None,
    })

    conn.commit()
    print(f"  {day_str}: {status}" + (f" ({'; '.join(errors)})" if errors else ""))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", help="Sync specific date (YYYY-MM-DD)")
    parser.add_argument("--backfill", type=int, help="Backfill last N days")
    args = parser.parse_args()

    client = get_garmin_client()
    conn = psycopg2.connect(os.environ["DATABASE_URL"])

    if args.backfill:
        print(f"Backfilling last {args.backfill} days...")
        for i in range(args.backfill, 0, -1):
            sync_day(client, conn, date.today() - timedelta(days=i))
    elif args.date:
        sync_day(client, conn, date.fromisoformat(args.date))
    else:
        # Default: sync yesterday
        sync_day(client, conn, date.today() - timedelta(days=1))

    conn.close()
    print("Done.")


if __name__ == "__main__":
    main()
```

### 9.4 Key Design Decisions

**Manual entries always win.** The sync script uses `COALESCE(existing, garmin_value)` for steps and exercise, so anything you've already logged manually is preserved. Garmin data only fills in blanks. This means you can still override Garmin's step count if it's wrong, or log exercise that you did without your watch.

**Subjective + objective sleep.** Your manual `sleep_quality` (1–3 subjective rating) and Garmin's `garmin_sleep_score` (0–100 objective score) are stored as separate fields. This is deliberate — the gap between "how I felt I slept" and "how Garmin says I slept" is itself an interesting data point. The AI digest and correlation explorer can analyse both.

**Activity type mapping.** Garmin's activity type keys (e.g. `treadmill_running`, `strength_training`) are mapped to your existing Health Hub activity types (Run, Gym, etc.) via `ACTIVITY_TYPE_MAP`. Unmapped types are logged as warnings so you can add new mappings as they come up. You'll likely need to expand this dict as you encounter new Garmin activity types.

**Garmin fields live on `daily_log`, not `custom_metric`.** Resting HR, stress, Body Battery, HRV, and sleep stages are promoted to first-class columns because you'll query them constantly in the correlation explorer and AI digests. Putting them in `custom_metric` would make every analytics query require a pivot, which is painful.

**Sync logging.** Every sync run is recorded in `garmin_sync` with per-category success/failure flags. This makes it easy to spot sync issues in the admin panel — you can add a "Garmin Sync Status" card to the admin page showing the last sync date, any failures, and a manual re-sync trigger.

### 9.5 Setup on the Pi

```bash
# Install dependencies
pip install garminconnect psycopg2-binary --break-system-packages

# First-time login (interactive — will prompt for MFA if enabled)
cd /home/pi/health-hub/scripts
GARMIN_EMAIL="your@email.com" GARMIN_PASSWORD="your-password" python3 -c "
from garminconnect import Garmin
client = Garmin('$GARMIN_EMAIL', '$GARMIN_PASSWORD', prompt_mfa=lambda: input('MFA code: '))
client.login('~/.garminconnect')
print('Login successful — tokens saved to ~/.garminconnect/')
"

# Test sync
GARMIN_EMAIL="your@email.com" \
GARMIN_PASSWORD="your-password" \
DATABASE_URL="postgresql://user:pass@localhost:5432/shared_db" \
python3 garmin-sync.py

# Backfill historical data (as far back as Garmin retains)
python3 garmin-sync.py --backfill 365

# Set up cron (6am daily — Garmin data finalises overnight after device sync)
crontab -e
# Add: 0 6 * * * cd /home/pi/health-hub/scripts && /usr/bin/python3 garmin-sync.py >> /var/log/garmin-sync.log 2>&1
```

### 9.6 Environment Variables

Add to `.env.production`:

```bash
GARMIN_EMAIL="your-garmin-email@example.com"
GARMIN_PASSWORD="your-garmin-password"
```

### 9.7 What This Unlocks for Analysis

The Garmin data massively enriches your correlation analysis and AI insights:

- **Resting HR × alcohol**: does your resting heart rate spike the day after heavy drinking? (Spoiler: almost certainly yes.)
- **HRV × mood**: is your subjective mood correlated with your objective HRV? If so, HRV becomes an early warning system.
- **Body Battery × exercise performance**: do you train better on high Body Battery days?
- **Sleep stages × next-day mood**: does deep sleep duration predict mood better than total sleep time?
- **Stress × alcohol**: do high-stress days predict evening drinking?
- **Objective vs subjective sleep**: how well calibrated is your "gut feel" sleep rating compared to what Garmin measures? Does the gap vary by alcohol consumption?

All of these can be queried through the multi-factor correlation explorer (6B.2) and fed into the AI digest (6B.1) for narrative analysis.

---

## 10. PWA Support

```typescript
// next.config.ts — use next-pwa or serwist
import withPWA from "next-pwa";

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
})({
  output: "standalone",
});
```

Create `public/manifest.json`:
```json
{
  "name": "Health Hub",
  "short_name": "Health Hub",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#10b981",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

This lets you "install" Health Hub on your phone's home screen for a native-app feel.

---

## 11. Polish & UX

- **Dark mode** — Tailwind's `dark:` classes + a toggle in the nav. Health data at 11pm should not blind you.
- **Keyboard shortcuts** — `n` for new entry, `←`/`→` for day navigation, number keys for quick mood/sleep selection
- **Toast notifications** — shadcn's Sonner for save confirmations
- **Loading states** — React Suspense boundaries + skeleton components for dashboard cards
- **Responsive** — works on phone (primary use case for daily entry) and desktop (analytics)
- **Colour system** — matches your spreadsheet's emoji language: 🟩 green (#22c55e), 🟨 amber (#eab308), 🟧 orange (#f97316), 🟥 red (#ef4444)

---

## 12. UI/UX Design with Claude Design

### 12.1 Overview

Claude Design is Anthropic's visual prototyping tool (launched April 2026) that lets you go from a text description to interactive, clickable prototypes through conversation. It's powered by Claude Opus 4.7 and lives at [claude.ai/design](https://claude.ai/design). The key feature for this project is the **Claude Code handoff** — when a design is ready, Claude packages it into a bundle that can be passed directly to Claude Code for implementation, creating a closed loop from design to production code.

### 12.2 Design System Setup

On first use, Claude Design can read your codebase and design files to build a design system that's automatically applied to everything it creates. For Health Hub, feed it:

- **Colour tokens**: the green/amber/orange/red health metric scale (#22c55e, #eab308, #f97316, #ef4444), plus your dark mode background and surface colours
- **Typography**: whatever you settle on (the project uses Tailwind defaults, but you can specify a preferred font)
- **Component library**: point it at shadcn/ui so the prototypes use the same component patterns as the real app
- **The Prisma schema**: so it understands the data model and can create realistic mock data in prototypes

Once the design system is set up, every new page you prototype in Claude Design will automatically inherit your Health Hub brand — consistent colours, spacing, and component patterns.

### 12.3 Pages to Prototype

Work through these in order — each one builds on the design language established by the previous:

**Round 1 — Core pages (design first, build second):**

1. **Daily Entry Form** — the most important page. Prototype both mobile and desktop layouts. Focus on tap target sizes for the toggle groups, scroll depth on mobile, and the colour-coded feedback (green/amber/red toggles). Test the feel of the exercise slot dropdowns. This page gets used every single day, so iterate until it feels fast.

2. **Dashboard** — today's status, streaks, weekly comparison cards. This is the landing page, so it needs to communicate a lot at a glance without feeling cluttered. Prototype the summary cards, sparklines, and the quick-entry shortcut.

3. **History Browser** — calendar heat map with metric selector tabs. Prototype the colour scale rendering and the click-to-edit interaction (tapping a day opens the entry form).

**Round 2 — Analytics pages:**

4. **Alcohol Insights** — calendar heat map, monthly bar chart, day-of-week distribution, rolling averages. This establishes the chart design language that all other analytics pages follow.

5. **Exercise Analysis** — activity donut, weekly volume trend, step count with moving average. Include a section showing Garmin-synced data (resting HR trend, sleep stage breakdown).

6. **Mood & Sleep** — dual calendar heat maps, distribution bars, rolling averages. Include both subjective sleep rating and Garmin sleep score displayed together.

7. **Correlations** — scatter plots, grouped bars, the multi-factor query builder UI. This is the most complex page — the query builder needs careful UX attention.

**Round 3 — Insights pages:**

8. **AI Digest Feed** — chronological feed of weekly/monthly AI-generated insights. Design the card layout for each digest, how highlights are displayed, and the "Generate New Insight" trigger.

9. **"What Works For Me" Profile** — the personal health summary page. Design the section layout (best days, alcohol profile, exercise profile, sleep insights, strongest correlations).

10. **Anomaly Alerts** — how anomaly cards appear on the dashboard and the full anomaly log page.

**Round 4 — Admin & navigation:**

11. **Navigation** — sidebar on desktop, bottom tab bar on mobile. Include the Garmin sync status indicator.

12. **Admin** — data completeness, Garmin sync status, export controls.

### 12.4 Design Prompting Strategy

For each page, provide Claude Design with:

1. **The data model** — which fields from the Prisma schema this page displays or edits
2. **Mock data** — realistic sample data so the prototype looks like the real thing (e.g. "show 7 days where mood varies between 1-3, alcohol between 0-5, exercise some days, some Garmin sleep scores")
3. **Interaction description** — what happens when the user taps/clicks things
4. **Mobile vs desktop priorities** — the entry form is mobile-first; analytics are desktop-first
5. **Design references** — if there are apps or dashboards you like the look of, screenshot them and upload as reference

**Example prompt for the Daily Entry Form:**

```
Design a daily health entry form for a personal tracking app called Health Hub.

Design system: dark mode, Tailwind/shadcn components, colour scale:
green #22c55e, amber #eab308, orange #f97316, red #ef4444.

The form logs these fields (all optional):
- Date: shown at top with ← → navigation arrows
- Mood: 3-option toggle (Good=green, OK=amber, Bad=red)
- Sleep: 3-option toggle (Good=green, OK=amber, Bad=red)
- Alcohol: toggle (0, 1, 2, 3, 4+) coloured green→red
- Sex: toggle (Partner, Solo, Variant, None, Period)
- Exercise: up to 4 activity slots (searchable dropdown: Run, Gym,
  Football, Core, Swim, Cycle, Hike, Walk, Yoga, Pilates, Golf, Tennis)
- Total exercise time: HH:MM:SS input
- Steps: number input (shows Garmin-synced value if available, editable)
- Stretched: checkbox
- Notes: single-line text input
- Save button

Below the manual entry section, show a read-only "Garmin Data" card
displaying: sleep score (72/100), sleep stages bar, resting HR (58 bpm),
stress (32), Body Battery (65), HRV (42ms).

Design for mobile-first (this gets filled in on a phone at night in bed).
Big tap targets. Minimal scrolling. Toast confirmation on save.

Show both mobile (390px) and desktop (1200px) layouts.
```

### 12.5 Handoff to Claude Code

Once a design is finalised in Claude Design, use the built-in handoff feature to export it to Claude Code. The handoff bundle includes the visual design, component structure, and design intent, which Claude Code uses to generate implementation code that matches the prototype.

**Workflow:**

1. Finalise design in Claude Design → refine through conversation, inline comments, sliders
2. Export handoff bundle to Claude Code
3. Claude Code generates React/Next.js components with Tailwind styling
4. Review generated code, integrate with your Prisma data layer and Server Actions
5. Iterate — if the implemented version doesn't match the design, take a screenshot back to Claude Design for comparison

**What to hand off vs what to build manually:**

| Hand off to Claude Code | Build manually / with Codex |
|---|---|
| Component layout and styling | Server Actions (data mutations) |
| Responsive breakpoints | Prisma queries and API routes |
| Toggle group interactions | Chart data fetching and transformation |
| Form field layout | Authentication middleware |
| Navigation structure | Garmin sync integration |
| Card/widget designs | Anomaly detection logic |

The handoff works best for the visual/layout layer. Data fetching, business logic, and backend integration still need to be wired up separately.

### 12.6 Export Options

Claude Design exports in multiple formats, useful for different purposes:

- **Claude Code handoff** — primary workflow, generates implementation code
- **HTML** — standalone interactive prototype, useful for sharing with others for feedback before building
- **PDF** — static snapshots for documentation
- **PPTX** — if you want to present the design plan
- **Canva** — if you want to refine the visual design further in Canva before implementing

---

## 13. Future Enhancements

- **Weather correlation** — OpenWeatherMap API → `CustomMetric` table. Was your mood worse on rainy days? Did you exercise less in cold weeks? The multi-factor explorer (6B.2) can query these once stored
- **Telegram bot** — for quick logging: `/mood good`, `/alcohol 2`, `/exercise run gym`
- **Daily reminder** — cron job or PWA push notification if you haven't logged by 9pm
- **Weight / body composition tracking** — add as a `CustomMetric` initially, promote to a `daily_log` column if used regularly
- **Partner access** — optional read-only view for Hannah (the sex/period data already hints at shared tracking potential)
- **Natural language queries** — "How did I do last month compared to the month before?" routed to Claude with your data context, returning a conversational answer. Essentially the AI digest on-demand for any question
- **Garmin enrichment** — pull additional Garmin data like VO2 Max, training readiness, respiration rate, and Intensity Minutes into `CustomMetric` for deeper analysis

---

## 14. Implementation Roadmap

### Phase 1: Foundation
- Set up Claude Design: create Health Hub design system (colours, typography, shadcn components)
- **Claude Design**: prototype the Daily Entry Form (mobile + desktop) and Dashboard
- `npx create-next-app` with App Router + TypeScript + Tailwind
- Prisma schema, migrations, seed data (activity types)
- **Claude Code**: hand off Entry Form and Dashboard designs → generate components
- Wire up Server Actions for daily log CRUD
- NextAuth single-password login
- Deploy to Pi with PM2 + reverse proxy + Route 53 DNS

### Phase 2: Data Migration
- Run the Python import script against the Pi's Postgres
- Validate imported data (spot-check against spreadsheet)
- **Claude Design**: prototype History Browser (calendar heat map + table view)
- **Claude Code**: hand off → generate history components
- Wire up heat map data queries and click-to-edit navigation

### Phase 3: Garmin Integration
- Install `python-garminconnect` on the Pi, complete first-time login
- Deploy `garmin-sync.py`, configure cron job
- Backfill historical Garmin data (as far back as available)
- Update Daily Entry Form to show read-only Garmin data card below manual entry
- Admin page: Garmin sync status card with last sync date, errors, manual re-sync button

### Phase 4: Analytics Dashboards
- **Claude Design**: prototype Alcohol Insights page (establishes chart design language)
- **Claude Code**: hand off → generate chart components
- Repeat for Exercise Analysis, Mood & Sleep, and Correlations pages
- API routes for chart data, client-side Recharts/ECharts rendering
- Year-over-year overlay charts
- Seasonal/monthly pattern visualisations
- Garmin-specific charts: resting HR trend, sleep stage breakdown, stress vs mood, Body Battery trends

### Phase 5: Polish
- PWA manifest + service worker
- Dark mode toggle
- Keyboard shortcuts
- Responsive refinements — screenshot running app, compare in Claude Design, iterate
- Export functionality
- Backup cron job

### Phase 6: Deep Analysis & AI Insights
- Anthropic API integration (`@anthropic-ai/sdk`)
- Weekly AI digest generation (cron job + manual trigger)
- Monthly AI digest with year-over-year comparisons
- **Claude Design**: prototype AI Digest Feed, Anomaly Alerts, and "What Works For Me" Profile
- **Claude Code**: hand off insight pages → generate components
- Anomaly detection engine (runs on each new entry + nightly)
- Multi-factor correlation explorer UI (query builder + results chart)
- Time-lagged analysis queries and visualisations
- Pre-built insight queries ("Does exercise cancel out a hangover?", etc.)
- Garmin-enriched insights: include resting HR, HRV, stress, Body Battery in AI digests and correlations

### Phase 7: Ongoing
- Natural language queries ("How did April compare to March?")
- Telegram bot for quick logging
- Weather correlation data
- Refine AI prompts based on which insights are actually useful
- Expand Garmin activity type mappings as new types appear

---

## 15. Development with Claude Design + Claude Code + Codex

The three tools form a pipeline: **Design → Code → Ship**.

### Design Phase (Claude Design)

For each page or component:

1. Write a design prompt describing the page, its data model, interactions, and mock data
2. Iterate in Claude Design through conversation, inline comments, and sliders until the design feels right
3. Test the interactive prototype — especially mobile layouts for the entry form
4. Export the handoff bundle to Claude Code

**Best for:** visual design, layout decisions, responsive breakpoints, interaction patterns, colour system consistency, getting stakeholder/personal buy-in before building.

### Build Phase (Claude Code)

Receive the Claude Design handoff and generate implementation code:

1. Claude Code produces React/Next.js components with Tailwind styling that match the prototype
2. Wire up Prisma queries, Server Actions, and API routes to the generated components
3. Integrate authentication, Garmin data display, and chart libraries
4. Test against the design — screenshot the running app and compare in Claude Design if needed

**Best for:** translating designs to code, component scaffolding, maintaining design fidelity, iterating on implementation details.

### Implementation Phase (Codex + Claude Chat)

For the parts that Claude Code doesn't handle from the design handoff:

**Codex (bulk implementation):**
- Writing CRUD Server Actions from the Prisma schema
- Building out API routes for analytics data
- Generating chart configurations for Recharts/ECharts
- Writing the Garmin sync script and import script
- Implementing anomaly detection functions from the logic spec
- Building the multi-factor query builder backend

**Claude Chat (complex logic + architecture):**
- Schema design iterations
- Analytics query logic (correlations, streaks, rolling averages)
- AI digest prompt engineering
- Anomaly detection threshold tuning
- Debugging tricky Prisma/Next.js interactions
- Architecture decisions

### The Full Loop

```
 ┌──────────────────┐
 │  Claude Design    │ ← Design prompts, iterate visually
 │  (UI/UX)          │
 └────────┬─────────┘
          │ handoff bundle
          ▼
 ┌──────────────────┐
 │  Claude Code      │ ← Generate components from design
 │  (Implementation) │
 └────────┬─────────┘
          │ generated code
          ▼
 ┌──────────────────┐
 │  Codex + Claude   │ ← Wire up data, logic, backend
 │  (Logic + Polish) │
 └────────┬─────────┘
          │ working feature
          ▼
 ┌──────────────────┐
 │  Review & Test    │ ← Screenshot back to Claude Design
 │                   │   if implementation drifts from design
 └──────────────────┘
```

**Tip:** Feed all three tools the Prisma schema as context. For Claude Design, it helps generate realistic mock data. For Claude Code, it ensures correctly-typed components. For Codex, it produces accurate queries and Server Actions.
