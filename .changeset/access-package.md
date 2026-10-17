---
'@sveltebuilder/access': minor
'create-sveltebuilder': minor
---

New package `@sveltebuilder/access`: the Drizzle schema for roles and permissions (`permission`, `role`, `role_permission`, `user_group`, `user_group_member`, `role_assignment`), the standard permission actions, and the view-model types its components and screens will share.

Every scaffold now depends on it and registers its schema, and ships `supabase/supplemental/01-access.sql`: the tables' foreign keys to `user_account`, row level security (administrators may read; nobody else may), and every direct write revoked from `anon` and `authenticated`. Nothing grants access through these tables yet. See `docs/ACCESS-CONTROL.md`.
