# Access Control — Work Plan

Instructions for Claude Code to build roles and permissions into SvelteBuilder.
Run it phase by phase on the `feat/access-control` branch.

Read these first, completely, in this order:

1. `CLAUDE.md` — repository rules. Every guardrail applies.
2. `docs/ACCESS-CONTROL-DECISIONS.md` — what was decided, and why (A1–A17, O1–O6).
3. `docs/ACCESS-CONTROL.md` — the design. Section numbers below (§2.1 and so on) point into it.

---

## Ground rules

- **Stop after Phase 0** and wait for the open decisions and pending names to be approved.
- After Phase 0, run the phases in order. Each phase is **one commit** (or a small series), its message naming the phase.
- **Pause for review** at the end of any phase marked ⏸. Otherwise continue once the gate passes.
- **Never weaken a gate to make it pass.** If a gate fails and the fix isn't obvious, stop and report.
- **Never reverse a decision quietly.** If building shows a decision in `docs/ACCESS-CONTROL-DECISIONS.md` is wrong, stop, write up what you found against the decision's stated reason, and wait.
- A name not in the approved list is added as **pending**, and you stop at the end of the phase to get it approved.
- Every new table gets RLS and an explicit policy in the same phase that creates it. A table with RLS and no policy, or no RLS at all, is the content-module incident again.
- Write changesets as you go. Run `pnpm changeset status --verbose` after each one. The release train is settled in Phase 0 (O4); until then, do not merge this branch.
- No `TODO`s, placeholders or mocked data paths in anything committed. The production-ready bar in `CLAUDE.md` applies to every phase, not only the last.

### The gates

| Gate | What it proves |
| --- | --- |
| `pnpm check` | Every package's own source typechecks. |
| `pnpm test` | Unit suites, including the create CLI's template and screen-bundle tests. |
| `pnpm lint` | ESLint guardrails and `css:check`. |
| `pnpm scaffold:check` | A scaffold with every module typechecks and builds. |
| `pnpm sql:check` | The SQL applies, re-seeds, and RLS behaves for admin, non-admin and anon. **The only gate that runs a policy.** Run it with `--modules logistic,content` from Phase 2 on. |
| Accessibility workflow | axe over dev-kitchen in light, dark, RTL. Run it locally for any phase that adds a component. |

"Gate passes" means all of these pass, unless the phase says otherwise.

### Deferred decisions and their deadlines

Report this table at the end of every phase. Update it when an item lands or something new is deferred.

| Item | Where recorded | Must land before | Status |
| --- | --- | --- | --- |
| O1 package name | DECISIONS | Phase 1 | open |
| O2 core SQL location | DECISIONS | Phase 2 | open |
| O3 pending names | DESIGN §8 | Phase 1 | open |
| O4 release train | DECISIONS | merge of this branch | open |
| O5 container targets | DECISIONS | Phase 11 | open |
| O6 module-managed roles locked | DECISIONS | Phase 2 | open |
| Supplemental ordering for the generated file | DESIGN §4 | Phase 3 | open |
| `article_assignment.role` column name | DESIGN §8 note | Phase 8 | open |
| Content's seeded role set | DESIGN §7 | Phase 8 | open |

---

## Phase 0 — Verify the ground, settle names ⏸

Read-only, plus one docs commit.

1. Confirm every repository fact the design relies on. Report each as confirmed or wrong:
   - `current_user_id()` returns `bigint` and `current_user_admin()` returns `boolean`, both `STABLE SECURITY DEFINER` (`superprototype/supabase/supplemental/00-auth-functions.sql`).
   - Entity PKs in content and logistic are `bigint` (`packages/*/src/lib/schema/`).
   - Supplemental files from base, flavour and modules are merged and sorted alphabetically as one list (`tools/cli/src/commands/sync-supabase.ts`, `tools/create/src/module-template.ts`).
   - An edited supplemental file is carried forward in full by content comparison.
   - `discover()` parses manifests as plain JSON, so an extra `access` key is ignored by today's sync.
   - `scripts/sql-check/00-supabase-stub.sql` can impersonate a second non-admin user, and a user who belongs to a group. If not, list what the stub needs.
   - Supabase type generation picks up tables created in supplemental SQL.
2. Work out the supplemental ordering for the core access SQL and the generated file (DESIGN §4). Propose file names, or a sync change that emits the generated file at a fixed position. Say which, and why.
3. List every existing policy in content and logistic that gates on `current_user_admin()`, grouped by table. This is the adoption worklist for Phases 8 and 9.
4. Present O1–O6 and every **pending** name in DESIGN §8 for approval, with any counter-proposal and its reason.
5. Commit the findings as an appendix to this file. Stop.

---

## Phase 1 — `@sveltebuilder/access` package and static schema

1. Create `packages/access` following an existing module package's layout (`package.json`, `svelte.config.js`, `tsconfig.json`, `README.md`, `LICENSE`, `CHANGELOG.md` left to Changesets).
2. Add the §2.1 tables as Drizzle definitions, one file per table, with inferred types and an `index.ts` barrel exported as `@sveltebuilder/access/schema`.
3. Add `views.ts` with the view-model types the components and screens will need. Export as `@sveltebuilder/access/views`. Import `ScreenCopy` and friends from coreui; do not redeclare them.
4. Register the package in the base scaffold's `.sveltebuilder/registry/` so every scaffold includes it, sorted after `@sveltebuilder/local-text-schema` and the flavour.
5. Pin it in the create CLI the way other SvelteBuilder dependencies are pinned (`package-version.test.ts` must cover it).
6. Changeset: new package.

**Gate.**

---

## Phase 2 — Core SQL: functions, RLS, admin RPCs, hardening

In the location settled by O2.

1. Triggers on `role_assignment`: scope must exist in `permission`; external groups refused (A10).
2. `current_user_group_ids()` and `current_user_can()` (§3.1).
3. RLS on every §2.1 table. Reads go through the RPCs; admins may select directly for the admin screens. Write the policy intent in a comment block at the top of the file, as `02-content-rls.sql` does.
4. Revoke `insert`, `update`, `delete`, `truncate`, `references`, `trigger` on every access table from `anon` and `authenticated` (A12). Write the reason in the file, pointing at `05-user-account-hardening.sql`.
5. Admin RPCs (§3.3), each checking `current_user_admin()` itself. `set_role_permissions` and `delete_role` refuse a role with a non-null `slug`.
6. Grant `execute` explicitly on every function to exactly the roles that call it.
7. Seed EN and FR copy for the `access` module UI scope.

`explain_access()` is not in this phase. It needs the generated tables to answer for entities, and shipping it half-working would be a placeholder. It lands whole in Phase 3.

**Gate**, plus `sql:check` must still pass for content and logistic, unchanged.

---

## Phase 3 — Generator in `@sveltebuilder/cli`

1. Extend `SchemaManifest` with the optional `access` shape (DESIGN §4). Validate it: unknown keys, an `access.entity` scope missing from `access.permission`, or missing `share`, fail sync with a message naming the manifest file.
2. For each `access.permission` pair, emit an idempotent `permission` insert into the generated seed.
3. For each `access.entity` scope, emit into the generated supplemental file: the §2.2 table (with `add column if not exists` for every column), its indexes, RLS enabled with admin and owner-of-grant read policies, the revokes from Phase 2 step 4, and the four §3.2 functions with their grants.
4. `create_<entity>_role_assignment` enforces A12: caller holds `<scope>.share` on that entity, and every permission of the role in that scope is held by the caller on that entity. Use `current_user_<entity>_actions` for both.
5. `explain_access()` (DESIGN §3.3), covering global, scope and entity grants.
6. Unit tests for the generator: valid manifest, each validation failure, output stability (same input, byte-identical output), and that output re-applied to a database built from the previous output succeeds.
7. Changeset for `@sveltebuilder/cli`.

**Gate.**

---

## Phase 4 — SQL assertions ⏸

1. Extend `00-supabase-stub.sql` with whatever Phase 0 found missing (a second non-admin, a group member).
2. Add the assertion file (DESIGN §9 name) covering every bullet in DESIGN §9.
3. Give `sql:check` a fixture module manifest declaring `access.entity` on a scaffold table, so entity-level behaviour is asserted before any real module adopts it. The fixture lives in `scripts/sql-check/`, never in a template.
4. Extend the existing policy-pattern assertion so a bare or row-referencing call to any access helper fails.

**Gate.** Pause: this phase defines what "works" means for everything after it.

---

## Phase 5 — coreui `CheckboxMatrix`

1. Build it per DESIGN §6.1. Plain stylesheet in its concept folder, listed in `components.css`. BEM classes. No English defaults; accessible names required.
2. dev-kitchen showcase, including RTL and an inherited cell. The catalog check must pass.
3. Server-render test in `packages/coreui/test/`.
4. Add it to `docs/COREUI-COMPATIBILITY.md` (its classes are public API).
5. Changeset for coreui. Run `pnpm changeset status --verbose` and stop if any module shows a major.

**Gate**, plus the Accessibility workflow.

---

## Phase 6 — `@sveltebuilder/access` components

1. Build the four components of DESIGN §6.2 on coreui only (guardrail 4). Camp 2: copy through `getDictionary()` with the `dictionary?` override.
2. `RoleAssignmentPanel` must make the difference between a direct grant and inherited access unmistakable without colour alone: text naming the source, and no remove control on an inherited row.
3. dev-kitchen showcases with typed fixtures, and server-render tests including the no-`[missing:]` gate.
4. EN and FR copy for every slug the components render.

**Gate**, plus the Accessibility workflow.

---

## Phase 7 — Base admin screens ⏸

1. Data modules per table (DESIGN §5.2). Routes never call `.from(` or `.rpc(` directly.
2. Screens of DESIGN §6.3, following the `locale` and `navigation-item` admin screens for structure, stylesheets and form-error handling (`formError` / `formErrorText`).
3. Admin navigation entries, seeded with EN and FR copy.
4. Screen-bundle and data-module tests pass; every rendered slug is seeded.

**Gate.** Pause for a hands-on review of the admin flow in a scaffolded app.

---

## Phase 8 — Content adoption ⏸

Start by settling the two Phase 8 items in the deferred table: the seeded role set (from the newsroom's real workflow) and the `article_assignment.role` column name.

1. Declare `access` in content's manifest (DESIGN §4 example, adjusted to the approved roles).
2. Seed roles, `role_permission` rows resolved by `(scope, action)`, EN and FR copy.
3. Rewrite the admin-gated policies from the Phase 0 worklist to the DESIGN §3.4 shape, with the `article_assignment` relationship predicate on `article`.
4. Loaders for article admin screens return `actions` per row (DESIGN §5.3); screens hide controls the user cannot use.
5. Add `RoleAssignmentPanel` to the article admin detail screen.
6. Extend `40-assert-content.sql`: an assigned editor can update their article and not another; a `content_writer` cannot publish; public reads are unchanged.
7. If a rename lands, it is total (see `CLAUDE.md` and the conformance plan's rule): schema, types, policies, seeds, screens, tests, docs, in this phase.
8. Changeset for content.

**Gate.** Pause.

---

## Phase 9 — Logistic adoption

1. Declare `access.permission` (no `access.entity`).
2. Seed roles with copy.
3. Rewrite admin-gated policies to the scope-level shape. SECURITY DEFINER stock-mutation functions check `current_user_can()` themselves, since they bypass RLS.
4. Loaders return `actions`; screens hide what the user cannot do.
5. Extend `30-assert-logistic.sql`: an operator can receive and pick but not adjust stock or manage suppliers.
6. Changeset for logistic.

**Gate.**

---

## Phase 10 — Documentation ⏸

Write in the house style: second person, imperative, a reason with every rule, admonitions for hard rules.

1. `CLAUDE.md`:
   - Restate guardrail 6 per A8.
   - Add an _Access control_ section under _Auth Architecture_: the model, the policy shape, the "permissions not roles" rule, where the SQL lives. Point at the design doc; do not copy it.
   - Add `packages/access` to _Monorepo Layout_ and to _Completed Foundation_.
   - Add guardrails: no role-name checks; no access decisions in TypeScript; no direct DML on access tables.
2. `tools/create/templates/superprototype/CLAUDE.md`: how a developer adds an access-controlled entity to their own app (manifest, policy shape, panel).
3. `packages/access/README.md` and the content and logistic READMEs.
4. `docs/DEFERRED.md`: everything excluded or deferred, with its reason.
5. Mark `docs/ACCESS-CONTROL-DECISIONS.md` and `docs/ACCESS-CONTROL.md` as built, and correct anything the build changed.

**Gate.** Pause for final review before the branch merges on the train settled by O4.

---

## Phase 11 — Container targets (only on explicit go-ahead, O5)

Do not start this phase unless O5 has been answered "yes, in v1".

Scope: a role assigned on a `section` covers the articles linked to it through `article_section`.
Design it first, as an addition to `docs/ACCESS-CONTROL.md`, covering at least: how a manifest declares the parent relation, how `current_user_article_ids()` unions container grants without per-row cost, what `explain_access()` reports, and how `RoleAssignmentPanel` shows "via Sports section". Stop for approval before writing code.
