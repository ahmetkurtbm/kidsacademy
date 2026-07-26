# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # start dev server (Turbopack, port 3000 by default)
npm run build             # production build
npm run lint               # eslint . (flat config, eslint.config.mjs)
npm test                    # vitest run — all tests, once
npx vitest run lib/auth.test.ts        # run a single test file
npx vitest run -t "returns null"       # run tests matching a name pattern
npx tsc --noEmit -p tsconfig.json      # type-check only
```

There is no `next lint` — Next 16 removed it, so linting goes through `eslint .` directly (see `eslint.config.mjs`, built on `eslint-config-next/core-web-vitals`).

## Architecture

**Stack**: Next.js 16 (App Router) + React 19 + TypeScript + Supabase (Postgres + Storage). No ORM, no CSS framework — styling is a set of plain `.css` files imported globally in `app/layout.tsx`. `next.config.ts` sets `images: { unoptimized: true }`, which is why the app uses plain `<img>` instead of `next/image` throughout (deliberate, not an oversight).

**All Supabase access is server-only, via the service role.** `lib/supabase.ts`'s `getSupabaseAdmin()` is the *only* way any code talks to the database. Every table has RLS enabled with `revoke all ... from anon, authenticated` (see `supabase/schema.sql`), so the browser can never reach Supabase directly — everything goes through Next.js API routes or server components. Keep new data access on this same path.

**Auth is hand-rolled, not a library.** `lib/auth.ts` implements HMAC-SHA256-signed, base64url cookie sessions (`createSession`/`readSession`) and scrypt password hashing (`hashPassword`/`verifyPassword`) — no NextAuth/Clerk/etc. There are two independent roles, not a unified user table:
- **admin**: one shared password from the `ADMIN_PASSWORD` env var, session cookie `ka_admin`. Every `app/api/admin/**` route re-checks this via a local `authorized()` helper reading the cookie.
- **parent**: per-row credentials in `parent_accounts` (slug + scrypt-hashed password), session cookie `ka_parent`, scoped to that one parent's data only.

**Login rate limiting is DB-backed, not in-memory** (`lib/rate-limit.ts`, table `login_attempts`) — deliberately, because the app targets serverless/Vercel deployment where in-memory counters don't persist across function instances. `checkRateLimit`/`recordAttempt` degrade silently (no-op) if the table doesn't exist yet, so a pending migration never breaks login.

**Migrations are not auto-applied.** `supabase/schema.sql` is the canonical "fresh database" schema; `supabase/migrations/*.sql` are incremental changes for existing databases. There is no Supabase CLI wiring or migration runner in this repo — every migration file has to be run manually in the Supabase SQL Editor. When adding a column/table, update both the new migration file *and* `supabase/schema.sql` to keep them in sync, and prefer making API routes tolerate the migration not having been applied yet (see the `phoneSetupRequired`/`contentSetupRequired` fallback pattern in `app/api/admin/data/route.ts`) rather than hard-failing the whole endpoint.

**Admin panel** (`app/admin/`): `page.tsx` is a client-component orchestrator holding all state and fetch handlers; it renders presentational sections from `app/admin/components/*` (`AnnouncementsSection`, `EventsSection`, `ExamSection`, `ParentsSection`, `Overview`, `AdminLogin`), with shared types/constants in `app/admin/types.ts`. Parent accounts and exams share one route file, `app/api/admin/data/route.ts` (GET/POST/PATCH/DELETE dispatch on a `type` field in the body); events and announcements are separate route files because they handle multipart file uploads to Supabase Storage.

**Parent portal**: `app/veli/[slug]/page.tsx` is a thin server wrapper; `parent-results.tsx` is the client component that fetches `/api/veli/results?slug=...` and renders score history, per-subject breakdowns (both latest-exam and all-time aggregated), and a hand-drawn SVG progress chart (no charting library).

**Testing**: Vitest, config in `vitest.config.ts` (aliases `@/*` to repo root, matching `tsconfig.json`). Tests are colocated as `*.test.ts` next to the source they cover. Route handler tests mock `next/headers` (cookies) and `@/lib/supabase` (`getSupabaseAdmin`); `test/fakeSupabase.ts` has the shared fake Supabase query-builder used to simulate `.select().eq().gte()` chains and inserts/updates without hitting a real database.

**CI** (`.github/workflows/ci.yml`): lint → test → build on push/PR to `main`. `npm run build` must succeed even with no Supabase env vars set (the home page's data fetches swallow errors and render empty state), so don't introduce a build-time dependency on secrets being present.

## Environment variables

Documented with placeholders in `.env.example`: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `SESSION_SECRET` (≥24 chars), `NEXT_PUBLIC_SITE_URL` (used by `app/sitemap.ts`, `app/robots.ts`, and Open Graph metadata in `app/layout.tsx`).
