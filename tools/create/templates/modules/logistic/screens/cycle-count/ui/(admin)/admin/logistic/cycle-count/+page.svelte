<script lang="ts">
  import { goto } from '$app/navigation';
  import { createDictionary } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import {
    Button,
    Checkbox,
    DataTable,
    Dialog,
    InlineNotification,
    StatusBadge,
  } from '@sveltebuilder/coreui';
  import type { DataTableColumn } from '@sveltebuilder/coreui';
  import type { CycleCountStatus } from '@sveltebuilder/logistic';
  import type {
    CycleCountListView,
    CycleCountRow,
    ScreenFormResult,
  } from '@sveltebuilder/logistic/views';

  let { data, form }: { data: CycleCountListView; form?: ScreenFormResult } = $props();

  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');

  let newCountOpen = $state(false);

  const columns: DataTableColumn[] = $derived([
    { key: 'id', label: t('logistic.cycle_count.one') },
    { key: 'status', label: t('logistic.cycle_count.status_label') },
    { key: 'progress', label: t('logistic.cycle_count.progress'), align: 'right' },
    { key: 'createdAt', label: t('logistic.cycle_count.created_at') },
  ]);

  // StatusBadge takes a variant, not a domain status: mapping the one to the other is the
  // caller's job by design, since only the domain knows which states are good news.
  const statusVariant = (status: CycleCountStatus) =>
    status === 'complete'
      ? 'success'
      : status === 'in_progress'
        ? 'warning'
        : status === 'cancelled'
          ? 'danger'
          : 'default';

  const href = (status: CycleCountStatus | null, page = 1) => {
    const params = new URLSearchParams();
    if (status !== null) params.set('status', status);
    if (page > 1) params.set('page', String(page));
    const query = params.toString();
    return `/admin/logistic/cycle-count${query ? `?${query}` : ''}`;
  };

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(data.localeCode, { dateStyle: 'medium' }).format(new Date(iso));
</script>

{#snippet countCell(row: CycleCountRow, column: DataTableColumn)}
  {#if column.key === 'id'}
    <a href="/admin/logistic/cycle-count/{row.id}" class="cycle-count-list__link">#{row.id}</a>
  {:else if column.key === 'status'}
    <StatusBadge
      variant={statusVariant(row.status)}
      label={t(`logistic.cycle_count.status.${row.status}`)}
    />
  {:else if column.key === 'progress'}
    <!-- Interpolated through MF2 so a locale can order the two numbers as its grammar
         needs, rather than the screen hardcoding "x of y". -->
    {scoped.formatText(
      'logistic.cycle_count.progress_value',
      { counted: row.countedCount, total: row.lineCount },
      'logistic'
    )}
  {:else if column.key === 'createdAt'}
    {formatDate(row.createdAt)}
  {/if}
{/snippet}

<svelte:head>
  <title>{t('logistic.cycle_count.title')}</title>
</svelte:head>

<div class="cycle-count-list">
  <header class="cycle-count-list__header">
    <h1 class="cycle-count-list__title">{t('logistic.cycle_count.title')}</h1>
    <Button variant="primary" onclick={() => (newCountOpen = true)}>
      {t('logistic.cycle_count.new')}
    </Button>
  </header>

  {#if form?.error}
    <InlineNotification severity="error" summary={form.error} />
  {/if}

  <nav class="cycle-count-list__filters" aria-label={t('logistic.cycle_count.filter_status')}>
    <Button
      href={href(null)}
      variant={data.status === null ? 'secondary' : 'ghost'}
      size="sm"
      aria-current={data.status === null ? 'page' : undefined}
    >
      {t('logistic.cycle_count.filter_all')}
    </Button>
    {#each data.statuses as status (status)}
      <Button
        href={href(status)}
        variant={data.status === status ? 'secondary' : 'ghost'}
        size="sm"
        aria-current={data.status === status ? 'page' : undefined}
      >
        {t(`logistic.cycle_count.status.${status}`)}
      </Button>
    {/each}
  </nav>

  <DataTable
    {columns}
    rows={data.counts}
    rowKey={(row) => row.id}
    cell={countCell}
    page={data.page}
    perPage={data.perPage}
    total={data.total}
    onPageChange={(next) => goto(href(data.status, next))}
    emptyLabel={t('logistic.cycle_count.empty')}
  />
</div>

<Dialog bind:open={newCountOpen} title={t('logistic.cycle_count.new')}>
  {#snippet children()}
    <form method="POST" action="?/create" class="cycle-count-new-form">
      <fieldset class="cycle-count-new-form__locations">
        <legend>{t('logistic.cycle_count.choose_locations')}</legend>
        {#each data.locations as location (location.id)}
          <!-- Checkbox is self-labelling, so it is not wrapped in a Field: that would
               nest one label inside another and leave the outer for= dangling. -->
          <Checkbox
            name="location_ids"
            value={String(location.id)}
            label={scoped.localText('name', 'storage_location', location.id)}
          />
        {/each}
      </fieldset>

      <div class="cycle-count-new-form__actions">
        <Button variant="ghost" onclick={() => (newCountOpen = false)}>
          {dictionary.localText('action.cancel')}
        </Button>
        <Button type="submit" variant="primary">{t('logistic.cycle_count.create')}</Button>
      </div>
    </form>
  {/snippet}
</Dialog>

<style>
  .cycle-count-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-6);
    max-width: 72rem;
    margin-inline: auto;
  }

  .cycle-count-list__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  .cycle-count-list__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .cycle-count-list__filters {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .cycle-count-list__link {
    color: var(--color-text-primary);
    font-weight: var(--weight-medium);
  }

  .cycle-count-new-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .cycle-count-new-form__locations {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    border: 0;
    margin: 0;
    padding: 0;
  }

  .cycle-count-new-form__actions {
    display: flex;
    gap: var(--space-2);
    justify-content: flex-end;
  }
</style>
