import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { UserGroupAdminDetailView } from '@sveltebuilder/access/views';
import { listPermission } from '$lib/server/permission';
import { listRole } from '$lib/server/role';
import { listRoleAssignment } from '$lib/server/role-assignment';
import { listUserAccount } from '$lib/server/user-account';
import { deleteUserGroup, getUserGroup } from '$lib/server/user-group';
import {
  addUserGroupMember,
  listUserGroupMember,
  removeUserGroupMember,
} from '$lib/server/user-group-member';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import { formError } from '$lib/server/form-error';
import { createRoleAssignmentAction, deleteRoleAssignmentAction } from '../../role-assignment-action';
import { requireAdministrator } from '../../require-administrator';

export const load: PageServerLoad = async ({ params, locals, parent }): Promise<UserGroupAdminDetailView> => {
  await requireAdministrator(parent);

  const id = parseInt(params.id);
  if (isNaN(id)) throw error(404, 'Not found');

  const [userGroupResult, userAccountsResult, rolesResult, permissionsResult, copy] = await Promise.all([
    getUserGroup(locals.supabase, id),
    listUserAccount(locals.supabase),
    listRole(locals.supabase),
    listPermission(locals.supabase),
    loadScopedCopy(
      locals.supabase,
      ['access', 'role', 'user_group'],
      locals.locale.code,
      locals.defaultLocale.code
    ),
  ]);
  if (userGroupResult.error || userAccountsResult.error || rolesResult.error || permissionsResult.error) {
    throw error(500, 'Failed to load the group.');
  }
  if (!userGroupResult.data) throw error(404, 'Group not found');

  const [membersResult, roleAssignmentsResult] = await Promise.all([
    listUserGroupMember(locals.supabase, id, userAccountsResult.data),
    listRoleAssignment(locals.supabase, { userGroupId: id }, userAccountsResult.data),
  ]);
  if (membersResult.error || roleAssignmentsResult.error) throw error(500, 'Failed to load the group.');

  const memberIds = new Set(membersResult.data.map((member) => member.userAccount.id));

  return {
    userGroup: userGroupResult.data,
    userGroupMembers: membersResult.data,
    userAccounts: userAccountsResult.data
      .filter((userAccount) => !memberIds.has(userAccount.id))
      .map(({ id: userAccountId, emailAddress }) => ({ id: userAccountId, emailAddress })),
    roleAssignments: roleAssignmentsResult.data,
    roles: rolesResult.data,
    scopes: [...new Set(permissionsResult.data.map((permission) => permission.scope))],
    localeCode: locals.locale.code,
    copy,
  };
};

const memberId = (form: FormData) => parseInt((form.get('user_account_id') as string | null) ?? '');

export const actions: Actions = {
  addMember: async ({ params, request, locals }) => {
    const id = parseInt(params.id);
    const userAccountId = memberId(await request.formData());
    if (isNaN(id) || isNaN(userAccountId)) return formError(422, 'error.id_invalid');

    const { error: addError } = await addUserGroupMember(locals.supabase, id, userAccountId);
    if (addError) return formError(500, 'access.error.user_group_member_failed');
    return { success: true as const };
  },

  removeMember: async ({ params, request, locals }) => {
    const id = parseInt(params.id);
    const userAccountId = memberId(await request.formData());
    if (isNaN(id) || isNaN(userAccountId)) return formError(422, 'error.id_invalid');

    const { error: removeError } = await removeUserGroupMember(locals.supabase, id, userAccountId);
    if (removeError) return formError(500, 'access.error.user_group_member_failed');
    return { success: true as const };
  },

  createRoleAssignment: async ({ params, request, locals }) => {
    const id = parseInt(params.id);
    if (isNaN(id)) return formError(422, 'error.id_invalid');
    return createRoleAssignmentAction(locals.supabase, await request.formData(), { userGroupId: id });
  },

  deleteRoleAssignment: async ({ request, locals }) =>
    deleteRoleAssignmentAction(locals.supabase, await request.formData()),

  delete: async ({ params, locals }) => {
    const id = parseInt(params.id);
    if (isNaN(id)) return formError(422, 'error.id_invalid');

    const { error: deleteError } = await deleteUserGroup(locals.supabase, id);
    if (deleteError) return formError(500, 'access.error.user_group_delete_failed');
    throw redirect(303, '/admin/user-group');
  },
};
