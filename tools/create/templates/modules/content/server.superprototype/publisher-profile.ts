import type { SupabaseClient } from '@supabase/supabase-js';
import type { PublisherProfile } from '@sveltebuilder/content';
import type { QueryResult } from '$lib/server/postgrest';

/** The publication's identity, a singleton. Null when none is seeded. */
export async function getPublisherProfile(
  supabase: SupabaseClient
): Promise<QueryResult<PublisherProfile | null>> {
  const { data, error } = await supabase
    .from('publisher_profile')
    .select('id, logo_media_asset_id, url, created_at')
    .limit(1)
    .maybeSingle();
  if (error) return { data: null, error };
  return {
    data: data
      ? {
          id: data.id,
          logoMediaAssetId: data.logo_media_asset_id,
          url: data.url,
          createdAt: data.created_at,
        }
      : null,
    error: null,
  };
}
