import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { RoleAdminListView } from '@sveltebuilder/access/views';
import { createRole, listRole } from '$lib/server/role';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import { formError } from '$lib/server/form-error';
import { requireAdministrator } from '../require-administrator';

export const load: PageServerLoad = async ({ locals, parent }): Promise<RoleAdminListView> => {
  await requireAdministrator(parent);

  const [rolesResult, copy] = await Promise.all([
    listRole(locals.supabase),
    loadScopedCopy(locals.supabase, ['access', 'role'], locals.locale.code, locals.defaultLocale.code),
  ]);
  if (rolesResult.error) throw error(500, 'Failed to load roles.');

  return { roles: rolesResult.data, copy };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const form = await request.formData();
    const name = (form.get('name') as string | null)?.trim();
    if (!name) return formError(422, 'access.error.name_required');

    const { data: roleId, error: createError } = await createRole(locals.supabase, {
      localeId: locals.locale.id,
      name,
      permissionIds: [],
    });
    if (createError) return formError(500, 'access.error.role_create_failed');

    throw redirect(303, `/admin/role/${roleId}`);
  },
};
