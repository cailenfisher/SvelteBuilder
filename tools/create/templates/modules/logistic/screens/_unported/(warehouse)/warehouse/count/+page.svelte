<script lang="ts">
  import { Button } from '@sveltebuilder/coreui';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  function formatDate(iso: string): string {
    return new Intl.DateTimeFormat(data.locale.code, { dateStyle: 'medium' }).format(new Date(iso));
  }
</script>

<div class="count-queue">
  <h1 class="count-queue__title">Cycle counting</h1>

  {#if data.myCounts.length > 0}
    <section class="count-queue__section">
      <h2 class="count-queue__section-title">My counts</h2>
      <ul class="count-queue__list" aria-label="My cycle counts">
        {#each data.myCounts as count (count.id)}
          <li class="count-queue__item count-queue__item--mine">
            <a href="/warehouse/count/{count.id}" class="count-queue__item-link">
              <div class="count-queue__item-info">
                <span class="count-queue__item-id">Count #{count.id}</span>
                <span class="count-queue__item-meta">Started {formatDate(count.createdAt)}</span>
              </div>
              <span class="count-queue__item-arrow" aria-hidden="true">→</span>
            </a>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <section class="count-queue__section">
    <h2 class="count-queue__section-title">Open counts</h2>

    {#if data.openCounts.length > 0}
      <ul class="count-queue__list" aria-label="Open cycle counts">
        {#each data.openCounts as count (count.id)}
          <li class="count-queue__item">
            <div class="count-queue__item-info">
              <span class="count-queue__item-id">Count #{count.id}</span>
              <span class="count-queue__item-meta">Created {formatDate(count.createdAt)}</span>
            </div>
            <form method="POST" action="?/take">
              <input type="hidden" name="count_id" value={count.id} />
              <Button type="submit" variant="primary" size="sm">Take</Button>
            </form>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="count-queue__empty">No open cycle counts right now.</p>
    {/if}
  </section>
</div>

<style>
  .count-queue {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-4);
    max-width: 640px;
    margin-inline: auto;
    width: 100%;
  }

  .count-queue__title {
    font-size: var(--text-xl);
    font-weight: var(--weight-bold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .count-queue__section {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .count-queue__section-title {
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--color-text-secondary);
    margin: 0;
  }

  .count-queue__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .count-queue__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background-color: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: var(--card-radius);
  }

  .count-queue__item--mine {
    border-color: var(--color-border-brand);
    padding: 0;
  }

  .count-queue__item-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    width: 100%;
    padding: var(--space-3) var(--space-4);
    text-decoration: none;
  }

  .count-queue__item-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .count-queue__item-id {
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--color-text-primary);
  }

  .count-queue__item-meta {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  .count-queue__item-arrow {
    color: var(--color-text-secondary);
  }

  .count-queue__empty {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }
</style>
