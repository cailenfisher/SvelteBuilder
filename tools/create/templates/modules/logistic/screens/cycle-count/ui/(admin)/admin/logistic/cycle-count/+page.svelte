<script lang="ts">
  import './cycle-count-list-screen.css';
  import { goto } from '$app/navigation';
  import { createDictionary } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { Button, Dialog, FilterLinkList, InlineNotification } from '@sveltebuilder/coreui';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';
  import type { CycleCountStatus } from '@sveltebuilder/logistic';
  import type { CycleCountListView } from '@sveltebuilder/logistic/views';
  import CycleCountCreateForm from './CycleCountCreateForm.svelte';
  import CycleCountTable from './CycleCountTable.svelte';

  let { data, form }: { data: CycleCountListView; form?: ScreenFormResult } = $props();

  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');

  let newCountOpen = $state(false);

  const href = (status: CycleCountStatus | null, page = 1) => {
    const params = new URLSearchParams();
    if (status !== null) params.set('status', status);
    if (page > 1) params.set('page', String(page));
    const query = params.toString();
    return `/admin/logistic/cycle-count${query ? `?${query}` : ''}`;
  };
</script>

<svelte:head>
  <title>{t('logistic.cycle_count.title')}</title>
</svelte:head>

<div class="cycle-count-list-screen">
  <header class="cycle-count-list-screen__header">
    <h1 class="cycle-count-list-screen__title">{t('logistic.cycle_count.title')}</h1>
    <Button variant="primary" onclick={() => (newCountOpen = true)}>
      {t('logistic.cycle_count.new')}
    </Button>
  </header>

  {#if form?.error}
    <InlineNotification severity="danger" summary={form.error} />
  {/if}

  <FilterLinkList
    label={t('logistic.cycle_count.filter_status')}
    links={[
      { href: href(null), label: t('logistic.cycle_count.filter_all'), current: data.status === null },
      ...data.statuses.map((status) => ({
        href: href(status),
        label: t(`logistic.cycle_count.status.${status}`),
        current: data.status === status,
      })),
    ]}
  />

  <CycleCountTable
    cycleCounts={data.cycleCounts}
    page={data.page}
    perPage={data.perPage}
    total={data.total}
    onPageChange={(next) => goto(href(data.status, next))}
    localeCode={data.localeCode}
    dictionary={scoped}
  />
</div>

<Dialog bind:open={newCountOpen} title={t('logistic.cycle_count.new')} closeLabel={dictionary.localText('action.close')}>
  {#snippet children()}
    <CycleCountCreateForm
      storageLocations={data.storageLocations}
      dictionary={scoped}
      onCancel={() => (newCountOpen = false)}
    />
  {/snippet}
</Dialog>
