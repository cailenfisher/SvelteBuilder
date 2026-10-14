<script lang="ts">
  import './section-detail-screen.css';
  import { goto } from '$app/navigation';
  import { createDictionary } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { Pagination } from '@sveltebuilder/coreui';
  import { ArticleCard, SectionLink } from '@sveltebuilder/content';
  import type { SectionDetailView } from '@sveltebuilder/content/views';

  let { data }: { data: SectionDetailView } = $props();

  const dictionary = getDictionary();

  // Request-scoped, not a merge into the context instance — see the article screen.
  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'content');

  const mediaAssets = $derived(new Map(data.mediaAssets.map((asset) => [asset.id, asset])));

  const sectionName = $derived(scoped.localText('name', 'section', data.section.id));

  const href = (page: number) =>
    page > 1 ? `/section/${data.section.slug}?page=${page}` : `/section/${data.section.slug}`;
</script>

<svelte:head>
  <title>{sectionName}</title>
</svelte:head>

<main class="section-detail-screen">
  <header class="section-detail-screen__header">
    <h1 class="section-detail-screen__title">{sectionName}</h1>

    {#if data.childSections.length > 0}
      <nav class="section-detail-screen__children" aria-label={t('content.section.subsections')}>
        {#each data.childSections as child (child.id)}
          <!-- Camp 2 component: it resolves the section's name from the dictionary itself. -->
          <SectionLink
            section={child}
            locale={data.localeCode}
            href="/section/{child.slug}"
            dictionary={scoped}
          />
        {/each}
      </nav>
    {/if}
  </header>

  {#if data.articles.length > 0}
    <div class="section-detail-screen__river">
      {#each data.articles as article, index (article.id)}
        <!-- The first article leads the page; the rest run as a river. This is the one piece
             of editorial judgement a listing makes without a curated front. -->
        <ArticleCard
          {article}
          status={article.status}
          bylines={article.bylines}
          sections={article.sections}
          topics={article.topics}
          locale={data.localeCode}
          href="/article/{article.canonicalSlug}"
          variant={index === 0 ? 'lead' : 'river'}
          {mediaAssets}
          blocks={article.blocks}
          storageBaseUrl={data.storageBaseUrl}
          dictionary={scoped}
        />
      {/each}
    </div>

    {#if data.total > data.perPage}
      <nav class="section-detail-screen__pagination" aria-label={t('content.section.pagination')}>
        <!-- Server-side paging, so a page change is a navigation: the loader owns the slice and
             a shared URL has to land on the same one. -->
        <Pagination
          count={data.total}
          perPage={data.perPage}
          page={data.page}
          onPageChange={(next) => goto(href(next))}
          previousLabel={dictionary.localText('pagination.previous')}
          nextLabel={dictionary.localText('pagination.next')}
          label={dictionary.localText('navigation.pagination')}
        />
      </nav>
    {/if}
  {:else}
    <p class="section-detail-screen__empty">{t('content.section.empty')}</p>
  {/if}
</main>
