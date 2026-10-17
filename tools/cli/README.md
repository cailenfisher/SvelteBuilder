# @sveltebuilder/cli

Ongoing project management CLI for [SvelteBuilder](https://github.com/cailenfisher/SvelteBuilder) projects. `create-sveltebuilder` depends on this package internally — sync logic is never duplicated between initial scaffolding and later module additions.

## Install

Usually you don't install this directly — `npm create sveltebuilder@latest` adds it to your project automatically. To use it standalone:

```sh
npm install -D @sveltebuilder/cli
```

## Usage

```sh
sveltebuilder sync:supabase   # generate Supabase migrations from Drizzle schemas
sveltebuilder sync            # deprecated alias for sync:supabase
```

`sveltebuilder sync:supabase`:

1. Discovers every installed module's schema manifest under `.sveltebuilder/registry/*.json`.
2. Topologically sorts them by each manifest's `after` dependencies (the local-text schema first, then domain modules).
3. Writes a barrel file (`.sveltebuilder/schema.ts`) and a generated `drizzle.config.ts`.
4. Runs `drizzle-kit generate` to produce Supabase migrations, then writes any new or changed supplemental SQL (RLS policies, functions, triggers) into a migration created by this run — drizzle-kit's, or an empty `--custom` one when the schema did not change — so nothing is ever added to a migration a hosted project has already applied.
5. Assembles `supabase/seed.sql` from the base local-text seed data plus each module's seed SQL.

## Programmatic API

```ts
import { syncSupabase } from '@sveltebuilder/cli/api';
```

`create-sveltebuilder` calls `syncSupabase` directly as the final step of scaffolding a new project.

## Part of the SvelteBuilder ecosystem

See the [SvelteBuilder README](https://github.com/cailenfisher/SvelteBuilder) for how schema ordering, modules, and the scaffold templates fit together.
