import type { SupabaseClient } from '@supabase/supabase-js';
import type { Permission } from '@sveltebuilder/access/schema';
import type { QueryResult } from '$lib/server/postgrest';

/**
 * The permission catalog, by scope then action. sync:supabase writes it from every module's
 * registry manifest; nothing in the app changes it. Readable by administrators only.
 */
export async function listPermission(supabase: SupabaseClient): Promise<QueryResult<Permission[]>> {
  const { data, error } = await supabase
    .from('permission')
    .select('id, scope, action')
    .order('scope')
    .order('action');
  if (error) return { data: null, error };
  return { data, error: null };
}
