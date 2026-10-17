---
'@sveltebuilder/cli': minor
---

`sync:supabase` reads an `access` key in each registry manifest (`permission`: each scope's actions; `entity`: the scopes whose single rows can be granted) and writes `supabase/supplemental/access-generated.sql`:

- the permission catalog, as re-runnable inserts in the migration rather than the seed, since `supabase db push` never runs the seed;
- for each entity scope, a `<scope>_role_assignment` table whose foreign key matches the entity's primary key, with row level security and every direct write revoked;
- `current_user_<scope>_ids(action)` for policies, `current_user_<scope>_actions(ids)` for showing controls, `create_`/`delete_<scope>_role_assignment` (refusing anyone without `share`, or granting more than they hold), and `list_<scope>_access` / `list_<scope>_principal` for the access panel.

The generated file applies directly after `01-access.sql`, whatever either is named. A malformed declaration fails sync with a message naming its manifest, before anything is written.
