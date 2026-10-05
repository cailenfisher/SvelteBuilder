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
    Textarea,
  } from '@sveltebuilder/coreui';
  import type { DataTableColumn } from '@sveltebuilder/coreui';
  import type { ReturnAuthorizationStatus } from '@sveltebuilder/logistic';
  import type {
    ReturnAuthorizationRow,
    ReturnListView,
    ScreenFormResult,
  } from '@sveltebuilder/logistic/views';

  let { data, form }: { data: ReturnListView; form?: ScreenFormResult } = $props();

  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');

  let newReturnOpen = $state(false);

  const columns: DataTableColumn[] = $derived([
    { key: 'id', label: t('logistic.return.one') },
    { key: 'status', label: t('logistic.return.status_label') },
    { key: 'reason', label: t('logistic.return.reason') },
    { key: 'lineCount', label: t('logistic.return.lines'), align: 'right' },
    { key: 'createdAt', label: t('logistic.return.created_at') },
  ]);

  const statusVariant = (status: ReturnAuthorizationStatus) =>
    status === 'processed'
      ? 'success'
      : status === 'received'
        ? 'warning'
        : status === 'cancelled'
          ? 'danger'
          : 'default';

  const href = (status: ReturnAuthorizationStatus | null, page = 1) => {
    const params = new URLSearchParams();
    if (status !== null) params.set('status', status);
    if (page > 1) params.set('page', String(page));
    const query = params.toString();
    return `/admin/logistic/return${query ? `?${query}` : ''}`;
  };

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(data.localeCode, { dateStyle: 'medium' }).format(new Date(iso));
</script>

{#snippet returnCell(row: ReturnAuthorizationRow, column: DataTableColumn)}
  {#if column.key === 'id'}
    <a href="/admin/logistic/return/{row.id}" class="return-list__link">#{row.id}</a>
  {:else if column.key === 'status'}
    <Badge variant={statusVariant(row.status)}>
      {t(`logistic.return_authorization.status.${row.status}`)}
    </Badge>
  {:else if column.key === 'reason'}
    {row.reason ?? '—'}
  {:else if column.key === 'lineCount'}
    {row.lineCount}
  {:else if column.key === 'createdAt'}
    {formatDate(row.createdAt)}
  {/if}
{/snippet}

<svelte:head>
  <title>{t('logistic.return.title')}</title>
</svelte:head>

<div class="return-list">
  <header class="return-list__header">
    <h1 class="return-list__title">{t('logistic.return.title')}</h1>
    <Button variant="primary" onclick={() => (newReturnOpen = true)}>
      {t('logistic.return.new')}
    </Button>
  </header>

  {#if form?.error}
    <InlineNotification severity="error" summary={form.error} />
  {/if}

  <nav class="return-list__filters" aria-label={t('logistic.return.filter_status')}>
    <Button
      href={href(null)}
      variant={data.status === null ? 'secondary' : 'ghost'}
      size="sm"
      aria-current={data.status === null ? 'page' : undefined}
    >
      {t('logistic.return.filter_all')}
    </Button>
    {#each data.statuses as status (status)}
      <Button
        href={href(status)}
        variant={data.status === status ? 'secondary' : 'ghost'}
        size="sm"
        aria-current={data.status === status ? 'page' : undefined}
      >
        {t(`logistic.return_authorization.status.${status}`)}
      </Button>
    {/each}
  </nav>

  <DataTable
    {columns}
    rows={data.returns}
    rowKey={(row) => row.id}
    cell={returnCell}
    page={data.page}
    perPage={data.perPage}
    total={data.total}
    onPageChange={(next) => goto(href(data.status, next))}
    emptyLabel={t('logistic.return.empty')}
  />
</div>

<Dialog bind:open={newReturnOpen} title={t('logistic.return.new')} closeLabel={dictionary.localText('action.close')}>
  {#snippet children()}
    <form method="POST" action="?/create" class="return-new-form">
      <Field label={t('logistic.field.sku')} id="return-sku" required>
        <Input name="sku" required />
      </Field>
      <Field label={t('logistic.return.expected_quantity')} id="return-quantity" required>
        <Input name="expected_quantity" type="number" min="1" value="1" required />
      </Field>
      <Field label={t('logistic.return.reason')} id="return-reason">
        <Input name="reason" />
      </Field>
      <Field label={t('logistic.field.note')} id="return-note">
        <Textarea name="note" rows={3} />
      </Field>

      <div class="return-new-form__actions">
        <Button variant="ghost" onclick={() => (newReturnOpen = false)}>
          {dictionary.localText('action.cancel')}
        </Button>
        <Button type="submit" variant="primary">{t('logistic.return.create')}</Button>
      </div>
    </form>
  {/snippet}
</Dialog>

<style>
  .return-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-6);
    max-width: 72rem;
    margin-inline: auto;
  }

  .return-list__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  .return-list__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--text);
    margin: 0;
  }

  .return-list__filters {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .return-list__link {
    color: var(--text);
    font-weight: var(--weight-medium);
  }

  .return-new-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .return-new-form__actions {
    display: flex;
    gap: var(--space-2);
    justify-content: flex-end;
  }
</style>
