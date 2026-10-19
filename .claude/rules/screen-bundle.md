---
paths:
  - "tools/create/**"
---

### Screen bundles

A module's route code lives in the create CLI's template tree, never in the package — see
guardrail 10. Each selectable bundle is:

```
tools/create/templates/modules/<module>/screens/<screen-id>/
├── manifest.json            id, label, hint, routes, requires, actions, copySlugs
├── ui/                      +page.svelte — provider-neutral, imports its view types
└── server.superprototype/   +page.server.ts — loaders and form actions for that flavour
```

Both halves merge into `src/routes/` at scaffold time. The contract between them is the module's
exported view-model types (`@sveltebuilder/<module>/views`), because nothing typechecks across that
boundary until a project exists. A directory starting with `_` is a holding area for route code not
yet ported into a bundle: never selectable, never copied. Full rationale in `docs/MODULE-ROUTES.md`.

A bundle is a **coherent feature**, not a route file — its list, its detail, and any layout they
share. `requires` names sibling bundles it links to, and selection expands through it, because a
screen that hardcodes an href to a sibling renders a dead link without it. Where the links are dense
enough that no subset makes sense, the feature is one bundle: logistic's warehouse app ships its
shell and its pick-task, inbound-receipt and cycle-count screens together for exactly that reason.

`routes` means "has a page". A bundle shipping `+server.ts` endpoints declares them separately under
`endpoints` — content's feed bundle is three of them and no pages. Code that several routes in one
bundle share goes in an ordinary module beside them in the routes tree (SvelteKit treats only `+page`,
`+layout`, `+server` and `+error` as special), not in `$lib`, which a scaffold without that module
would also receive.

**Data access goes through one data module per table.** A module's template directory carries a
module-level `server.<flavour>/` overlay, which the create CLI copies to `src/lib/server/<module>/`
whenever the module is selected, with or without any of its screens. It holds one file per table,
named like that table's schema file, and each function lives in the file of the table its query
starts from: `inbound-receipt.ts` exports `listInboundReceipt` and `getInboundReceipt` (which embeds
the lines), while `inbound-receipt-line.ts` exports `addInboundReceiptLine`. The scaffold's own
tables follow the same rule in the flavour's `src/lib/server/` (`locale.ts`, `navigation-item.ts`).

Each function takes the request's `supabase` client as its first argument, so every query still
runs through `event.locals.supabase` (guardrail 8) with RLS applied. It owns the table, the columns,
the embeds and the `snake_case` → `camelCase` conversion, and returns supabase-js's own
`{ data, error }` shape (`QueryResult<T>`) with the data already converted. The route checks `error`
where it calls and decides what a failure means to the person on the other end: a 500, a form
error, or a logged fallback. Route files never call `.from(` or `.rpc(` themselves, which
`tools/create/test/data-module.test.ts` enforces. Helpers every data module needs (`toOne`,
`QueryResult`) live once in the flavour's `src/lib/server/postgrest.ts`.

**Where a screen's extracted components go.** A sub-block of a screen that names a concept becomes
its own component. If it is presentational (props in, markup out), it goes in the module package's
concept folder, with a dev-kitchen showcase. If it is bound to its route (posts to that page's form
actions, or builds that route's hrefs), it stays in the bundle, beside the `+page.svelte` that uses
it.

**Shared screen-contract types are declared once.** `ScreenCopy`, `ScreenLocale`, `ScreenPage` and
`ScreenFormResult` are type-only exports of `@sveltebuilder/coreui`, and every module's `views.ts`
imports them. A module declares only the screen types particular to it.
