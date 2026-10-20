# Access Control — Work Plan

Instructions for Claude Code to build roles and permissions into SvelteBuilder.
Run it phase by phase on the `feat/access-control` branch.

Read these first, completely, in this order:

1. `CLAUDE.md` — repository rules. Every guardrail applies.
2. `docs/ACCESS-CONTROL-DECISIONS.md` — what was decided, and why (A1–A22, E1–E3, O1–O6).
3. `docs/ACCESS-CONTROL.md` — the design. Section numbers below (§2.1 and so on) point into it.

---

## Ground rules

- **Stop after Phase 0** and wait for its findings to be reviewed. (O1–O6 and the §8 names were approved before Phase 0 ran, on 2026-10-17.)
- After Phase 0, run the phases in order. Each phase is **one commit** (or a small series), its message naming the phase.
- **Pause for review** at the end of any phase marked ⏸. Otherwise continue once the gate passes.
- **Never weaken a gate to make it pass.** If a gate fails and the fix isn't obvious, stop and report.
- **Never reverse a decision quietly.** If building shows a decision in `docs/ACCESS-CONTROL-DECISIONS.md` is wrong, stop, write up what you found against the decision's stated reason, and wait.
- A name not in the approved list is added to DESIGN §8 under its phase. *(Stopping for approval was suspended on 2026-10-17: every name, approved or new, is reviewed in the branch's pull request. List each phase's new names in its commit message.)*
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
| O1 package name | DECISIONS | Phase 1 | approved: `@sveltebuilder/access` |
| O2 core SQL location | DECISIONS | Phase 2 | approved: base supplemental |
| O3 names | DESIGN §8 | Phase 1 | approved |
| O4 release train | DECISIONS | merge of this branch | changed 2026-10-18: fold into the 2.0 RC; Phase 10 merges the upgrade guides and revalidates the 1.x upgrade |
| O5 container targets | DECISIONS | Phase 11 | approved: excluded from v1 core; Phase 11 only on go-ahead |
| O6 module-managed roles locked | DECISIONS | Phase 2 | approved |
| Supplemental ordering for the generated file | A21 | Phase 3 | decided: sync places it after `01-access.sql`; Phase 0 confirms the sort |
| Sharing edges E1–E3 | DECISIONS | not v1 | accepted for v1; best options recorded |
| Principal picker privacy | A20 | not v1 | accepted for v1; options recorded |
| `explain_access()` | DECISIONS exclusions | not v1 | excluded |
| Replace filename-prefix ordering of supplemental SQL | `docs/DEFERRED.md` | not v1 | recorded |
| `article_assignment.role` column name | A23 | Phase 8 | decided: renamed `article_assignment_role` |
| Content's seeded role set, and further content scopes (P3) | A23 | Phase 8 | decided: Editor, Writer, Contributor; the editorial set of scopes |
| Staff reaching `/admin` | A24 | Phase 8 | decided and built |
| Content's changeset is `major` (the `article_assignment_role` rename) | `.changeset/access-content.md` | done | part of 2.0 now (O4) |
| `checkbox-matrix` changeset | `.changeset/checkbox-matrix.md` | done | `minor`, now that this folds into the RC: content and logistic are already majors there |
| `@sveltebuilder/access` releases as 1.0.0-rc | Changesets | merge of this branch | its coreui peer makes the new package a major; 1.0 beside coreui 1.0 unless decided otherwise |
| P1 article insert constraint | A19 | Phase 8 | adopted |
| Upgrade tooling (validated guides, drizzle-kit snapshot) | `docs/DEFERRED.md` | not v1 | parked 2026-10-18 until something depends on a release; changesets carry the breaking changes |
| P2 logistic non-admin access on adoption | A22 | Phase 9 | adopted and built; the MIGRATION guide tells operators to give staff Warehouse operator |
| Warehouse no-access page, inbound receipt attribution, Operators adding shipment lines | `docs/DEFERRED.md` | not v1 | recorded in Phase 9 |

---

## Phase 0 — Verify the ground, settle names ⏸

Read-only, plus one docs commit.

1. Confirm every repository fact the design relies on. Report each as confirmed or wrong:
   - `current_user_id()` returns `bigint` and `current_user_admin()` returns `boolean`, both `STABLE SECURITY DEFINER` (`superprototype/supabase/supplemental/00-auth-functions.sql`).
   - Entity PKs in content and logistic are `bigint` (`packages/*/src/lib/schema/`).
   - Supplemental files from base, flavour and modules are merged and sorted alphabetically as one list (`tools/cli/src/commands/sync-supabase.ts`, `tools/create/src/module-template.ts`), and `01-access.sql` would sort after `00-auth-functions.sql` and before every file that will call the access helpers.
   - An edited supplemental file is carried forward in full by content comparison.
   - `discover()` parses manifests as plain JSON, so an extra `access` key is ignored by today's sync.
   - `scripts/sql-check/00-supabase-stub.sql` can impersonate a second non-admin user, and a user who belongs to a group. If not, list what the stub needs.
   - Supabase type generation picks up tables created in supplemental SQL.
   - After table-level `UPDATE` on `article` is revoked and re-granted per column (A19), a PostgREST `PATCH` of the granted columns still works and one naming `article_status_id` is refused.
2. List every place content's scaffold code writes `article_status_id` or `published_at` other than `content_transition_article_status`. Each becomes a call to the RPC in Phase 8.
3. List every existing policy in content and logistic that gates on `current_user_admin()`, grouped by table, and mark which tables are children of an access-controlled entity (A18), which are relationship tables a predicate will read (A13), and which columns a module verb guards (A19). This is the adoption worklist for Phases 8 and 9.
4. O1–O6 and the DESIGN §8 names are already approved. Report any finding from steps 1–3 that argues against one, against its stated reason.
5. Commit the findings as an appendix to this file. Stop.

---

## Phase 1 — `@sveltebuilder/access` package and static schema

1. Create `packages/access` following an existing module package's layout (`package.json`, `svelte.config.js`, `tsconfig.json`, `README.md`, `LICENSE`, `CHANGELOG.md` left to Changesets).
2. Add the §2.1 tables as Drizzle definitions, one file per table, with inferred types and an `index.ts` barrel exported as `@sveltebuilder/access/schema`.
3. Add `views.ts` with the view-model types the components and screens will need. Export as `@sveltebuilder/access/views`. Import `ScreenCopy` and friends from coreui; do not redeclare them.
4. Register the package in the base scaffold's `.sveltebuilder/registry/` so every scaffold includes it, with `after: ["@sveltebuilder/local-text-schema"]` only. Its foreign keys to `user_account` are added in `01-access.sql`, not in Drizzle, as content does (Phase 0 appendix §4).
5. Pin it in the create CLI the way other SvelteBuilder dependencies are pinned (`package-version.test.ts` must cover it).
6. Changeset: new package.

**Gate.**

---

## Phase 2 — Core SQL: functions, RLS, admin RPCs, hardening

In the location settled by O2, as `01-access.sql` (A21).

1. Triggers on `role_assignment`: scope must exist in `permission`; external groups refused (A10).
2. `current_user_group_ids()` and `current_user_can()` (§3.1).
3. RLS on every §2.1 table. Reads go through the RPCs; admins may select directly for the admin screens. Write the policy intent in a comment block at the top of the file, as `02-content-rls.sql` does. *(Landed in Phase 1, with step 4: the ground rule puts RLS in the phase that creates a table, and registering the schema in Phase 1 creates them.)*
4. Revoke `insert`, `update`, `delete`, `truncate`, `references`, `trigger` on every access table from `anon` and `authenticated` (A12). Write the reason in the file, pointing at `05-user-account-hardening.sql`. *(Landed in Phase 1.)*
5. Admin RPCs (§3.3), each checking `current_user_admin()` itself. `set_role_permissions` and `delete_role` refuse a role with a non-null `slug`. Those that call `04-admin-write-rpc.sql`'s link-plus-copy function are `plpgsql`, since `04-` applies after `01-` (Phase 0 appendix §4).
6. Grant `execute` explicitly on every function to exactly the roles that call it.
7. Seed EN and FR copy for the `access` module UI scope. *(Moved to Phases 6 and 7: no slug in that scope is rendered until the components and screens exist, and copy seeded ahead of them would be slugs nothing uses.)*
8. Extend `00-supabase-stub.sql` with whatever Phase 0 found missing (a second non-admin, a group member).
9. Add the assertion file (DESIGN §9 name) with every §9 bullet this phase makes testable: no-assignment refusal, scope and global grants, groups, expiry, external groups, admin RPC refusal, revoked DML, module-managed roles, admins with no assignments. Behaviour is asserted in the phase that builds it, not two phases later.

**Gate**, plus `sql:check` must still pass for content and logistic, unchanged.

---

## Phase 3 — Generator in `@sveltebuilder/cli`

1. Extend `SchemaManifest` with the optional `access` shape (DESIGN §4). Validate it: unknown keys, an `access.entity` scope missing from `access.permission`, or missing `share`, fail sync with a message naming the manifest file.
2. For each `access.permission` pair, emit an idempotent `permission` insert into the generated supplemental file, not the seed (A11).
3. For each `access.entity` scope, emit into the generated supplemental file: the §2.2 table (with `add column if not exists` for every column), its indexes, RLS enabled with the §2.2 read policy, the revokes from Phase 2 step 4, and the six §3.2 functions with their grants.
4. `create_<entity>_role_assignment` enforces A12: caller holds `<scope>.share` on that entity, and every permission of the role in that scope is held by the caller on that entity. Use `current_user_<entity>_actions` for both.
5. Order the generated file directly after `01-access.sql` in sync's supplemental list, whatever its name (A21).
6. Unit tests for the generator: valid manifest, each validation failure, output stability (same input, byte-identical output), that output re-applied to a database built from the previous output succeeds, and the A21 ordering.
7. Give `sql:check` a fixture module manifest declaring `access.entity` on a scaffold table, so entity-level behaviour is asserted before any real module adopts it. The fixture lives in `scripts/sql-check/`, never in a template. Add the entity-level §9 bullets: entity grants, cascade on delete, escalation refused, the two `list_` RPCs, and the catalog present without a seed.
8. Changeset for `@sveltebuilder/cli`.

**Gate.**

---

## Phase 4 — Assertion review ⏸

1. Walk DESIGN §9 bullet by bullet and show where each is asserted. Every bullet not owned by Phase 8 must already pass.
2. Extend the existing policy-pattern assertion so a bare or row-referencing call to any access helper fails.

**Gate.** Pause: this phase confirms what "works" means for everything after it.

---

## Phase 5 — coreui `CheckboxMatrix`

1. Build it per DESIGN §6.1. Plain stylesheet in its concept folder, listed in `components.css`. BEM classes. No English defaults; accessible names required.
2. dev-kitchen showcase, including RTL and an inherited cell. The catalog check must pass.
3. Server-render test in `packages/coreui/test/`.
4. Add it to `docs/COREUI-COMPATIBILITY.md` (its classes are public API), and add `Matrix` to the role suffix list in `CLAUDE.md` (approved 2026-10-17).
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
3. Rewrite the admin-gated policies from the Phase 0 worklist to the DESIGN §3.4 shape, with the `article_assignment` relationship predicate on `article`, the parent check on every child table (A18), and the share-and-update gate on `article_assignment` writes (A13).
4. Make `content_transition_article_status` `SECURITY DEFINER` with the DESIGN §3.5 check, rebuild the `article` update grant per column, and add the §3.5 insert policy (A19).
5. Loaders for article admin screens return `actions` per row (DESIGN §5.3); screens hide controls the user cannot use.
6. Add `RoleAssignmentPanel` to the article admin detail screen, with its add form using `list_article_principal`.
7. Close field-test finding 6 (appendix §3a): `comment` columns are selectable only per public column.
8. Extend `40-assert-content.sql` with the content bullets of DESIGN §9, plus `author_email` unreadable by anon and authenticated non-admins, plus: an assigned editor can update their article and its blocks and not another's; a `content_writer` cannot publish by RPC or by `PATCH`; the publish checklist cannot be skipped by an admin either; public reads are unchanged.
9. If a rename lands, it is total (see `CLAUDE.md` and the conformance plan's rule): schema, types, policies, seeds, screens, tests, docs, in this phase.
10. Changeset for content. Run the Clarion's `08` journey against a scaffold from this branch. *Moved to Phase 10*, which re-runs every Clarion journey against the finished branch.

**Gate.** Pause.

---

## Phase 9 — Logistic adoption

1. Declare `access.permission` (no `access.entity`).
2. Seed roles with copy.
3. Rewrite every policy in the Phase 0 worklist to the scope-level shape: admin-gated, `using (true)` reads, and `worker_update` alike (A22).
4. The five SECURITY DEFINER stock functions check `current_user_can()` themselves, since they bypass RLS, and take the acting user from `current_user_id()` instead of a `p_user_account_id` parameter. Update their callers.
5. Close field-test finding 7 (appendix §3a): rebuild `pick_task_line`'s update grant so its quantities and references change only through `logistic_record_picked_quantity`.
6. Loaders return `actions`; screens hide what the user cannot do. The `(warehouse)` layout admits only a user holding a logistic permission, and shows a no-access page rather than a 403 to one who does not (field-test finding 12). *Built:* finding 12 is closed by A24, since sign-in lands staff on `/admin/dashboard`, which now admits them and lists the warehouse. Someone with no role still gets a 403; the no-access page is in `docs/DEFERRED.md`.
7. Extend `30-assert-logistic.sql`: an operator can receive and pick but not adjust stock or manage suppliers; a signed-in user with no role reads nothing; a stock adjustment cannot be attributed to someone else; a worker cannot change a pick line's requested quantity. Run the Clarion's `08` journey against a scaffold from this branch. *Moved to Phase 10*, which re-runs every Clarion journey against the finished branch.
8. Changeset for logistic, and a `MIGRATION` entry telling operators to assign `logistic_operator` to existing staff before upgrading.

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
4. `docs/DEFERRED.md`: everything excluded or deferred, with its reason, including `explain_access()`, E1–E3 and the A20 privacy options.
5. Mark `docs/ACCESS-CONTROL-DECISIONS.md` and `docs/ACCESS-CONTROL.md` as built, and correct anything the build changed.
6. Because this branch folds into the 2.0 RC (O4): merge `docs/MIGRATION-ACCESS-CONTROL.md` into `docs/MIGRATION-2.0.md`, and validate the merged upgrade the way MIGRATION-2.0 was validated on 2026-10-15: a database built from the last 1.x release, upgraded with the guide's SQL and the new supplemental files and seed, must pass every `pnpm sql:check` assertion and re-run its seed cleanly. Drop what only existed to keep a 2.1 additive: the optional `actions` on admin views becomes required where every loader supplies it. Re-run the Clarion journeys (`~/code/testdeploy/puddleby-clarion/e2e`) against a scaffold from this branch. *Built 2026-10-18:* merged, and the 1.x upgrade revalidated (schema, grants and copy links match a fresh 2.0 database; every assertion passes), except regenerating migrations, which drizzle-kit cannot do non-interactively across the renames (`docs/DEFERRED.md`, and a warning in the guide). `actions` is required on every admin view. The Clarion, upgraded by the guide in a copy (`~/code/testdeploy/clarion-access`), passes all 61 journeys: findings 1, 4, 5, 6, 7 and 12 are fixed, and the upgrade surfaced one thing the guide now says, that an app's own invoker SQL calling the stock primitives must become definer. The journeys were adapted for 2.0 (the seeded menu entries; Agatha giving Bert his role); the seven open findings unrelated to access stay `test.fail`.
7. Bring `docs/ACCESS-CONTROL-USAGE.md` (written ahead of the build, as the target) and the root `README.md` _Access control_ section in line with what was built: every name, file, RPC and screen behaviour they mention must exist and work as described. Walk the admin section in a scaffolded app. Remove the "not yet built" status notes. Keep the README section short and pointing at the usage doc. *Built:* aligned with the build; the admin section was walked by the Phase 7 and 8 browser smoke tests and the Clarion journeys (giving a role from a user's page).

**Gate.** Pause for final review before the branch merges on the train settled by O4.

---

## Phase 11 — Container targets (only on explicit go-ahead, O5)

Do not start this phase unless O5 has been answered "yes, in v1".

Scope: a role assigned on a `section` covers the articles linked to it through `article_section`.
Design it first, as an addition to `docs/ACCESS-CONTROL.md`, covering at least: how a manifest declares the parent relation, how `current_user_article_ids()` unions container grants without per-row cost, what `list_article_access()` reports, and how `RoleAssignmentPanel` shows "via Sports section". Stop for approval before writing code.

---

## Appendix — Phase 0 findings (2026-10-17)

### 1. Repository facts

| Fact the design relies on | Result | Evidence |
| --- | --- | --- |
| `current_user_id()` returns `bigint`, `current_user_admin()` `boolean`, both `STABLE SECURITY DEFINER`, `search_path = ''` | Confirmed | `superprototype/supabase/supplemental/00-auth-functions.sql:36-63` |
| Entity PKs in content and logistic are `bigint` | Confirmed: all 41 tables | `packages/{content,logistic}/src/lib/schema/*.ts` |
| Supplemental files from base, flavour and modules merge into one directory and apply in one sort | Confirmed. Module files are copied in with `overwrite: true`, so two packages shipping the same filename would silently replace one another | `tools/create/src/module-template.ts:35-41`, `tools/cli/src/commands/sync-supabase.ts:91-92` |
| `01-access.sql` sorts after `00-auth-functions.sql` and before every file that will call the access helpers | Confirmed. Today's order: `00-auth-functions`, `00-local-text-rls`, `01-access` (new), `01-content-supplements`, `01-get-dictionary`, `02-content-rls`, `03-base-rls`, `03-content-media`, `04-admin-write-rpc`, `05-logistic-supplements`, `05-user-account-hardening` | as above |
| An edited supplemental file is carried forward in full, by content comparison | Confirmed. It is skipped when its trimmed text appears in any migration, which is why Phase 3's byte-identical-output test matters: unstable output would add a migration on every sync | `sync-supabase.ts:94-108` |
| `discover()` ignores an extra `access` key | Confirmed: plain `JSON.parse`, cast to `SchemaManifest` | `tools/cli/src/lib/discover.ts:28` |
| The stub can impersonate a second non-admin and a group member | Confirmed, and the stub needs nothing. Assertions create principals themselves (insert into `auth.users`, then `ensure_user_account()` under that subject), and can write group membership as the owner before `set local role authenticated` | `scripts/sql-check/20-assert-base.sql:188-231` |
| Supabase type generation picks up tables created in supplemental SQL | **Wrong premise.** The scaffold does not generate Supabase types; its client is untyped unless the developer asks (`superprototype/CLAUDE.md:196`). Every read of an access table goes through an RPC anyway, and an RPC result needs a declared row type at the data module, as `article-preview-token.ts` already does. DESIGN §5.1 is corrected to say so | |
| Column grants (A19) work alongside RLS | Confirmed on `postgres:17-alpine`: with table `UPDATE` revoked and re-granted per column, updating a granted column succeeds (with `returning *`); setting a guarded column, alone or with others, or through `insert … on conflict do update`, is refused; a definer RPC writes it; a column added later is not updatable; `has_column_privilege` gives an assertion what it needs. PostgREST's `PATCH` sets only the payload's columns, so it behaves the same | throwaway container |

### 2. Writes of `article_status_id` and `published_at`

Besides `content_transition_article_status`, one: `createArticle` inserts `article_status_id` (`modules/content/server.superprototype/article.ts:211`), with the lowest-positioned status from `getInitialArticleStatus`. Nothing in content issues an `UPDATE` on `article` from TypeScript.

That insert is a gap A19 does not cover: column `UPDATE` grants say nothing about `INSERT`, so a user holding `article.create` could insert an article already `published`, skipping both `publish` and the checklist. See proposal P1.

### 3. Adoption worklist

**Content** (`modules/content/supplemental/02-content-rls.sql`):

| Tables | Policies today | Kind |
| --- | --- | --- |
| `article` | public read of published; admin all | Access-controlled entity. §3.4 shape, A19 on `article_status_id`, `published_at`, and P1 for insert |
| `article_block`, `article_byline`, `article_section`, `article_topic`, `article_tag` (loop, line 118) | public read via `content_article_public(article_id)`; admin all | Children (A18) |
| `live_coverage`; `live_update` through `live_coverage_id` | public read via the article; admin all | Children (A18); `live_update` checks through its coverage's `article_id` |
| `article_revision`, `article_checklist_state`, `article_preview_token` (loop, line 192) | admin all | Children (A18) |
| `article_assignment` (same loop) | admin all | Relationship (A13): writes need `article.share` and `article.update` |
| `section`, `media_asset` (loop, line 65) | public read; admin all | Scope-level, in the DESIGN §4 catalog |
| `media_asset_rights`, `media_asset_source` (loop, line 192) | admin all | Children of `media_asset`, at scope level only |
| `article_status`, `topic`, `tag`, `author_profile`, `publisher_profile`, `newsletter`, `front`, `front_slot` (line 65) | public read; admin all | Not in the DESIGN §4 catalog, so they stay admin-only unless Phase 8 adds scopes. Fronts and tags are plausibly editor work |
| `publish_checklist_item`, `subscriber`, `newsletter_subscription` (line 192) | admin all | Stay admin-only: configuration and reader PII |
| `comment` | public read, public insert, admin all | Stays as it is unless moderation becomes a scope |

Content functions: `content_transition_article_status` (A19). `set_media_asset_copy`, `set_media_asset_rights`, `create_media_asset` are `SECURITY INVOKER`, so the new policies govern them unchanged. `content_subscribe` and the two preview functions are public-by-design definer functions and are unaffected.

**Logistic** (`modules/logistic/supplemental/05-logistic-supplements.sql:780-950`). The worklist is wider than "policies gating on `current_user_admin()`":

| Tables | Policies today |
| --- | --- |
| all 14 tables | `read … to authenticated using (true)`: **any signed-in user reads everything** |
| all except `stock_adjustment` | admin all |
| `inbound_receipt`(`_line`), `pick_task`(`_line`), `return_authorization`(`_line`), `cycle_count`(`_line`) | `worker_update`: **any signed-in user** may update within a status window, with no permission check |
| `stock_adjustment` | insert by self (`user_account_id = current_user_id()`) |

And the five `SECURITY DEFINER` stock functions (`logistic_adjust_stock`, `_reserve_stock`, `_release_stock_reservation`, `_consume_stock`, `_ensure_stock_level`, lines 119-252) are executable by every authenticated user, check nothing, and take the acting `p_user_account_id` as a **parameter**, so a caller can attribute an adjustment to anyone. That is existing drift, not caused by this work, but Phase 9 has to fix it: the definer functions check `current_user_can()` and take the actor from `current_user_id()`. The eight `SECURITY INVOKER` RPCs follow whatever policies Phase 9 writes.

### 3a. Field-test findings this work must close

The Puddleby Clarion field test (`~/code/testdeploy/puddleby-clarion/FINDINGS.md`, 2026-10-16) found four security problems on the RC, and its `08-sunday-a-nosy-reader` journey pins each as `test.fail`. That journey passing is the acceptance check for Phases 8 and 9.

| Finding | Closed by |
| --- | --- |
| 4. Anyone who signs up can call the stock functions and sign the change as the admin | Phase 9 step 4 |
| 5. "Authenticated" means anyone with an email address; signup is open | A22, Phase 9 step 3. Signup stays open: an account with no role now reaches nothing |
| 6. An approved comment exposes `author_email` to anon: the row policy restricts rows, not columns | Phase 8: revoke table `SELECT` on `comment` from `anon` and `authenticated` and grant it per public column, the A19 technique applied to reads |
| 7. `pick_task_line_worker_update` is `with check (true)`, so a worker can rewrite their own lines | Phase 9: the line's quantities and references change only through `logistic_record_picked_quantity` (A19) |

### 4. Corrections made in this commit

Facts, not decisions:

- DESIGN §5.1: generated-table row types come from declared RPC result types, not Supabase type generation (finding 1).
- PLAN Phase 1 step 4: the access manifest's `after` names only `@sveltebuilder/local-text-schema`. Naming the flavour from a base-template manifest would make `resolve()` throw "Circular dependency" in any scaffold without that flavour (an unknown `after` never reaches in-degree zero, `tools/cli/src/lib/resolve.ts`). FKs to `user_account` go in `01-access.sql`, as content already does for its own (`article-assignment.ts:14`).
- PLAN Phase 2: core RPCs that call `04-admin-write-rpc.sql`'s link-plus-copy function must be `plpgsql`, which resolves the call at run time. `04-` applies after `01-`, and a `language sql` body is checked at creation.

### 5. Proposals (decided 2026-10-17: P1 adopted into A19, P2 as A22, P3 deferred to Phase 8 as recommended)

**P1. Constrain article inserts too (extends A19).**
RLS can't see which columns an update changes, but an insert's `with check` sees the whole new row. So the insert policy can require an unpublished status and a null `published_at` unless the caller holds `article.publish`. One policy, no RPC. Recommendation: adopt, as part of A19.

**P2. Logistic adoption changes what non-admins can do.**
A5 keeps admins' access identical. But today any signed-in user reads all logistic data and can do warehouse work. Gating reads and `worker_update` on permissions (which the model requires) leaves every existing non-admin worker with nothing until someone assigns them a role. The options:
- (a) Accept it, and make the release note and `MIGRATION` entry tell operators to assign `logistic_operator` to existing staff before upgrading.
- (b) Gate writes only, and leave reads open to any signed-in user in v1.
- (c) Add a built-in "every signed-in user" principal that can hold a role.

Recommendation: (a). (b) leaves the whole warehouse readable by anyone who can sign in, including future external-group members. (c) is a second principal kind for a one-time transition. Under (a), Phase 9's behaviour change for non-admins also needs weighing against O4's "2.1 minor".

**P3. Which further content scopes join the catalog.**
`front`, `front_slot`, `tag`, `topic` and `newsletter` are editorial tables that stay admin-only under the DESIGN §4 example. Recommendation: settle with the seeded role set at the start of Phase 8, as already deferred.

---

## Appendix — Phase 4 assertion review (2026-10-17)

Where each DESIGN §9 bullet is asserted. Files are in `scripts/sql-check/`; "25" is `25-assert-access.sql`, "26" is `26-assert-access-entity.sql`, run against a scope (`sql_check_widget`) and an entity (`navigation_item`, declared by `access-fixture.json`) that no module uses.

| §9 bullet | Asserted in | Note |
| --- | --- | --- |
| No assignment: cannot read a non-public row, update, delete | 25 (`current_user_can` false), 26 (`current_user_<entity>_ids` empty) | At the helper level. The same at the row level, through a real module's policies, is Phase 8 and 9 |
| A scope grant admits that scope and no other | 25 | |
| An entity grant admits that row only | 26 | |
| A group grant works; removing the member removes it | 25 (scope, and removal), 26 (entity, internal and external groups) | |
| An expired assignment admits nothing | 25 (scope), 26 (entity) | |
| A global two-scope role admits both; at an entity target, only the matching scope | 25 (global), 26 (entity) | The entity half was added in this review |
| An external group cannot receive a global or scope assignment | 25 | |
| `share` without a permission cannot grant it | 26 | Also: a holder of every permission without `share` is refused |
| A non-admin cannot call an admin RPC; direct DML refused on every access table | 25 (core tables and all nine RPCs), 26 (generated table, anon execute) | |
| Deleting an entity deletes its assignments | 26 | |
| A module-managed role cannot be changed | 25 | Also cannot be deleted |
| Admins keep access with no assignments | 25 (`current_user_can`), 26 (`_actions` holds the whole catalog) | |
| Entity `update` admits that article's child rows only | Phase 8 | Needs content's adopted policies |
| `article.create` without `publish` cannot insert a published article | Phase 8 | |
| `article.update` without `publish` cannot change status directly or publish by RPC | Phase 8 | |
| The `article` column grant names every unguarded column | Phase 8 | |
| `article_assignment` writes need `share` and `update` | Phase 8 | |
| `list_<entity>_access` / `_principal` refuse a non-sharer; a sharer cannot read another entity's grants | 26 | |
| The catalog is present after the migration alone | `sql-check.mjs`, step "access catalog before seed" | Added in this review: the check in 26 ran after the seed, so it could not tell |
| Policies call access helpers as `(select …)` with literal arguments | `20-assert-base.sql` | Also refuses `_actions` in any policy |

**Mutation testing.** Every assertion file was run against deliberately broken SQL in copies of a kept database: 6 breaks of the core SQL, 7 of the generated SQL, 5 bad policy shapes. All 18 are caught, each by the check written for it, and the unbroken control passes. Three of the generated-SQL breaks first slipped through, or were caught by an unrelated error, and the tests were sharpened until each failed for its own reason.
