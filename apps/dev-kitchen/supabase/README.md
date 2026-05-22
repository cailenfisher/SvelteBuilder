# dev-kitchen Supabase

This directory is the Supabase working directory for the SvelteBuilder dev-kitchen app.
It is connected to the SvelteBuilder GitHub repository via the Supabase GitHub integration.

## Schema

Schema files live in `schemas/`. They are declarative — edit them in place and generate
a migration with:

    supabase db diff -f <description>

Never edit migration files by hand.

## Adding a new module

When a new @sveltebuilder module is added to dev-kitchen:

1. Copy the module's schema files into `schemas/`
2. Add the module's manifest to `schemas/_registry/`
3. Run `sveltebuilder sync` from `apps/dev-kitchen/` to update `config.toml`
4. Run `supabase db diff -f add_<module>` to generate the migration
5. Commit schema files, registry manifest, updated config.toml, and generated migration

## Seed data

`seed.sql` runs on preview branches only — not production.
It contains locale records and the base application dictionary in English and French.
