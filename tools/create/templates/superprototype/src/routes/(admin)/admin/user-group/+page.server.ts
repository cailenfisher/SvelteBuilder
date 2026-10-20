import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { UserGroupAdminListView } from '@sveltebuilder/access/views';
import { createUserGroup, listUserGroup } from '$lib/server/user-group';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import { formError } from '$lib/server/form-error';
import { requireAdministrator } from '../require-access';

export const load: PageServerLoad = async ({ locals, parent }): Promise<UserGroupAdminListView> => {
  await requireAdministrator(parent);

  const [userGroupsResult, copy] = await Promise.all([
    listUserGroup(locals.supabase),
    loadScopedCopy(locals.supabase, ['access', 'user_group'], locals.locale.code, locals.defaultLocale.code),
  ]);
  if (userGroupsResult.error) throw error(500, 'Failed to load groups.');

  return { userGroups: userGroupsResult.data, copy };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const form = await request.formData();
    const name = (form.get('name') as string | null)?.trim();
    const external = form.get('external') !== null;
    if (!name) return formError(422, 'access.error.name_required');

    const { data: userGroupId, error: createError } = await createUserGroup(locals.supabase, {
      localeId: locals.locale.id,
      name,
      external,
    });
    if (createError) return formError(500, 'access.error.user_group_create_failed');

    throw redirect(303, `/admin/user-group/${userGroupId}`);
  },
};
