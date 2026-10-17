<!-- A subscriber's email is plain data, not copy; the list's own column and table copy
     (scope `content`) resolves from the dictionary.
     Uses coreui DataTable for paginated subscriber management. -->
<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import { DataTable } from '@sveltebuilder/coreui';
  import type { DataTableColumn } from '@sveltebuilder/coreui';
  import type { NewsletterWithCopy, SubscriberWithLocale } from '../schema/index.js';

  type Props = {
    subscribers: SubscriberWithLocale[];
    newsletter: NewsletterWithCopy;
    total: number;
    page: number;
    perPage: number;
    onPageChange?: (page: number) => void;
    locale: string;
    dictionary?: DictionaryInstance;
  };

  let {
    subscribers,
    newsletter,
    total,
    page,
    perPage,
    onPageChange,
    locale,
    dictionary: dictionaryProp,
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();

  const columns: DataTableColumn[] = $derived([
    { key: 'emailAddress', label: dictionary.localText('content.subscriber_list.email_address', 'content') },
    { key: 'subscriberLocale', label: dictionary.localText('content.subscriber_list.locale', 'content') },
    { key: 'confirmedAt', label: dictionary.localText('content.subscriber_list.confirmed_at', 'content') },
    { key: 'joinedAt', label: dictionary.localText('content.subscriber_list.created_at', 'content') },
  ]);

  const tableLabels = $derived({
    empty: dictionary.localText('content.subscriber_list.empty', 'content'),
    pagination: dictionary.localText('content.pagination.label', 'content'),
    previousPage: dictionary.localText('content.pagination.previous', 'content'),
    nextPage: dictionary.localText('content.pagination.next', 'content'),
  });

  function formatDate(iso: string): string {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso));
  }
</script>

{#snippet subscriberCell(subscriber: SubscriberWithLocale, column: DataTableColumn)}
  {#if column.key === 'emailAddress'}
    {subscriber.emailAddress}
  {:else if column.key === 'subscriberLocale'}
    {subscriber.localeCode}
  {:else if column.key === 'confirmedAt'}
    {subscriber.confirmedAt
      ? formatDate(subscriber.confirmedAt)
      : dictionary.localText('content.subscriber_list.pending', 'content')}
  {:else if column.key === 'joinedAt'}
    {formatDate(subscriber.createdAt)}
  {/if}
{/snippet}

<div class="subscriber-list">
  <header class="subscriber-list__header">
    <h2 class="subscriber-list__newsletter-name">{newsletter.name}</h2>
    <p class="subscriber-list__count">
      {dictionary.formatText('content.subscriber_list.count', { count: total }, 'content')}
    </p>
  </header>

  <DataTable
    {columns}
    rows={subscribers}
    rowKey={(subscriber) => subscriber.id}
    cell={subscriberCell}
    {page}
    {perPage}
    {total}
    onPageChange={onPageChange ?? (() => {})}
    labels={tableLabels}
  />
</div>
