import type { SupabaseClient } from '@supabase/supabase-js';
import type { ArticleChecklistState } from '@sveltebuilder/content';
import type { QueryResult } from '$lib/server/postgrest';

/** Which checklist items an article has satisfied. An item with no row is unsatisfied. */
export async function listArticleChecklistState(
  supabase: SupabaseClient,
  articleId: number
): Promise<QueryResult<Pick<ArticleChecklistState, 'publishChecklistItemId' | 'satisfied'>[]>> {
  const { data, error } = await supabase
    .from('article_checklist_state')
    .select('publish_checklist_item_id, satisfied')
    .eq('article_id', articleId);
  if (error) return { data: null, error };
  return {
    data: data.map((row) => ({
      publishChecklistItemId: row.publish_checklist_item_id,
      satisfied: row.satisfied,
    })),
    error: null,
  };
}

/**
 * Ticks or unticks one item. The unique index on (article_id, publish_checklist_item_id) is
 * what makes this a single upsert rather than a read-then-insert-or-update.
 */
export async function saveArticleChecklistState(
  supabase: SupabaseClient,
  state: Pick<ArticleChecklistState, 'articleId' | 'publishChecklistItemId' | 'satisfied'>
): Promise<QueryResult<null>> {
  const { error } = await supabase.from('article_checklist_state').upsert(
    {
      article_id: state.articleId,
      publish_checklist_item_id: state.publishChecklistItemId,
      satisfied: state.satisfied,
      satisfied_at: state.satisfied ? new Date().toISOString() : null,
    },
    { onConflict: 'article_id,publish_checklist_item_id' }
  );
  if (error) return { data: null, error };
  return { data: null, error: null };
}
