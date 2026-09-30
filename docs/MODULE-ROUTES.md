# MODULE-ROUTES.md

How domain modules should deliver route-level code (loaders, form actions, pages) given that the
scaffold templates no longer agree on how to reach the database.

**Status: decided 2026-09-30.** The analysis below is kept as the rationale; the decisions it
produced are stated here. Read alongside `CLAUDE.md`'s *Template Status* and `docs/DEFERRED.md`.

## Decisions

1. **Modules stay pure (Option A).** A module package ships its Drizzle schema, its supplemental SQL,
   its components, and the view-model types that define its screen contracts. It ships no data-access
   layer and no route code. The `./server` export is removed from every module.

2. **Screens live in template-land, and are owned by the app once scaffolded.** Route code is a
   one-time scaffold — a starting point the generated project owns outright, not a dependency it
   tracks. Upgradeability is explicitly not a goal: real teams diverge from generated route code
   immediately, and pretending otherwise produces an abstraction nobody wants. This closes the
   upgradeability question raised under *Angles that are easy to miss* by declining it on purpose.

3. **The line between a component and a screen: once it is a full screen, view, or page, it does not
   belong in the library.** Components may compose other components freely. A `+page.svelte`, or a
   composed view that exists to *be* a page, belongs in the template tree. Recorded as a guardrail in
   `CLAUDE.md`.

4. **The type is the contract.** Because a screen and its loader now live in different places, each
   module exports view-model types (`@sveltebuilder/<mod>/views`). The neutral screen imports the
   type; every flavor's loader returns it. The contract covers load data, form action names, field
   names, and `fail()` payload shapes. This is what keeps the split checkable instead of implicit.

5. **Screens split by flavor inside the module's template directory, not into `base`.** The property
   wanted is provider-neutral, not always-installed; putting module screens in `base` would couple
   base to modules. Layout is `screens/<screen-id>/{manifest.json, ui/**, server.<flavor>/**}`.
   Only `server.superprototype/` exists today.

6. **The selectable unit is a feature bundle, not a route file.** A bundle carries its list, detail
   and any shared layout together, and declares `requires` for sibling bundles it links to. Screens
   are selected in the create CLI after module selection.

7. **SQL and seed data stay module-granular; only routes are screen-granular.** An unselected screen's
   tables and copy are harmless, whereas a missing table is not. This keeps schema, supplemental SQL
   and seeds exactly as they are.

8. **Native is not cancelled, but is not served by this pass.** Its obligation reduces to supplying
   `server.native/` halves satisfying the exported view-model types. That does not resolve its actual
   blocker — `withUser` + GUC still bypasses RLS against a table-owning role, and the non-owner role
   plus `ALTER DEFAULT PRIVILEGES` remains prerequisite.

## Flagged for later

| Severity | Item |
| --- | --- |
| **Critical — pending review** | Logistic's 40 RLS policies call `public.current_user_id()` bare rather than as `(select …)`, so they evaluate once per row instead of once per statement, and they re-implement the admin check as an inline `exists (select 1 from public.user_account …)` subquery instead of calling `public.current_user_admin()`. On warehouse-scale tables this is a real cost. The policies have also never been enforced — under `withUser` the connection role owned the tables, so Postgres skipped RLS entirely. This pass leaves them as they are; only a policy that blocks a screen from functioning gets touched, and it gets reported rather than silently optimised. |
| **Important — later** | Nav, seed and supplemental data are module-granular while routes are screen-granular. Harmless today because logistic seeds no nav items at all and base's admin layout returns an empty `navItems` stub — but module screens are currently reachable only through hardcoded links between sibling screens, which is why bundles need `requires`. A real nav story would let selection drive discoverability. |
| **Needs its own conversation** | What of logistic's 45 removed query functions belongs in Postgres as views or `SECURITY INVOKER` functions rather than in route loaders. Some already are (`logistic_adjust_stock`, `logistic_reserve_stock`, …). This pass does a quick pass on the obvious candidates and moves the rest into SuperPrototype loaders. |
| **Revisit** | Feature-bundle granularity may need a second pass once several modules use it; cross-bundle hardcoded links are the pressure point. |
| **Revisit** | Screens-as-components (a `<PickTaskListScreen>` in the package with a five-line route) preserves markup upgradeability and follows from screens being the valuable artifact. Declined for now in favour of editable template files; worth reopening if real consumers appear or a second flavour lands. |
| **Practice** | Pin template dependencies at authoring time. `"latest"` across the board produced a scaffold whose `pnpm check` cannot run (TypeScript 7 against svelte-check 4). Screens are code written against specific component APIs, so this matters more now than it did. |


## What actually broke

`tools/create/templates/modules/logistic/routes/` ships 18 `+page.server.ts` files whose every query
looks like this:

```ts
const suppliers = await locals.db.withUser((tx) => getSuppliers(tx, locale.code));
```

`locals.db` no longer exists. Phase 1 replaced SuperPrototype's Drizzle handle with
`locals.supabase`, so scaffolding Logistic now produces a project that does not typecheck.

Content escaped the break for a stranger reason: it *does* have 13 route templates, but they live
inside the package at `packages/content/src/lib/templates/routes/` and the create CLI has never
copied them. They were compiled into `dist/templates/routes/` and published as dead weight — build
output no scaffolded project routes and no developer can edit. So content has been shipping as a pure
Option A module by accident, and nobody noticed the routes never arrived. Those screens have value
and move into the template tree alongside logistic's.

## The question is data access, not routes

Routes are where the break surfaced, but they are not the thing that is wrong. Both
`@sveltebuilder/logistic` and `@sveltebuilder/content` export a `./server` entry point whose queries
import `drizzle-orm` at runtime. Guardrail 8 in `CLAUDE.md` calls exactly that a bug: runtime Drizzle
means a direct Postgres connection, which runs as a table-owning role, which bypasses RLS for every
policy in the project. That is the defect that triggered the whole Supabase realignment.

So `@sveltebuilder/logistic/server` is not merely inconvenient under SuperPrototype — it is
unusable. Rewriting the 18 route templates to call `locals.supabase` would leave the module's own
query layer stranded, and porting that query layer is the actual decision. **Any route strategy
below is downstream of deciding what happens to `./server`.**

That decision has three candidate answers, and they are the real fork:

1. **Delete it.** Modules ship schema, SQL, and components; all queries live in the app.
2. **Move it into Postgres.** Views and functions replace TypeScript queries (see Option C).
3. **Make it Native-only.** Modules keep a Drizzle layer that SuperPrototype never imports — which
   means SuperPrototype module routes need their own queries anyway, so this only helps if Native
   revives.

---

## Constraints any answer has to satisfy

- **RLS must stay in force.** The only reason SuperPrototype queries through PostgREST is that the
  request's own JWT reaches Postgres, so policies apply without the application arranging it. A
  module abstraction that reintroduces a privileged connection defeats every policy in the project.
- **Postgres is a given.** SvelteBuilder is locked to Postgres, which is why `docs/DEFERRED.md`
  retired the portability argument for a database-agnostic query layer. Whatever is shared does not
  need to abstract over *databases* — only over *clients*.
- **Platform-idiomatic beats provider-neutral.** The standing preference is to use a platform's own
  patterns rather than wrap them. An interface that both Drizzle and PostgREST can satisfy tends to
  express neither well.
- **Shared surfaces stay provider-neutral in shape.** Module packages are a shared surface. They may
  not take hard Supabase dependencies while Native is merely on hold.
- **The production-ready bar.** No placeholders, no broken options. A module that scaffolds a project
  which cannot build fails this outright, which is why the gate exists now rather than later.

---

## Options

### A. Components only — the easy answer

Modules export schema, supplemental SQL, and components. The app owns every loader, action, and page.

This is coreui's model, and coreui is the part of this repo that has never had a compatibility
problem. It is provider-neutral by construction: components take entities and snippets, and never
know how a row was fetched.

The cost is the product claim. "Production-grade domain modules that share one foundation" implies
more than a component library — a warehouse module that hands you `PickTaskList` but no pick-task
page leaves the reason teams rebuild these apps mostly intact. Whether that matters depends on how
much of the work is the schema and the SQL versus the glue.

### B. A provider-neutral port with per-template adapters

Modules define a repository interface (`LogisticStore`), ship a Drizzle adapter and a PostgREST
adapter, and route templates depend only on the interface.

This is the option that looks most like software engineering and is most likely to be a mistake. It
is precisely the provider-neutral abstraction the project already decided to stop building, and the
two clients do not differ cosmetically: PostgREST composes reads as embedded selects, applies RLS
implicitly, and needs an RPC for anything transactional, while Drizzle composes in SQL and has real
transactions. An interface both can satisfy is the intersection of their weaknesses. It also doubles
the adapter surface per module, for a second template that currently cannot be installed.

Worth keeping on the list only as the option to argue against explicitly.

### C. Push the shared layer into Postgres

Express module data access as database objects — views for reads, `SECURITY INVOKER` functions for
compound writes — and let each template call them the way it prefers: `.rpc()` and filtered view
selects from SuperPrototype, a query builder or raw `sql` from Native.

This is the most interesting option, because it relocates the shared surface to the one layer both
templates genuinely share. The provider difference is the *client*, not the database. SQL is
therefore neutral in a way TypeScript query code cannot be, without inventing an abstraction.

It also is not new: the project already does this where it matters most. `get_dictionary` resolves
locale priority in SQL, compound admin writes go through `04-admin-write-rpc.sql` as SECURITY
INVOKER precisely so RLS still checks each statement, and Logistic's concurrency-sensitive stock
mutations are already SECURITY DEFINER SQL. The pattern is established; this would extend it from
"things TypeScript cannot do safely" to "the module's data layer".

Costs are real. Filtering, sorting and pagination are natural over a view from PostgREST but become
function parameters if wrapped as RPCs. Types need generating rather than inferring from Drizzle.
And SQL is harder to review and refactor than TypeScript, which matters for a module authored once
and read many times.

### D. Flavor-scoped route templates

Keep modules as packages; move route templates to per-template directories
(`modules/<mod>/routes.superprototype/`, `routes.native/`) and have the create CLI copy the set
matching the chosen scaffold.

This is honest: route code *is* template-coupled, and pretending otherwise is what produced the
current break. Each set can be fully idiomatic. The N×M duplication people reach for as the
objection is N×1 today, so the structural move costs almost nothing now and makes a second flavor
additive instead of a refactor.

It composes well with C: if the domain logic is in the database, a flavor-specific route is a thin
call plus rendering, and duplicating that is cheap.

### E. Routes as library code

Modules export loaders and actions; generated route files are one-line re-exports.

The argument for this is the strongest thing on this page and is mostly invisible today — see
*Upgradeability* below. The argument against is that it needs the data handle, which drags the
provider back in unless paired with C, and that it trades the scaffold's readable, editable output
for something opaque.

### F. Codegen from a declarative route manifest

Modules declare pages and actions; the CLI generates idiomatic per-flavor route code at scaffold
time. One source of truth, readable output, no runtime abstraction — and a DSL to design, document
and maintain. Filed as the option to reach for only if D's duplication ever actually hurts;
reaching for it sooner is the complexity-without-value trap by name.

### G. Cancel Native

The entire question exists because Native is on hold rather than cancelled. If Native is never
coming back, modules may be Supabase-coupled, `./server` becomes a PostgREST query layer, route
templates have one target, and options B through F evaporate.

This dominates every other choice and should be decided first. It is not a technical question.

---

## Angles that are easy to miss

**Upgradeability.** A copied route template is a fork at scaffold time. Nothing shipped by copying
can ever receive a fix — the first security or correctness fix to a pick-task loader reaches zero
existing projects, and there is no mechanism by which it could. The framing "how do we ship routes to
both templates" quietly assumes copying; the sharper question is whether route code should be shipped
as copies at all. This is invisible while the project count is small and becomes the dominant concern
immediately after it is not. It cuts *against* D and A, and is the reason E deserves a serious look
despite its costs.

**Native currently has no correct data path to target.** `docs/DEFERRED.md` records that Native's
`withUser` + GUC pattern does not enforce RLS at all when the connection role owns the tables, and
that the fix — a dedicated non-owner role plus `ALTER DEFAULT PRIVILEGES` — has not been applied. So
there is no Native data-access story to design module routes against. Any abstraction chosen now
would be shaped by Drizzle's current, known-broken idiom. That is a sequencing argument: specify
Native's role model first, or do not design for Native at all.

**The economics of glue changed.** Part of the case for shipping routes is saving developers from
writing 18 similar loaders. That labour is now much cheaper than when the module design was set,
while the parts that stay expensive — the schema, the RLS policies, the concurrency-safe SQL, the
accessible components, the i18n wiring — are exactly what a module can ship without any of this
coupling. This is a genuine argument for A that has nothing to do with architecture.

**"Components only" does not mean "no route guidance".** Routes can ship as recipes rather than
copies: a documented canonical loader per page, or an `examples/` directory that is deliberately not
copied into the project. Zero coupling, no false promise of upgradeability, and the developer still
skips the design work. The middle path is usually missed because the two ends are louder.

**Editable versus upgradeable is the real trade, and it may be splittable.** Copied code is readable
and owned; packaged code is fixable in place. A module could put the stable, security-sensitive part
(queries, RLS-dependent access) in the package and leave the page-shaped part (loaders, form actions,
markup) as generated, editable files. That is not a compromise so much as a seam drawn where the two
properties actually differ in value.

**The gate is a data point.** Logistic has been unusable since Phase 1 and nobody noticed until a
smoke test. That says something about how much the route templates were being exercised, and is worth
weighing before investing in more of them.

---

## What this became

The plan executed from these decisions: pin template deps; strip `./server` and add `./views` to each
module; carry one vertical slice (Supplier) end to end through the new layout and the CLI's screen
selection; port the remaining bundles; then land a scaffold-and-build CI gate and ungate Logistic.

The recommendation this document originally closed with was to decide Native's fate first, on the
grounds that it collapses most of the question. That is still true, and it is still undecided — but
the structure chosen here makes Native additive rather than a refactor, so the decision can wait
without accruing cost.
