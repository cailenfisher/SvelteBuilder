---
"create-sveltebuilder": minor
---

Scaffold SuperPrototype as a Supabase-native application, and gate the two options that no longer
work with it.

**SuperPrototype's data layer is now PostgREST.** Every admin route, API endpoint, and auth guard in
the generated project queries through `event.locals.supabase` — a per-request `@supabase/ssr` client
built from the request's own cookies — instead of a Drizzle handle over a direct Postgres connection.
The generated project no longer contains `src/lib/server/db/client.ts`, `with-user.ts`, or a
`DATABASE_URL`.

This is a correctness fix, not a preference. A direct connection runs as a role that owns the tables,
and Postgres skips row-level security entirely for table owners — so every RLS policy the scaffold
shipped was silently inert. Going through PostgREST means the user's JWT reaches Postgres and policies
apply to every query without the application arranging anything.

Alongside it: `getClaims()` for route guards (verifying the token against cached JWKS rather than
calling the Auth server), the publishable key in place of the legacy anon key, `SECURITY INVOKER` RPCs
for writes that span more than one statement, and `ensure_user_account()` provisioning the domain
principal in SQL so the first-user-is-admin check cannot run under RLS and grant admin to everyone.

**Two options are gated in the interactive CLI, and both say so when selected rather than scaffolding
something broken:**

- The **Native** template is on hold. Its `withUser` + Drizzle pattern is what SuperPrototype moved
  away from, and its RLS enforcement has the same table-owner defect.
- The **Logistic** module is on hold. Its route templates call `locals.db.withUser()`, the handle
  SuperPrototype dropped, so scaffolding them produced a project that did not typecheck. The
  underlying design question — how domain modules should deliver route code across templates — is
  explored in `docs/MODULE-ROUTES.md`.

Content and coreui are unaffected.
