# @sveltebuilder/content

Publisher/news domain module for [SvelteBuilder](https://github.com/cailenfisher/SvelteBuilder): articles, editorial sections, taxonomy, live coverage, newsletters, and comments — with RSS, sitemaps, and JSON-LD structured data included.

## Install

```sh
npm install @sveltebuilder/content @sveltebuilder/hermes @sveltebuilder/coreui
```

Typically installed via `npm create sveltebuilder@latest`, which also copies the module's schema and starter routes into your project. Installing it directly gives you the components, server helpers, and Drizzle schema as a standalone library.

## Usage

```ts
import { ArticleCard, ArticleView, SectionFront } from '@sveltebuilder/content';
import { getPublishedArticles, getPublishedArticleBySlug } from '@sveltebuilder/content/server';
import { article, section, comment } from '@sveltebuilder/content/schema';
```

- **`@sveltebuilder/content`** — Svelte components, split into Camp 1 (`ArticleList`, `AssignmentQueue`, `BlockEditorHost`, `FrontCurationBoard`, `SubscriberList` — no hermes dependency) and Camp 2 (`ArticleCard`, `ArticleView`, `ArticleWorkflowPanel`, `AuthorProfileView`, `SectionFront`, `NewsletterSignup`, and more — import hermes and require `hermes.load()` before mount). Also re-exports all schema types.
- **`@sveltebuilder/content/server`** — query helpers (`getPublishedArticles`, `createArticle`, `transitionArticleStatus`, `subscribeToNewsletter`, …), feed generation (`generateRssFeed`), sitemaps (`generateStandardSitemap`, `generateNewsSitemap`), and structured data (`buildNewsArticleJsonLd`, `buildArticleMetaTags`, `buildHreflangAlternates`).
- **`@sveltebuilder/content/schema`** — Drizzle table definitions and TypeScript types (`Article`, `Section`, `Comment`, `Newsletter`, `MediaAsset`, `Front`, `LiveCoverage`, and more).

Like all SvelteBuilder domain modules, content carries no `name`/`title`/`body` copy columns on its entities — user-facing copy is linked via `@sveltebuilder/hermes` (`scope` = table name, `entityId` = the row's bigint PK). Two documented exceptions carry literal data instead of copy: `comment.author_name`/`author_email`/`body` (reader-submitted, not editorial) and `subscriber.email_address` (PII).

## Part of the SvelteBuilder ecosystem

See the [SvelteBuilder README](https://github.com/cailenfisher/SvelteBuilder) for the full architecture, including how domain modules relate to `@sveltebuilder/hermes`, `@sveltebuilder/coreui`, and the CLI sync workflow.
