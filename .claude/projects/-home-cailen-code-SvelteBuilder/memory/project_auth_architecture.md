---
name: project-auth-architecture
description: Auth architecture — principal/identity split, withUser pattern, current_user_id() RLS, Native vs SuperPrototype seam
metadata:
  type: project
---

**Decided 2026-06-12:** Unified auth contract across both scaffold templates.

**Principal–identity split:** `public.user_account` (bigint PK) is the domain principal. `auth.user` (text PK) is the provider identity. Linked via `user_account.auth_user_id text`. No email/name/image on `user_account`.

**Admin role:** `user_account.admin boolean not null default false`. RLS admin check: `exists (select 1 from public.user_account where id = public.current_user_id() and admin)`. No JWT claims.

**current_user_id() function:** STABLE SQL function reading `current_setting('app.current_user_id', true)::bigint`. STABLE = evaluated once per transaction, not per row. All RLS policies use this instead of `auth.uid()` or `auth.jwt()`.

**withUser wrapper:** `event.locals.db.withUser(fn)` opens a transaction, calls `set_config('app.current_user_id', ...)`, runs fn, commits. Raw `db` (in `db/client.ts`) NOT for route code — only auth-resolver.ts (bootstrap), hooks.server.ts (locale, public), and migrations.

**Template seam:** `src/lib/server/auth-resolver.ts` — returns `bigint | null`. Only line that differs between templates. SuperPrototype uses `event.locals.supabase.auth.getUser()`. Native uses `event.locals.auth()` (Auth.js v5).

**Native template:** Auth.js (`@auth/sveltekit`) with Drizzle adapter. Tables in `auth` schema (pgSchema('auth')). Providers: Entra, Google, GitHub. `events.createUser` provisions `user_account`. Located at `tools/create/templates/native/`.

**SuperPrototype:** Still Supabase Auth for OAuth, but now uses Drizzle + withUser for all data queries. Supabase client remains on locals for sign-in/out/callback routes only.

**Why:** Why: Removes PostgREST dependency for data queries, enables clean auth provider swap at a single seam, aligns both templates on the same hook/DB shape.

**How to apply:** When writing new routes in either template, always use `event.locals.db.withUser(...)`. When touching auth, check which template you're in and use the appropriate provider pattern.
