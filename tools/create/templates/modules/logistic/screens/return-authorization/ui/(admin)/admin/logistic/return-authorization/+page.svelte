<script lang="ts">
  import './return-authorization-list-screen.css';
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
  import type { ReturnAuthorizationRow, ReturnAuthorizationListView } from '@sveltebuilder/logistic/views';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';

  let { data, form }: { data: ReturnAuthorizationListView; form?: ScreenFormResult } = $props();

  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');

  let newReturnOpen = $state(false);

  const columns: DataTableColumn[] = $derived([
    { key: 'id', label: t('logistic.return_authorization.one') },
    { key: 'status', label: t('logistic.return_authorization.status_label') },
    { key: 'reason', label: t('logistic.return_authorization.reason') },
    { key: 'lineCount', label: t('logistic.return_authorization.lines'), align: 'end' },
    { key: 'createdAt', label: t('logistic.return_authorization.created_at') },
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
    return `/admin/logistic/return-authorization${query ? `?${query}` : ''}`;
  };

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(data.localeCode, { dateStyle: 'medium' }).format(new Date(iso));
</script>

{#snippet returnCell(row: ReturnAuthorizationRow, column: DataTableColumn)}
  {#if column.key === 'id'}
    <a href="/admin/logistic/return-authorization/{row.id}" class="return-authorization-list-screen__link">#{row.id}</a>
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
  <title>{t('logistic.return_authorization.title')}</title>
</svelte:head>

<div class="return-authorization-list-screen">
  <header class="return-authorization-list-screen__header">
    <h1 class="return-authorization-list-screen__title">{t('logistic.return_authorization.title')}</h1>
    <Button variant="primary" onclick={() => (newReturnOpen = true)}>
      {t('logistic.return_authorization.new')}
    </Button>
  </header>

  {#if form?.error}
    <InlineNotification severity="danger" summary={form.error} />
  {/if}

  <nav class="return-authorization-list-screen__filters" aria-label={t('logistic.return_authorization.filter_status')}>
    <Button
      href={href(null)}
      variant={data.status === null ? 'secondary' : 'ghost'}
      size="sm"
      aria-current={data.status === null ? 'page' : undefined}
    >
      {t('logistic.return_authorization.filter_all')}
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
    rows={data.returnAuthorizations}
    rowKey={(row) => row.id}
    cell={returnCell}
    page={data.page}
    perPage={data.perPage}
    total={data.total}
    onPageChange={(next) => goto(href(data.status, next))}
    labels={{
      empty: t('logistic.return_authorization.empty'),
      pagination: dictionary.localText('navigation.pagination'),
      previousPage: dictionary.localText('pagination.previous'),
      nextPage: dictionary.localText('pagination.next'),
    }}
  />
</div>

<Dialog bind:open={newReturnOpen} title={t('logistic.return_authorization.new')} closeLabel={dictionary.localText('action.close')}>
  {#snippet children()}
    <form method="POST" action="?/create" class="return-authorization-list-screen__new-form">
      <Field label={t('logistic.field.sku')} id="return-sku" required>
        <Input name="sku" required />
      </Field>
      <Field label={t('logistic.return_authorization.expected_quantity')} id="return-quantity" required>
        <Input name="expected_quantity" type="number" min="1" value="1" required />
      </Field>
      <Field label={t('logistic.return_authorization.reason')} id="return-reason">
        <Input name="reason" />
      </Field>
      <Field label={t('logistic.field.note')} id="return-note">
        <Textarea name="note" rows={3} />
      </Field>

      <div class="return-authorization-list-screen__new-form-actions">
        <Button variant="ghost" onclick={() => (newReturnOpen = false)}>
          {dictionary.localText('action.cancel')}
        </Button>
        <Button type="submit" variant="primary">{t('logistic.return_authorization.create')}</Button>
      </div>
    </form>
  {/snippet}
</Dialog>
