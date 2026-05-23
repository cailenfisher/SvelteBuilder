<script lang="ts">
  import { localText } from '@sveltebuilder/hermes';

  type Props = {
    postId: number;
    locale: string;
    class?: string | undefined;
  };

  let { postId, locale: _locale, class: extraClass }: Props = $props();

  // SECURITY: The consuming application is responsible for sanitizing body content
  // (e.g. via DOMPurify or a server-side HTML sanitizer) before it is stored in
  // the LocalText system. This component renders the stored HTML as-is.
  const body = $derived(localText('body', 'post', postId));

  const classes = $derived(
    ['post-body', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<div class={classes}>
  {@html body}
</div>

<style>
  .post-body {
    font-size: var(--text-base);
    line-height: var(--leading-relaxed);
    color: var(--color-text-primary);
    max-width: 70ch;
  }

  /* Prose typography — headings */
  .post-body :global(h1),
  .post-body :global(h2),
  .post-body :global(h3),
  .post-body :global(h4),
  .post-body :global(h5),
  .post-body :global(h6) {
    font-weight: var(--weight-semibold);
    line-height: var(--leading-snug);
    color: var(--color-text-primary);
    margin-block: var(--space-6) var(--space-3);
  }

  .post-body :global(h2) { font-size: var(--text-2xl); }
  .post-body :global(h3) { font-size: var(--text-xl); }
  .post-body :global(h4) { font-size: var(--text-lg); }

  /* Paragraphs */
  .post-body :global(p) {
    margin-block: 0 var(--space-4);
  }

  /* Links */
  .post-body :global(a) {
    color: var(--color-text-link);
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 2px;
  }

  .post-body :global(a:hover) {
    color: var(--color-text-link-hover);
  }

  /* Lists */
  .post-body :global(ul),
  .post-body :global(ol) {
    padding-inline-start: var(--space-6);
    margin-block: 0 var(--space-4);
  }

  .post-body :global(li) {
    margin-block-end: var(--space-1);
  }

  /* Blockquote */
  .post-body :global(blockquote) {
    border-inline-start: 4px solid var(--color-border-brand);
    padding-inline-start: var(--space-4);
    margin-inline: 0;
    margin-block: var(--space-4);
    color: var(--color-text-secondary);
    font-style: italic;
  }

  /* Code inline */
  .post-body :global(code) {
    font-family: var(--font-mono);
    font-size: 0.875em;
    background-color: var(--color-surface-overlay);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-sm);
    padding: 0.125em 0.375em;
  }

  /* Code blocks */
  .post-body :global(pre) {
    background-color: var(--color-surface-sunken);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    overflow-x: auto;
    margin-block: 0 var(--space-4);
  }

  .post-body :global(pre code) {
    background: none;
    border: none;
    padding: 0;
    font-size: var(--text-sm);
  }

  /* Horizontal rule */
  .post-body :global(hr) {
    border: none;
    border-block-start: 1px solid var(--color-border-default);
    margin-block: var(--space-8);
  }

  /* Images */
  .post-body :global(img) {
    max-width: 100%;
    border-radius: var(--radius-lg);
    height: auto;
  }

  /* Tables */
  .post-body :global(table) {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-sm);
    margin-block: 0 var(--space-4);
  }

  .post-body :global(th),
  .post-body :global(td) {
    border: 1px solid var(--color-border-default);
    padding: var(--space-2) var(--space-3);
    text-align: left;
  }

  .post-body :global(th) {
    font-weight: var(--weight-semibold);
    background-color: var(--color-surface-raised);
  }
</style>
