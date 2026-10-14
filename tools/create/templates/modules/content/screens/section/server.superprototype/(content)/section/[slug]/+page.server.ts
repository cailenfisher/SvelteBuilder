import { error } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { loadEntityCopy, loadScopedCopy } from '$lib/server/scoped-copy';
import { listArticleBySection } from '$lib/server/content/article-section';
import { listMediaAsset } from '$lib/server/content/media-asset';
import { getSectionBySlug, listActiveSection } from '$lib/server/content/section';
import { selectLeadMediaAssetId } from '@sveltebuilder/content/publishing';
import type { SectionDetailView } from '@sveltebuilder/content/views';
import type { PageServerLoad } from './$types';

// A public page with no auth guard: which articles a reader sees is decided entirely by the
// module's RLS policies. See supabase/supplemental/02-content-rls.sql.

const PER_PAGE = 20;

const STORAGE_BASE_URL = `${PUBLIC_SUPABASE_URL}/storage/v1/object/public`;

export const load: PageServerLoad = async ({ locals, params, url }): Promise<SectionDetailView> => {
  const pageParam = Number(url.searchParams.get('page') ?? '1');
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const sectionResult = await getSectionBySlug(locals.supabase, params.slug);

  if (sectionResult.error) throw error(500, 'Failed to load the section.');
  if (!sectionResult.data) throw error(404, 'Section not found.');

  const section = sectionResult.data;

  const [articlesResult, childResult] = await Promise.all([
    listArticleBySection(
      locals.supabase,
      section.id,
      { offset: (page - 1) * PER_PAGE, limit: PER_PAGE }
    ),
    listActiveSection(locals.supabase, section.id),
  ]);

  if (articlesResult.error) throw error(500, 'Failed to load the section’s articles.');
  if (childResult.error) throw error(500, 'Failed to load child sections.');

  const articles = articlesResult.data.rows;
  const childSections = childResult.data;

  // Each card's lead image, resolved by the same rule the article page uses (the editor's
  // choice, else the first image block). Only those assets are fetched, not every block's.
  const leadAssetIds = [
    ...new Set(
      articles
        .map((article) => selectLeadMediaAssetId({ ...article, blocks: article.blocks ?? [] }))
        .filter((lead): lead is NonNullable<typeof lead> => lead !== null)
        .map((lead) => lead.mediaAssetId)
    ),
  ];
  const mediaResult = await listMediaAsset(locals.supabase, leadAssetIds);
  if (mediaResult.error) throw error(500, 'Failed to load media.');

  const [uiCopy, entityCopy] = await Promise.all([
    loadScopedCopy(locals.supabase, ['content'], locals.locale.code, locals.defaultLocale.code),
    // By id, not by scope: 'article' is unbounded, so a whole-scope load would ship every
    // headline in the database to render one page of twenty.
    loadEntityCopy(
      locals.supabase,
      [
        { scope: 'article', ids: articles.map((article) => article.id) },
        { scope: 'article_status', ids: articles.map((article) => article.status.id) },
        {
          scope: 'author_profile',
          ids: articles.flatMap((article) => article.bylines.map((author) => author.id)),
        },
        {
          scope: 'section',
          ids: [
            section.id,
            ...childSections.map((child) => child.id),
            ...articles.flatMap((article) => article.sections.map((entry) => entry.id)),
          ],
        },
        {
          scope: 'topic',
          ids: articles.flatMap((article) => article.topics.map((entry) => entry.id)),
        },
      ],
      locals.locale.code,
      locals.defaultLocale.code
    ),
  ]);

  return {
    section,
    childSections,
    articles,
    storageBaseUrl: STORAGE_BASE_URL,
    mediaAssets: mediaResult.data,
    total: articlesResult.data.total,
    page,
    perPage: PER_PAGE,
    localeCode: locals.locale.code,
    copy: [...uiCopy, ...entityCopy],
  };
};
