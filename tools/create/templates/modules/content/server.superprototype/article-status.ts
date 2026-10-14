import type { SupabaseClient } from '@supabase/supabase-js';
import type { ArticleStatus } from '@sveltebuilder/content';
import type { QueryResult } from '$lib/server/postgrest';

/** Every workflow status, in workflow order. */
export async function listArticleStatus(
  supabase: SupabaseClient
): Promise<QueryResult<ArticleStatus[]>> {
  const { data, error } = await supabase
    .from('article_status')
    .select('id, slug, position')
    .order('position');
  if (error) return { data: null, error };
  return {
    data: data.map((row) => ({ id: row.id, slug: row.slug, position: row.position })),
    error: null,
  };
}

export async function getArticleStatus(
  supabase: SupabaseClient,
  id: number
): Promise<QueryResult<ArticleStatus | null>> {
  const { data, error } = await supabase
    .from('article_status')
    .select('id, slug, position')
    .eq('id', id)
    .maybeSingle();
  if (error) return { data: null, error };
  return {
    data: data ? { id: data.id, slug: data.slug, position: data.position } : null,
    error: null,
  };
}

/**
 * The status a new article starts at: the first by position rather than a hard-coded slug, so
 * renaming or reordering the workflow does not strand article creation. Null when no statuses
 * are configured.
 */
export async function getInitialArticleStatus(
  supabase: SupabaseClient
): Promise<QueryResult<Pick<ArticleStatus, 'id'> | null>> {
  const { data, error } = await supabase
    .from('article_status')
    .select('id')
    .order('position')
    .limit(1)
    .maybeSingle();
  if (error) return { data: null, error };
  return { data, error: null };
}
