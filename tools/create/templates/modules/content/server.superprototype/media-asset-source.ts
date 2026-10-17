import type { SupabaseClient } from '@supabase/supabase-js';
import type { MediaAssetSource } from '@sveltebuilder/content';
import type { QueryResult } from '$lib/server/postgrest';

/** Where the given assets came from. Admin-only under RLS, like the rights. */
export async function listMediaAssetSource(
  supabase: SupabaseClient,
  ids: number[]
): Promise<QueryResult<Pick<MediaAssetSource, 'mediaAssetId' | 'sourceUrl' | 'licenseUrl'>[]>> {
  if (ids.length === 0) return { data: [], error: null };
  const { data, error } = await supabase
    .from('media_asset_source')
    .select('media_asset_id, source_url, license_url')
    .in('media_asset_id', ids);
  if (error) return { data: null, error };
  return {
    data: data.map((row) => ({
      mediaAssetId: row.media_asset_id,
      sourceUrl: row.source_url,
      licenseUrl: row.license_url,
    })),
    error: null,
  };
}
