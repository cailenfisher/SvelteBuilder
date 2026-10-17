import type { SupabaseClient } from '@supabase/supabase-js';
import type { MediaAsset, MediaAssetAttribution } from '@sveltebuilder/content';
import type { QueryResult } from '$lib/server/postgrest';

/** The given assets. An empty list asks the database nothing. */
export async function listMediaAsset(
  supabase: SupabaseClient,
  ids: number[]
): Promise<QueryResult<MediaAsset[]>> {
  if (ids.length === 0) return { data: [], error: null };
  const { data, error } = await supabase
    .from('media_asset')
    .select('id, media_type, storage_key, width, height, mime_type, user_account_id, created_at')
    .in('id', ids);
  if (error) return { data: null, error };
  return {
    data: data.map((asset) => ({
      id: asset.id,
      mediaType: asset.media_type,
      storageKey: asset.storage_key,
      width: asset.width,
      height: asset.height,
      mimeType: asset.mime_type,
      userAccountId: asset.user_account_id,
      createdAt: asset.created_at,
    })),
    error: null,
  };
}

/**
 * Public provenance for the credit lines under the given assets: license and source URLs, for
 * the asset kinds credited in public. Read from the media_asset_attribution view, because the
 * rights and source tables behind it are admin-only.
 */
export async function listMediaAssetAttribution(
  supabase: SupabaseClient,
  ids: number[]
): Promise<QueryResult<MediaAssetAttribution[]>> {
  if (ids.length === 0) return { data: [], error: null };
  const { data, error } = await supabase
    .from('media_asset_attribution')
    .select('media_asset_id, license, source_url, license_url')
    .in('media_asset_id', ids);
  if (error) return { data: null, error };
  return {
    data: data.map((row) => ({
      mediaAssetId: row.media_asset_id,
      license: row.license,
      sourceUrl: row.source_url,
      licenseUrl: row.license_url,
    })),
    error: null,
  };
}
