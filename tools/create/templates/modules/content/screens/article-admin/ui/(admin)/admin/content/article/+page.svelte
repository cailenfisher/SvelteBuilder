<script lang="ts">
  import './article-admin-list-screen.css';
  import { goto } from '$app/navigation';
  import { createDictionary } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { Button, Dialog, FilterLinkList, InlineNotification } from '@sveltebuilder/coreui';
  import { ArticleList } from '@sveltebuilder/content';
  import type { ArticleAdminListView } from '@sveltebuilder/content/views';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';
  import ArticleCreateForm from './ArticleCreateForm.svelte';
  import { formErrorText } from '$lib/FormError/form-error';

  let { data, form }: { data: ArticleAdminListView; form?: ScreenFormResult } = $props();

  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const localText = (slug: string) => scoped.localText(slug, 'content');

  let newArticleOpen = $state(false);

  const href = (statusSlug: string | null, page = 1) => {
    const params = new URLSearchParams();
    if (statusSlug !== null) params.set('status', statusSlug);
    if (page > 1) params.set('page', String(page));
    const query = params.toString();
    return `/admin/content/article${query ? `?${query}` : ''}`;
  };
</script>

<svelte:head>
  <title>{localText('content.article_admin.article')}</title>
</svelte:head>

<div class="article-admin-list-screen">
  <header class="article-admin-list-screen__header">
    <h1 class="article-admin-list-screen__title">{localText('content.article_admin.article')}</h1>
    <Button variant="primary" onclick={() => (newArticleOpen = true)}>
      {localText('content.article_admin.new')}
    </Button>
  </header>

  {#if form?.error}
    <InlineNotification severity="danger" summary={formErrorText(form.error, scoped, dictionary)} detail={form.error.detail} />
  {/if}

  <FilterLinkList
    label={localText('content.article_admin.filter_status')}
    links={[
      { href: href(null), label: localText('content.article_admin.filter_all'), current: data.statusSlug === null },
      ...data.statuses.map((status) => ({
        href: href(status.slug),
        label: scoped.localText('name', 'article_status', status.id),
        current: data.statusSlug === status.slug,
      })),
    ]}
  />

  <ArticleList
    articles={data.articles}
    href={(article) => `/admin/content/article/${article.id}`}
    page={data.page}
    perPage={data.perPage}
    total={data.total}
    onPageChange={(next) => goto(href(data.statusSlug, next))}
    locale={data.localeCode}
    dictionary={scoped}
  />
</div>

<Dialog bind:open={newArticleOpen} title={localText('content.article_admin.new')} closeLabel={dictionary.localText('action.close')}>
  {#snippet children()}
    <ArticleCreateForm dictionary={scoped} onCancel={() => (newArticleOpen = false)} />
  {/snippet}
</Dialog>
