# Health Hub — AI Coding Agent Rules

> This file provides context for AI coding agents. Also see CLAUDE.md.

## Project

Single-user personal health tracker. Next.js 15 App Router + Prisma + PostgreSQL + Tailwind/shadcn + Recharts. Deployed on Raspberry Pi.

## Patterns to Follow

- Server Components by default. Only add `"use client"` for interactivity.
- Server Actions in `actions/` for mutations. Not API routes.
- API routes only for JSON data consumed by client-side charts.
- Prisma queries in Server Components or `lib/` — never in Client Components.
- shadcn/ui components from `components/ui/`. Don't rebuild them.
- Zod validation on all Server Action inputs.
- `date-fns` for date manipulation. No `moment`.
- `revalidatePath` after every mutation.
- Health colour scale: green `#22c55e`, amber `#eab308`, orange `#f97316`, red `#ef4444`.
- Dark mode default. Background `#0a0a0a`, cards `#111111`, borders `#222222`.

## Patterns to Avoid

- Don't use `getServerSession` — this is NextAuth v5, use `auth()` from `@/lib/auth`.
- Don't create API routes for CRUD — use Server Actions.
- Don't use `any` type. The Prisma client provides full types.
- Don't store dates as strings. Use Prisma `DateTime` / `Date`.
- Don't put Prisma queries in `"use client"` components.
- Don't modify tables outside the `health_hub` schema.
- Don't overwrite manually entered data with Garmin sync values.

## Key Types

- Mood/Sleep: `Int` 1=bad, 2=ok, 3=good (not strings, not 0-based)
- Alcohol: `Int` drink count, `null` = not logged, `0` = zero drinks
- Exercise time: stored in seconds, display as HH:MM:SS
- Sex activity: `String` enum — "Partner", "Solo", "Variant", "None", "Period"
