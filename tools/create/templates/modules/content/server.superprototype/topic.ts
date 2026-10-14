import type { SupabaseClient } from '@supabase/supabase-js';
import type { Topic } from '@sveltebuilder/content';
import type { QueryResult } from '$lib/server/postgrest';

export async function listActiveTopic(supabase: SupabaseClient): Promise<QueryResult<Topic[]>> {
  const { data, error } = await supabase
    .from('topic')
    .select('id, slug, active, created_at')
    .eq('active', true);
  if (error) return { data: null, error };
  return {
    data: data.map((topic) => ({
      id: topic.id,
      slug: topic.slug,
      active: topic.active,
      createdAt: topic.created_at,
    })),
    error: null,
  };
}
