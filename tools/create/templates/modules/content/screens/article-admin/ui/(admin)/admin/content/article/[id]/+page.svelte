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
    TableHeaderCell,
    TableRow,
  } from '@sveltebuilder/coreui';
  import type { ArticleAdminDetailView } from '@sveltebuilder/content/views';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';

  let { data, form }: { data: ArticleAdminDetailView; form?: ScreenFormResult } = $props();

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

<div class="article-admin">
  <header class="article-admin__header">
    <a href="/admin/content/article" class="article-admin__back">
      ← {t('content.article_admin.article')}
    </a>
    <div class="article-admin__title-row">
      <h1 class="article-admin__title">{headline}</h1>
      <Badge variant={article.status.slug === 'published' ? 'success' : 'default'}>
        {scoped.localText('name', 'article_status', article.status.id)}
      </Badge>
    </div>
    <p class="article-admin__slug"><code>{article.canonicalSlug}</code></p>
  </header>

  {#if form?.error}
    <InlineNotification severity="danger" summary={form.error} />
  {/if}

  <div class="article-admin__columns">
    <section class="article-admin__section" aria-label={t('content.article_admin.body')}>
      <h2 class="article-admin__section-title">{t('content.article_admin.body')}</h2>

      {#if article.blocks.length > 0}
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{t('content.article_admin.block_type')}</TableHeaderCell>
              <TableHeaderCell>{t('content.article_admin.block_text')}</TableHeaderCell>
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
        <p class="article-admin__empty">{t('content.article_admin.body_empty')}</p>
      {/if}

      <h2 class="article-admin__section-title">{t('content.article_admin.filing')}</h2>
      <dl class="article-admin__filing">
        <div>
          <dt>{t('content.article_admin.section')}</dt>
          <dd>
            {article.sections.length > 0
              ? article.sections
                  .map((section) => scoped.localText('name', 'section', section.id))
                  .join(', ')
              : '—'}
          </dd>
        </div>
        <div>
          <dt>{t('content.article_admin.article_byline')}</dt>
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

    <section class="article-admin__section" aria-label={t('content.article_admin.workflow')}>
      <h2 class="article-admin__section-title">{t('content.article_admin.checklist')}</h2>

      <ul class="article-admin__checklist">
        {#each data.checklist as item (item.id)}
          <li class="article-admin__checklist-item">
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
              <span class="article-admin__required">{t('content.article_admin.required')}</span>
            {/if}
          </li>
        {/each}
      </ul>

      <h2 class="article-admin__section-title">{t('content.article_admin.status')}</h2>

      {#if !publishable}
        <InlineNotification
          severity="info"
          summary={t('content.article_admin.publish_blocked')}
          detail={blockingItems
            .map((item) => scoped.localText('label', 'publish_checklist_item', item.id))
            .join(', ')}
        />
      {/if}

      <form method="POST" action="?/transition" class="article-admin__form" use:enhance>
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
  .article-admin {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-6);
    max-width: 72rem;
    margin-inline: auto;
  }

  .article-admin__back {
    color: var(--text-soft);
    font-size: var(--text-sm);
    text-decoration: none;
  }

  .article-admin__title-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-block-start: var(--space-2);
    flex-wrap: wrap;
  }

  .article-admin__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--text);
    margin: 0;
  }

  .article-admin__slug,
  .article-admin__empty {
    color: var(--text-soft);
    font-size: var(--text-sm);
    margin: var(--space-1) 0 0;
  }

  .article-admin__columns {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(22rem, 1fr));
    gap: var(--space-8);
    align-items: start;
  }

  .article-admin__section {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .article-admin__section-title {
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--text);
    margin: var(--space-4) 0 0;
  }

  .article-admin__filing {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin: 0;
  }

  .article-admin__filing dt {
    font-size: var(--text-sm);
    color: var(--text-soft);
  }

  .article-admin__filing dd {
    margin: 0;
    color: var(--text);
  }

  .article-admin__checklist {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .article-admin__checklist-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .article-admin__required {
    font-size: var(--text-xs);
    color: var(--text-soft);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .article-admin__form {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }
</style>
