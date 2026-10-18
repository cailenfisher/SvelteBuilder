// Entity components: each resolves its copy through diglossia's getDictionary(), or a
// `dictionary` prop. Schema and view types are their own exports, `./schema` and `./views`.
export { default as RolePermissionMatrix } from './Role/RolePermission/RolePermissionMatrix.svelte';
export { default as RoleAssignmentTable } from './Role/RoleAssignment/RoleAssignmentTable.svelte';
export { default as RoleAssignmentPanel } from './Role/RoleAssignment/RoleAssignmentPanel.svelte';
export { default as UserGroupMemberTable } from './UserGroup/UserGroupMember/UserGroupMemberTable.svelte';
