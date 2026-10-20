---
'create-sveltebuilder': minor
---

Scaffolds now ship the core of access control in `supabase/supplemental/01-access.sql`:

- `current_user_can(scope, action)` and `current_user_group_ids()`, the helpers a policy calls. An administrator can do everything; anyone else can through an unexpired global or scope role assignment, their own or one of their groups'.
- Administrator RPCs for roles (`create_role`, `set_role_permissions`, `delete_role`), groups (`create_user_group`, `delete_user_group`, `add_user_group_member`, `remove_user_group_member`) and assignments (`create_role_assignment`, `delete_role_assignment`). Each checks administrator status itself and raises `42501` otherwise. A module-managed role cannot be changed or deleted.
- A trigger refusing an assignment to a scope no permission names, and any global or scope assignment to an external group.
