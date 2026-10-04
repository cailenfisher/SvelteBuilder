<script lang="ts">
  import { createDictionary } from 'diglossia';
  import { ReceiptCard } from '@sveltebuilder/logistic';
  import type { ReceiveQueueView } from '@sveltebuilder/logistic/views';

  let { data }: { data: ReceiveQueueView } = $props();

  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');
</script>

<svelte:head>
  <title>{t('logistic.warehouse.receive')}</title>
</svelte:head>

<div class="receive-queue">
  <h1 class="receive-queue__title">{t('logistic.warehouse.receive')}</h1>

  <section class="receive-queue__section" aria-label={t('logistic.receive.active')}>
    <h2 class="receive-queue__section-title">{t('logistic.receive.active')}</h2>
    {#if data.active.length > 0}
      <div class="receive-queue__cards">
        {#each data.active as receipt (receipt.id)}
          <ReceiptCard
            {receipt}
            supplier={receipt.supplier}
            lines={receipt.lines}
            href="/warehouse/receive/{receipt.id}"
            locale={data.localeCode}
            dictionary={scoped}
          />
        {/each}
      </div>
    {:else}
      <p class="receive-queue__empty">{t('logistic.receive.empty')}</p>
    {/if}
  </section>

  {#if data.recent.length > 0}
    <section class="receive-queue__section" aria-label={t('logistic.receive.recent')}>
      <h2 class="receive-queue__section-title">{t('logistic.receive.recent')}</h2>
      <div class="receive-queue__cards">
        {#each data.recent as receipt (receipt.id)}
          <!-- Completed receipts are orientation, not work: no href, so nothing invites a
               receiver to open a receipt there is nothing left to do on. -->
          <ReceiptCard
            {receipt}
            supplier={receipt.supplier}
            lines={receipt.lines}
            locale={data.localeCode}
            dictionary={scoped}
          />
        {/each}
      </div>
    </section>
  {/if}
</div>

<style>
  .receive-queue {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
    padding: var(--space-6);
    max-width: 48rem;
    margin-inline: auto;
    width: 100%;
  }

  .receive-queue__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--text);
    margin: 0;
  }

  .receive-queue__section {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .receive-queue__section-title {
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--text);
    margin: 0;
  }

  .receive-queue__cards {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .receive-queue__empty {
    font-size: var(--text-sm);
    color: var(--text-soft);
    margin: 0;
  }
</style>
