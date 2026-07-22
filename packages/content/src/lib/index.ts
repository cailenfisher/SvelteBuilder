// =============================================================================
// @sveltebuilder/content — public surface
// =============================================================================

// Schema / types
export * from './schema/index.js';

// Camp 1 components (no hermes dependency)
export { default as ArticleList }       from './components/ArticleList.svelte';
export { default as AssignmentQueue }   from './components/AssignmentQueue.svelte';
export { default as BlockEditorHost }   from './components/BlockEditorHost.svelte';
export { default as FrontCurationBoard } from './components/FrontCurationBoard.svelte';
export { default as SubscriberList }    from './components/SubscriberList.svelte';

// Camp 2 components (import hermes — require hermes.load() before mount)
export { default as ArticleBlockRenderer } from './components/ArticleBlockRenderer.svelte';
export { default as ArticleCard }       from './components/ArticleCard.svelte';
export { default as ArticleView }       from './components/ArticleView.svelte';
export { default as ArticleWorkflowPanel } from './components/ArticleWorkflowPanel.svelte';
export { default as AuthorProfileView } from './components/AuthorProfileView.svelte';
export { default as BylineList }        from './components/BylineList.svelte';
export { default as LiveCoverageView }  from './components/LiveCoverageView.svelte';
export { default as LiveUpdateItem }    from './components/LiveUpdateItem.svelte';
export { default as MediaFigure }       from './components/MediaFigure.svelte';
export { default as NewsletterSignup }  from './components/NewsletterSignup.svelte';
export { default as SectionFront }      from './components/SectionFront.svelte';
export { default as SectionLabel }      from './components/SectionLabel.svelte';
export { default as TopicTag }          from './components/TopicTag.svelte';
