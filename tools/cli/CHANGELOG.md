# @sveltebuilder/cli

## 0.1.0-rc.2

### Minor Changes

- [#47](https://github.com/cailenfisher/SvelteBuilder/pull/47) [`3b98e10`](https://github.com/cailenfisher/SvelteBuilder/commit/3b98e102b31e94f2cd3fa725ca2901e5e1feaab6) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Content adopts roles and permissions (docs/ACCESS-CONTROL.md §7).

  **Breaking (content):** `article_assignment.role` is now `article_assignment_role`, and the exported `ArticleAssignment` type's `role` field is `articleAssignmentRole`. Run the rename in `docs/MIGRATION-2.0.md` before syncing. `CommentList` takes `CommentRow` (a comment without its author's email address); a `Comment` still satisfies it.

  Content's manifest declares its permission catalog and per-article access; its seed adds the Editor, Writer and Contributor roles. Its policies now grant by permission, by role on a single article, and by being assigned to an article, which lets you read and edit it and its body. Creating an article goes through `content_create_article`, which also writes its headline and makes the creator its author. Only `content_transition_article_status` changes an article's status, and moving to or from published takes `article.publish`. Assigning someone to an article takes `article.share`. A commenter's email address is selectable by nobody through the API. The article views gain optional `actions`; `@sveltebuilder/access/views` gains `RoleAssignmentPanelView`.

  Scaffolds admit staff to `/admin`: anyone holding a role sees the admin area and the menu entries for scopes they hold (`navigation_item.permission_scope`), while administrator screens refuse them in their loaders. The article screens show only the controls the reader may use, and the access panel to anyone who may share the article. `current_user_scopes()` and `list_scope_role()` join the core access SQL, and `sync:supabase` generates an entity-aware `current_user_scopes()`.

- [#47](https://github.com/cailenfisher/SvelteBuilder/pull/47) [`9887488`](https://github.com/cailenfisher/SvelteBuilder/commit/9887488c54628dd1ce5f5acf4f0bf2c39d1e740a) Thanks [@cailenfisher](https://github.com/cailenfisher)! - `sync:supabase` reads an `access` key in each registry manifest (`permission`: each scope's actions; `entity`: the scopes whose single rows can be granted) and writes `supabase/supplemental/access-generated.sql`:
  - the permission catalog, as re-runnable inserts in the migration rather than the seed, since `supabase db push` never runs the seed;
  - for each entity scope, a `<scope>_role_assignment` table whose foreign key matches the entity's primary key, with row level security and every direct write revoked;
  - `current_user_<scope>_ids(action)` for policies, `current_user_<scope>_actions(ids)` for showing controls, `create_`/`delete_<scope>_role_assignment` (refusing anyone without `share`, or granting more than they hold), and `list_<scope>_access` / `list_<scope>_principal` for the access panel.

  The generated file applies directly after `01-access.sql`, whatever either is named. A malformed declaration fails sync with a message naming its manifest, before anything is written.

### Patch Changes

- [#47](https://github.com/cailenfisher/SvelteBuilder/pull/47) [`4d087c2`](https://github.com/cailenfisher/SvelteBuilder/commit/4d087c232835e3d328ff292129e70be299782330) Thanks [@cailenfisher](https://github.com/cailenfisher)! - `sync:supabase` fails when drizzle-kit asks whether a schema object was renamed and there is no terminal to answer. drizzle-kit gave up at the question and exited 0, so sync reported success having written no schema migration. It now names the question and asks you to run sync in a terminal.

- Updated dependencies [[`d227635`](https://github.com/cailenfisher/SvelteBuilder/commit/d227635fb77d0232d0fd56fc277520de71b62298)]:
  - @sveltebuilder/local-text-schema@0.3.0-rc.1

## 0.0.16-rc.1

### Patch Changes

- [#43](https://github.com/cailenfisher/SvelteBuilder/pull/43) [`fe6c120`](https://github.com/cailenfisher/SvelteBuilder/commit/fe6c120da073b1cc9c6bb6c43c0d3a6a21a12072) Thanks [@cailenfisher](https://github.com/cailenfisher)! - `sync:supabase` writes new or changed `supabase/supplemental/*.sql` into a migration created by that run, never into an existing one. With no schema change it asks drizzle-kit for an empty custom migration (`NNNN_supplemental.sql`), registered in drizzle's journal so numbering stays consistent.

  Previously the SQL was appended to the latest migration, which a hosted project had usually already applied: `supabase db push` never ran it, so an RLS fix or a new function added after the first deploy never reached production, while `db reset` locally hid the problem.

## 0.0.16-rc.0

### Patch Changes

- Updated dependencies [[`1e4a485`](https://github.com/cailenfisher/SvelteBuilder/commit/1e4a48532161b74e527af2fafaaf1c14af73ee69), [`1fb15dd`](https://github.com/cailenfisher/SvelteBuilder/commit/1fb15ddc1f2481101b34ecd9654e71e023f6dc4e), [`9ce6154`](https://github.com/cailenfisher/SvelteBuilder/commit/9ce6154fb7c4f8bef568cfae8242d910a431c1d3), [`5a9b980`](https://github.com/cailenfisher/SvelteBuilder/commit/5a9b980d674ed60861ef3eda383d5c82b0833bdf)]:
  - @sveltebuilder/local-text-schema@0.3.0-rc.0

## 0.0.15

### Patch Changes

- [#17](https://github.com/cailenfisher/SvelteBuilder/pull/17) [`6f94556`](https://github.com/cailenfisher/SvelteBuilder/commit/6f94556a5bb311ba05ef997c00737d6f3ba9e1b7) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Bring the Logistic module's RLS policies onto the sanctioned shape, and make the gate that should
  have caught the drift actually run.

  **The policies.** All 40 of the module's policies called `public.current_user_id()` bare rather than
  as `(select …)`, and the 15 admin policies re-implemented the admin check as an inline
  `exists (select 1 from public.user_account where id = … and admin)` instead of calling
  `public.current_user_admin()`. The 37 bare calls are now wrapped and the inline checks replaced.

  The inline form was the one with teeth. It runs as the caller, so it re-enters `user_account`'s own
  policies and resolved only because `user_account_owner_read` admits exactly the row it asked for
  (`(select public.current_user_id()) = id`). Narrowing that policy later — gating it on an active
  flag, say — would have made all 15 admin policies deny admins, with nothing to point at.
  `current_user_admin()` is SECURITY DEFINER and does not have the problem. The file's own header
  comment had prescribed the inline form as the target, so it is replaced with the three conventions.

  **A new assertion.** `pnpm sql:check` now checks policy _shape_ across every policy in `public`: that
  no policy calls an identity helper bare, and that none tests `user_account.admin` inline. Both
  anti-patterns typecheck nowhere, pass every other assertion, and behave correctly in any test that
  runs as a single principal. Verified in both directions — it names all 20 drifted policies when the
  old definitions are restored.

  **`sync:supabase` resolved the wrong project root under any package manager.** It consulted
  `INIT_CWD` ahead of `process.cwd()`. A package manager sets `INIT_CWD` to the directory the user
  typed the command in, not the project root, and every grandchild process inherits it — so the CLI,
  spawned by a script in some other directory, was silently redirected back to wherever the outer
  command started, found no manifests, and generated nothing. With an empty registry it then warned
  and returned 0, so callers reported success. Root resolution is now `root ?? process.cwd()`, an
  empty registry is a hard error, and the CLI's commands exit non-zero on a thrown error instead of
  surfacing an unhandled rejection.

  The effect was that `pnpm sql:check` could not get past its own `sync:supabase` step, and
  `pnpm scaffold:check`, which never asserts that migrations were produced, ran that step as a no-op
  while reporting it green.

## 0.0.14

### Patch Changes

- [#11](https://github.com/cailenfisher/SvelteBuilder/pull/11) [`99b6a39`](https://github.com/cailenfisher/SvelteBuilder/commit/99b6a39abb4483d5646a78dad81d229808f8d598) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Stop `sync:supabase` re-appending every supplemental file to each new migration.

  The already-appended check only inspected the newest migration. A freshly generated migration
  contains no markers, so every schema change re-appended the project's entire `supabase/supplemental/`
  set into it — by the second migration the RLS policies, auth functions, and RPCs were all duplicated,
  and they accumulated another copy per migration after that. The SQL is idempotent, so `db reset` still
  produced a correct database; the migrations just grew a full copy of it each time.

  The check now runs against all migrations, and tests each file's content rather than its marker. An
  unchanged supplemental file is found verbatim in an earlier migration and skipped; an edited one is
  not found, so it is appended to the latest migration and reaches the database on the next reset. A
  marker-only check would have fixed the duplication but left edited supplemental SQL permanently
  unapplied. Comparing content also recognises blocks appended by earlier versions of this command,
  which wrote the same marker without one.

- Updated dependencies [[`99b6a39`](https://github.com/cailenfisher/SvelteBuilder/commit/99b6a39abb4483d5646a78dad81d229808f8d598)]:
  - @sveltebuilder/local-text-schema@0.2.0
