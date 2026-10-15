<script lang="ts">
  import './article-admin-list-screen.css';
  import { goto } from '$app/navigation';
  import { createDictionary } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import {
    Badge,
    Button,
    DataTable,
    Dialog,
    FilterLinkList,
    InlineNotification,
  } from '@sveltebuilder/coreui';
  import type { DataTableColumn } from '@sveltebuilder/coreui';
  import type { ArticleAdminListView, ArticleRow } from '@sveltebuilder/content/views';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';
  import ArticleCreateForm from './ArticleCreateForm.svelte';

  let { data, form }: { data: ArticleAdminListView; form?: ScreenFormResult } = $props();

  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'content');

  let newArticleOpen = $state(false);

  const columns: DataTableColumn[] = $derived([
    { key: 'headline', label: t('content.article_admin.headline') },
    { key: 'status', label: t('content.article_admin.status') },
    { key: 'slug', label: t('content.article_admin.slug') },
    { key: 'created', label: t('content.article_admin.created') },
  ]);

  const href = (statusSlug: string | null, page = 1) => {
    const params = new URLSearchParams();
    if (statusSlug !== null) params.set('status', statusSlug);
    if (page > 1) params.set('page', String(page));
    const query = params.toString();
    return `/admin/content/article${query ? `?${query}` : ''}`;
  };

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(data.localeCode, { dateStyle: 'medium' }).format(new Date(iso));
</script>

{#snippet articleCell(row: ArticleRow, column: DataTableColumn)}
  {#if column.key === 'headline'}
    <a href="/admin/content/article/{row.id}" class="article-admin-list-screen__link">
      {scoped.localText('headline', 'article', row.id)}
    </a>
  {:else if column.key === 'status'}
    <Badge variant={row.status.slug === 'published' ? 'success' : 'default'}>
      {scoped.localText('name', 'article_status', row.status.id)}
    </Badge>
  {:else if column.key === 'slug'}
    <code class="article-admin-list-screen__slug">{row.canonicalSlug}</code>
  {:else if column.key === 'created'}
    {formatDate(row.createdAt)}
  {/if}
{/snippet}

<svelte:head>
  <title>{t('content.article_admin.article')}</title>
</svelte:head>

<div class="article-admin-list-screen">
  <header class="article-admin-list-screen__header">
    <h1 class="article-admin-list-screen__title">{t('content.article_admin.article')}</h1>
    <Button variant="primary" onclick={() => (newArticleOpen = true)}>
      {t('content.article_admin.new')}
    </Button>
  </header>

  {#if form?.error}
    <InlineNotification severity="danger" summary={form.error} />
  {/if}

  <FilterLinkList
    label={t('content.article_admin.filter_status')}
    links={[
      { href: href(null), label: t('content.article_admin.filter_all'), current: data.statusSlug === null },
      ...data.statuses.map((status) => ({
        href: href(status.slug),
        label: scoped.localText('name', 'article_status', status.id),
        current: data.statusSlug === status.slug,
      })),
    ]}
  />

  <DataTable
    {columns}
    rows={data.articles}
    rowKey={(row) => row.id}
    cell={articleCell}
    page={data.page}
    perPage={data.perPage}
    total={data.total}
    onPageChange={(next) => goto(href(data.statusSlug, next))}
    labels={{
      empty: t('content.article_admin.empty'),
      pagination: dictionary.localText('navigation.pagination'),
      previousPage: dictionary.localText('pagination.previous'),
      nextPage: dictionary.localText('pagination.next'),
    }}
  />
</div>

<Dialog bind:open={newArticleOpen} title={t('content.article_admin.new')} closeLabel={dictionary.localText('action.close')}>
  {#snippet children()}
    <ArticleCreateForm dictionary={scoped} onCancel={() => (newArticleOpen = false)} />
  {/snippet}
</Dialog>
