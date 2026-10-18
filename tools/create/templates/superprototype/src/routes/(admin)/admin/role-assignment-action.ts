import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createRoleAssignment,
  deleteRoleAssignment,
  type RoleAssignmentPrincipal,
} from '$lib/server/role-assignment';
import { formError, postgrestFormError } from '$lib/server/form-error';

// The role-assignment actions the user and group detail screens share: both post
// RoleAssignmentCreateForm and RoleAssignmentTable's remove control to the same action names.

/**
 * `role_id`, `scope` (`*` for everywhere, which no scope can be named) and an optional
 * `expires_at`, which RoleAssignmentCreateForm's picker submits as a UTC wall-clock time with
 * no offset.
 */
export async function createRoleAssignmentAction(
  supabase: SupabaseClient,
  form: FormData,
  principal: RoleAssignmentPrincipal
) {
  const roleId = parseInt((form.get('role_id') as string | null) ?? '');
  const scopeInput = (form.get('scope') as string | null)?.trim() ?? '';
  const scope = scopeInput === '*' ? null : scopeInput;
  const expiresAtInput = (form.get('expires_at') as string | null)?.trim() || null;
  const expiresAt = expiresAtInput === null ? null : new Date(`${expiresAtInput}Z`);

  if (isNaN(roleId) || scope === '' || (expiresAt !== null && isNaN(expiresAt.getTime()))) {
    return formError(422, 'access.error.role_assignment_input');
  }

  const { error } = await createRoleAssignment(supabase, {
    roleId,
    principal,
    scope,
    expiresAt: expiresAt?.toISOString() ?? null,
  });
  if (error) {
    return postgrestFormError(error, 'access.error.role_assignment_failed', {
      '23505': 'access.error.role_assignment_duplicate',
      '23503': 'access.error.role_assignment_input',
      '23514': 'access.error.role_assignment_external',
    });
  }
  return { success: true as const };
}

export async function deleteRoleAssignmentAction(supabase: SupabaseClient, form: FormData) {
  const id = parseInt((form.get('role_assignment_id') as string | null) ?? '');
  if (isNaN(id)) return formError(422, 'error.id_invalid');

  const { error } = await deleteRoleAssignment(supabase, id);
  if (error) return formError(500, 'access.error.role_assignment_failed');
  return { success: true as const };
}
