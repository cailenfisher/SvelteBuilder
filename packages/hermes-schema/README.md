# @sveltebuilder/hermes-schema

Drizzle table definitions and seed data for the core [SvelteBuilder](https://github.com/cailenfisher/SvelteBuilder) i18n tables — `locale`, `local_text_link`, `local_text`. This is the base schema that `@sveltebuilder/hermes` dictionary payloads are read from; every SvelteBuilder scaffold and domain module depends on it.

## Install

```sh
npm install @sveltebuilder/hermes-schema
```

## Usage

```ts
import { locale, localTextLink, localText } from '@sveltebuilder/hermes-schema/schema';
import { LOCALES, BASE_SLUGS } from '@sveltebuilder/hermes-schema/seed';
```

- **`@sveltebuilder/hermes-schema/schema`** — Drizzle `pgTable` definitions with bigint identity primary keys, matching the SQL described in the [SvelteBuilder README](https://github.com/cailenfisher/SvelteBuilder):
  - `locale` — `id`, `code` (BCP-47, unique), `name`, `nativeName`, `dir` (`'ltr' | 'rtl'`)
  - `localTextLink` — `id`, `slug`, `scope` (nullable), `entityId` (nullable, polymorphic — no FK, points across many domain tables by convention)
  - `localText` — `id`, `link` (FK), `locale` (FK), `content`, unique on `(link, locale)`

  Each table also exports its inferred row types (`Locale`/`NewLocale`, `LocalTextLink`/`NewLocalTextLink`, `LocalText`/`NewLocalText`).

- **`@sveltebuilder/hermes-schema/seed`** — `LOCALES`, the default set of eight supported locales (`en`, `fr`, `es`, `de`, `pt-BR`, `ja`, `zh-CN`, `ar`), and `BASE_SLUGS`, the baseline application UI copy (navigation, actions, form states) with English and French translations.

## Part of the SvelteBuilder ecosystem

`@sveltebuilder/cli`'s `sveltebuilder sync:supabase` command discovers this schema alongside domain module schemas and generates ordered Supabase migrations from them. See the [SvelteBuilder README](https://github.com/cailenfisher/SvelteBuilder) for the full architecture.
