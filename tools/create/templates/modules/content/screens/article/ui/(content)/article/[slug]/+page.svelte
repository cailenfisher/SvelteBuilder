<script lang="ts">
  import './article-detail-screen.css';
  import { createDictionary } from 'diglossia';
  import { InlineNotification } from '@sveltebuilder/coreui';
  import { ArticleDetail, CommentList } from '@sveltebuilder/content';
  import { buildArticleMetaTags, buildNewsArticleJsonLd } from '@sveltebuilder/content/publishing';
  import type { ArticleDetailView } from '@sveltebuilder/content/views';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';
  import CommentForm from './CommentForm.svelte';

  let { data, form }: { data: ArticleDetailView; form?: ScreenFormResult } = $props();

  // A fresh instance from this screen's payload, not `getDictionary().merge(...)`. Merging
  // would mutate the dictionary the root layout put in context, which on the server is shared
  // by everything rendering that request and on the client accumulates every article the
  // reader has visited. createDictionary() is request-scoped by construction.
  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'content');

  const siteUrl = $derived(new URL(data.canonicalUrl).origin);

  // Keyed by id for the components and the structured-data builders, which both take a lookup
  // rather than assets embedded on each block.
  const mediaAssets = $derived(new Map(data.mediaAssets.map((asset) => [asset.id, asset])));
  const attributions = $derived(new Map(data.attributions.map((row) => [row.mediaAssetId, row])));

  // Both builders are pure: entities and a dictionary in, plain objects out. They live in
  // @sveltebuilder/content/publishing rather than a server entry point for that reason.
  const structuredDataOptions = $derived({
    siteUrl,
    locale: data.localeCode,
    storageBaseUrl: data.storageBaseUrl,
    mediaAssets,
  });

  const jsonLd = $derived(
    data.publisherProfile
      ? buildNewsArticleJsonLd(data.article, data.publisherProfile, scoped, structuredDataOptions)
      : null
  );

  const metaTags = $derived(
    data.publisherProfile
      ? buildArticleMetaTags(data.article, data.publisherProfile, scoped, structuredDataOptions)
      : {}
  );

  const commentAccepted = $derived(form?.success === true);
</script>

<svelte:head>
  <title>{scoped.localText('headline', 'article', data.article.id)}</title>
  <link rel="canonical" href={data.canonicalUrl} />
  {#each Object.entries(metaTags) as [key, value] (key)}
    {#if key === 'canonical'}
      <!-- Emitted above from the loader's own canonicalUrl, so it is not repeated here. -->
    {:else if key.startsWith('twitter:')}
      <meta name={key} content={value} />
    {:else}
      <meta property={key} content={value} />
    {/if}
  {/each}
  {#if jsonLd}
    <!-- Split so the closing tag cannot terminate this script block early. -->
    {@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}</` + `script>`}
  {/if}
</svelte:head>

<main class="article-detail-screen">
  <!-- Camp 2 component: it resolves the headline, dek and every block's text from the
       dictionary by entity id, so it takes this screen's instance rather than context. -->
  <ArticleDetail
    article={data.article}
    {mediaAssets}
    {attributions}
    storageBaseUrl={data.storageBaseUrl}
    locale={data.localeCode}
    dictionary={scoped}
  >
    {#snippet after()}
      {#if data.article.commentAllowed}
        <section class="article-detail-screen__comments" aria-label={t('content.comment.heading')}>
          <h2 class="article-detail-screen__comments-heading">{t('content.comment.heading')}</h2>

          {#if data.comments.length > 0}
            <CommentList comments={data.comments} />
          {/if}

          {#if commentAccepted}
            <!-- role="status" rather than an alert: a successful submission is confirmation,
                 not a problem, and should not interrupt a screen reader. -->
            <InlineNotification severity="success" summary={t('content.comment.pending')} />
          {:else}
            <CommentForm error={form?.error} dictionary={scoped} />
          {/if}
        </section>
      {/if}
    {/snippet}
  </ArticleDetail>
</main>
