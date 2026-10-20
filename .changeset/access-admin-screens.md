---
'create-sveltebuilder': minor
'@sveltebuilder/access': minor
'@sveltebuilder/local-text-schema': patch
---

Scaffolds ship the access administration screens, linked from the admin navigation:

- `/admin/role` and `/admin/role/[id]`: create a role, choose its permissions on the permission grid, clone a module's role to customise it, delete an administrator's role.
- `/admin/user-group` and `/admin/user-group/[id]`: create a group (internal, or external for an outside organisation, fixed at creation), add and remove members, give it roles everywhere or on every item of a kind (never for an external group).
- `/admin/user-account` and `/admin/user-account/[id]`: every user by email address, their groups and roles, and promoting or demoting an administrator (never the last one).

SuperPrototype adds `admin_list_user_account()`, an administrator-only definer function listing users with their email addresses, since email lives in `auth.users`; one data module per access table in `src/lib/server/`; and `postgrestFormError()` in `$lib/server/form-error`, which reports a refused or invalid write by its Postgres code. `@sveltebuilder/access/views` exports the screens' view types. The `access` copy seed now follows the module seed shape.
