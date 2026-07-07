<!-- Camp 1: no hermes import — subscriber email is plain data, not copy.
     Uses coreui DataTable for paginated subscriber management. -->
<script lang="ts">
  import { DataTable } from '@sveltebuilder/coreui';
  import type { Column } from '@sveltebuilder/coreui';
  import type { Subscriber, NewsletterWithCopy } from '../schema/index.js';

  type Props = {
    subscribers: Subscriber[];
    newsletter: NewsletterWithCopy;
    total: number;
    page: number;
    perPage: number;
    loading?: boolean;
    onPageChange?: (page: number) => void;
    locale: string;
  };

  let {
    subscribers,
    newsletter,
    total,
    page,
    perPage,
    loading = false,
    onPageChange,
    locale,
  }: Props = $props();

  type SubscriberRow = {
    id: number;
    emailAddress: string;
    subscriberLocale: string;
    confirmedAt: string | null;
    joinedAt: string;
  };

  const rows: SubscriberRow[] = $derived(
    subscribers.map((s) => ({
      id: s.id,
      emailAddress: s.emailAddress,
      subscriberLocale: s.locale,
      confirmedAt: s.confirmedAt
        ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(s.confirmedAt))
        : 'Pending',
      joinedAt: new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(s.createdAt)),
    })),
  );

  const columns: Column<SubscriberRow>[] = [
    { key: 'emailAddress',      label: 'Email',        sortable: true },
    { key: 'subscriberLocale',  label: 'Locale',       sortable: true },
    { key: 'confirmedAt',       label: 'Confirmed',    sortable: true },
    { key: 'joinedAt',          label: 'Joined',       sortable: true },
  ];
</script>

<div class="subscriber-list">
  <header class="subscriber-list__header">
    <h2 class="subscriber-list__newsletter-name">{newsletter.name}</h2>
    <p class="subscriber-list__count">{total.toLocaleString(locale)} subscribers</p>
  </header>

  <DataTable
    data={rows}
    {columns}
    {total}
    {page}
    {perPage}
    {loading}
    onPageChange={onPageChange ?? (() => {})}
    emptyMessage="No subscribers yet."
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
