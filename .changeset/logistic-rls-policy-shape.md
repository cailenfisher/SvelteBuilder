---
'create-sveltebuilder': patch
'@sveltebuilder/cli': patch
---

Bring the Logistic module's RLS policies onto the sanctioned shape, and make the gate that should
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
