// =============================================================================
// @sveltebuilder/content — TypeScript types
//
// i18n convention: entities with user-facing copy carry NO name/title/body/etc.
// Copy is linked via diglossia (scope = table name, entity_id = bigint PK).
//
// SCOPE DEVIATIONS (documented):
//   comment.author_name, comment.author_email, comment.body — reader-submitted
//     runtime data, not editorial copy. Never entered in the LocalText store.
//     Same pattern as the original blog module comment.body deviation.
//   subscriber.email_address — PII/data, not copy. Never translated.
//
// One module per concept: each table with its pgEnums and inferred types, and each enum's
// values in a module of their own. See .claude/rules/drizzle-schema.md, "Schema file layout".
// =============================================================================

export * from './article-assignment-role.js';
export * from './article-assignment.js';
export * from './article-block-type.js';
export * from './article-block.js';
export * from './article-byline.js';
export * from './article-checklist-state.js';
export * from './article-preview-token.js';
export * from './article-revision.js';
export * from './article-section.js';
export * from './article-status.js';
export * from './article-tag.js';
export * from './article-topic.js';
export * from './article.js';
export * from './author-profile.js';
export * from './comment-status.js';
export * from './comment.js';
export * from './front-layout-variant.js';
export * from './front-slot.js';
export * from './front.js';
export * from './live-coverage.js';
export * from './live-update.js';
export * from './media-asset-license.js';
export * from './media-asset-rights.js';
export * from './media-asset-source.js';
export * from './media-asset-type.js';
export * from './media-asset.js';
export * from './newsletter-subscription.js';
export * from './newsletter.js';
export * from './publish-checklist-item.js';
export * from './publisher-profile.js';
export * from './section.js';
export * from './subscriber.js';
export * from './tag.js';
export * from './topic.js';
