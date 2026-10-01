---
'create-sveltebuilder': minor
'@sveltebuilder/logistic': minor
---

The Logistic route port is complete: all of its route code now ships as eight selectable screen
bundles.

**Bundles.** supplier, stock, receipt, shipment, return, cycle-count, warehouse, dashboard.
`screens/_unported/` is gone. Every loader queries `event.locals.supabase` rather than the Drizzle
handle SuperPrototype dropped, every screen is internationalised — the originals were hardcoded
English down to their table headers — and each bundle's contract with its loader is stated as types
the module exports from `@sveltebuilder/logistic/views`.

The warehouse app is one bundle rather than four. Its shell nav and home screen link to picking,
receiving and counting, so no subset of those is installable without dead links. The dashboard is the
opposite shape: it links to everything, so it `requires` everything and selection expands through it.

**Seven new RPCs**, all SECURITY INVOKER so RLS still checks each statement inside, for the
operations that span statements and whose partial results are garbage: creating a supplier (whose
name is an i18n link plus copy, not a column), creating a shipment, a return authorization or a cycle
count with their lines, receiving a receipt line, grading a returned line, and recording or completing
a pick. They share one rule — the RLS-governed update goes first and its row count is checked —
because under RLS a forbidden UPDATE affects zero rows rather than raising, so ordering it first means
a refusal aborts before any stock has moved.

**A security fix.** All five of the module's existing SECURITY DEFINER stock functions were missing
`set search_path`, which lets a definer function inherit the caller's search_path and be made to run a
shadowed object with the owner's privileges. All are now schema-qualified with an empty search_path
and explicit grants. A new `pnpm sql:check` asserts the property for every definer function.

**Defects fixed in passing**, all of which existed because template code had never been typechecked
or executed: a "Add supplier" button linking to a route that does not exist; props coreui never
defined (`Tabs`/`TabsTrigger` with `href` and `aria-label`, `Select` with `required`, `StatusBadge`
with `status`); a location picker rendering a raw database slug to users; return condition and
disposition values hardcoded as English markup; a restock with no location silently dropping the
goods; the shipment status filter omitting `packed`; and a receiving queue whose two lists were both
capped by a single fifty-row fetch.

**New gate.** `pnpm sql:check` applies a scaffolded project's migration and seed to Postgres in
Docker, applies the seed twice to prove it is re-runnable, and asserts the database behaves as the
routes assume — impersonating an admin, a non-admin and an anonymous visitor through `set role` plus
a JWT subject, which is the only way RLS is exercised at all. `pnpm test` gains a suite checking the
half of a screen bundle's contract types cannot express: that a manifest matches its files, that every
slug a screen renders is seeded, and that each has both required locales.
