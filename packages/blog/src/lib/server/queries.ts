// Server-only — never import from client-side code.
// All functions accept a typed Supabase client and return camelCase domain types.
// Entity text pattern: slug = field name (e.g. 'title'), scope = table name,
// entity_id = bigint PK of the entity. Matches hermes local_text_link schema exactly.

import type {
  Post,
  PostCategory,
  PostTag,
  PostStatus,
  PostWithCopy,
  PostCategoryWithCopy,
  PostTagWithCopy,
  Comment,
  CommentWithAuthor,
} from '../schema/index.js';
import type { DictionaryPayload } from '@sveltebuilder/hermes';
import type { SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Internal snake_case → camelCase row mappers
// ---------------------------------------------------------------------------

function mapPost(row: Record<string, unknown>): Post {
  return {
    id: row.id as number,
    slug: row.slug as string,
    userAccountId: row.user_account_id as string,
    status: row.status as PostStatus,
    featured: row.featured as boolean,
    allowComment: row.allow_comment as boolean,
    readingTimeMinute: row.reading_time_minute as number | null,
    publishedAt: row.published_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapCategory(row: Record<string, unknown>): PostCategory {
  return {
    id: row.id as number,
    slug: row.slug as string,
    active: row.active as boolean,
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as string,
  };
}

function mapTag(row: Record<string, unknown>): PostTag {
  return {
    id: row.id as number,
    slug: row.slug as string,
    active: row.active as boolean,
    createdAt: row.created_at as string,
  };
}

function mapComment(row: Record<string, unknown>): Comment {
  return {
    id: row.id as number,
    postId: row.post_id as number,
    userAccountId: row.user_account_id as string | null,
    parentCommentId: row.parent_comment_id as number | null,
    body: row.body as string,
    approved: row.approved as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ---------------------------------------------------------------------------
// Text resolution helpers
// ---------------------------------------------------------------------------

// Fetch resolved copy for a set of entities from local_text_link + local_text.
// Returns a flat record keyed as '{slug}.{entityId}', e.g. 'title.1'.
async function resolveEntityText(
  supabase: SupabaseClient,
  entityIds: number[],
  scope: string,
  locale: string,
  fallbackLocale: string,
): Promise<Record<string, string>> {
  if (entityIds.length === 0) return {};

  const { data, error } = await supabase
    .from('local_text_link')
    .select(`
      slug,
      entity_id,
      local_text (
        content,
        locale:locale ( code )
      )
    `)
    .eq('scope', scope)
    .in('entity_id', entityIds);

  if (error) throw new Error(`[blog] resolveEntityText error: ${error.message}`);

  const result: Record<string, string> = {};

  for (const row of data ?? []) {
    const slug = row.slug as string;
    const entityId = row.entity_id as number;
    const texts = (row.local_text ?? []) as Array<{
      content: string;
      locale: { code: string } | null;
    }>;

    const userEntry = texts.find((t) => t.locale?.code === locale);
    const fallbackEntry = texts.find((t) => t.locale?.code === fallbackLocale);
    const firstEntry = texts[0];

    const resolved = userEntry ?? fallbackEntry ?? firstEntry;
    if (resolved) result[`${slug}.${entityId}`] = resolved.content;
  }

  return result;
}

// Build a DictionaryPayload from PostWithCopy array — for client-side hermes merge.
export function buildDictionaryPayload(
  posts: PostWithCopy[],
  locale: string,
): DictionaryPayload {
  const payload: DictionaryPayload = [];

  for (const post of posts) {
    payload.push(
      { link: { id: 0, slug: 'title',   scope: 'post', entityId: post.id }, content: post.title,   localeCode: locale },
      { link: { id: 0, slug: 'excerpt', scope: 'post', entityId: post.id }, content: post.excerpt, localeCode: locale },
    );
  }

  return payload;
}

// Build a full DictionaryPayload for a single post (includes body).
export function buildPostDictionaryPayload(
  post: PostWithCopy,
  locale: string,
): DictionaryPayload {
  return [
    { link: { id: 0, slug: 'title',   scope: 'post', entityId: post.id }, content: post.title,   localeCode: locale },
    { link: { id: 0, slug: 'excerpt', scope: 'post', entityId: post.id }, content: post.excerpt, localeCode: locale },
    { link: { id: 0, slug: 'body',    scope: 'post', entityId: post.id }, content: post.body,    localeCode: locale },
    ...post.categories.map((c) => ({
      link: { id: 0, slug: 'name', scope: 'post_category', entityId: c.id },
      content: c.name,
      localeCode: locale,
    })),
    ...post.tags.map((t) => ({
      link: { id: 0, slug: 'name', scope: 'post_tag', entityId: t.id },
      content: t.name,
      localeCode: locale,
    })),
  ];
}

// ---------------------------------------------------------------------------
// Enrich a raw Post array with resolved copy
// ---------------------------------------------------------------------------

async function enrichPosts(
  supabase: SupabaseClient,
  posts: Post[],
  locale: string,
  fallbackLocale: string,
): Promise<PostWithCopy[]> {
  if (posts.length === 0) return [];

  const postIds = posts.map((p) => p.id);

  // Fetch post text and category/tag associations in parallel
  const [postText, junctionRows] = await Promise.all([
    resolveEntityText(supabase, postIds, 'post', locale, fallbackLocale),
    supabase
      .from('post_category_post')
      .select('post_id, post_category ( id, slug, active, sort_order, created_at )')
      .in('post_id', postIds),
  ]);

  const tagRows = await supabase
    .from('post_post_tag')
    .select('post_id, post_tag ( id, slug, active, created_at )')
    .in('post_id', postIds);

  // Collect category/tag IDs for text resolution
  const catIds = new Set<number>();
  const tagIds = new Set<number>();

  for (const row of junctionRows.data ?? []) {
    const cat = row.post_category as Record<string, unknown> | null;
    if (cat?.id) catIds.add(cat.id as number);
  }
  for (const row of tagRows.data ?? []) {
    const tag = row.post_tag as Record<string, unknown> | null;
    if (tag?.id) tagIds.add(tag.id as number);
  }

  const [catText, tagText] = await Promise.all([
    resolveEntityText(supabase, [...catIds], 'post_category', locale, fallbackLocale),
    resolveEntityText(supabase, [...tagIds], 'post_tag', locale, fallbackLocale),
  ]);

  // Build enriched posts
  return posts.map((post) => {
    const categories: PostCategoryWithCopy[] = (junctionRows.data ?? [])
      .filter((r) => r.post_id === post.id)
      .map((r) => {
        const cat = r.post_category as Record<string, unknown>;
        return {
          ...mapCategory(cat),
          name: catText[`name.${cat.id}`] ?? '',
        };
      });

    const tags: PostTagWithCopy[] = (tagRows.data ?? [])
      .filter((r) => r.post_id === post.id)
      .map((r) => {
        const tag = r.post_tag as Record<string, unknown>;
        return {
          ...mapTag(tag),
          name: tagText[`name.${tag.id}`] ?? '',
        };
      });

    return {
      ...post,
      title:   postText[`title.${post.id}`]   ?? '',
      excerpt: postText[`excerpt.${post.id}`] ?? '',
      body:    postText[`body.${post.id}`]    ?? '',
      categories,
      tags,
    };
  });
}

// ---------------------------------------------------------------------------
// Public query: published post list
// ---------------------------------------------------------------------------

export async function getPublishedPosts(
  supabase: SupabaseClient,
  locale: string,
  options?: {
    categorySlug?: string;
    tagSlug?: string;
    page?: number;
    perPage?: number;
    featured?: boolean;
    fallbackLocale?: string;
  },
): Promise<{ posts: PostWithCopy[]; total: number }> {
  const page = options?.page ?? 1;
  const perPage = options?.perPage ?? 10;
  const fallbackLocale = options?.fallbackLocale ?? 'en';
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from('post')
    .select('*', { count: 'exact' })
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(from, to);

  if (options?.featured !== undefined) {
    query = query.eq('featured', options.featured);
  }

  if (options?.categorySlug) {
    const { data: cat } = await supabase
      .from('post_category')
      .select('id')
      .eq('slug', options.categorySlug)
      .single();

    if (!cat) return { posts: [], total: 0 };

    const { data: junction } = await supabase
      .from('post_category_post')
      .select('post_id')
      .eq('post_category_id', cat.id);

    const postIds = (junction ?? []).map((r) => r.post_id as number);
    if (postIds.length === 0) return { posts: [], total: 0 };
    query = query.in('id', postIds);
  }

  if (options?.tagSlug) {
    const { data: tag } = await supabase
      .from('post_tag')
      .select('id')
      .eq('slug', options.tagSlug)
      .single();

    if (!tag) return { posts: [], total: 0 };

    const { data: junction } = await supabase
      .from('post_post_tag')
      .select('post_id')
      .eq('post_tag_id', tag.id);

    const postIds = (junction ?? []).map((r) => r.post_id as number);
    if (postIds.length === 0) return { posts: [], total: 0 };
    query = query.in('id', postIds);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(`[blog] getPublishedPosts error: ${error.message}`);

  const posts = (data ?? []).map((r) => mapPost(r as Record<string, unknown>));
  const enriched = await enrichPosts(supabase, posts, locale, fallbackLocale);
  return { posts: enriched, total: count ?? 0 };
}

// ---------------------------------------------------------------------------
// Public query: single post by URL slug
// ---------------------------------------------------------------------------

export async function getPublishedPostBySlug(
  supabase: SupabaseClient,
  slug: string,
  locale: string,
  fallbackLocale = 'en',
): Promise<PostWithCopy | null> {
  const { data: postData, error: postError } = await supabase
    .from('post')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (postError) throw new Error(`[blog] getPublishedPostBySlug error: ${postError.message}`);
  if (!postData) return null;

  const post = mapPost(postData as Record<string, unknown>);
  const [enriched] = await enrichPosts(supabase, [post], locale, fallbackLocale);
  return enriched ?? null;
}

// ---------------------------------------------------------------------------
// Admin queries
// ---------------------------------------------------------------------------

export async function getAdminPosts(
  supabase: SupabaseClient,
  options?: {
    status?: PostStatus;
    page?: number;
    perPage?: number;
  },
): Promise<{ posts: Post[]; total: number }> {
  const page = options?.page ?? 1;
  const perPage = options?.perPage ?? 20;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from('post')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(`[blog] getAdminPosts error: ${error.message}`);

  return {
    posts: (data ?? []).map((r) => mapPost(r as Record<string, unknown>)),
    total: count ?? 0,
  };
}

export async function getAdminPost(
  supabase: SupabaseClient,
  id: number,
): Promise<Post | null> {
  const { data, error } = await supabase
    .from('post')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`[blog] getAdminPost error: ${error.message}`);
  if (!data) return null;
  return mapPost(data as Record<string, unknown>);
}

// ---------------------------------------------------------------------------
// Post mutations
// ---------------------------------------------------------------------------

export async function createPost(
  supabase: SupabaseClient,
  data: {
    userAccountId: string;
    slug: string;
    status?: PostStatus;
    featured?: boolean;
    allowComment?: boolean;
  },
): Promise<number> {
  const { data: row, error } = await supabase
    .from('post')
    .insert({
      user_account_id: data.userAccountId,
      slug: data.slug,
      status: data.status ?? 'draft',
      featured: data.featured ?? false,
      allow_comment: data.allowComment ?? true,
    })
    .select('id')
    .single();

  if (error) throw new Error(`[blog] createPost error: ${error.message}`);
  return row.id as number;
}

export async function updatePost(
  supabase: SupabaseClient,
  id: number,
  data: Partial<Omit<Post, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (data.slug !== undefined) payload.slug = data.slug;
  if (data.userAccountId !== undefined) payload.user_account_id = data.userAccountId;
  if (data.status !== undefined) payload.status = data.status;
  if (data.featured !== undefined) payload.featured = data.featured;
  if (data.allowComment !== undefined) payload.allow_comment = data.allowComment;
  if (data.readingTimeMinute !== undefined) payload.reading_time_minute = data.readingTimeMinute;
  if (data.publishedAt !== undefined) payload.published_at = data.publishedAt;

  const { error } = await supabase.from('post').update(payload).eq('id', id);
  if (error) throw new Error(`[blog] updatePost error: ${error.message}`);
}

export async function publishPost(supabase: SupabaseClient, id: number): Promise<void> {
  const { data: existing } = await supabase
    .from('post')
    .select('published_at')
    .eq('id', id)
    .single();

  const { error } = await supabase
    .from('post')
    .update({
      status: 'published',
      published_at: existing?.published_at ?? new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw new Error(`[blog] publishPost error: ${error.message}`);
}

export async function unpublishPost(supabase: SupabaseClient, id: number): Promise<void> {
  const { error } = await supabase
    .from('post')
    .update({ status: 'draft' })
    .eq('id', id);

  if (error) throw new Error(`[blog] unpublishPost error: ${error.message}`);
}

export async function deletePost(supabase: SupabaseClient, id: number): Promise<void> {
  const { error } = await supabase.from('post').delete().eq('id', id);
  if (error) throw new Error(`[blog] deletePost error: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Categories and tags
// ---------------------------------------------------------------------------

export async function getCategories(
  supabase: SupabaseClient,
  locale: string,
  fallbackLocale = 'en',
): Promise<PostCategoryWithCopy[]> {
  const { data, error } = await supabase
    .from('post_category')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`[blog] getCategories error: ${error.message}`);

  const categories = (data ?? []).map((r) => mapCategory(r as Record<string, unknown>));
  const text = await resolveEntityText(
    supabase,
    categories.map((c) => c.id),
    'post_category',
    locale,
    fallbackLocale,
  );

  return categories.map((c) => ({ ...c, name: text[`name.${c.id}`] ?? c.slug }));
}

export async function getTags(
  supabase: SupabaseClient,
  locale: string,
  fallbackLocale = 'en',
): Promise<PostTagWithCopy[]> {
  const { data, error } = await supabase
    .from('post_tag')
    .select('*')
    .eq('active', true)
    .order('slug', { ascending: true });

  if (error) throw new Error(`[blog] getTags error: ${error.message}`);

  const tags = (data ?? []).map((r) => mapTag(r as Record<string, unknown>));
  const text = await resolveEntityText(
    supabase,
    tags.map((t) => t.id),
    'post_tag',
    locale,
    fallbackLocale,
  );

  return tags.map((t) => ({ ...t, name: text[`name.${t.id}`] ?? t.slug }));
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export async function getComments(
  supabase: SupabaseClient,
  postId: number,
): Promise<CommentWithAuthor[]> {
  const { data, error } = await supabase
    .from('comment')
    .select(`
      *,
      author:user_account ( display_name )
    `)
    .eq('post_id', postId)
    .eq('approved', true)
    .is('parent_comment_id', null)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`[blog] getComments error: ${error.message}`);

  const topLevel = data ?? [];

  // Fetch replies for all top-level comments
  const topIds = topLevel.map((r) => r.id as number);
  const { data: replyData } = topIds.length > 0
    ? await supabase
        .from('comment')
        .select('*, author:user_account ( display_name )')
        .in('parent_comment_id', topIds)
        .eq('approved', true)
        .order('created_at', { ascending: true })
    : { data: [] };

  const replies = replyData ?? [];

  function mapWithAuthor(row: Record<string, unknown>, nested: CommentWithAuthor[] = []): CommentWithAuthor {
    const authorRow = row.author as Record<string, unknown> | null;
    return {
      ...mapComment(row),
      authorDisplayName: (authorRow?.display_name as string | null) ?? null,
      replies: nested,
    };
  }

  return topLevel.map((row) => {
    const nested = replies
      .filter((r) => r.parent_comment_id === row.id)
      .map((r) => mapWithAuthor(r as Record<string, unknown>));
    return mapWithAuthor(row as Record<string, unknown>, nested);
  });
}

export async function createComment(
  supabase: SupabaseClient,
  data: {
    postId: number;
    userAccountId: string;
    body: string;
    parentCommentId?: number;
  },
): Promise<void> {
  const { error } = await supabase.from('comment').insert({
    post_id: data.postId,
    user_account_id: data.userAccountId,
    body: data.body,
    parent_comment_id: data.parentCommentId ?? null,
  });

  if (error) throw new Error(`[blog] createComment error: ${error.message}`);
}

export async function setCommentApproval(
  supabase: SupabaseClient,
  id: number,
  approved: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('comment')
    .update({ approved })
    .eq('id', id);

  if (error) throw new Error(`[blog] setCommentApproval error: ${error.message}`);
}
