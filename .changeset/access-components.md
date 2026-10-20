---
'@sveltebuilder/access': minor
'create-sveltebuilder': minor
---

`@sveltebuilder/access` exports its components and stylesheet (`@sveltebuilder/access/styles/components.css`):

- `RolePermissionMatrix`: a role's permissions on coreui's `CheckboxMatrix`, kinds of thing down the side and actions across the top; read-only for a module-managed role.
- `RoleAssignmentTable`: assignments with who holds them, the role, where it applies and when it ends.
- `RoleAssignmentPanel`: one row's access, from `list_<entity>_access`, splitting access given on the row (removable through the host's `removeAction`) from access inherited from a broader role (never removable there).
- `UserGroupMemberTable`: a group's members.

Each resolves its copy from the dictionary, with the usual `dictionary` prop override. Scaffolds import the stylesheet after coreui's, and seed the `access` scope's UI copy in English and French (`supabase/seeds/01-access.sql`).
