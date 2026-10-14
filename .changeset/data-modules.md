---
'create-sveltebuilder': minor
---

Scaffolded projects reach the database through data modules, one per table, instead of building
queries in route files. Selecting a module now also copies its data modules to
`src/lib/server/<module>/` (`inbound-receipt.ts`, `inbound-receipt-line.ts`, …), whether or not any
of its screens are chosen, and the SuperPrototype template's own routes use `locale.ts`,
`local-text.ts`, `navigation-item.ts` and `user-account.ts` in `src/lib/server/`. Each function
takes the request's Supabase client, so RLS still applies, and returns supabase-js's
`{ data, error }` with the rows already in camelCase. Routes check the error and decide what it
means, exactly as before.

`toOne` is no longer copied into each loader; `toLocale`, `LOCALE_COLUMNS` and
`toDictionaryPayload` moved from `$lib/server/postgrest` into the data modules that use them. The
article admin screen's publish check now answers a failed read with a 500 rather than reporting the
article as not found.
