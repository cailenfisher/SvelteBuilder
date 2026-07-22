<!-- Camp 1: no hermes import — subscriber email is plain data, not copy.
     Uses coreui DataTable for paginated subscriber management. -->
<script lang="ts">
  import { DataTable } from '@sveltebuilder/coreui';
  import type { DataTableColumn } from '@sveltebuilder/coreui';
  import type { Subscriber, NewsletterWithCopy } from '../schema/index.js';

  type Props = {
    subscribers: Subscriber[];
    newsletter: NewsletterWithCopy;
    total: number;
    page: number;
    perPage: number;
    onPageChange?: (page: number) => void;
    locale: string;
  };

  let {
    subscribers,
    newsletter,
    total,
    page,
    perPage,
    onPageChange,
    locale,
  }: Props = $props();

  const columns: DataTableColumn[] = [
    { key: 'emailAddress', label: 'Email' },
    { key: 'subscriberLocale', label: 'Locale' },
    { key: 'confirmedAt', label: 'Confirmed' },
    { key: 'joinedAt', label: 'Joined' },
  ];

  function formatDate(iso: string): string {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso));
  }
</script>

{#snippet subscriberCell(subscriber: Subscriber, column: DataTableColumn)}
  {#if column.key === 'emailAddress'}
    {subscriber.emailAddress}
  {:else if column.key === 'subscriberLocale'}
    {subscriber.locale}
  {:else if column.key === 'confirmedAt'}
    {subscriber.confirmedAt ? formatDate(subscriber.confirmedAt) : 'Pending'}
  {:else if column.key === 'joinedAt'}
    {formatDate(subscriber.createdAt)}
  {/if}
{/snippet}

<div class="subscriber-list">
  <header class="subscriber-list__header">
    <h2 class="subscriber-list__newsletter-name">{newsletter.name}</h2>
    <p class="subscriber-list__count">{total.toLocaleString(locale)} subscribers</p>
  </header>

  <DataTable
    columns={columns}
    rows={subscribers}
    rowKey={(subscriber) => subscriber.id}
    cell={subscriberCell}
    {page}
    {perPage}
    {total}
    onPageChange={onPageChange ?? (() => {})}
    emptyLabel="No subscribers yet."
  />
</div>

<style>
  .subscriber-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .subscriber-list__header {
    display: flex;
    align-items: baseline;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  .subscriber-list__newsletter-name {
    margin: 0;
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--text);
  }

  .subscriber-list__count {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--text-soft);
  }
</style>
