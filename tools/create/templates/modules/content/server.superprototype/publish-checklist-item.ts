import type { SupabaseClient } from '@supabase/supabase-js';
import type { PublishChecklistItem } from '@sveltebuilder/content';
import type { QueryResult } from '$lib/server/postgrest';

/** Every item an article is checked against before publishing, in order. */
export async function listPublishChecklistItem(
  supabase: SupabaseClient
): Promise<QueryResult<Pick<PublishChecklistItem, 'id' | 'slug' | 'position' | 'required'>[]>> {
  const { data, error } = await supabase
    .from('publish_checklist_item')
    .select('id, slug, position, required')
    .order('position');
  if (error) return { data: null, error };
  return {
    data: data.map((item) => ({
      id: item.id,
      slug: item.slug,
      position: item.position,
      required: item.required,
    })),
    error: null,
  };
}
