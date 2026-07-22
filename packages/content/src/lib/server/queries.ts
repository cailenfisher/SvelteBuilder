// Server-only — never import from client-side code.
// All functions accept a typed Supabase client and return camelCase domain types.
// Entity text pattern: slug = field name, scope = table name, entity_id = bigint PK.

import type {
  Article,
  ArticleAssignment,
  ArticleAssignmentRole,
  ArticleBlock,
  ArticleBlockContent,
  ArticleBlockType,
  ArticleBlockWithCopy,
  ArticleByline,
  ArticleChecklistState,
  ArticlePreviewToken,
  ArticleRevision,
  ArticleStatus,
  ArticleStatusWithCopy,
  ArticleWithCopy,
  AuthorProfile,
  AuthorProfileWithCopy,
  Comment,
  CommentStatus,
  CommentWithReplies,
  Front,
  FrontLayoutVariant,
  FrontSlot,
  FrontSlotWithArticle,
  FrontWithSlots,
  LiveCoverage,
  LiveCoverageWithUpdates,
  LiveUpdate,
  LiveUpdateWithCopy,
  MediaAsset,
  MediaAssetRights,
  MediaAssetWithCopy,
  MediaType,
  MediaLicense,
  Newsletter,
  NewsletterSubscription,
  NewsletterWithCopy,
  PaginatedResult,
  PublishChecklistItem,
  PublisherProfile,
  PublisherProfileWithCopy,
  Section,
  SectionWithCopy,
  Subscriber,
  Tag,
  TagWithCopy,
  Topic,
  TopicWithCopy,
} from '../schema/index.js';
import type { DictionaryPayload } from '@sveltebuilder/hermes';
import type { SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Internal row mappers (snake_case → camelCase)
// ---------------------------------------------------------------------------

function mapArticleStatus(r: Record<string, unknown>): ArticleStatus {
  return {
    id: r.id as number,
    slug: r.slug as string,
    ordinal: r.ordinal as number,
  };
}

function mapArticle(r: Record<string, unknown>): Article {
  return {
    id: r.id as number,
    articleStatusId: r.article_status_id as number,
    canonicalSlug: r.canonical_slug as string,
    publishedAt: r.published_at as string | null,
    updatedAt: r.updated_at as string,
    deletedAt: r.deleted_at as string | null,
    embargoUntil: r.embargo_until as string | null,
    allowComment: r.allow_comment as boolean,
    createdAt: r.created_at as string,
  };
}

function mapBlock(r: Record<string, unknown>): ArticleBlock {
  return {
    id: r.id as number,
    articleId: r.article_id as number,
    blockType: r.block_type as ArticleBlockType,
    position: r.position as number,
    content: (r.content ?? {}) as ArticleBlockContent,
    mediaAssetId: r.media_asset_id as number | null,
    createdAt: r.created_at as string,
  };
}

function mapAuthorProfile(r: Record<string, unknown>): AuthorProfile {
  return {
    id: r.id as number,
    userAccountId: r.user_account_id as number | null,
    slug: r.slug as string,
    active: r.active as boolean,
    createdAt: r.created_at as string,
  };
}

function mapSection(r: Record<string, unknown>): Section {
  return {
    id: r.id as number,
    parentSectionId: r.parent_section_id as number | null,
    slug: r.slug as string,
    ordinal: r.ordinal as number,
    active: r.active as boolean,
    createdAt: r.created_at as string,
  };
}

function mapTopic(r: Record<string, unknown>): Topic {
  return {
    id: r.id as number,
    slug: r.slug as string,
    active: r.active as boolean,
    createdAt: r.created_at as string,
  };
}

function mapTag(r: Record<string, unknown>): Tag {
  return {
    id: r.id as number,
    slug: r.slug as string,
    active: r.active as boolean,
    createdAt: r.created_at as string,
  };
}

function mapMediaAsset(r: Record<string, unknown>): MediaAsset {
  return {
    id: r.id as number,
    mediaType: r.media_type as MediaType,
    storageKey: r.storage_key as string,
    width: r.width as number | null,
    height: r.height as number | null,
    mimeType: r.mime_type as string,
    uploadedBy: r.uploaded_by as number,
    createdAt: r.created_at as string,
  };
}

function mapMediaAssetRights(r: Record<string, unknown>): MediaAssetRights {
  return {
    id: r.id as number,
    mediaAssetId: r.media_asset_id as number,
    license: r.license as MediaLicense,
    creditRequired: r.credit_required as boolean,
    expiresAt: r.expires_at as string | null,
    createdAt: r.created_at as string,
  };
}

function mapFront(r: Record<string, unknown>): Front {
  return {
    id: r.id as number,
    sectionId: r.section_id as number | null,
    slug: r.slug as string,
    active: r.active as boolean,
    createdAt: r.created_at as string,
  };
}

function mapFrontSlot(r: Record<string, unknown>): FrontSlot {
  return {
    id: r.id as number,
    frontId: r.front_id as number,
    articleId: r.article_id as number,
    position: r.position as number,
    layoutVariant: r.layout_variant as FrontLayoutVariant,
    pinnedUntil: r.pinned_until as string | null,
    createdAt: r.created_at as string,
  };
}

function mapLiveCoverage(r: Record<string, unknown>): LiveCoverage {
  return {
    id: r.id as number,
    articleId: r.article_id as number,
    active: r.active as boolean,
    startedAt: r.started_at as string,
    endedAt: r.ended_at as string | null,
  };
}

function mapLiveUpdate(r: Record<string, unknown>): LiveUpdate {
  return {
    id: r.id as number,
    liveCoverageId: r.live_coverage_id as number,
    publishedAt: r.published_at as string,
    pinned: r.pinned as boolean,
    position: r.position as number,
    createdAt: r.created_at as string,
  };
}

function mapNewsletter(r: Record<string, unknown>): Newsletter {
  return {
    id: r.id as number,
    slug: r.slug as string,
    active: r.active as boolean,
    createdAt: r.created_at as string,
  };
}

function mapSubscriber(r: Record<string, unknown>): Subscriber {
  return {
    id: r.id as number,
    emailAddress: r.email_address as string,
    locale: r.locale as string,
    confirmedAt: r.confirmed_at as string | null,
    createdAt: r.created_at as string,
  };
}

function mapComment(r: Record<string, unknown>): Comment {
  return {
    id: r.id as number,
    articleId: r.article_id as number,
    userAccountId: r.user_account_id as number | null,
    parentCommentId: r.parent_comment_id as number | null,
    authorName: r.author_name as string,
    authorEmail: r.author_email as string,
    body: r.body as string,
    status: r.status as CommentStatus,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function mapPublishChecklistItem(r: Record<string, unknown>): PublishChecklistItem {
  return {
    id: r.id as number,
    slug: r.slug as string,
    ordinal: r.ordinal as number,
    required: r.required as boolean,
  };
}

function mapPublisherProfile(r: Record<string, unknown>): PublisherProfile {
  return {
    id: r.id as number,
    logoMediaAssetId: r.logo_media_asset_id as number | null,
    url: r.url as string,
    createdAt: r.created_at as string,
  };
}

// ---------------------------------------------------------------------------
// Entity text resolution
// ---------------------------------------------------------------------------

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
    .select(`slug, entity_id, local_text ( content, locale:locale ( code ) )`)
    .eq('scope', scope)
    .in('entity_id', entityIds);

  if (error) throw new Error(`[content] resolveEntityText(${scope}): ${error.message}`);

  const result: Record<string, string> = {};
  for (const row of data ?? []) {
    const slug = row.slug as string;
    const entityId = row.entity_id as number;
    const texts = (row.local_text ?? []) as unknown as Array<{ content: string; locale: { code: string } | null }>;
    const resolved =
      texts.find((t) => t.locale?.code === locale) ??
      texts.find((t) => t.locale?.code === fallbackLocale) ??
      texts[0];
    if (resolved) result[`${slug}.${entityId}`] = resolved.content;
  }
  return result;
}

async function resolveGlobalText(
  supabase: SupabaseClient,
  slugs: string[],
  scope: string,
  locale: string,
  fallbackLocale: string,
): Promise<Record<string, string>> {
  if (slugs.length === 0) return {};

  const { data, error } = await supabase
    .from('local_text_link')
    .select(`slug, local_text ( content, locale:locale ( code ) )`)
    .eq('scope', scope)
    .is('entity_id', null)
    .in('slug', slugs);

  if (error) throw new Error(`[content] resolveGlobalText(${scope}): ${error.message}`);

  const result: Record<string, string> = {};
  for (const row of data ?? []) {
    const slug = row.slug as string;
    const texts = (row.local_text ?? []) as unknown as Array<{ content: string; locale: { code: string } | null }>;
    const resolved =
      texts.find((t) => t.locale?.code === locale) ??
      texts.find((t) => t.locale?.code === fallbackLocale) ??
      texts[0];
    if (resolved) result[slug] = resolved.content;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Media asset enrichment
// ---------------------------------------------------------------------------

async function enrichMediaAssets(
  supabase: SupabaseClient,
  assetIds: number[],
  locale: string,
  fallbackLocale: string,
): Promise<Map<number, MediaAssetWithCopy>> {
  if (assetIds.length === 0) return new Map();

  const [assetsResult, rightsResult] = await Promise.all([
    supabase.from('media_asset').select('*').in('id', assetIds),
    supabase.from('media_asset_rights').select('*').in('media_asset_id', assetIds),
  ]);

  if (assetsResult.error) throw new Error(`[content] enrichMediaAssets: ${assetsResult.error.message}`);

  const text = await resolveEntityText(supabase, assetIds, 'media_asset', locale, fallbackLocale);
  const rightsMap = new Map<number, MediaAssetRights>();

  for (const r of rightsResult.data ?? []) {
    const row = r as Record<string, unknown>;
    rightsMap.set(row.media_asset_id as number, mapMediaAssetRights(row));
  }

  const result = new Map<number, MediaAssetWithCopy>();
  for (const r of assetsResult.data ?? []) {
    const row = r as Record<string, unknown>;
    const asset = mapMediaAsset(row);
    result.set(asset.id, {
      ...asset,
      altText: text[`alt_text.${asset.id}`] ?? '',
      caption: text[`caption.${asset.id}`] ?? '',
      credit: text[`credit.${asset.id}`] ?? '',
      rights: rightsMap.get(asset.id) ?? null,
    });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Article enrichment
// ---------------------------------------------------------------------------

async function enrichArticles(
  supabase: SupabaseClient,
  articles: Article[],
  locale: string,
  fallbackLocale: string,
  options: { includeBlocks?: boolean } = {},
): Promise<ArticleWithCopy[]> {
  if (articles.length === 0) return [];

  const ids = articles.map((a) => a.id);
  const statusIds = [...new Set(articles.map((a) => a.articleStatusId))];

  const [
    articleText,
    statusRows,
    bylineRows,
    sectionJunction,
    topicJunction,
    tagJunction,
  ] = await Promise.all([
    resolveEntityText(supabase, ids, 'article', locale, fallbackLocale),
    supabase.from('article_status').select('*').in('id', statusIds),
    supabase
      .from('article_byline')
      .select('article_id, position, author_profile ( id, user_account_id, slug, active, created_at )')
      .in('article_id', ids)
      .order('position', { ascending: true }),
    supabase
      .from('article_section')
      .select('article_id, section ( id, parent_section_id, slug, ordinal, active, created_at )')
      .in('article_id', ids),
    supabase
      .from('article_topic')
      .select('article_id, topic ( id, slug, active, created_at )')
      .in('article_id', ids),
    supabase
      .from('article_tag')
      .select('article_id, tag ( id, slug, active, created_at )')
      .in('article_id', ids),
  ]);

  if (statusRows.error) throw new Error(`[content] enrichArticles status: ${statusRows.error.message}`);
  if (bylineRows.error) throw new Error(`[content] enrichArticles bylines: ${bylineRows.error.message}`);

  // Collect all author profile IDs
  const authorIds = new Set<number>();
  for (const r of bylineRows.data ?? []) {
    const ap = r.author_profile as unknown as Record<string, unknown> | null;
    if (ap?.id) authorIds.add(ap.id as number);
  }

  // Collect all section/topic/tag IDs
  const sectionIds = new Set<number>();
  const topicIds = new Set<number>();
  const tagIds = new Set<number>();

  for (const r of sectionJunction.data ?? []) {
    const s = r.section as unknown as Record<string, unknown> | null;
    if (s?.id) sectionIds.add(s.id as number);
  }
  for (const r of topicJunction.data ?? []) {
    const t = r.topic as unknown as Record<string, unknown> | null;
    if (t?.id) topicIds.add(t.id as number);
  }
  for (const r of tagJunction.data ?? []) {
    const t = r.tag as unknown as Record<string, unknown> | null;
    if (t?.id) tagIds.add(t.id as number);
  }

  // Parallel text resolution
  const [authorText, sectionText, topicText, tagText, statusText] = await Promise.all([
    resolveEntityText(supabase, [...authorIds], 'author_profile', locale, fallbackLocale),
    resolveEntityText(supabase, [...sectionIds], 'section', locale, fallbackLocale),
    resolveEntityText(supabase, [...topicIds], 'topic', locale, fallbackLocale),
    resolveEntityText(supabase, [...tagIds], 'tag', locale, fallbackLocale),
    resolveEntityText(supabase, statusIds, 'article_status', locale, fallbackLocale),
  ]);

  // Build status map
  const statusMap = new Map<number, ArticleStatusWithCopy>();
  for (const r of statusRows.data ?? []) {
    const row = r as Record<string, unknown>;
    const s = mapArticleStatus(row);
    statusMap.set(s.id, { ...s, label: statusText[`label.${s.id}`] ?? s.slug });
  }

  // Optionally fetch blocks
  let blocksMap = new Map<number, ArticleBlock[]>();
  let mediaIds = new Set<number>();
  let mediaMap = new Map<number, MediaAssetWithCopy>();

  if (options.includeBlocks) {
    const { data: blockData, error: blockError } = await supabase
      .from('article_block')
      .select('*')
      .in('article_id', ids)
      .order('position', { ascending: true });

    if (blockError) throw new Error(`[content] enrichArticles blocks: ${blockError.message}`);

    const blockIds: number[] = [];
    for (const r of blockData ?? []) {
      const row = r as Record<string, unknown>;
      const block = mapBlock(row);
      if (!blocksMap.has(block.articleId)) blocksMap.set(block.articleId, []);
      blocksMap.get(block.articleId)!.push(block);
      blockIds.push(block.id);
      if (block.mediaAssetId) mediaIds.add(block.mediaAssetId);
    }

    const [blockText] = await Promise.all([
      resolveEntityText(supabase, blockIds, 'article_block', locale, fallbackLocale),
    ]);

    mediaMap = await enrichMediaAssets(supabase, [...mediaIds], locale, fallbackLocale);

    // Attach block text
    for (const [articleId, blocks] of blocksMap) {
      blocksMap.set(
        articleId,
        blocks.map((b) => ({
          ...b,
          text: blockText[`text.${b.id}`] ?? '',
          mediaAsset: b.mediaAssetId ? (mediaMap.get(b.mediaAssetId) ?? null) : null,
        } as ArticleBlockWithCopy)),
      );
    }
  }

  return articles.map((article) => {
    const status = statusMap.get(article.articleStatusId) ?? {
      id: article.articleStatusId,
      slug: 'unknown',
      ordinal: 0,
      label: 'Unknown',
    };

    const bylines: AuthorProfileWithCopy[] = (bylineRows.data ?? [])
      .filter((r) => r.article_id === article.id)
      .map((r) => {
        const ap = r.author_profile as unknown as Record<string, unknown>;
        const base = mapAuthorProfile(ap);
        return {
          ...base,
          name: authorText[`name.${base.id}`] ?? base.slug,
          bio: authorText[`bio.${base.id}`] ?? '',
        };
      });

    const sections: SectionWithCopy[] = (sectionJunction.data ?? [])
      .filter((r) => r.article_id === article.id)
      .map((r) => {
        const s = r.section as unknown as Record<string, unknown>;
        const base = mapSection(s);
        return { ...base, name: sectionText[`name.${base.id}`] ?? base.slug, description: sectionText[`description.${base.id}`] ?? '', children: [] };
      });

    const topics: TopicWithCopy[] = (topicJunction.data ?? [])
      .filter((r) => r.article_id === article.id)
      .map((r) => {
        const t = r.topic as unknown as Record<string, unknown>;
        const base = mapTopic(t);
        return { ...base, name: topicText[`name.${base.id}`] ?? base.slug };
      });

    const tags: TagWithCopy[] = (tagJunction.data ?? [])
      .filter((r) => r.article_id === article.id)
      .map((r) => {
        const t = r.tag as unknown as Record<string, unknown>;
        const base = mapTag(t);
        return { ...base, name: tagText[`name.${base.id}`] ?? base.slug };
      });

    const rawBlocks = (blocksMap.get(article.id) ?? []) as ArticleBlockWithCopy[];

    return {
      ...article,
      headline: articleText[`headline.${article.id}`] ?? '',
      dek: articleText[`dek.${article.id}`] ?? '',
      status,
      blocks: rawBlocks,
      bylines,
      sections,
      topics,
      tags,
    };
  });
}

// ---------------------------------------------------------------------------
// Public queries — article list / single
// ---------------------------------------------------------------------------

export async function getPublishedArticles(
  supabase: SupabaseClient,
  locale: string,
  options?: {
    sectionSlug?: string;
    topicSlug?: string;
    tagSlug?: string;
    authorSlug?: string;
    page?: number;
    perPage?: number;
    fallbackLocale?: string;
  },
): Promise<PaginatedResult<ArticleWithCopy>> {
  const page = options?.page ?? 1;
  const perPage = options?.perPage ?? 10;
  const fallbackLocale = options?.fallbackLocale ?? 'en';
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  // Collect filter IDs if slug filters are requested
  async function resolveFilterIds(table: string, slugCol: string, slug: string, junctionTable: string, fkCol: string): Promise<number[] | null> {
    const { data } = await supabase.from(table).select('id').eq(slugCol, slug).single();
    if (!data) return [];
    const row = data as Record<string, unknown>;
    const { data: jd } = await supabase.from(junctionTable).select('article_id').eq(fkCol, row.id);
    return (jd ?? []).map((r) => (r as Record<string, unknown>).article_id as number);
  }

  const [sectionFilter, topicFilter, tagFilter, authorFilter] = await Promise.all([
    options?.sectionSlug ? resolveFilterIds('section', 'slug', options.sectionSlug, 'article_section', 'section_id') : Promise.resolve(null),
    options?.topicSlug   ? resolveFilterIds('topic',   'slug', options.topicSlug,   'article_topic',   'topic_id')   : Promise.resolve(null),
    options?.tagSlug     ? resolveFilterIds('tag',     'slug', options.tagSlug,     'article_tag',     'tag_id')     : Promise.resolve(null),
    options?.authorSlug  ? resolveFilterIds('author_profile', 'slug', options.authorSlug, 'article_byline', 'author_profile_id') : Promise.resolve(null),
  ]);

  // Any empty filter means no results
  const activeFilters = [sectionFilter, topicFilter, tagFilter, authorFilter].filter((f): f is number[] => f !== null);
  if (activeFilters.some((f) => f.length === 0)) {
    return { items: [], total: 0, page, perPage };
  }

  let query = supabase
    .from('article')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .range(from, to);

  // Join on article_status for published filter (slug = 'published')
  const { data: publishedStatus } = await supabase
    .from('article_status')
    .select('id')
    .eq('slug', 'published')
    .single();

  if (!publishedStatus) return { items: [], total: 0, page, perPage };
  query = query.eq('article_status_id', (publishedStatus as Record<string, unknown>).id);

  // Embargo filter (not embargoed or embargo expired)
  query = query.or(`embargo_until.is.null,embargo_until.lte.${new Date().toISOString()}`);

  // Apply ID filters (intersection of all active slug filters)
  if (activeFilters.length > 0) {
    const intersection = activeFilters.reduce((acc, ids) => acc.filter((id) => ids.includes(id)));
    if (intersection.length === 0) return { items: [], total: 0, page, perPage };
    query = query.in('id', intersection);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(`[content] getPublishedArticles: ${error.message}`);

  const articles = (data ?? []).map((r) => mapArticle(r as Record<string, unknown>));
  const items = await enrichArticles(supabase, articles, locale, fallbackLocale);
  return { items, total: count ?? 0, page, perPage };
}

export async function getPublishedArticleBySlug(
  supabase: SupabaseClient,
  slug: string,
  locale: string,
  fallbackLocale = 'en',
): Promise<ArticleWithCopy | null> {
  const { data: publishedStatus } = await supabase
    .from('article_status')
    .select('id')
    .eq('slug', 'published')
    .single();

  if (!publishedStatus) return null;

  const { data, error } = await supabase
    .from('article')
    .select('*')
    .eq('canonical_slug', slug)
    .eq('article_status_id', (publishedStatus as Record<string, unknown>).id)
    .is('deleted_at', null)
    .or(`embargo_until.is.null,embargo_until.lte.${new Date().toISOString()}`)
    .maybeSingle();

  if (error) throw new Error(`[content] getPublishedArticleBySlug: ${error.message}`);
  if (!data) return null;

  const article = mapArticle(data as Record<string, unknown>);
  const [enriched] = await enrichArticles(supabase, [article], locale, fallbackLocale, { includeBlocks: true });
  return enriched ?? null;
}

// Preview — bypasses published/embargo check; validates token server-side.
export async function getArticleByPreviewToken(
  supabase: SupabaseClient,
  token: string,
  locale: string,
  fallbackLocale = 'en',
): Promise<ArticleWithCopy | null> {
  const { data: tokenRow, error: tokenErr } = await supabase
    .from('article_preview_token')
    .select('article_id, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (tokenErr) throw new Error(`[content] getArticleByPreviewToken token: ${tokenErr.message}`);
  if (!tokenRow) return null;
  const row = tokenRow as Record<string, unknown>;
  if (new Date(row.expires_at as string) < new Date()) return null;

  const { data, error } = await supabase
    .from('article')
    .select('*')
    .eq('id', row.article_id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw new Error(`[content] getArticleByPreviewToken article: ${error.message}`);
  if (!data) return null;

  const article = mapArticle(data as Record<string, unknown>);
  const [enriched] = await enrichArticles(supabase, [article], locale, fallbackLocale, { includeBlocks: true });
  return enriched ?? null;
}

// ---------------------------------------------------------------------------
// Section front
// ---------------------------------------------------------------------------

export async function getSectionFront(
  supabase: SupabaseClient,
  slug: string,
  locale: string,
  fallbackLocale = 'en',
): Promise<FrontWithSlots | null> {
  // Resolve section slug → section → front
  const { data: frontData, error: frontErr } = await supabase
    .from('front')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle();

  if (frontErr) throw new Error(`[content] getSectionFront: ${frontErr.message}`);
  if (!frontData) return null;

  const front = mapFront(frontData as Record<string, unknown>);
  const frontText = await resolveEntityText(supabase, [front.id], 'front', locale, fallbackLocale);

  const { data: slotData, error: slotErr } = await supabase
    .from('front_slot')
    .select('*')
    .eq('front_id', front.id)
    .order('position', { ascending: true });

  if (slotErr) throw new Error(`[content] getSectionFront slots: ${slotErr.message}`);

  const slots = (slotData ?? []).map((r) => mapFrontSlot(r as Record<string, unknown>));
  const articleIds = slots.map((s) => s.articleId);

  // Resolve slot override headlines
  const slotIds = slots.map((s) => s.id);
  const [articleResults, slotText] = await Promise.all([
    articleIds.length > 0
      ? supabase.from('article').select('*').in('id', articleIds)
      : Promise.resolve({ data: [], error: null }),
    resolveEntityText(supabase, slotIds, 'front_slot', locale, fallbackLocale),
  ]);

  if (articleResults.error) throw new Error(`[content] getSectionFront articles: ${articleResults.error.message}`);

  const rawArticles = (articleResults.data ?? []).map((r) => mapArticle(r as Record<string, unknown>));
  const enrichedArticles = await enrichArticles(supabase, rawArticles, locale, fallbackLocale);
  const articleMap = new Map(enrichedArticles.map((a) => [a.id, a]));

  let sectionWithCopy: SectionWithCopy | null = null;
  if (front.sectionId) {
    const { data: sectionData } = await supabase
      .from('section')
      .select('*')
      .eq('id', front.sectionId)
      .single();
    if (sectionData) {
      const s = mapSection(sectionData as Record<string, unknown>);
      const sText = await resolveEntityText(supabase, [s.id], 'section', locale, fallbackLocale);
      sectionWithCopy = {
        ...s,
        name: sText[`name.${s.id}`] ?? s.slug,
        description: sText[`description.${s.id}`] ?? '',
        children: [],
      };
    }
  }

  const slotsWithArticles: FrontSlotWithArticle[] = slots
    .filter((s) => articleMap.has(s.articleId))
    .map((s) => ({
      ...s,
      article: articleMap.get(s.articleId)!,
      overrideHeadline: slotText[`override_headline.${s.id}`] ?? '',
    }));

  return {
    ...front,
    name: frontText[`name.${front.id}`] ?? front.slug,
    slots: slotsWithArticles,
    section: sectionWithCopy,
  };
}

// ---------------------------------------------------------------------------
// Live coverage
// ---------------------------------------------------------------------------

export async function getLiveCoverage(
  supabase: SupabaseClient,
  articleId: number,
  locale: string,
  fallbackLocale = 'en',
): Promise<LiveCoverageWithUpdates | null> {
  const { data, error } = await supabase
    .from('live_coverage')
    .select('*')
    .eq('article_id', articleId)
    .maybeSingle();

  if (error) throw new Error(`[content] getLiveCoverage: ${error.message}`);
  if (!data) return null;

  const coverage = mapLiveCoverage(data as Record<string, unknown>);

  const { data: updateData, error: updateErr } = await supabase
    .from('live_update')
    .select('*')
    .eq('live_coverage_id', coverage.id)
    .order('pinned', { ascending: false })
    .order('position', { ascending: false });

  if (updateErr) throw new Error(`[content] getLiveCoverage updates: ${updateErr.message}`);

  const rawUpdates = (updateData ?? []).map((r) => mapLiveUpdate(r as Record<string, unknown>));
  const updateIds = rawUpdates.map((u) => u.id);
  const updateText = await resolveEntityText(supabase, updateIds, 'live_update', locale, fallbackLocale);

  const updates: LiveUpdateWithCopy[] = rawUpdates.map((u) => ({
    ...u,
    text: updateText[`text.${u.id}`] ?? '',
  }));

  return { ...coverage, updates };
}

// ---------------------------------------------------------------------------
// Newsletters & subscriptions
// ---------------------------------------------------------------------------

export async function getNewsletters(
  supabase: SupabaseClient,
  locale: string,
  fallbackLocale = 'en',
): Promise<NewsletterWithCopy[]> {
  const { data, error } = await supabase
    .from('newsletter')
    .select('*')
    .eq('active', true)
    .order('id', { ascending: true });

  if (error) throw new Error(`[content] getNewsletters: ${error.message}`);

  const newsletters = (data ?? []).map((r) => mapNewsletter(r as Record<string, unknown>));
  const text = await resolveEntityText(
    supabase,
    newsletters.map((n) => n.id),
    'newsletter',
    locale,
    fallbackLocale,
  );

  return newsletters.map((n) => ({
    ...n,
    name: text[`name.${n.id}`] ?? n.slug,
    description: text[`description.${n.id}`] ?? '',
  }));
}

export async function subscribeToNewsletter(
  supabase: SupabaseClient,
  data: { emailAddress: string; newsletterId: number; locale?: string },
): Promise<{ subscriberId: number; alreadyExisted: boolean }> {
  // Upsert subscriber
  const { data: subRow, error: subErr } = await supabase
    .from('subscriber')
    .upsert({ email_address: data.emailAddress, locale: data.locale ?? 'en' }, { onConflict: 'email_address' })
    .select('id')
    .single();

  if (subErr) throw new Error(`[content] subscribeToNewsletter subscriber: ${subErr.message}`);
  const subscriberId = (subRow as Record<string, unknown>).id as number;

  // Upsert subscription
  const { error: nsErr } = await supabase
    .from('newsletter_subscription')
    .upsert(
      { newsletter_id: data.newsletterId, subscriber_id: subscriberId, unsubscribed_at: null },
      { onConflict: 'newsletter_id,subscriber_id' },
    );

  if (nsErr) throw new Error(`[content] subscribeToNewsletter subscription: ${nsErr.message}`);
  return { subscriberId, alreadyExisted: false };
}

export async function unsubscribeFromNewsletter(
  supabase: SupabaseClient,
  emailAddress: string,
  newsletterId: number,
): Promise<void> {
  const { data: sub } = await supabase
    .from('subscriber')
    .select('id')
    .eq('email_address', emailAddress)
    .maybeSingle();

  if (!sub) return;
  const subscriberId = (sub as Record<string, unknown>).id as number;

  const { error } = await supabase
    .from('newsletter_subscription')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('newsletter_id', newsletterId)
    .eq('subscriber_id', subscriberId);

  if (error) throw new Error(`[content] unsubscribeFromNewsletter: ${error.message}`);
}

export async function confirmSubscriber(
  supabase: SupabaseClient,
  subscriberId: number,
): Promise<void> {
  const { error } = await supabase
    .from('subscriber')
    .update({ confirmed_at: new Date().toISOString() })
    .eq('id', subscriberId);

  if (error) throw new Error(`[content] confirmSubscriber: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Admin subscriber list
// ---------------------------------------------------------------------------

export async function getSubscribers(
  supabase: SupabaseClient,
  options?: { page?: number; perPage?: number; newsletterId?: number },
): Promise<PaginatedResult<Subscriber>> {
  const page = options?.page ?? 1;
  const perPage = options?.perPage ?? 50;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from('subscriber')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (options?.newsletterId) {
    const { data: subIds } = await supabase
      .from('newsletter_subscription')
      .select('subscriber_id')
      .eq('newsletter_id', options.newsletterId)
      .is('unsubscribed_at', null);

    const ids = (subIds ?? []).map((r) => (r as Record<string, unknown>).subscriber_id as number);
    if (ids.length === 0) return { items: [], total: 0, page, perPage };
    query = query.in('id', ids);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(`[content] getSubscribers: ${error.message}`);

  return {
    items: (data ?? []).map((r) => mapSubscriber(r as Record<string, unknown>)),
    total: count ?? 0,
    page,
    perPage,
  };
}

// ---------------------------------------------------------------------------
// Workflow
// ---------------------------------------------------------------------------

export async function getArticleStatuses(supabase: SupabaseClient, locale: string, fallbackLocale = 'en'): Promise<ArticleStatusWithCopy[]> {
  const { data, error } = await supabase
    .from('article_status')
    .select('*')
    .order('ordinal', { ascending: true });

  if (error) throw new Error(`[content] getArticleStatuses: ${error.message}`);
  const statuses = (data ?? []).map((r) => mapArticleStatus(r as Record<string, unknown>));
  const text = await resolveEntityText(supabase, statuses.map((s) => s.id), 'article_status', locale, fallbackLocale);
  return statuses.map((s) => ({ ...s, label: text[`label.${s.id}`] ?? s.slug }));
}

export async function transitionArticleStatus(
  supabase: SupabaseClient,
  articleId: number,
  targetStatusSlug: string,
  userAccountId: number,
): Promise<void> {
  const { data: statusRow, error: statusErr } = await supabase
    .from('article_status')
    .select('id')
    .eq('slug', targetStatusSlug)
    .single();

  if (statusErr || !statusRow) throw new Error(`[content] transitionArticleStatus: status '${targetStatusSlug}' not found`);

  const statusId = (statusRow as Record<string, unknown>).id as number;

  const updatePayload: Record<string, unknown> = { article_status_id: statusId };
  if (targetStatusSlug === 'published') {
    const { data: existing } = await supabase
      .from('article')
      .select('published_at')
      .eq('id', articleId)
      .single();
    if (existing && !(existing as Record<string, unknown>).published_at) {
      updatePayload.published_at = new Date().toISOString();
    }
  }

  const { error: articleErr } = await supabase
    .from('article')
    .update(updatePayload)
    .eq('id', articleId);

  if (articleErr) throw new Error(`[content] transitionArticleStatus update: ${articleErr.message}`);

  // Append revision record
  const { error: revErr } = await supabase
    .from('article_revision')
    .insert({ article_id: articleId, user_account_id: userAccountId });

  if (revErr) throw new Error(`[content] transitionArticleStatus revision: ${revErr.message}`);
}

export async function getArticleAssignments(
  supabase: SupabaseClient,
  articleId: number,
): Promise<ArticleAssignment[]> {
  const { data, error } = await supabase
    .from('article_assignment')
    .select('*')
    .eq('article_id', articleId)
    .order('assigned_at', { ascending: false });

  if (error) throw new Error(`[content] getArticleAssignments: ${error.message}`);

  return (data ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    return {
      id: row.id as number,
      articleId: row.article_id as number,
      userAccountId: row.user_account_id as number,
      role: row.role as ArticleAssignmentRole,
      assignedAt: row.assigned_at as string,
      dueAt: row.due_at as string | null,
    };
  });
}

export async function setChecklistState(
  supabase: SupabaseClient,
  articleId: number,
  itemId: number,
  satisfied: boolean,
): Promise<void> {
  const payload: Record<string, unknown> = {
    article_id: articleId,
    publish_checklist_item_id: itemId,
    satisfied,
    satisfied_at: satisfied ? new Date().toISOString() : null,
  };

  const { error } = await supabase
    .from('article_checklist_state')
    .upsert(payload, { onConflict: 'article_id,publish_checklist_item_id' });

  if (error) throw new Error(`[content] setChecklistState: ${error.message}`);
}

export async function getChecklistState(
  supabase: SupabaseClient,
  articleId: number,
  locale: string,
  fallbackLocale = 'en',
): Promise<Array<PublishChecklistItem & { satisfied: boolean; satisfiedAt: string | null; label: string }>> {
  const [{ data: items, error: itemErr }, { data: states, error: stateErr }] = await Promise.all([
    supabase.from('publish_checklist_item').select('*').order('ordinal'),
    supabase.from('article_checklist_state').select('*').eq('article_id', articleId),
  ]);

  if (itemErr) throw new Error(`[content] getChecklistState items: ${itemErr.message}`);
  if (stateErr) throw new Error(`[content] getChecklistState states: ${stateErr.message}`);

  const mappedItems = (items ?? []).map((r) => mapPublishChecklistItem(r as Record<string, unknown>));
  const text = await resolveEntityText(supabase, mappedItems.map((i) => i.id), 'publish_checklist_item', locale, fallbackLocale);

  const stateMap = new Map<number, ArticleChecklistState>();
  for (const r of states ?? []) {
    const row = r as Record<string, unknown>;
    stateMap.set(row.publish_checklist_item_id as number, {
      id: row.id as number,
      articleId: row.article_id as number,
      publishChecklistItemId: row.publish_checklist_item_id as number,
      satisfied: row.satisfied as boolean,
      satisfiedAt: row.satisfied_at as string | null,
    });
  }

  return mappedItems.map((item) => {
    const state = stateMap.get(item.id);
    return {
      ...item,
      label: text[`label.${item.id}`] ?? item.slug,
      satisfied: state?.satisfied ?? false,
      satisfiedAt: state?.satisfiedAt ?? null,
    };
  });
}

// ---------------------------------------------------------------------------
// Admin article queries
// ---------------------------------------------------------------------------

export async function getAdminArticles(
  supabase: SupabaseClient,
  locale: string,
  options?: {
    statusSlug?: string;
    page?: number;
    perPage?: number;
    fallbackLocale?: string;
  },
): Promise<PaginatedResult<ArticleWithCopy>> {
  const page = options?.page ?? 1;
  const perPage = options?.perPage ?? 20;
  const fallbackLocale = options?.fallbackLocale ?? 'en';
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from('article')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (options?.statusSlug) {
    const { data: statusRow } = await supabase
      .from('article_status')
      .select('id')
      .eq('slug', options.statusSlug)
      .single();

    if (statusRow) {
      query = query.eq('article_status_id', (statusRow as Record<string, unknown>).id);
    }
  }

  const { data, error, count } = await query;
  if (error) throw new Error(`[content] getAdminArticles: ${error.message}`);

  const articles = (data ?? []).map((r) => mapArticle(r as Record<string, unknown>));
  const items = await enrichArticles(supabase, articles, locale, fallbackLocale);
  return { items, total: count ?? 0, page, perPage };
}

export async function createArticle(
  supabase: SupabaseClient,
  data: { canonicalSlug: string; statusSlug?: string },
): Promise<number> {
  const { data: statusRow } = await supabase
    .from('article_status')
    .select('id')
    .eq('slug', data.statusSlug ?? 'pitch')
    .single();

  if (!statusRow) throw new Error(`[content] createArticle: status not found`);

  const { data: row, error } = await supabase
    .from('article')
    .insert({
      canonical_slug: data.canonicalSlug,
      article_status_id: (statusRow as Record<string, unknown>).id,
    })
    .select('id')
    .single();

  if (error) throw new Error(`[content] createArticle: ${error.message}`);
  return (row as Record<string, unknown>).id as number;
}

export async function updateArticle(
  supabase: SupabaseClient,
  id: number,
  data: Partial<Pick<Article, 'canonicalSlug' | 'embargoUntil' | 'allowComment'>>,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (data.canonicalSlug !== undefined) payload.canonical_slug = data.canonicalSlug;
  if (data.embargoUntil !== undefined) payload.embargo_until = data.embargoUntil;
  if (data.allowComment !== undefined) payload.allow_comment = data.allowComment;

  const { error } = await supabase.from('article').update(payload).eq('id', id);
  if (error) throw new Error(`[content] updateArticle: ${error.message}`);
}

export async function softDeleteArticle(supabase: SupabaseClient, id: number): Promise<void> {
  const { error } = await supabase
    .from('article')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(`[content] softDeleteArticle: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export async function getApprovedComments(
  supabase: SupabaseClient,
  articleId: number,
): Promise<CommentWithReplies[]> {
  const { data, error } = await supabase
    .from('comment')
    .select('*')
    .eq('article_id', articleId)
    .eq('status', 'approved')
    .is('parent_comment_id', null)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`[content] getApprovedComments: ${error.message}`);

  const topLevel = (data ?? []).map((r) => mapComment(r as Record<string, unknown>));
  const topIds = topLevel.map((c) => c.id);

  const { data: replyData } = topIds.length > 0
    ? await supabase
        .from('comment')
        .select('*')
        .in('parent_comment_id', topIds)
        .eq('status', 'approved')
        .order('created_at', { ascending: true })
    : { data: [] };

  const replies = (replyData ?? []).map((r) => mapComment(r as Record<string, unknown>));

  return topLevel.map((c) => ({
    ...c,
    replies: replies
      .filter((r) => r.parentCommentId === c.id)
      .map((r) => ({ ...r, replies: [] })),
  }));
}

export async function createComment(
  supabase: SupabaseClient,
  data: {
    articleId: number;
    authorName: string;
    authorEmail: string;
    body: string;
    parentCommentId?: number;
    userAccountId?: number;
  },
): Promise<void> {
  const { error } = await supabase.from('comment').insert({
    article_id: data.articleId,
    author_name: data.authorName,
    author_email: data.authorEmail,
    body: data.body,
    parent_comment_id: data.parentCommentId ?? null,
    user_account_id: data.userAccountId ?? null,
  });

  if (error) throw new Error(`[content] createComment: ${error.message}`);
}

export async function setCommentStatus(
  supabase: SupabaseClient,
  id: number,
  status: CommentStatus,
): Promise<void> {
  const { error } = await supabase.from('comment').update({ status }).eq('id', id);
  if (error) throw new Error(`[content] setCommentStatus: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Publisher profile
// ---------------------------------------------------------------------------

export async function getPublisherProfile(
  supabase: SupabaseClient,
  locale: string,
  fallbackLocale = 'en',
): Promise<PublisherProfileWithCopy | null> {
  const { data, error } = await supabase
    .from('publisher_profile')
    .select('*')
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`[content] getPublisherProfile: ${error.message}`);
  if (!data) return null;

  const profile = mapPublisherProfile(data as Record<string, unknown>);
  const text = await resolveEntityText(supabase, [profile.id], 'publisher_profile', locale, fallbackLocale);

  let logo: MediaAssetWithCopy | null = null;
  if (profile.logoMediaAssetId) {
    const logoMap = await enrichMediaAssets(supabase, [profile.logoMediaAssetId], locale, fallbackLocale);
    logo = logoMap.get(profile.logoMediaAssetId) ?? null;
  }

  return { ...profile, name: text[`name.${profile.id}`] ?? '', logo };
}

// ---------------------------------------------------------------------------
// DictionaryPayload builders (for hermes.merge)
// ---------------------------------------------------------------------------

export function buildArticleDictionaryPayload(article: ArticleWithCopy, locale: string): DictionaryPayload {
  const payload: DictionaryPayload = [
    { link: { id: 0, slug: 'headline', scope: 'article', entityId: article.id }, content: article.headline, localeCode: locale },
    { link: { id: 0, slug: 'dek', scope: 'article', entityId: article.id }, content: article.dek, localeCode: locale },
    ...article.bylines.map((a) => ({
      link: { id: 0, slug: 'name', scope: 'author_profile', entityId: a.id },
      content: a.name,
      localeCode: locale,
    })),
    ...article.sections.map((s) => ({
      link: { id: 0, slug: 'name', scope: 'section', entityId: s.id },
      content: s.name,
      localeCode: locale,
    })),
    ...article.topics.map((t) => ({
      link: { id: 0, slug: 'name', scope: 'topic', entityId: t.id },
      content: t.name,
      localeCode: locale,
    })),
    ...article.tags.map((t) => ({
      link: { id: 0, slug: 'name', scope: 'tag', entityId: t.id },
      content: t.name,
      localeCode: locale,
    })),
  ];

  for (const block of article.blocks) {
    if ((block as ArticleBlockWithCopy).text) {
      payload.push({
        link: { id: 0, slug: 'text', scope: 'article_block', entityId: block.id },
        content: (block as ArticleBlockWithCopy).text,
        localeCode: locale,
      });
    }
  }

  return payload;
}

export function buildArticleListDictionaryPayload(articles: ArticleWithCopy[], locale: string): DictionaryPayload {
  return articles.flatMap((a) => [
    { link: { id: 0, slug: 'headline', scope: 'article', entityId: a.id }, content: a.headline, localeCode: locale },
    { link: { id: 0, slug: 'dek', scope: 'article', entityId: a.id }, content: a.dek, localeCode: locale },
  ]);
}
