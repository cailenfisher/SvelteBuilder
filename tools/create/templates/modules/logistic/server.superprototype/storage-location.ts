import type { SupabaseClient } from '@supabase/supabase-js';
import type { StorageLocationType } from '@sveltebuilder/logistic';
import type { StorageLocationOption } from '@sveltebuilder/logistic/views';
import type { QueryResult } from '$lib/server/postgrest';

/**
 * The active locations of one type, in walk order. Only bins hold stock; the coarser levels
 * of the tree are for navigation, so screens that move or count stock ask for bins.
 */
export async function listStorageLocationOption(
  supabase: SupabaseClient,
  locationType: StorageLocationType
): Promise<QueryResult<StorageLocationOption[]>> {
  const { data, error } = await supabase
    .from('storage_location')
    .select('id, slug, location_type')
    .eq('active', true)
    .eq('location_type', locationType)
    .order('position');
  if (error) return { data: null, error };
  return {
    data: data.map((location) => ({
      id: location.id,
      slug: location.slug,
      locationType: location.location_type,
    })),
    error: null,
  };
}
