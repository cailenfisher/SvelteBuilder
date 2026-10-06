# SvelteBuilder — SuperPrototype

A SvelteKit app scaffolded by [SvelteBuilder](https://github.com/cailenfisher/SvelteBuilder), using
Supabase for both Postgres and Auth.

For a full walkthrough (sign-in setup, renaming the app, branding, and prototyping with Claude
Code), see the
[SuperPrototype setup guide](https://github.com/cailenfisher/SvelteBuilder/blob/main/docs/superprototype-setup.md).

## Local development

Requires [Docker](https://docs.docker.com/get-docker/) (the Supabase CLI runs Postgres, Auth,
Storage, and Studio as containers).

```bash
cp .env.example .env
pnpm install                       # if the create step's install did not run
pnpm sveltebuilder sync:supabase   # generates supabase/migrations from the Drizzle schema
pnpm db:start                      # supabase start — the first run pulls several GB of images
```

`db:start` prints the local API URL and keys. To get them already mapped to this project's `.env`
names, run:

```bash
pnpm supabase status -o env \
  --override-name api.url=PUBLIC_SUPABASE_URL \
  --override-name auth.publishable_key=PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

and copy the two matching lines into `.env`. There is no `DATABASE_URL`: this app never opens a
direct Postgres connection, which is what keeps RLS in force on every query (see
[CLAUDE.md](./CLAUDE.md)).

```bash
pnpm db:reset                      # applies supabase/migrations + supabase/seed.sql
pnpm dev
```

Studio (a local admin UI for the database itself) is at `http://127.0.0.1:54323`.

## Sign-in

Everything under `/admin` requires being signed in, and the only sign-in method is Google OAuth.
There is no local bypass. To set it up locally:

1. Create an OAuth client in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   (an existing one works too) and add `http://127.0.0.1:54321/auth/v1/callback` to its authorized
   redirect URIs. That is Supabase's callback, not this app's: Google only talks to Supabase.
2. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`.
3. Set `enabled = true` under `[auth.external.google]` in `supabase/config.toml`.
4. `pnpm db:stop && pnpm db:start` (config changes are only read at start).

Without it, the public route (`/`) and the read-only `/api/locale` and `/api/local-text/*`
endpoints still work. Only the admin section is gated.

### Administrators

The first person ever to sign in is provisioned with `user_account.admin = true` automatically,
by the `ensure_user_account()` function in `supabase/supplemental/00-auth-functions.sql`, called
from `src/lib/server/auth-resolver.ts`. Sign in yourself before anyone else does. Locally,
`pnpm db:reset` empties the table, and the next sign-in becomes the administrator again.

There is no invite UI. To promote or demote someone after that:

- **From the app**, call the `admin_set_user_admin(p_user_account_id, p_admin)` RPC through
  `locals.supabase.rpc(...)` as a signed-in administrator. It checks the caller is an admin and
  refuses to demote the last one.
- **As an operator**, run SQL in Studio or the Supabase dashboard's SQL editor, which runs with
  full privileges. The person must have signed in once so their row exists:

  ```sql
  update public.user_account set admin = true
  where auth_user_id = (select id from auth.users where email = 'colleague@example.com');
  ```

Request roles (`anon`, `authenticated`) have no write privilege on `user_account` at all; see
`supabase/supplemental/05-user-account-hardening.sql` for why. Do not add an update policy to
that table.

## Changing the schema

When you change `src/lib/server/schema.ts`, a module's schema, anything in `supabase/supplemental/`
or anything in `supabase/seeds/`:

```bash
pnpm sveltebuilder sync:supabase   # regenerate migrations and seed.sql
pnpm db:reset                      # rebuild the local database
pnpm check                         # svelte-check: catch routes that no longer match the schema
```

Never edit `supabase/migrations/*` or `supabase/seed.sql` by hand. Both are generated.

## Deploying to a hosted Supabase project

```bash
pnpm supabase link --project-ref <project-ref>
pnpm supabase db push --include-seed
```

Then:

- Set `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `PUBLIC_DEFAULT_LOCALE` and
  `PUBLIC_SITE_URL` in your deployment environment. They are compiled in, so they must be
  available at **build** time. The URL and key are under Project Settings > API Keys.
- Enable Google under Authentication > Sign In / Providers, with
  `https://<project-ref>.supabase.co/auth/v1/callback` as the redirect URI in your Google client.
- Under Authentication > URL Configuration, set the Site URL to your app's origin and add
  `https://<your-domain>/**` to Redirect URLs.

## Everything else

See [CLAUDE.md](./CLAUDE.md) for the data-access rules, RLS and auth patterns, the i18n
architecture, schema rules, and naming conventions this project follows. Claude Code reads it
automatically.
