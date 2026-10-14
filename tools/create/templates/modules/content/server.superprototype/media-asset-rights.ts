import type { SupabaseClient } from '@supabase/supabase-js';
import type { MediaAssetRights } from '@sveltebuilder/content';
import type { QueryResult } from '$lib/server/postgrest';

/**
 * The rights recorded for the given assets. Admin-only under RLS, which is who publishes; the
 * public page reads the media_asset_attribution view instead.
 */
export async function listMediaAssetRights(
  supabase: SupabaseClient,
  ids: number[]
): Promise<
  QueryResult<Pick<MediaAssetRights, 'mediaAssetId' | 'license' | 'creditRequired' | 'expiresAt'>[]>
> {
  if (ids.length === 0) return { data: [], error: null };
  const { data, error } = await supabase
    .from('media_asset_rights')
    .select('media_asset_id, license, credit_required, expires_at')
    .in('media_asset_id', ids);
  if (error) return { data: null, error };
  return {
    data: data.map((row) => ({
      mediaAssetId: row.media_asset_id,
      license: row.license,
      creditRequired: row.credit_required,
      expiresAt: row.expires_at,
    })),
    error: null,
  };
}
