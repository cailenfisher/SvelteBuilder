import type { SupabaseClient } from '@supabase/supabase-js';
import type { QueryResult } from '$lib/server/postgrest';

/**
 * The articles the current user is assigned to, in any assignment role. Being assigned lets them
 * read and edit an article, without publishing, deleting or sharing it
 * (content_assigned_article_ids, 02-content-rls.sql).
 */
export async function listAssignedArticleId(supabase: SupabaseClient): Promise<QueryResult<number[]>> {
  const { data, error } = await supabase.rpc('content_assigned_article_ids');
  if (error) return { data: null, error };
  return { data: ((data as (number | string)[] | null) ?? []).map(Number), error: null };
}
