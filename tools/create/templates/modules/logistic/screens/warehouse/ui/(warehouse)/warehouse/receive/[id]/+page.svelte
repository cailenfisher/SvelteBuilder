<script lang="ts">
  import { enhance } from '$app/forms';
  import { createDictionary } from 'diglossia';
  import { Badge, Button, InlineNotification, Input } from '@sveltebuilder/coreui';
  import type { ReceiveDetailView, ScreenFormResult } from '@sveltebuilder/logistic/views';

  let { data, form }: { data: ReceiveDetailView; form?: ScreenFormResult } = $props();

  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');

  const receipt = $derived(data.receipt);

  const supplierName = $derived(
    receipt.supplierId !== null
      ? scoped.localText('name', 'supplier', receipt.supplierId)
      : t('logistic.inbound_receipt.blind')
  );

  const outstanding = $derived(
    receipt.lines.filter((line) => line.receivedQuantity < line.expectedQuantity).length
  );
</script>

<svelte:head>
  <title>{t('logistic.receipt.one')} #{receipt.id}</title>
</svelte:head>

<div class="receive-task">
  <header class="receive-task__header">
    <a href="/warehouse/receive" class="receive-task__back">
      ← {t('logistic.warehouse.receive')}
    </a>
    <div class="receive-task__title-row">
      <h1 class="receive-task__title">{t('logistic.receipt.one')} #{receipt.id}</h1>
      <Badge variant={receipt.status === 'partial' ? 'warning' : 'default'}>
        {t(`logistic.inbound_receipt.status.${receipt.status}`)}
      </Badge>
    </div>
    <p class="receive-task__meta">{supplierName}</p>
    <p class="receive-task__meta">
      {scoped.formatText(
        'logistic.receive.outstanding',
        { outstanding, total: receipt.lines.length },
        'logistic'
      )}
    </p>
  </header>

  {#if form?.error}
    <InlineNotification severity="error" summary={form.error} />
  {/if}

  <ol class="receive-task__lines">
    {#each receipt.lines as line (line.id)}
      <li class="receive-task__line" class:done={line.receivedQuantity >= line.expectedQuantity}>
        <div class="receive-task__line-where">
          <!-- Where it goes, first and largest: the receiver is putting goods away. -->
          <span class="receive-task__location">
            {scoped.localText('name', 'storage_location', line.storageLocationId)}
          </span>
          <code class="receive-task__sku">{line.sku}</code>
        </div>

        <div class="receive-task__line-what">
          <span class="receive-task__quantity">
            {scoped.formatText(
              'logistic.receive.received_of',
              { received: line.receivedQuantity, expected: line.expectedQuantity },
              'logistic'
            )}
          </span>

          <form method="POST" action="?/receive" class="receive-task__form" use:enhance>
            <input type="hidden" name="line_id" value={line.id} />
            <!-- No max: receiving more than expected is a real event, and the discrepancy
                 column exists to record it. That is the difference from picking, where the
                 reservation caps what may be taken. -->
            <Input
              name="quantity"
              type="number"
              min="0"
              value={String(line.receivedQuantity)}
              aria-label={t('logistic.receipt.received_quantity')}
            />
            <Button type="submit" variant="primary" size="sm">
              {t('logistic.receipt.receive')}
            </Button>
          </form>
        </div>

        {#if line.discrepancy !== 0}
          <p class="receive-task__discrepancy">
            {scoped.formatText(
              'logistic.receive.discrepancy_note',
              { discrepancy: line.discrepancy },
              'logistic'
            )}
          </p>
        {/if}
      </li>
    {/each}
  </ol>
</div>

<style>
  .receive-task {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-6);
    max-width: 48rem;
    margin-inline: auto;
    width: 100%;
  }

  .receive-task__back {
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    text-decoration: none;
  }

  .receive-task__title-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-block-start: var(--space-2);
  }

  .receive-task__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .receive-task__meta {
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    margin: var(--space-1) 0 0;
  }

  .receive-task__lines {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .receive-task__line {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-4);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    background-color: var(--color-surface-default);
  }

  .receive-task__line.done {
    opacity: 0.6;
  }

  .receive-task__line-where {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .receive-task__location {
    font-size: var(--text-lg);
    font-weight: var(--weight-bold);
    color: var(--color-text-primary);
  }

  .receive-task__sku {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  .receive-task__line-what {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  .receive-task__quantity {
    font-size: var(--text-base);
    color: var(--color-text-primary);
  }

  .receive-task__form {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }

  .receive-task__discrepancy {
    font-size: var(--text-sm);
    color: var(--danger);
    margin: 0;
  }
</style>
