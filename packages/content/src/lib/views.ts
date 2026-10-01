import type { DictionaryPayload } from 'diglossia';
import type {
  Article,
  ArticleBlock,
  AuthorProfile,
  Comment,
  MediaAsset,
  PublisherProfile,
  Section,
  Tag,
  Topic,
} from './schema/index.js';

/**
 * Screen contracts.
 *
 * A screen (`+page.svelte`) and the loader that feeds it do not live together: the screen
 * ships once, provider-neutral, in the create CLI's template tree, while the loader ships per
 * scaffold flavour (`server.superprototype/`, and `server.native/` if Native revives).
 * Nothing typechecks across that boundary until a project is scaffolded, so the boundary is
 * stated here instead: the screen imports the view type, and every flavour's loader returns
 * it. See docs/MODULE-ROUTES.md.
 *
 * These types deliberately carry no resolved copy, unlike the older `*WithCopy` types in
 * `./schema`. Those were the shape a query layer produced — it resolved a headline into a
 * string and handed the row over. A screen now holds a dictionary and reads
 * `localText('headline', 'article', id)` itself, which is what lets a locale switch rewrite
 * the page rather than requiring the loader to run again.
 *
 * Not expressible here, and therefore documented per screen in its manifest.json: form action
 * names, their field names, and which of them a screen submits.
 */

/**
 * Every screen in this module needs copy, and the root dictionary does not carry it —
 * `get_dictionary` treats a null scope filter as "scope is null", so scoped copy has to be
 * loaded and provided by the screen's own loader.
 *
 * The payload must already be resolved to one entry per key; diglossia only flattens it. It
 * carries both the module's UI copy (scope 'content') and the entity-bound copy the screen
 * renders — an article's headline, a block's text, a section's name.
 */
export type ScreenCopy = {
  copy: DictionaryPayload;
};

/**
 * The locale a screen formats dates in, and declares to assistive technology.
 *
 * Carried on the view rather than read from the root layout's data, because a screen is
 * provider-neutral and the layout's shape is the scaffold's business.
 */
export type ScreenLocale = {
  localeCode: string;
};

/**
 * Where a media asset's storageKey resolves to a URL.
 *
 * On the view rather than read from an environment variable in the screen, because the answer
 * is provider-specific — Supabase Storage puts it under the project URL — and a screen that
 * imported `$env/static/public` to find out would stop being flavour-neutral.
 */
export type ScreenStorage = {
  storageBaseUrl: string;
  /**
   * The assets this screen's blocks refer to. An array rather than a Map because it crosses
   * the load boundary; the screen builds the Map the components want.
   */
  mediaAssets: MediaAsset[];
};

/**
 * A server-paginated list. The loader owns the slice; the screen renders the controls.
 */
export type ScreenPage = {
  page: number;
  perPage: number;
  /** Rows matching the filter, not rows on this page. */
  total: number;
};

// ── Shared article shapes ────────────────────────────────────────────────────

/**
 * An article with everything a page or a card needs to render it, minus the copy.
 *
 * `blocks` is present only where the body is actually rendered — a list does not need it, and
 * a list that embedded every block of every article would be the classic way such a screen
 * becomes slow.
 */
export type ArticleRow = Article & {
  sections: Section[];
  topics: Topic[];
  tags: Tag[];
  /**
   * In byline order, which is editorially meaningful: the first name is the lead. Named
   * `bylines` to match both the article_byline table and ArticleView's prop, so an
   * ArticleWithBlocks satisfies ArticleRenderable without reshaping.
   */
  bylines: AuthorProfile[];
};

export type ArticleWithBlocks = ArticleRow & {
  /** In `position` order. */
  blocks: ArticleBlock[];
};

// ── Public reading screens ───────────────────────────────────────────────────

/**
 * `/article/[slug]`
 *
 * Named ArticlePageView rather than ArticleView because the package already exports a
 * component by that name, and a screen imports both.
 */
export type ArticlePageView = ScreenCopy &
  ScreenLocale &
  ScreenStorage & {
    article: ArticleWithBlocks;
    /** Approved only, and empty when the article does not accept comments. */
    comments: Comment[];
    /** Null when no publisher profile is seeded; the page then omits its structured data. */
    publisherProfile: PublisherProfile | null;
    /** Absolute, for the canonical link and the JSON-LD. */
    canonicalUrl: string;
  };

/** `/section/[slug]` — SectionView is taken by a component, hence the suffix. */
export type SectionPageView = ScreenCopy &
  ScreenLocale &
  ScreenPage & {
    section: Section;
    /** Child sections, for navigating down the taxonomy. */
    childSections: Section[];
    articles: ArticleRow[];
  };

/**
 * `/preview/[token]`
 *
 * The article comes back through a SECURITY DEFINER function keyed on the token rather than a
 * normal read, because RLS hides an unpublished article and a policy cannot see which token
 * the request presented. The token is the credential; see the module's 02-content-rls.sql.
 */
export type PreviewPageView = ScreenCopy &
  ScreenLocale &
  ScreenStorage & {
    article: ArticleWithBlocks;
  };

// ── Admin screens ────────────────────────────────────────────────────────────

/** `/admin/content/article` */
export type AdminArticleListView = ScreenCopy &
  ScreenLocale &
  ScreenPage & {
    articles: ArticleRow[];
    /** Every workflow status, in ordinal order, for the filter and the create form. */
    statuses: ArticleStatusRow[];
    /** Null means unfiltered, which is not the same as any particular status. */
    statusSlug: string | null;
  };

/** A workflow status. Its name is entity-bound copy, so it is not on the row. */
export type ArticleStatusRow = {
  id: number;
  slug: string;
  ordinal: number;
};

/** `/admin/content/article/[id]` */
export type AdminArticleDetailView = ScreenCopy &
  ScreenLocale & {
    article: ArticleWithBlocks;
    statuses: ArticleStatusRow[];
    /** The publish gate: every checklist item, and whether this article has ticked it. */
    checklist: ChecklistEntry[];
    /** Sections, topics and tags the editor can file this article under. */
    availableSections: Section[];
    availableTopics: Topic[];
    availableTags: Tag[];
  };

export type ChecklistEntry = {
  id: number;
  slug: string;
  ordinal: number;
  required: boolean;
  completed: boolean;
};

/**
 * What a screen's form actions return. `fail()` payloads and successful returns share one
 * shape so a screen can render `form?.error` without narrowing per action — which is why the
 * success branch declares `error?: undefined` rather than omitting the key: a union whose
 * members disagree on which keys exist cannot be read through `?.` at all, only narrowed
 * first.
 */
export type ScreenFormResult =
  | { success: true; message?: string; error?: undefined }
  | { success?: false; error: string };
