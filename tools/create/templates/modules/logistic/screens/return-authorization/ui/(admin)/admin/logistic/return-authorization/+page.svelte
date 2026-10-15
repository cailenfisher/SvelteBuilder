<script lang="ts">
  import './return-authorization-list-screen.css';
  import { goto } from '$app/navigation';
  import { createDictionary } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { Button, Dialog, FilterLinkList, InlineNotification } from '@sveltebuilder/coreui';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';
  import type { ReturnAuthorizationStatus } from '@sveltebuilder/logistic';
  import type { ReturnAuthorizationListView } from '@sveltebuilder/logistic/views';
  import ReturnAuthorizationCreateForm from './ReturnAuthorizationCreateForm.svelte';
  import ReturnAuthorizationTable from './ReturnAuthorizationTable.svelte';

  let { data, form }: { data: ReturnAuthorizationListView; form?: ScreenFormResult } = $props();

  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');

  let newReturnOpen = $state(false);

  const href = (status: ReturnAuthorizationStatus | null, page = 1) => {
    const params = new URLSearchParams();
    if (status !== null) params.set('status', status);
    if (page > 1) params.set('page', String(page));
    const query = params.toString();
    return `/admin/logistic/return-authorization${query ? `?${query}` : ''}`;
  };
</script>

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

  <FilterLinkList
    label={t('logistic.return_authorization.filter_status')}
    links={[
      { href: href(null), label: t('logistic.return_authorization.filter_all'), current: data.status === null },
      ...data.statuses.map((status) => ({
        href: href(status),
        label: t(`logistic.return_authorization.status.${status}`),
        current: data.status === status,
      })),
    ]}
  />

  <ReturnAuthorizationTable
    returnAuthorizations={data.returnAuthorizations}
    page={data.page}
    perPage={data.perPage}
    total={data.total}
    onPageChange={(next) => goto(href(data.status, next))}
    localeCode={data.localeCode}
    dictionary={scoped}
  />
</div>

<Dialog bind:open={newReturnOpen} title={t('logistic.return_authorization.new')} closeLabel={dictionary.localText('action.close')}>
  {#snippet children()}
    <ReturnAuthorizationCreateForm dictionary={scoped} onCancel={() => (newReturnOpen = false)} />
  {/snippet}
</Dialog>
