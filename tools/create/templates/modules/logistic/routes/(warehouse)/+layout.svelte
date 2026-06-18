<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { LayoutData } from './$types';

  type Props = {
    data: LayoutData;
    children: Snippet;
  };

  let { data, children }: Props = $props();
</script>

<div class="warehouse-layout">
  <header class="warehouse-layout__header">
    <a href="/warehouse" class="warehouse-layout__wordmark">Warehouse</a>

    <nav class="warehouse-layout__nav" aria-label="Warehouse navigation">
      <a href="/warehouse/pick" class="warehouse-layout__nav-link">Pick queue</a>
      <a href="/warehouse/receive" class="warehouse-layout__nav-link">Receiving</a>
    </nav>
  </header>

  <main class="warehouse-layout__main">
    {@render children()}
  </main>
</div>

<style>
  .warehouse-layout {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
  }

  .warehouse-layout__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-3) var(--space-4);
    background-color: var(--color-surface-default);
    border-block-end: 1px solid var(--color-border-default);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .warehouse-layout__wordmark {
    font-size: var(--text-base);
    font-weight: var(--weight-bold);
    color: var(--color-text-primary);
    text-decoration: none;
  }

  .warehouse-layout__nav {
    display: flex;
    gap: var(--space-1);
  }

  .warehouse-layout__nav-link {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-text-secondary);
    text-decoration: none;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
    transition: background-color var(--duration-fast) var(--ease-out),
                color var(--duration-fast) var(--ease-out);
  }

  .warehouse-layout__nav-link:hover {
    background-color: var(--color-surface-overlay);
    color: var(--color-text-primary);
  }

  .warehouse-layout__main {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
</style>
