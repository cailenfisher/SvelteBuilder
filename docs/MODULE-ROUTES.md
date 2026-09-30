# MODULE-ROUTES.md

How domain modules should deliver route-level code (loaders, form actions, pages) given that the
scaffold templates no longer agree on how to reach the database.

**Status: open.** Nothing here is decided. The Logistic module is gated in `npm create sveltebuilder`
until it is, and this document exists so the gate is a considered pause rather than an oversight.
Read alongside `CLAUDE.md`'s *Template Status* and `docs/DEFERRED.md`.

---

## What actually broke

`tools/create/templates/modules/logistic/routes/` ships 18 `+page.server.ts` files whose every query
looks like this:

```ts
const suppliers = await locals.db.withUser((tx) => getSuppliers(tx, locale.code));
```

`locals.db` no longer exists. Phase 1 replaced SuperPrototype's Drizzle handle with
`locals.supabase`, so scaffolding Logistic now produces a project that does not typecheck. The
Content module escaped only because it never shipped route templates — its module template is a
manifest plus supplemental SQL.

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

## Recommendation

Sequenced, cheapest first:

1. **Decide G.** Everything else is contingent. If Native is cancelled, stop here and make modules
   Supabase-native.
2. **Decide the `./server` export.** It is unusable under SuperPrototype today regardless of what
   routes do. This is the blocking item, not routes.
3. **Prototype C on one module surface** — one read view and one write function for, say, suppliers —
   and see what the route code shrinks to. If it collapses to a thin call, D becomes nearly free and
   the N×M objection stops mattering.
4. **Adopt D structurally** whichever way C goes, because it costs nothing now and removes the
   category of break that caused this document.
5. **Revisit E** once there are enough downstream projects that an unfixable copied route is a real
   liability. Do not build it before then.

A is the likely answer for anything that cannot be expressed in the database, and that is not a
retreat: it is the same boundary coreui already draws successfully.

## What would settle it

- Is Native shipping? (G)
- Does a module's value survive without routes? If a team would still install `@sveltebuilder/logistic`
  for schema, SQL, and components alone, A is sufficient and the rest is optimisation.
- How much of a module's data access can be expressed as views and SECURITY INVOKER functions without
  contorting it? That number decides whether C is a foundation or a detour.
- How many scaffolded projects exist, and has a module fix ever needed to reach them? The first time
  the answer is "yes, and it couldn't", E stops being theoretical.
