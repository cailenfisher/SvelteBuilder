import { error } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import { listAssignedArticleId } from '$lib/server/content/article-assignment';
import { listArticleAction } from '$lib/server/content/article-role-assignment';

// Shared by the article list and detail loaders.

/**
 * What the reader may do to each article: their permissions at every width, plus read and edit
 * on any article they are assigned to (content_assigned_article_ids). Used to show only the
 * controls that will work; RLS refuses the rest regardless.
 */
export async function loadArticleAction(
  supabase: SupabaseClient,
  articleIds: number[]
): Promise<Map<number, string[]>> {
  const [actionResult, assignedResult] = await Promise.all([
    listArticleAction(supabase, articleIds),
    listAssignedArticleId(supabase),
  ]);
  if (actionResult.error || assignedResult.error) throw error(500, 'Failed to load article permissions.');

  const assigned = new Set(assignedResult.data);
  return new Map(
    articleIds.map((id) => {
      const actions = new Set(actionResult.data.get(id) ?? []);
      if (assigned.has(id)) {
        actions.add('read');
        actions.add('update');
      }
      return [id, [...actions]];
    })
  );
}
