import type { SupabaseClient } from '@supabase/supabase-js';
import type { Comment } from '@sveltebuilder/content';
import type { QueryResult } from '$lib/server/postgrest';

/**
 * An article's comments, oldest first. RLS already restricts a reader to approved comments on
 * publicly visible articles, so the article is the only filter here.
 */
export async function listComment(
  supabase: SupabaseClient,
  articleId: number
): Promise<QueryResult<Comment[]>> {
  const { data, error } = await supabase
    .from('comment')
    .select(
      'id, article_id, user_account_id, parent_comment_id, author_name, author_email, body, status, created_at, updated_at'
    )
    .eq('article_id', articleId)
    .order('created_at');
  if (error) return { data: null, error };
  return {
    data: data.map((comment) => ({
      id: comment.id,
      articleId: comment.article_id,
      userAccountId: comment.user_account_id,
      parentCommentId: comment.parent_comment_id,
      authorName: comment.author_name,
      authorEmail: comment.author_email,
      body: comment.body,
      status: comment.status,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
    })),
    error: null,
  };
}

/**
 * Submits a reader's comment, always as pending. One insert, and three things make it safe
 * without the caller checking any of them, all RLS rather than application logic: a comment may
 * only be inserted as pending, only against a publicly visible article, and only when that
 * article accepts comments. The insert policy's refusal arrives as 42501.
 */
export async function createComment(
  supabase: SupabaseClient,
  fields: Pick<Comment, 'articleId' | 'userAccountId' | 'authorName' | 'authorEmail' | 'body'>
): Promise<QueryResult<null>> {
  const { error } = await supabase.from('comment').insert({
    article_id: fields.articleId,
    user_account_id: fields.userAccountId,
    author_name: fields.authorName,
    author_email: fields.authorEmail,
    body: fields.body,
    status: 'pending',
  });
  if (error) return { data: null, error };
  return { data: null, error: null };
}
