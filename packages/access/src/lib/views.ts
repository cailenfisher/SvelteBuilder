/**
 * View-model types for the access components and the screens that host them.
 *
 * Every access table is unreadable to ordinary users. A loader reads them only through the
 * access RPCs (`list_<entity>_access`, `list_<entity>_principal`) or, on the admin screens, as
 * an administrator, and converts the rows it gets to these shapes at the data module. See
 * docs/ACCESS-CONTROL.md §5.
 *
 * None of these carries copy. A role's, a permission's and a group's labels resolve from the
 * dictionary under the `role`, `permission` and `user_group` scopes, by id.
 */

import type { ScreenCopy, ScreenLocale } from '@sveltebuilder/coreui';
import type { Permission, Role, UserGroup } from './schema/index.js';

/** A user as the principal picker and the access tables show one. */
export type UserAccountOption = {
  id: number;
  /** From auth.users. Visible to anyone who can share the row in question (A20). */
  emailAddress: string;
};

/** A group as the principal picker and the access tables show one. Its name is copy. */
export type UserGroupOption = {
  id: number;
  external: boolean;
};

/**
 * One role assignment, at any target width.
 *
 * Exactly one of `userAccount` and `userGroup` is set: the principal holding the role. A null
 * `scope` is a global assignment; `entityId` is set only for an assignment on one row, which is
 * the only kind an entity's access panel can remove there (A17). Every other row in that panel
 * is access inherited from a broader assignment.
 */
export type RoleAssignmentRow = {
  id: number;
  roleId: number;
  userAccount: UserAccountOption | null;
  userGroup: UserGroupOption | null;
  scope: string | null;
  entityId: number | null;
  grantedBy: UserAccountOption | null;
  grantedAt: string;
  expiresAt: string | null;
};

/** A user as the administration screens list one. */
export type UserAccountRow = UserAccountOption & {
  admin: boolean;
  createdAt: string;
};

/** One member of a group. */
export type UserGroupMemberRow = {
  userGroupId: number;
  userAccount: UserAccountOption;
  createdAt: string;
};

// ── Screen contracts ─────────────────────────────────────────────────────────
//
// The access administration screens ship once, in the base template, and their loaders per
// scaffold flavour. As for every module's screens, the view type is the contract between the
// two (docs/MODULE-ROUTES.md): the screen types `data` as it, and the loader returns it. Each
// carries the `access` scope's copy plus the names of the roles and groups it shows.

/** What RoleAssignmentCreateForm offers: every role, and every scope a role can be given on. */
export type RoleAssignmentCreateFormView = {
  roles: Role[];
  /** Distinct scopes of the permission catalog, for a scope-level assignment. */
  scopes: string[];
};

export type RoleAdminListView = ScreenCopy & {
  roles: Role[];
};

export type RoleAdminDetailView = ScreenCopy & {
  role: Role;
  permissions: Permission[];
  rolePermissionIds: number[];
};

export type UserGroupAdminListView = ScreenCopy & {
  userGroups: UserGroup[];
};

export type UserGroupAdminDetailView = ScreenCopy &
  ScreenLocale &
  RoleAssignmentCreateFormView & {
    userGroup: UserGroup;
    userGroupMembers: UserGroupMemberRow[];
    /** The users who are not yet members, for the add-member form. */
    userAccounts: UserAccountOption[];
    roleAssignments: RoleAssignmentRow[];
  };

export type UserAccountAdminListView = ScreenCopy & {
  userAccounts: UserAccountRow[];
};

export type UserAccountAdminDetailView = ScreenCopy &
  ScreenLocale &
  RoleAssignmentCreateFormView & {
    userAccount: UserAccountRow;
    /** The groups the user belongs to. */
    userGroups: UserGroup[];
    roleAssignments: RoleAssignmentRow[];
  };

/**
 * What a module's detail screen adds to show one row's access panel (RoleAssignmentPanel) and
 * its sharing form. Null when the reader may not share that row, in which case the panel is not
 * shown at all. The same for any access-controlled entity, so a module's own view types need not
 * depend on this package: its screen types `data` as its view intersected with
 * `{ access: RoleAssignmentPanelView | null }`.
 */
export type RoleAssignmentPanelView = {
  /** list_<entity>_access: assignments on the row, and broader ones that reach it. */
  roleAssignments: RoleAssignmentRow[];
  /** list_<entity>_principal: everyone the reader may give access to (A20). */
  userAccounts: UserAccountOption[];
  userGroups: UserGroupOption[];
  /** list_scope_role: the roles that apply to the row's scope. */
  roles: Pick<Role, 'id' | 'slug'>[];
};
