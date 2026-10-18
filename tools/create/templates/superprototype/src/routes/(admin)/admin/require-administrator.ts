import { error } from '@sveltejs/kit';

/**
 * Refuses a staff member a screen only administrators use. The (admin) layout admits staff too
 * (anyone holding a role, A24 in docs/ACCESS-CONTROL-DECISIONS.md) and reports whether this is
 * an administrator; every administrator-only screen calls this first in its loader, passing
 * SvelteKit's `parent`. RLS and the admin RPCs refuse a staff member's reads and writes
 * regardless: this turns a half-empty page into a plain 403.
 */
export async function requireAdministrator(parent: () => Promise<{ admin: boolean }>): Promise<void> {
  const { admin } = await parent();
  if (!admin) throw error(403, 'Administrators only.');
}
