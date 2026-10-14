import type { SupabaseClient } from '@supabase/supabase-js';
import type { Tag } from '@sveltebuilder/content';
import type { QueryResult } from '$lib/server/postgrest';

export async function listTag(supabase: SupabaseClient): Promise<QueryResult<Tag[]>> {
  const { data, error } = await supabase.from('tag').select('id, slug, active, created_at');
  if (error) return { data: null, error };
  return {
    data: data.map((tag) => ({
      id: tag.id,
      slug: tag.slug,
      active: tag.active,
      createdAt: tag.created_at,
    })),
    error: null,
  };
}
