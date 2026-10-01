<script lang="ts">
  import { enhance } from '$app/forms';
  import { createDictionary } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import {
    Badge,
    Button,
    Checkbox,
    InlineNotification,
    Select,
    SelectItem,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@sveltebuilder/coreui';
  import type { AdminArticleDetailView, ScreenFormResult } from '@sveltebuilder/content/views';

  let { data, form }: { data: AdminArticleDetailView; form?: ScreenFormResult } = $props();

  // One form per checklist item, keyed by item id so the checkbox can submit its own.
  const checklistForms: Record<number, HTMLFormElement | undefined> = $state({});

  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'content');

  const article = $derived(data.article);
  const headline = $derived(scoped.localText('headline', 'article', article.id));

  // What the server will refuse, shown before the editor tries. The RPC enforces the same rule,
  // so this is a courtesy rather than the safeguard.
  const blockingItems = $derived(data.checklist.filter((item) => item.required && !item.completed));
  const publishable = $derived(blockingItems.length === 0);
</script>

<svelte:head>
  <title>{headline}</title>
</svelte:head>

<div class="admin-article">
  <header class="admin-article__header">
    <a href="/admin/content/article" class="admin-article__back">
      ← {t('content.admin.articles')}
    </a>
    <div class="admin-article__title-row">
      <h1 class="admin-article__title">{headline}</h1>
      <Badge variant={article.status.slug === 'published' ? 'success' : 'default'}>
        {scoped.localText('name', 'article_status', article.status.id)}
      </Badge>
    </div>
    <p class="admin-article__slug"><code>{article.canonicalSlug}</code></p>
  </header>

  {#if form?.error}
    <InlineNotification severity="error" summary={form.error} />
  {/if}

  <div class="admin-article__columns">
    <section class="admin-article__section" aria-label={t('content.admin.body')}>
      <h2 class="admin-article__section-title">{t('content.admin.body')}</h2>

      {#if article.blocks.length > 0}
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>{t('content.admin.block_type')}</TableHeader>
              <TableHeader>{t('content.admin.block_text')}</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {#each article.blocks as block (block.id)}
              <TableRow>
                <TableCell>{block.blockType}</TableCell>
                <TableCell>
                  {scoped.localText('text', 'article_block', block.id)}
                </TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      {:else}
        <p class="admin-article__empty">{t('content.admin.body_empty')}</p>
      {/if}

      <h2 class="admin-article__section-title">{t('content.admin.filing')}</h2>
      <dl class="admin-article__filing">
        <div>
          <dt>{t('content.admin.sections')}</dt>
          <dd>
            {article.sections.length > 0
              ? article.sections
                  .map((section) => scoped.localText('name', 'section', section.id))
                  .join(', ')
              : '—'}
          </dd>
        </div>
        <div>
          <dt>{t('content.admin.bylines')}</dt>
          <dd>
            {article.bylines.length > 0
              ? article.bylines
                  .map((author) => scoped.localText('name', 'author_profile', author.id))
                  .join(', ')
              : '—'}
          </dd>
        </div>
      </dl>
    </section>

    <section class="admin-article__section" aria-label={t('content.admin.workflow')}>
      <h2 class="admin-article__section-title">{t('content.admin.checklist')}</h2>

      <ul class="admin-article__checklist">
        {#each data.checklist as item (item.id)}
          <li class="admin-article__checklist-item">
            <!-- One form per item: ticking a box is its own submission, so a half-filled
                 checklist cannot be lost by navigating away. use:enhance keeps the page. -->
            <form
              method="POST"
              action="?/checklist"
              use:enhance
              bind:this={checklistForms[item.id]}
            >
              <input type="hidden" name="item_id" value={item.id} />
              <input type="hidden" name="satisfied" value={item.completed ? 'false' : 'true'} />
              <!-- Checkbox is self-labelling, so it is not wrapped in a Field. -->
              <Checkbox
                checked={item.completed}
                label={scoped.localText('label', 'publish_checklist_item', item.id)}
                onCheckedChange={() => checklistForms[item.id]?.requestSubmit()}
              />
            </form>
            {#if item.required}
              <span class="admin-article__required">{t('content.admin.required')}</span>
            {/if}
          </li>
        {/each}
      </ul>

      <h2 class="admin-article__section-title">{t('content.admin.status')}</h2>

      {#if !publishable}
        <InlineNotification
          severity="info"
          summary={t('content.admin.publish_blocked')}
          detail={blockingItems
            .map((item) => scoped.localText('label', 'publish_checklist_item', item.id))
            .join(', ')}
        />
      {/if}

      <form method="POST" action="?/transition" class="admin-article__form" use:enhance>
        <Select name="status_slug" value={article.status.slug}>
          {#each data.statuses as status (status.id)}
            <SelectItem
              value={status.slug}
              label={scoped.localText('name', 'article_status', status.id)}
            />
          {/each}
        </Select>
        <Button type="submit" variant="primary" size="sm">
          {dictionary.localText('action.save')}
        </Button>
      </form>
    </section>
  </div>
</div>

<style>
  .admin-article {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-6);
    max-width: 72rem;
    margin-inline: auto;
  }

  .admin-article__back {
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    text-decoration: none;
  }

  .admin-article__title-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-block-start: var(--space-2);
    flex-wrap: wrap;
  }

  .admin-article__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .admin-article__slug,
  .admin-article__empty {
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    margin: var(--space-1) 0 0;
  }

  .admin-article__columns {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(22rem, 1fr));
    gap: var(--space-8);
    align-items: start;
  }

  .admin-article__section {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .admin-article__section-title {
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--color-text-primary);
    margin: var(--space-4) 0 0;
  }

  .admin-article__filing {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin: 0;
  }

  .admin-article__filing dt {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  .admin-article__filing dd {
    margin: 0;
    color: var(--color-text-primary);
  }

  .admin-article__checklist {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .admin-article__checklist-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .admin-article__required {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .admin-article__form {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }
</style>
