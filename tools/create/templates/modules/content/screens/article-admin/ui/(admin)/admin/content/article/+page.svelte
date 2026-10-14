<script lang="ts">
  import { goto } from '$app/navigation';
  import { createDictionary } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import {
    Badge,
    Button,
    DataTable,
    Dialog,
    Field,
    InlineNotification,
    Input,
  } from '@sveltebuilder/coreui';
  import type { DataTableColumn } from '@sveltebuilder/coreui';
  import type { ArticleAdminListView, ArticleRow } from '@sveltebuilder/content/views';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';

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
    <a href="/admin/content/article/{row.id}" class="article-admin-list__link">
      {scoped.localText('headline', 'article', row.id)}
    </a>
  {:else if column.key === 'status'}
    <Badge variant={row.status.slug === 'published' ? 'success' : 'default'}>
      {scoped.localText('name', 'article_status', row.status.id)}
    </Badge>
  {:else if column.key === 'slug'}
    <code class="article-admin-list__slug">{row.canonicalSlug}</code>
  {:else if column.key === 'created'}
    {formatDate(row.createdAt)}
  {/if}
{/snippet}

<svelte:head>
  <title>{t('content.article_admin.article')}</title>
</svelte:head>

<div class="article-admin-list">
  <header class="article-admin-list__header">
    <h1 class="article-admin-list__title">{t('content.article_admin.article')}</h1>
    <Button variant="primary" onclick={() => (newArticleOpen = true)}>
      {t('content.article_admin.new')}
    </Button>
  </header>

  {#if form?.error}
    <InlineNotification severity="danger" summary={form.error} />
  {/if}

  <!-- Links in a <nav>, not tabs: the filter is server-side, so each option is a navigation to a
       different URL rather than a panel swap, and aria-current is what says which is on. -->
  <nav class="article-admin-list__filters" aria-label={t('content.article_admin.filter_status')}>
    <Button
      href={href(null)}
      variant={data.statusSlug === null ? 'secondary' : 'ghost'}
      size="sm"
      aria-current={data.statusSlug === null ? 'page' : undefined}
    >
      {t('content.article_admin.filter_all')}
    </Button>
    {#each data.statuses as status (status.id)}
      <Button
        href={href(status.slug)}
        variant={data.statusSlug === status.slug ? 'secondary' : 'ghost'}
        size="sm"
        aria-current={data.statusSlug === status.slug ? 'page' : undefined}
      >
        {scoped.localText('name', 'article_status', status.id)}
      </Button>
    {/each}
  </nav>

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
    <form method="POST" action="?/create" class="article-admin-list__form">
      <!-- Both fields are required: an article with no headline cannot be told apart from its
           siblings in the list above, which is the only place an editor will look for it. -->
      <Field label={t('content.article_admin.headline')} id="new-headline" required>
        <Input name="headline" required />
      </Field>
      <Field label={t('content.article_admin.slug')} id="new-slug" required>
        <Input name="canonical_slug" required />
      </Field>

      <div class="article-admin-list__form-actions">
        <Button variant="ghost" onclick={() => (newArticleOpen = false)}>
          {dictionary.localText('action.cancel')}
        </Button>
        <Button type="submit" variant="primary">{t('content.article_admin.create')}</Button>
      </div>
    </form>
  {/snippet}
</Dialog>

<style>
  .article-admin-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-6);
    max-width: 72rem;
    margin-inline: auto;
  }

  .article-admin-list__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  .article-admin-list__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--text);
    margin: 0;
  }

  .article-admin-list__filters {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .article-admin-list__link {
    color: var(--text);
    font-weight: var(--weight-medium);
  }

  .article-admin-list__slug {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--text-soft);
  }

  .article-admin-list__form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .article-admin-list__form-actions {
    display: flex;
    gap: var(--space-2);
    justify-content: flex-end;
  }
</style>
