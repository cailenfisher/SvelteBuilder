import type { ScreenCopy, ScreenLocale, ScreenPage } from '@sveltebuilder/coreui';
import type {
  Article,
  ArticleBlock,
  ArticleStatus,
  AuthorProfile,
  Comment,
  MediaAsset,
  MediaAssetAttribution,
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
 * Public provenance for the assets in `ScreenStorage.mediaAssets`, for credit lines that link to
 * a source and name their license. Separate from ScreenStorage because it is a second read — the
 * `media_asset_attribution` view — that only a screen showing full-size figures needs; a card
 * list does not.
 */
export type ScreenAttribution = {
  attributions: MediaAssetAttribution[];
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
  /**
   * The workflow status as a row, not a slug, because ArticleCard takes it that way and its
   * display name is entity-bound copy keyed by the status id.
   */
  status: ArticleStatus;
  sections: Section[];
  topics: Topic[];
  tags: Tag[];
  /**
   * In byline order, which is editorially meaningful: the first name is the lead. Named
   * `bylines` to match both the article_byline table and ArticleDetail's prop, so an
   * ArticleWithBlocks satisfies ArticleRenderable without reshaping.
   */
  bylines: AuthorProfile[];
  /**
   * What the reader may do to this article, every action named as a permission action is
   * (`update`, `publish`, `share`). Set on the admin screens, from current_user_article_actions
   * and the reader's assignments, to show only the controls that will work. A courtesy: RLS
   * refuses what is not allowed whatever the screen shows. Absent on the public screens, which
   * share this type and have no controls to hide.
   */
  actions?: string[];
  /**
   * Present only when a list loads image blocks so its cards can show a picture — and then only
   * those, not the whole body, which is the classic way a listing becomes slow.
   */
  blocks?: ArticleBlock[];
};

export type ArticleWithBlocks = ArticleRow & {
  /** In `position` order. */
  blocks: ArticleBlock[];
};

// ── Public reading screens ───────────────────────────────────────────────────

/**
 * `/article/[slug]`
 *
 * Named ArticleDetailView rather than ArticleDetail because the package already exports a
 * component by that name, and a screen imports both.
 */
/**
 * A comment as a reader's page shows it: everything but the commenter's email address, which no
 * one can read through the API (02-content-rls.sql grants SELECT on every other column).
 */
export type CommentRow = Omit<Comment, 'authorEmail'>;

export type ArticleDetailView = ScreenCopy &
  ScreenLocale &
  ScreenStorage &
  ScreenAttribution & {
    article: ArticleWithBlocks;
    /** Approved only, and empty when the article does not accept comments. */
    comments: CommentRow[];
    /** Null when no publisher profile is seeded; the page then omits its structured data. */
    publisherProfile: PublisherProfile | null;
    /** Absolute, for the canonical link and the JSON-LD. */
    canonicalUrl: string;
  };

/** `/section/[slug]` — SectionView is taken by a component, hence the suffix. */
export type SectionDetailView = ScreenCopy &
  ScreenLocale &
  ScreenStorage &
  ScreenPage & {
    section: Section;
    /** Child sections, for navigating down the taxonomy. */
    childSections: Section[];
    articles: ArticleRow[];
  };

/**
 * `/article-preview/[token]`
 *
 * The article comes back through a SECURITY DEFINER function keyed on the token rather than a
 * normal read, because RLS hides an unpublished article and a policy cannot see which token
 * the request presented. The token is the credential; see the module's 02-content-rls.sql.
 */
export type ArticlePreviewDetailView = ScreenCopy &
  ScreenLocale &
  ScreenStorage &
  ScreenAttribution & {
    article: ArticleWithBlocks;
  };

// ── Admin screens ────────────────────────────────────────────────────────────

/** `/admin/content/article` */
export type ArticleAdminListView = ScreenCopy &
  ScreenLocale &
  ScreenPage & {
    articles: ArticleRow[];
    /** Every workflow status, in position order, for the filter and the create form. */
    statuses: ArticleStatus[];
    /** Null means unfiltered, which is not the same as any particular status. */
    statusSlug: string | null;
    /**
     * What the reader may do to every article, from current_user_can (`create` is the one the
     * screen asks about). See ArticleRow's `actions`.
     */
    articleActions: string[];
  };

/** `/admin/content/article/[id]` */
export type ArticleAdminDetailView = ScreenCopy &
  ScreenLocale & {
    article: ArticleWithBlocks;
    statuses: ArticleStatus[];
    /** The publish gate: every checklist item, and whether this article has ticked it. */
    checklist: ArticleChecklistEntry[];
    /** Sections, topics and tags the editor can file this article under. */
    availableSections: Section[];
    availableTopics: Topic[];
    availableTags: Tag[];
    /** What the reader may do to this article. See ArticleRow's `actions`. */
    actions: string[];
  };

export type ArticleChecklistEntry = {
  id: number;
  slug: string;
  position: number;
  required: boolean;
  completed: boolean;
};

