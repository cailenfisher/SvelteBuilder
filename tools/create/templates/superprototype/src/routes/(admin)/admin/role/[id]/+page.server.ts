import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { RoleAdminDetailView } from '@sveltebuilder/access/views';
import { listPermission } from '$lib/server/permission';
import { createRole, deleteRole, getRole } from '$lib/server/role';
import { listRolePermissionId, setRolePermission } from '$lib/server/role-permission';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import { formError, postgrestFormError } from '$lib/server/form-error';
import { requireAdministrator } from '../../require-access';

export const load: PageServerLoad = async ({ params, locals, parent }): Promise<RoleAdminDetailView> => {
  await requireAdministrator(parent);

  const id = parseInt(params.id);
  if (isNaN(id)) throw error(404, 'Not found');

  const [roleResult, permissionsResult, heldResult, copy] = await Promise.all([
    getRole(locals.supabase, id),
    listPermission(locals.supabase),
    listRolePermissionId(locals.supabase, id),
    loadScopedCopy(locals.supabase, ['access', 'role'], locals.locale.code, locals.defaultLocale.code),
  ]);
  if (roleResult.error || permissionsResult.error || heldResult.error) {
    throw error(500, 'Failed to load the role.');
  }
  if (!roleResult.data) throw error(404, 'Role not found');

  return {
    role: roleResult.data,
    permissions: permissionsResult.data,
    rolePermissionIds: heldResult.data,
    copy,
  };
};

export const actions: Actions = {
  setPermission: async ({ params, request, locals }) => {
    const id = parseInt(params.id);
    const form = await request.formData();
    const permissionIds = form.getAll('permission_id').map((value) => parseInt(value as string));
    if (isNaN(id) || permissionIds.some((permissionId) => isNaN(permissionId))) {
      return formError(422, 'error.id_invalid');
    }

    const { error: setError } = await setRolePermission(locals.supabase, id, permissionIds);
    if (setError) {
      return postgrestFormError(setError, 'access.error.role_update_failed', {
        '42501': 'access.error.role_managed',
      });
    }
    return { success: true as const };
  },

  // A copy with the same permissions, which an administrator may then change. The only way to
  // customise a module-managed role (O6).
  clone: async ({ params, request, locals }) => {
    const id = parseInt(params.id);
    const form = await request.formData();
    const name = (form.get('name') as string | null)?.trim();
    if (isNaN(id)) return formError(422, 'error.id_invalid');
    if (!name) return formError(422, 'access.error.name_required');

    const { data: permissionIds, error: heldError } = await listRolePermissionId(locals.supabase, id);
    if (heldError) return formError(500, 'access.error.role_create_failed');

    const { data: cloneId, error: createError } = await createRole(locals.supabase, {
      localeId: locals.locale.id,
      name,
      permissionIds,
    });
    if (createError) return formError(500, 'access.error.role_create_failed');

    throw redirect(303, `/admin/role/${cloneId}`);
  },

  delete: async ({ params, locals }) => {
    const id = parseInt(params.id);
    if (isNaN(id)) return formError(422, 'error.id_invalid');

    const { error: deleteError } = await deleteRole(locals.supabase, id);
    if (deleteError) {
      return postgrestFormError(deleteError, 'access.error.role_delete_failed', {
        '42501': 'access.error.role_managed',
      });
    }
    throw redirect(303, '/admin/role');
  },
};
