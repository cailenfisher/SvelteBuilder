import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  RoleAssignmentRow,
  UserAccountOption,
  UserGroupOption,
} from '@sveltebuilder/access/views';
import type { QueryResult } from '$lib/server/postgrest';

// Access on single articles: the article_role_assignment table sync:supabase generates from this
// module's manifest, and the functions generated with it (docs/ACCESS-CONTROL.md §3.2). Every
// read goes through a function, because the table is readable only to sharers and grantees.

/**
 * What the current user may do to each article, every width counted: as an administrator, by a
 * broad role, or by a role on that article (current_user_article_actions). Being assigned to an
 * article is not included; listAssignedArticleId answers that.
 */
export async function listArticleAction(
  supabase: SupabaseClient,
  articleIds: number[]
): Promise<QueryResult<Map<number, string[]>>> {
  const actions = new Map<number, string[]>(articleIds.map((id) => [id, []]));
  if (articleIds.length === 0) return { data: actions, error: null };

  const { data, error } = await supabase.rpc('current_user_article_actions', { p_article_ids: articleIds });
  if (error) return { data: null, error };
  for (const row of (data as { article_id: number | string; action: string }[] | null) ?? []) {
    actions.get(Number(row.article_id))?.push(row.action);
  }
  return { data: actions, error: null };
}

type ArticleAccessRecord = {
  id: number;
  role_id: number;
  user_account_id: number | string | null;
  email_address: string | null;
  user_group_id: number | null;
  external: boolean | null;
  scope: string | null;
  article_id: number | string | null;
  granted_by: number | string | null;
  granted_by_email_address: string | null;
  granted_at: string;
  expires_at: string | null;
};

/**
 * One article's access panel (list_article_access): its own assignments, and the broader ones
 * that reach it. Refused with 42501 for a reader who may not share it.
 */
export async function listArticleAccess(
  supabase: SupabaseClient,
  articleId: number
): Promise<QueryResult<RoleAssignmentRow[]>> {
  const { data, error } = await supabase.rpc('list_article_access', { p_article_id: articleId });
  if (error) return { data: null, error };
  return {
    data: ((data as ArticleAccessRecord[] | null) ?? []).map((row) => ({
      id: row.id,
      roleId: row.role_id,
      userAccount:
        row.user_account_id === null
          ? null
          : { id: Number(row.user_account_id), emailAddress: row.email_address ?? '' },
      userGroup:
        row.user_group_id === null ? null : { id: row.user_group_id, external: row.external ?? false },
      scope: row.scope,
      entityId: row.article_id === null ? null : Number(row.article_id),
      grantedBy:
        row.granted_by === null
          ? null
          : { id: Number(row.granted_by), emailAddress: row.granted_by_email_address ?? '' },
      grantedAt: row.granted_at,
      expiresAt: row.expires_at,
    })),
    error: null,
  };
}

type ArticlePrincipalRecord = {
  user_account_id: number | string | null;
  email_address: string | null;
  user_group_id: number | null;
  external: boolean | null;
};

/**
 * Everyone the reader may give access to this article: every user by email address, and every
 * group (list_article_principal; its privacy cost is A20). Refused with 42501 for a reader who
 * may not share it.
 */
export async function listArticlePrincipal(
  supabase: SupabaseClient,
  articleId: number
): Promise<QueryResult<{ userAccounts: UserAccountOption[]; userGroups: UserGroupOption[] }>> {
  const { data, error } = await supabase.rpc('list_article_principal', { p_article_id: articleId });
  if (error) return { data: null, error };
  const userAccounts: UserAccountOption[] = [];
  const userGroups: UserGroupOption[] = [];
  for (const row of (data as ArticlePrincipalRecord[] | null) ?? []) {
    if (row.user_account_id !== null) {
      userAccounts.push({ id: Number(row.user_account_id), emailAddress: row.email_address ?? '' });
    } else if (row.user_group_id !== null) {
      userGroups.push({ id: row.user_group_id, external: row.external ?? false });
    }
  }
  return { data: { userAccounts, userGroups }, error: null };
}

/**
 * Gives a user or a group a role on one article, until an optional end. Refused with 42501
 * unless the caller holds `article.share` on it and every article permission the role holds.
 */
export async function createArticleRoleAssignment(
  supabase: SupabaseClient,
  fields: {
    articleId: number;
    roleId: number;
    principal: { userAccountId: number } | { userGroupId: number };
    expiresAt: string | null;
  }
): Promise<QueryResult<number>> {
  const { data, error } = await supabase.rpc('create_article_role_assignment', {
    p_article_id: fields.articleId,
    p_role_id: fields.roleId,
    p_user_account_id: 'userAccountId' in fields.principal ? fields.principal.userAccountId : null,
    p_user_group_id: 'userGroupId' in fields.principal ? fields.principal.userGroupId : null,
    p_expires_at: fields.expiresAt,
  });
  if (error) return { data: null, error };
  return { data: Number(data), error: null };
}

/** Removes one assignment on an article. Refused with 42501 without `article.share` on it. */
export async function deleteArticleRoleAssignment(
  supabase: SupabaseClient,
  id: number
): Promise<QueryResult<null>> {
  const { error } = await supabase.rpc('delete_article_role_assignment', { p_role_assignment_id: id });
  if (error) return { data: null, error };
  return { data: null, error: null };
}
