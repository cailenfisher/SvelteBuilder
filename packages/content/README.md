# @sveltebuilder/content

Publisher/news domain module for [SvelteBuilder](https://github.com/cailenfisher/SvelteBuilder): articles, editorial sections, taxonomy, live coverage, newsletters, and comments — with RSS, sitemaps, and JSON-LD structured data included.

## Install

```sh
npm install @sveltebuilder/content diglossia @sveltebuilder/coreui
```

Typically installed via `npm create sveltebuilder@latest`, which also copies the module's schema and starter routes into your project. Installing it directly gives you the components, server helpers, and Drizzle schema as a standalone library.

## Usage

Import the module's stylesheet once, in your app's `app.css`, after coreui's and in the same
layer. Its components carry no `<style>` blocks, so without it they render unstyled. A project
made with `npm create sveltebuilder` already has this line.

```css
@import '@sveltebuilder/coreui/styles/components.css' layer(components);
@import '@sveltebuilder/content/styles/components.css' layer(components);
```

```ts
import { ArticleCard, ArticleDetail, FrontDetail } from '@sveltebuilder/content';
import { generateRssFeed, validateArticleForPublish } from '@sveltebuilder/content/publishing';
import type { ArticleDetailView } from '@sveltebuilder/content/views';
import { article, section, comment } from '@sveltebuilder/content/schema';
```

- **`@sveltebuilder/content`** — Svelte components, split into application-level components (`CommentList` — readers' own words, no diglossia dependency) and entity components (`ArticleCard`, `ArticleDetail`, `ArticleList`, `ArticleAssignmentQueue`, `ArticleWorkflowPanel`, `FrontCurationBoard`, `SubscriberList`, `AuthorProfileDetail`, `FrontDetail`, `NewsletterSubscriptionForm`, `ArticleBlockEditor`, and more — call `getDictionary()` from `diglossia/svelte`, with an optional `dictionary` prop for overriding context). Also re-exports all schema types.
- **`@sveltebuilder/content/publishing`** — pure functions with no database access: feed generation (`generateRssFeed`), sitemaps (`generateStandardSitemap`, `generateNewsSitemap`), structured data (`buildNewsArticleJsonLd`, `buildArticleMetaTags`, `buildHreflangAlternates`) and the publish check (`validateArticleForPublish`). The module ships no queries (guardrail 11); a scaffolded project's data modules in `src/lib/server/content/` hold them.
- **`@sveltebuilder/content/views`** — the view-model types a screen and its loader share.
- **`@sveltebuilder/content/styles/components.css`** — every component's styles, for the `components` layer.
- **`@sveltebuilder/content/schema`** — Drizzle table definitions and TypeScript types (`Article`, `Section`, `Comment`, `Newsletter`, `MediaAsset`, `Front`, `LiveCoverage`, and more).

Like all SvelteBuilder domain modules, content carries no `name`/`title`/`body` copy columns on its entities — user-facing copy is linked via `diglossia` (`scope` = table name, `entityId` = the row's bigint PK). Two documented exceptions carry literal data instead of copy: `comment.author_name`/`author_email`/`body` (reader-submitted, not editorial) and `subscriber.email_address` (PII).

## Part of the SvelteBuilder ecosystem

See the [SvelteBuilder README](https://github.com/cailenfisher/SvelteBuilder) for the full architecture, including how domain modules relate to `diglossia`, `@sveltebuilder/coreui`, and the CLI sync workflow.
