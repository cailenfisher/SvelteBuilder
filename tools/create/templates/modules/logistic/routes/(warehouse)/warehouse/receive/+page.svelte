<script lang="ts">
  import { Badge } from '@sveltebuilder/coreui';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  function formatDate(iso: string): string {
    return new Intl.DateTimeFormat(data.locale.code, { dateStyle: 'medium' }).format(new Date(iso));
  }
</script>

<div class="receive-queue">
  <h1 class="receive-queue__title">Receiving</h1>

  <section class="receive-queue__section">
    <h2 class="receive-queue__section-title">
      Pending receipts
      {#if data.active.length > 0}
        <Badge variant="default" size="sm">{data.active.length}</Badge>
      {/if}
    </h2>

    {#if data.active.length > 0}
      <ul class="receive-queue__list" aria-label="Pending receipts">
        {#each data.active as receipt (receipt.id)}
          <li class="receive-queue__item" class:receive-queue__item--partial={receipt.status === 'partial'}>
            <a href="/warehouse/receive/{receipt.id}" class="receive-queue__item-link">
              <div class="receive-queue__item-info">
                <span class="receive-queue__item-supplier">{receipt.supplier.name}</span>
                <span class="receive-queue__item-meta">
                  Receipt #{receipt.id}
                  {#if receipt.expectedAt}
                    · Expected {formatDate(receipt.expectedAt)}
                  {/if}
                </span>
              </div>
              <div class="receive-queue__item-right">
                {#if receipt.status === 'partial'}
                  <Badge variant="warning" size="sm">Partial</Badge>
                {:else}
                  <Badge variant="default" size="sm">{receipt.lines.length} lines</Badge>
                {/if}
                <span class="receive-queue__item-arrow" aria-hidden="true">→</span>
              </div>
            </a>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="receive-queue__empty">No pending receipts right now.</p>
    {/if}
  </section>

  {#if data.recent.length > 0}
    <section class="receive-queue__section">
      <h2 class="receive-queue__section-title">Recently completed</h2>
      <ul class="receive-queue__list receive-queue__list--muted" aria-label="Recently completed receipts">
        {#each data.recent as receipt (receipt.id)}
          <li class="receive-queue__item receive-queue__item--complete">
            <span class="receive-queue__item-supplier">{receipt.supplier.name}</span>
            <span class="receive-queue__item-meta">
              #{receipt.id}
              {#if receipt.receivedAt}· {formatDate(receipt.receivedAt)}{/if}
            </span>
          </li>
        {/each}
      </ul>
    </section>
  {/if}
</div>

<style>
  .receive-queue {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-4);
    max-width: 600px;
    margin-inline: auto;
    width: 100%;
  }

  .receive-queue__title {
    font-size: var(--text-xl);
    font-weight: var(--weight-bold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .receive-queue__section {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .receive-queue__section-title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .receive-queue__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .receive-queue__list--muted {
    opacity: 0.7;
  }

  .receive-queue__item {
    background-color: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: var(--card-radius);
  }

  .receive-queue__item--partial {
    border-color: var(--color-warning-border);
  }

  .receive-queue__item--complete {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
  }

  .receive-queue__item-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    text-decoration: none;
    color: inherit;
    border-radius: var(--card-radius);
    transition: background-color var(--duration-fast) var(--ease-out);
  }

  .receive-queue__item-link:hover {
    background-color: var(--color-surface-overlay);
  }

  .receive-queue__item-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .receive-queue__item-supplier {
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--color-text-primary);
  }

  .receive-queue__item-meta {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  .receive-queue__item-right {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-shrink: 0;
  }

  .receive-queue__item-arrow {
    font-size: var(--text-base);
    color: var(--color-text-secondary);
  }

  .receive-queue__empty {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }
</style>
