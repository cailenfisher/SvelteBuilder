import { error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { UserAccountAdminDetailView } from '@sveltebuilder/access/views';
import { listPermission } from '$lib/server/permission';
import { listRole } from '$lib/server/role';
import { listRoleAssignment } from '$lib/server/role-assignment';
import { listUserAccount, setUserAccountAdmin } from '$lib/server/user-account';
import { listUserGroupOfUserAccount } from '$lib/server/user-group-member';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import { formError } from '$lib/server/form-error';
import { createRoleAssignmentAction, deleteRoleAssignmentAction } from '../../role-assignment-action';

export const load: PageServerLoad = async ({ params, locals }): Promise<UserAccountAdminDetailView> => {
  const id = parseInt(params.id);
  if (isNaN(id)) throw error(404, 'Not found');

  const [userAccountsResult, userGroupsResult, rolesResult, permissionsResult, copy] = await Promise.all([
    listUserAccount(locals.supabase),
    listUserGroupOfUserAccount(locals.supabase, id),
    listRole(locals.supabase),
    listPermission(locals.supabase),
    loadScopedCopy(
      locals.supabase,
      ['access', 'role', 'user_group'],
      locals.locale.code,
      locals.defaultLocale.code
    ),
  ]);
  if (userAccountsResult.error || userGroupsResult.error || rolesResult.error || permissionsResult.error) {
    throw error(500, 'Failed to load the user.');
  }
  const userAccount = userAccountsResult.data.find((candidate) => candidate.id === id);
  if (!userAccount) throw error(404, 'User not found');

  const { data: roleAssignments, error: assignmentError } = await listRoleAssignment(
    locals.supabase,
    { userAccountId: id },
    userAccountsResult.data
  );
  if (assignmentError) throw error(500, 'Failed to load the user.');

  return {
    userAccount,
    userGroups: userGroupsResult.data,
    roleAssignments,
    roles: rolesResult.data,
    scopes: [...new Set(permissionsResult.data.map((permission) => permission.scope))],
    localeCode: locals.locale.code,
    copy,
  };
};

export const actions: Actions = {
  setAdmin: async ({ params, request, locals }) => {
    const id = parseInt(params.id);
    const admin = (await request.formData()).get('admin') === 'true';
    if (isNaN(id)) return formError(422, 'error.id_invalid');

    // Refused for the last administrator, which is the case worth saying in the message.
    const { error: setError } = await setUserAccountAdmin(locals.supabase, id, admin);
    if (setError) return formError(409, 'access.error.user_account_admin_failed');
    return { success: true as const };
  },

  createRoleAssignment: async ({ params, request, locals }) => {
    const id = parseInt(params.id);
    if (isNaN(id)) return formError(422, 'error.id_invalid');
    return createRoleAssignmentAction(locals.supabase, await request.formData(), { userAccountId: id });
  },

  deleteRoleAssignment: async ({ request, locals }) =>
    deleteRoleAssignmentAction(locals.supabase, await request.formData()),
};
