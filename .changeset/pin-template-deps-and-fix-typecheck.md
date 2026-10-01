---
"create-sveltebuilder": patch
---

Pin the scaffold's third-party dependencies, and fix the 12 type errors that pinning revealed.

Every dependency in the base template was `"latest"`. That resolved `typescript` to 7.0.2, which
svelte-check 4 refuses outright unless TypeScript 6 is installed alongside it and it is run with
`--tsgo` — so `pnpm check` could not run at all in a scaffolded project, and had not been able to for
some time. Third-party deps are now pinned to the majors verified working end to end (svelte 5, Kit 2,
Vite 8, svelte-check 4, TypeScript 5.9, `@supabase/*`). First-party packages stay on `"latest"`: they
are released from this repo and a new scaffold should pick up current module code.

With `svelte-check` able to run again it reported 12 errors in the scaffold's own admin routes, all
pre-existing and all previously invisible. A scaffolded project now typechecks with 0 errors.

One was a live bug rather than a typing complaint: the admin layout read `item.local_text_link` while
its loader returned `localTextLink`, so every sidebar nav label silently fell back to showing the raw
href instead of its translation.

The rest were three patterns, now fixed at the source in a new `src/lib/server/postgrest.ts`:

- **To-one embeds typed as arrays.** supabase-js types every PostgREST embed as an array without
  generated database types, so `local_text_link(...)` came back typed `[]` while being an object at
  runtime. `toOne()` narrows it, and documents why.
- **Partial `locale` selects.** Three loaders selected `id, code, native_name` and passed the result
  where a full `Locale` was expected. `LOCALE_COLUMNS` and `toLocale()` keep the select and the
  boundary mapping together.
- **Untyped dictionary rows.** The three `/api/local-text` endpoints each hand-rolled the same
  snake_case→camelCase map with an implicitly-`any` row. `toDictionaryPayload()` replaces all three.

Also fixes an accessibility bug in the navigation-item editor: a `Checkbox` was wrapped in a `Field`
with a label, but `Checkbox` is self-labelling — it renders its own `<label>` around the control. The
result was one `<label>` nested inside another with the outer one's `for` pointing at no element. It
now takes `label` directly.
