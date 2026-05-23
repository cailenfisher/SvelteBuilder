# SuperPrototype Template

Files in this directory are layered on top of `templates/base/` when the user
selects the SuperPrototype scaffold. Files here overwrite their base counterparts.

## What this template adds
- Supabase client setup (`src/lib/server/supabase.ts`)
- Full Supabase Auth wiring in `src/hooks.server.ts`
- Supabase-specific `app.d.ts` locals
- `.env.example` with Supabase environment variables
- `supabase/config.toml` initial configuration
- `@supabase/ssr` and `@supabase/supabase-js` dependencies
- All API routes and layout server load (`src/routes/`) — these call the database
  via `locals.supabase` and are therefore Supabase-specific

## What stays in base
- Locale resolution logic in `hooks.server.ts` (cookie/header fallback, no DB)
- `PUBLIC_DEFAULT_LOCALE` in `.env.example`
- All schema files (`supabase/schemas/`)
- `LocaleSwitcher` and app shell (`+layout.svelte`, `+page.svelte`, `+error.svelte`)
- `app.d.ts` base locals (`locale`, `defaultLocale` only)
