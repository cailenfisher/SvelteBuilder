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

/** One member of a group. */
export type UserGroupMemberRow = {
  userGroupId: number;
  userAccount: UserAccountOption;
  createdAt: string;
};
