# SuperPrototype Setup Guide

This guide takes a freshly scaffolded SuperPrototype project from `pnpm create sveltebuilder` to
an app with your name, your branding, working sign-in, and a fast loop for building your own
features. It expands on the [quick start](../README.md) in the main README.

SuperPrototype is built the Supabase way: Postgres reached only through the Supabase Data API,
Supabase Auth for sign-in, and the Supabase CLI for migrations and local development. If you
intend to stay on Supabase, that is the point; if you need a portable data layer, this is not the
template for you yet.

**Contents**

1. [Prerequisites](#1-prerequisites)
2. [Create the project](#2-create-the-project)
3. [What you got](#3-what-you-got)
4. [Connect a database](#4-connect-a-database)
5. [Set up sign-in (Google OAuth)](#5-set-up-sign-in-google-oauth)
6. [Your first sign-in and the admin area](#6-your-first-sign-in-and-the-admin-area)
7. [Rename your app](#7-rename-your-app)
8. [Match the design system to your brand](#8-match-the-design-system-to-your-brand)
9. [Prototype quickly with the shipped CLAUDE.md](#9-prototype-quickly-with-the-shipped-claudemd)
10. [The schema change loop](#10-the-schema-change-loop)
11. [Deploy](#11-deploy)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Prerequisites

- **Node.js 20+** and a package manager. The examples use `pnpm`; `npm` and `yarn` work too.
- **A Google Cloud account**, for the OAuth client behind sign-in. Google is currently the only
  sign-in method.
- **One of:**
  - a **hosted Supabase project** ([supabase.com](https://supabase.com)), or
  - **[Docker](https://docs.docker.com/get-docker/)**, to run Supabase locally. The first
    `db:start` pulls several GB of images.

You do not need to install the Supabase CLI globally. The scaffold installs it as a dev
dependency, so `pnpm supabase …` and the `db:*` scripts use the project's copy.

---

## 2. Create the project

```sh
pnpm create sveltebuilder@latest my-app
```

The CLI asks for:

| Prompt          | What to choose                                                                                                                                                                                     |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project name    | Lowercase letters, numbers, `-`, `_`, `.`. It becomes the directory, the `package.json` name, and the `project_id` that namespaces your local Supabase containers.                               |
| Scaffold template | **SuperPrototype**. Native is on hold and cannot be selected.                                                                                                                                  |
| Package manager | Whichever you use. It is used for the install step.                                                                                                                                                |
| Domain modules  | Optional. `content` (publisher/news) and `logistic` (warehouse operations). Each adds its schema, row level security policies, seed data and components. Choose none for a blank app.              |
| Screens         | Only shown if you picked a module. Each screen bundle is a complete feature (list, detail, shared layout). Bundles that link to each other are pulled in together, so you never get a dead link. |

**Choose modules now.** Adding a module to an existing project (`sveltebuilder add <module>`) is
planned but not built yet. Screens you scaffold are copied into `src/routes/` and belong to your
app from then on, so take the ones you might want; deleting a screen later is easy.

Every prompt can be answered by a flag instead, which makes the run non-interactive:

```sh
pnpm create sveltebuilder@latest my-app \
  --template superprototype --pm pnpm \
  --modules logistic --screens all
```

`--modules none` and `--screens none` are valid. `--screens` also takes a comma list of
`<module>:<screen-id>` keys, for example `logistic:supplier,logistic:stock`.

After copying files the CLI installs dependencies and runs `sveltebuilder sync:supabase`, which
writes your first migration to `supabase/migrations/` and your seed to `supabase/seed.sql`. If
either step fails (usually the install, offline), run them yourself:

```sh
cd my-app
pnpm install
pnpm sveltebuilder sync:supabase
```

Then create your environment file:

```sh
cp .env.example .env
```

---

## 3. What you got

```
my-app/
├── CLAUDE.md                     context file for Claude Code (section 9)
├── .env.example                  every variable the app reads, with comments
├── .sveltebuilder/registry/      which Drizzle schemas make up your database
├── src/
│   ├── app.css                   design tokens and the CSS layer order (section 8)
│   ├── chrome.css                structural styles for buttons, inputs, cards
│   ├── hooks.server.ts           Supabase client, session, locale resolution
│   ├── lib/server/
│   │   ├── schema.ts             your tables, as Drizzle definitions
│   │   ├── auth-resolver.ts      session → user_account.id
│   │   └── supabase.ts           per-request Supabase client
│   └── routes/
│       ├── +layout.svelte        app shell: header, footer, dictionary, toasts
│       ├── +page.svelte          the home page
│       ├── sign-in/, sign-out/, auth/callback/
│       ├── (admin)/admin/        dashboard, locales, localized copy, navigation
│       └── api/                  /api/locale and /api/local-text
└── supabase/
    ├── config.toml               local Supabase configuration
    ├── migrations/               generated; do not edit by hand
    ├── supplemental/             SQL Drizzle cannot express: RLS, functions, RPCs
    ├── seeds/                    extra seed files, appended to seed.sql in name order
    └── seed.sql                  generated; do not edit by hand
```

Three ideas run through everything:

- **No direct database connection.** Every query goes through `event.locals.supabase`, a
  per-request client carrying the visitor's session. Postgres row level security (RLS) applies
  to every query automatically. There is no `DATABASE_URL`, and there should never be one: a
  direct connection runs as the table owner and skips RLS entirely.
- **Copy lives in the database, in every locale.** There are no `name` or `title` columns. User
  facing text is stored in `local_text`, keyed by a slug, and read through a dictionary. The
  app ships with 8 locales and English and French copy.
- **The schema is TypeScript; the SQL is generated.** You edit `src/lib/server/schema.ts` and
  `supabase/supplemental/*.sql`, then run `sveltebuilder sync:supabase`.

---

## 4. Connect a database

Pick one. You can switch later; nothing in the code depends on which you choose.

### Option A: hosted Supabase

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard). Note the
   **project ref**, the subdomain in `https://<project-ref>.supabase.co`.
2. Under **Project Settings → API Keys**, copy the project URL and the **publishable key**
   (`sb_publishable_…`) into `.env`:

   ```sh
   PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

   The publishable key is meant to be public; RLS is what protects your data. Do not put the
   secret or service-role key in this app's environment. Nothing in the scaffold uses it.

3. Link the project and push the schema and seed:

   ```sh
   pnpm supabase login          # first time only
   pnpm supabase link --project-ref <project-ref>
   pnpm supabase db push --include-seed
   ```

4. Start the app:

   ```sh
   pnpm dev
   ```

   `http://localhost:5173` should show "SvelteBuilder App". The language switcher in the header
   should list 8 locales.

### Option B: local Supabase in Docker

1. Start the stack:

   ```sh
   pnpm db:start
   ```

   It prints the local API URL and keys. To get them already named for `.env`:

   ```sh
   pnpm supabase status -o env \
     --override-name api.url=PUBLIC_SUPABASE_URL \
     --override-name auth.publishable_key=PUBLIC_SUPABASE_PUBLISHABLE_KEY
   ```

   Copy those two lines into `.env`.

2. Apply the migration and seed, then start the app:

   ```sh
   pnpm db:reset
   pnpm dev
   ```

Useful local addresses:

| Service           | URL                       |
| ----------------- | ------------------------- |
| Your app          | http://localhost:5173     |
| Supabase API      | http://127.0.0.1:54321    |
| Studio (DB admin) | http://127.0.0.1:54323    |
| Mail catcher      | http://127.0.0.1:54324    |

`pnpm db:stop` stops the containers and keeps the data. `pnpm db:reset` wipes the database and
reapplies every migration and the seed. Treat local data as disposable.

### The other variables

| Variable                | Default                 | Notes                                                                                                                   |
| ----------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `PUBLIC_DEFAULT_LOCALE` | `en`                    | Used when neither the visitor's `locale` cookie nor their browser language matches a seeded locale.                    |
| `PUBLIC_SITE_URL`       | `http://localhost:5173` | Where Supabase sends people back to after Google sign-in. Must be the origin the app is actually served from.         |
| `GOOGLE_CLIENT_ID`      | empty                   | Local Supabase only (section 5). On hosted Supabase the credentials live in the dashboard instead.                      |
| `GOOGLE_CLIENT_SECRET`  | empty                   | As above.                                                                                                               |

All `PUBLIC_*` values are read through `$env/static/public`, so they are fixed **at build
time**. Changing one means restarting `pnpm dev` or rebuilding.

---

## 5. Set up sign-in (Google OAuth)

Without sign-in, the public home page and the read-only `/api/*` endpoints work, but everything
under `/admin` redirects to `/sign-in`. There is no local bypass.

The flow, so the configuration makes sense:

```
/sign-in  ──►  Google  ──►  Supabase Auth (/auth/v1/callback)  ──►  your app (/auth/callback)  ──►  /admin/dashboard
```

Google only ever talks to **Supabase**, so Google's redirect URI is Supabase's callback, not
your app's. Supabase then sends the visitor to `PUBLIC_SITE_URL/auth/callback`, which must be on
Supabase's list of allowed redirect URLs.

### 5.1 Create the Google OAuth client

In [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

1. Create or select a project.
2. Configure the **OAuth consent screen** (Google Auth Platform → Branding/Audience). An
   **External** app in **Testing** status is fine while you build; add your own Google account
   as a test user. Publish it before real users sign in.
3. **Credentials → Create credentials → OAuth client ID → Web application.**
4. Under **Authorized redirect URIs**, add the Supabase callback for every environment that will
   use this client:

   | Environment    | Redirect URI                                     |
   | -------------- | ------------------------------------------------ |
   | Local Supabase | `http://127.0.0.1:54321/auth/v1/callback`        |
   | Hosted         | `https://<project-ref>.supabase.co/auth/v1/callback` |

   You can use one client for both, or a separate client per environment.

5. Copy the **client ID** and **client secret**.

### 5.2a Hosted Supabase

1. **Authentication → Sign In / Providers → Google**: enable it and paste the client ID and
   secret.
2. **Authentication → URL Configuration**:
   - **Site URL**: your app's main URL (`http://localhost:5173` while developing, your real
     domain once deployed).
   - **Redirect URLs**: add every origin the app runs on, with a wildcard so the
     `/auth/callback` path is allowed, for example `http://localhost:5173/**` and
     `https://app.example.com/**`.
3. Set `PUBLIC_SITE_URL` in `.env` to match where you are running the app.

### 5.2b Local Supabase

1. Set the credentials in `.env`:

   ```sh
   GOOGLE_CLIENT_ID=...apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=...
   ```

2. In `supabase/config.toml`, enable the provider:

   ```toml
   [auth.external.google]
   enabled = true
   client_id = "env(GOOGLE_CLIENT_ID)"
   secret = "env(GOOGLE_CLIENT_SECRET)"
   ```

3. Check the `[auth]` block. `site_url` and `additional_redirect_urls` should cover the URL in
   `PUBLIC_SITE_URL`. If you serve the app from a different host or port, update both.
4. Restart the stack; config changes are only read at start:

   ```sh
   pnpm db:stop && pnpm db:start
   ```

---

## 6. Your first sign-in and the admin area

Go to `/sign-in` and sign in with Google.

**The first account ever to sign in becomes the administrator.** On every sign-in, the
`ensure_user_account()` database function creates a `user_account` row for that identity if
it does not have one yet. When the table is empty, the new row gets `admin = true`. Everyone
after that is a regular user. So:

- Sign in yourself before you share the URL with anyone.
- On local Supabase, `pnpm db:reset` empties the table, and the next person to sign in becomes
  the administrator again.

Everyone who completes Google sign-in gets a `user_account` row. Only administrators can open
`/admin`; anyone else gets a 403. If your app should not accept sign-ups from arbitrary Google
accounts, restrict that in Supabase Auth or keep the Google consent screen in Testing with an
allow-list of test users.

The admin area has four screens:

| Screen          | Path                     | What it is for                                                                                       |
| --------------- | ------------------------ | ---------------------------------------------------------------------------------------------------- |
| Dashboard       | `/admin/dashboard`       | Landing page after sign-in.                                                                          |
| Localized copy  | `/admin/local-text`      | Every piece of UI text, in every locale. Edit copy here without a deploy.                            |
| Locales         | `/admin/locale`          | Add, edit, or remove the languages the app offers.                                                    |
| Navigation      | `/admin/navigation-item` | The admin menu entries, their order, and their labels.                                               |

Module screens you selected live under `/admin/<module>/` (for example `/admin/logistic`). They
do not add themselves to the admin menu; add entries for the ones you want at
`/admin/navigation-item`.

### Adding more administrators

There is no invite UI yet. Two options:

- **As an operator, in the Supabase SQL editor** (Studio locally, or the dashboard), which runs
  with full privileges:

  ```sql
  update public.user_account set admin = true
  where auth_user_id = (select id from auth.users where email = 'colleague@example.com');
  ```

  They must have signed in once first, so their row exists.

- **From application code**, call the `admin_set_user_admin(p_user_account_id, p_admin)` RPC
  through `locals.supabase.rpc(...)` while signed in as an administrator. It checks the caller is
  an admin and refuses to remove the last one. This is the only route the app itself has for
  changing the flag; regular users cannot write to `user_account` at all.

---

## 7. Rename your app

The name "SvelteBuilder App" appears in a few places, and they are not all the same kind of
thing.

### 7.1 The display name (what visitors see)

The header, the footer, the browser tab title, and the home page heading all read the `app.name`
slug from the dictionary. The home page subtitle is `app.tagline`. Because they are database
copy, they exist once per locale.

**Quick change:** sign in, open `/admin/local-text`, find `app.name` and `app.tagline`, and edit
the text for each locale. This takes effect immediately and needs no deploy.

**Durable change:** edits made in the admin UI live only in that database. `pnpm db:reset`
reseeds the defaults, and a new environment starts with them too. To make your name the seeded
default, add a seed file that runs after the base seed and overwrites it:

```sql
-- supabase/seeds/10-app-identity.sql
insert into public.local_text (link, locale, content)
select l.id, (select id from public.locale where code = v.locale_code), v.content
from (values
  ('app.name',    'en', 'Acme Freight'),
  ('app.name',    'fr', 'Acme Fret'),
  ('app.tagline', 'en', 'Every pallet, accounted for'),
  ('app.tagline', 'fr', 'Chaque palette, comptabilisée')
) as v(slug, locale_code, content)
join public.local_text_link l
  on l.slug = v.slug and l.scope is null and l.entity_id is null
on conflict (link, locale) do update set content = excluded.content;
```

Then regenerate and apply the seed:

```sh
pnpm sveltebuilder sync:supabase
pnpm db:reset                              # local
pnpm supabase db push --include-seed       # hosted
```

Notes:

- Files in `supabase/seeds/` are appended to `seed.sql` in name order, after the generated base
  seed, so a `10-` prefix runs after everything the scaffold ships. Never edit `seed.sql`
  itself; `sync:supabase` regenerates it.
- The base seed uses `do nothing` on conflict so it never clobbers anything. This file uses
  `do update` on purpose, because overwriting the default is the point. Be aware that it also
  overwrites any admin-UI edits to these slugs whenever the seed runs.
- Locales without a translation fall back to the default locale's copy. Provide at least `en`
  and `fr`, matching the rest of the seed.

### 7.2 The package and project identifiers

These are developer-facing and only need changing if you want the identifier itself to change:

| Where                                | What                                                                                                                    |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `package.json` → `name`              | Set from the project name at scaffold time.                                                                            |
| `supabase/config.toml` → `project_id` | Names your local Docker containers. Changing it starts a fresh, empty local stack under the new name; stop the old one first (`pnpm db:stop`). |
| The project directory                | Rename freely; nothing references it.                                                                                   |

### 7.3 Things that are not wired up yet

- **Favicon.** `src/app.html` references `favicon.png`, but the scaffold does not ship a
  `static/` directory. Create `static/favicon.png` (and any other icons you want) yourself.
- **Sign-in page copy** comes from the `user.sign_in`, `user.sign_in.subtitle` and
  `user.sign_in_with_google` slugs. Edit them like `app.name` if you want different wording.
- **Meta description and social tags** are not set by the scaffold. Add them in
  `src/routes/+layout.svelte`'s `<svelte:head>`, reading from the dictionary so they are
  localized.

---

## 8. Match the design system to your brand

### 8.1 How styling is organised

`src/app.css` is the integration point. It declares a fixed layer order and imports each style
source into its layer:

```css
@layer reset, tokens, base, chrome, components, utilities;

@import '@sveltebuilder/coreui/styles/tokens.css';
@import '@sveltebuilder/coreui/styles/base.css' layer(base);
@import './chrome.css' layer(chrome);
@import '@sveltebuilder/coreui/styles/components.css' layer(components);
```

Anything you write **after the imports, outside a layer**, beats every layered rule regardless
of selector specificity. That is the override mechanism: no `!important`, no specificity fights.

You will touch, from most to least common:

| You want to change...                                 | Edit                                                                      |
| ----------------------------------------------------- | ------------------------------------------------------------------------- |
| Brand color, neutrals, status colors, font, radius    | The `:root` token block in `src/app.css`                                  |
| A specific component's look                           | Unlayered rules at the bottom of `src/app.css`                            |
| The base structure of `.btn`, `.input`, `.card`, etc. | `src/chrome.css` (it is yours, not a package file)                        |
| The app shell: header, footer, page padding           | `src/routes/+layout.svelte`                                               |

### 8.2 The tokens

The public theming surface is 11 custom properties. Everything else (surfaces, borders, text
shades, hover and active states, tinted backgrounds) is derived from these with `color-mix()`,
so changing one value recolors the whole app consistently.

| Token              | Default                               | Controls                                                                                         |
| ------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `--brand`          | `#2563eb`                             | Primary buttons, links, focus accents, selected states. Hover, active and soft tints derive from it. |
| `--chrome`         | `#e2e8f0`                             | The single neutral for borders, raised surfaces and text shades in light mode.                   |
| `--danger`         | `#dc2626`                             | Errors and destructive actions.                                                                  |
| `--warning`        | `#d97706`                             | Caution.                                                                                         |
| `--success`        | `#16a34a`                             | Confirmation.                                                                                    |
| `--info`           | `#0284c7`                             | Informational messages.                                                                          |
| `--font`           | `system-ui, -apple-system, sans-serif` | All UI text.                                                                                    |
| `--font-mono`      | `ui-monospace, monospace`             | Codes, IDs, reference values.                                                                    |
| `--font-size-base` | `1rem`                                | Root size. The type and spacing scale is in `rem`, so this scales the whole UI's density.        |
| `--leading-base`   | `1.5`                                 | Root line height.                                                                                |
| `--radius`         | `6px`                                 | Corner radius for every component.                                                               |

The scaffold already overrides some of these in `src/app.css` (a light blue `--brand` and
brighter status colors). Replace that block with your own:

```css
/* ---- Token overrides ---- */
:root {
  --brand:  #0f5a9c;
  --chrome: #dde3ec;

  --danger:  #b42318;
  --warning: #b54708;
  --success: #067647;
  --info:    #175cd3;

  --font: 'Inter', system-ui, sans-serif;
  --radius: 4px;
}
```

Don't override the derived tokens (`--brand-hover`, `--surface-raised`, `--text-soft`, ...).
They are internal to coreui and can change between releases. If you cannot get the look you need
from the 11 tokens, write an unlayered rule for that component (8.4) instead.

### 8.3 Fonts

The scaffold loads no web fonts. To use one:

- **Hosted (for example Google Fonts):** add the `<link>` tags inside `<head>` in `src/app.html`,
  then set `--font`.
- **Self-hosted:** put the font files in `static/fonts/`, declare them with `@font-face` at the
  top of `src/app.css` (after the `@layer`/`@import` lines), then set `--font`.

### 8.4 Overriding a specific component

coreui components use plain class names (`.btn`, `.btn.primary`, `.card`, `.alert`, ...) and
target Bits UI state through data attributes (`[data-state='open']`, `[data-highlighted]`,
`[data-disabled]`), never toggled classes. Write unlayered rules against those:

```css
/* bottom of src/app.css — unlayered, so it wins */
.btn {
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.btn.primary {
  box-shadow: 0 1px 0 rgb(0 0 0 / 0.15);
}

.accordion-trigger[data-state='open'] {
  background: var(--brand-soft);
}
```

Reading the internal tokens (`var(--brand-soft)`, `var(--text-soft)`) inside your own rules is
fine; it is overriding them that is unsupported. To find a component's classes, look in
`node_modules/@sveltebuilder/coreui/styles/components.css`.

### 8.5 Dark mode

Dark mode follows the visitor's system setting with no work from you. In dark mode, surfaces,
borders and text switch to a fixed slate palette, and your `--brand` and status colors are
re-tinted to suit it. `--chrome` has no effect in dark mode.

To give people a manual switch, set `data-color-scheme` on `<html>`:

```ts
document.documentElement.setAttribute('data-color-scheme', 'dark');  // force dark
document.documentElement.setAttribute('data-color-scheme', 'light'); // force light
document.documentElement.removeAttribute('data-color-scheme');       // follow the system
```

Persist the choice (a cookie lets the server render the right scheme on first paint, with no
flash) and apply it in the root layout.

### 8.6 Contrast is your responsibility once you change colors

The default token values are chosen to meet WCAG AA contrast. Your brand colors may not. Check at
least: white text on `--brand` (primary buttons), `--brand` as link text on white, and each
status color as text on white. For a light brand color (yellow, light blue), you may need a
darker `--brand` than your marketing palette and a separate accent elsewhere.

### 8.7 Per-tenant or runtime branding

If brand colors come from the database (a white-label app), load them in
`src/routes/+layout.server.ts` and emit them in `+layout.svelte`:

```svelte
<svelte:head>
  {@html `<style>:root { --brand: ${data.brand}; }</style>`}
</svelte:head>
```

Validate the value server-side (for example, accept only `#rrggbb`) before it reaches the page;
it is being written into a `<style>` element.

---

## 9. Prototype quickly with the shipped CLAUDE.md

Your project root contains a `CLAUDE.md`. [Claude Code](https://claude.com/claude-code) reads it
automatically at the start of every session in the project, so every request you make is
answered with SvelteBuilder's rules already in mind.

### 9.1 What it already teaches Claude

- **The i18n model**: no `name`/`title`/`label`/`description` columns, copy linked by slug, scope
  and entity ID; the dictionary created once in the root layout and never inside `$effect`.
- **The component split**: application UI (`Button`, layout chrome) takes plain strings;
  entity components (`ProductCard`) resolve their own copy from the dictionary.
- **Naming conventions** from SQL to CSS: singular tables, no abbreviations, no `is`/`has`
  prefixes on booleans.
- **Use coreui first**, before building a new component.
- **WCAG 2.2 AA** expectations for generated markup.
- **Ready-made prompt patterns** for adding an entity, a route, a component, or dictionary
  entries.
- **A review checklist** of the mistakes to flag in generated code.

### 9.2 Add your project's own section first

The shipped file describes SvelteBuilder in general. It does not know what you are building,
and it says little about the Supabase specifics of this template. Spend ten minutes adding a
section at the top. It pays for itself in the first session.

Describe the product:

```markdown
## This Project

Acme Freight is an internal tool for dispatchers at a regional trucking company. Users are
dispatchers (create and assign loads), drivers (see and update their own loads on a phone), and
admins. English and French at launch; Spanish next.

Core entities: load, stop, driver, vehicle, customer. A load has an ordered list of stops. A
driver has at most one active load.

v1 excludes: invoicing, route optimisation, ELD integration.
```

And state the data-access rules the generic file leaves out:

```markdown
## Data Access (SuperPrototype)

- All database access goes through `event.locals.supabase` in `+page.server.ts`,
  `+layout.server.ts` or `+server.ts`. Never open a direct Postgres connection, never add a
  DATABASE_URL, never import `drizzle-orm` at runtime. Drizzle is only the schema source.
- Tables are defined in `src/lib/server/schema.ts`. New primary keys are
  `integer generated always as identity`, and foreign keys are `<table>_id`.
- Every new table gets RLS enabled and explicit policies in a new
  `supabase/supplemental/NN-<name>.sql`. Policies call `(select public.current_user_id())` and
  `(select public.current_user_admin())`, never `auth.uid()` directly, and always name their
  role with `to`.
- A write that spans more than one statement goes in a SECURITY INVOKER Postgres function called
  with `.rpc()`, so it is atomic and RLS still applies.
- Never grant `anon` or `authenticated` UPDATE on `user_account`.
- Every new slug is seeded in `supabase/seeds/` with `en` and `fr` copy.
- After schema or SQL changes: `pnpm sveltebuilder sync:supabase`, then `pnpm db:reset`, then
  `pnpm check`.
```

`CLAUDE.md` is a normal file in your repo. Edit it as your project's conventions grow, and commit
it so everyone on the team, and every session, gets the same context.

### 9.3 A prototyping loop that works

Work in vertical slices, one entity or feature at a time, and let each slice reach the database
before you start the next. A typical first request:

> Read CLAUDE.md. Add a `load` entity: a reference number, a status (draft, assigned, in transit,
> delivered), an optional assigned driver, and timestamps. Its display name is localized copy,
> not a column. Add the Drizzle table, RLS so dispatchers and admins can read and write and
> drivers can read only their own loads, en and fr seed copy for its UI labels, and a
> `/load` list page and `/load/[id]` detail page using coreui's DataTable and Card. Then run
> sync:supabase, db:reset and check, and fix anything that fails.

Then iterate: "drivers need to mark a stop as arrived from their phone", "add a status filter to
the load list", and so on.

Habits that keep a prototype on track:

- **Ask for the schema and the RLS policies first** and read them before any UI is built.
  Who-can-see-what is the decision that is most expensive to change later.
- **Let it run the gates.** `pnpm check` (svelte-check) catches loaders that reference fields
  that no longer exist; `vite dev` does not typecheck. `pnpm db:reset` proves the migration and
  seed apply cleanly from empty.
- **Test as more than one person.** Sign in as a non-admin in a second browser profile. RLS
  bugs only show up as someone who is not the administrator.
- **Use the checklist.** Ask Claude to review a change against the "What Not to Do" checklist in
  `CLAUDE.md` before you commit.
- **Use the module packages as reference.** If you selected `content` or `logistic`, their
  scaffolded screens and `supabase/supplemental/` files are working examples of every pattern
  above. Point Claude at them: "follow the pattern in `src/routes/(admin)/admin/logistic/supplier/`".

---

## 10. The schema change loop

Whenever you change `src/lib/server/schema.ts`, a file in `supabase/supplemental/`, or a file in
`supabase/seeds/`:

```sh
pnpm sveltebuilder sync:supabase    # regenerate migration, supplemental SQL and seed.sql
pnpm db:reset                       # local: rebuild the database from scratch
pnpm check                          # typecheck routes against the new shape
```

For hosted Supabase, apply new migrations with:

```sh
pnpm supabase db push               # add --include-seed to rerun the seed as well
```

What `sync:supabase` does:

1. Reads `.sveltebuilder/registry/*.json` to find every schema source (the local-text tables,
   your `schema.ts`, and any modules) and orders them by their dependencies.
2. Runs `drizzle-kit generate`, writing a new migration to `supabase/migrations/` for whatever
   changed.
3. Appends any new or changed `supabase/supplemental/*.sql` to the newest migration.
4. Regenerates `supabase/seed.sql` from the base locales and copy, plus `supabase/seeds/*.sql`.

Rules of thumb:

- Never hand-edit files in `supabase/migrations/` or `supabase/seed.sql`. They are outputs.
- Name new supplemental and seed files with a numeric prefix above the scaffold's
  (`10-load-rls.sql`, `10-load-copy.sql`) so they apply after the auth helpers and base data
  they depend on.
- Write supplemental SQL to be re-runnable: `create or replace function`,
  `drop policy if exists ... ; create policy ...`.
- Write seeds to be re-runnable: no hard-coded IDs, look up locales by code and links by slug,
  `on conflict do nothing`.
- Once a migration has been pushed to a shared or hosted database, treat it as permanent. Fix
  forward with a new change rather than editing history.

---

## 11. Deploy

SuperPrototype uses `@sveltejs/adapter-auto`, which detects Vercel, Netlify, Cloudflare and
other supported hosts automatically. For anything else, switch to the
[adapter](https://svelte.dev/docs/kit/adapters) for your platform in `svelte.config.js`.

Checklist:

1. **Database:** `pnpm supabase db push --include-seed` against the production project.
2. **Environment variables** on your host, available **at build time** (they are compiled in):
   `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `PUBLIC_DEFAULT_LOCALE`, and
   `PUBLIC_SITE_URL` set to the production origin, for example `https://app.example.com`. The
   Google variables are not needed; on hosted Supabase they live in the dashboard.
3. **Supabase Auth URL Configuration:** set **Site URL** to the production origin and add
   `https://app.example.com/**` to **Redirect URLs**. Add preview-deployment origins too if you
   want sign-in to work on them.
4. **Google OAuth client:** the hosted Supabase callback
   (`https://<project-ref>.supabase.co/auth/v1/callback`) must be an authorized redirect URI, and
   the consent screen must be published before people outside your test-user list can sign in.
5. **Sign in first** on production, so the administrator account is yours.

---

## 12. Troubleshooting

**Every piece of text shows `[missing: app.name]` or similar.**
The dictionary is empty. Either the seed never ran (`pnpm db:reset` locally, or
`pnpm supabase db push --include-seed` on hosted) or `.env` points at a different Supabase
project than the one you seeded. Restart `pnpm dev` after changing `.env`.

**The language switcher is empty and the server logs `[locale] query error`.**
The app cannot reach Supabase or the tables do not exist. Check `PUBLIC_SUPABASE_URL` and the
key, and that the migration has been applied.

**Signing in returns me to `/` or the Site URL instead of `/admin/dashboard`.**
Supabase rejected the redirect target and fell back to the Site URL. Add your app's origin with
`/**` to the allowed redirect URLs (hosted), or to `additional_redirect_urls` in
`supabase/config.toml` (local, then restart), and check that `PUBLIC_SITE_URL` matches the origin
in your browser exactly. `localhost` and `127.0.0.1` count as different origins.

**Google shows `redirect_uri_mismatch`.**
The Google client's authorized redirect URIs must include Supabase's callback
(`…/auth/v1/callback`) for the environment you are using, not your app's `/auth/callback`.

**Google sign-in does nothing locally, or Supabase says the provider is not enabled.**
`enabled = true` under `[auth.external.google]`, the two `GOOGLE_*` values in `.env`, and a
`pnpm db:stop && pnpm db:start`. Config is read only when the stack starts.

**I signed in but `/admin` says "Admin access required."**
Someone else signed in first and became the administrator. Promote yourself with the SQL in
section 6. Locally, `pnpm db:reset` and sign in again also works.

**`sync:supabase` reports success but no migration appears.**
Run it from the project root with the project's own installed CLI
(`pnpm sveltebuilder sync:supabase`). If dependencies are not installed, `drizzle-kit` is
missing.

**`pnpm dev` works but `pnpm build` or `pnpm check` fails with type errors.**
Vite does not typecheck, so dev mode can run over a loader that references a column you
removed. `pnpm check` tells you which route; fix it before you deploy.

**The first `pnpm db:start` takes a long time.**
It is pulling several GB of Docker images. Later starts take seconds.
