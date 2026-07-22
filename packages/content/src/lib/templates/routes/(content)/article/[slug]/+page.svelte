<script lang="ts">
  import { merge } from '@sveltebuilder/hermes';
  import { ArticleView, NewsletterSignup } from '@sveltebuilder/content';
  import { buildNewsArticleJsonLd, buildArticleMetaTags } from '@sveltebuilder/content/server';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  $effect(() => {
    merge(data.dictionaryPayload, data.locale.code, data.defaultLocale.code);
  });

  const jsonLd = $derived(
    data.publisherProfile
      ? buildNewsArticleJsonLd(data.article, data.publisherProfile, data.canonicalUrl, data.locale.code)
      : null,
  );

  const metaTags = $derived(
    buildArticleMetaTags(data.article, data.canonicalUrl, data.locales),
  );

  const mediaAssets = $derived(
    new Map(
      (data.article.blocks ?? [])
        .filter((b) => b.mediaAsset != null)
        .map((b) => [BigInt(b.mediaAssetId!), b.mediaAsset!]),
    ),
  );

  const commentsPending = $derived(form?.success === true);
</script>

<svelte:head>
  <title>{data.article.headline}</title>
  {#each metaTags as tag}
    {#if 'content' in tag}
      <meta name={tag.name} content={tag.content} />
    {:else if 'href' in tag}
      <link rel={tag.rel} hreflang={tag.hreflang} href={tag.href} />
    {:else if 'property' in tag}
      <meta property={tag.property} content={tag.ogContent} />
    {/if}
  {/each}
  {#if jsonLd}
    {@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}</` + `script>`}
  {/if}
</svelte:head>

<main class="article-page">
  <ArticleView
    article={data.article}
    {mediaAssets}
    storageBaseUrl={data.storageBaseUrl}
    locale={data.locale.code}
  >
    {#snippet after()}
      {#if data.article.allowComment}
        <section class="article-page__comments" aria-label="Comments">
          {#if commentsPending}
            <p class="article-page__comment-pending" role="status" aria-live="polite">
              Your comment has been submitted and is awaiting moderation.
            </p>
          {:else}
            <form class="article-page__comment-form" method="POST" action="?/comment">
              <h2 class="article-page__comments-heading">Leave a comment</h2>
              <label class="article-page__label" for="comment-name">Name</label>
              <input class="article-page__input" id="comment-name" name="author_name" type="text" required />

              <label class="article-page__label" for="comment-email">Email</label>
              <input class="article-page__input" id="comment-email" name="author_email" type="email" required />

              <label class="article-page__label" for="comment-body">Comment</label>
              <textarea class="article-page__textarea" id="comment-body" name="body" rows="5" required></textarea>

              {#if form?.error}
                <p class="article-page__form-error" role="alert">{form.error}</p>
              {/if}

              <button class="article-page__submit" type="submit">Submit comment</button>
            </form>
          {/if}
        </section>
      {/if}
    {/snippet}
  </ArticleView>
</main>

<style>
  .article-page {
    padding: var(--space-8) var(--space-4);
  }

  .article-page__comments {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding-block-start: var(--space-8);
  }

  .article-page__comments-heading {
    margin: 0;
    font-size: var(--text-xl);
    font-weight: var(--weight-semibold);
    color: var(--text);
  }

  .article-page__comment-pending {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--text-soft);
    font-style: italic;
  }

  .article-page__comment-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    max-width: 40rem;
  }

  .article-page__label {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--text);
  }

  .article-page__input,
  .article-page__textarea {
    width: 100%;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    font-size: var(--text-base);
    color: var(--text);
    background: var(--surface);
  }

  .article-page__textarea {
    resize: vertical;
    min-height: 7rem;
  }

  .article-page__form-error {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--color-error, #dc2626);
  }

  .article-page__submit {
    align-self: flex-start;
    padding: var(--space-2) var(--space-5);
    background: var(--brand);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    cursor: pointer;
  }

  .article-page__submit:hover {
    background: color-mix(in srgb, var(--brand), black 15%);
  }
</style>
