<script lang="ts">
  import type { Snippet } from 'svelte';
  import { page } from '$app/state';
  import { createDictionary } from 'diglossia';
  import type { WarehouseShellView } from '@sveltebuilder/logistic/views';

  let { data, children }: { data: WarehouseShellView; children: Snippet } = $props();

  // The shell's labels are the module's copy, so they come from an instance built here
  // rather than the root dictionary — get_dictionary treats a null scope filter as
  // "scope is null", so scoped copy never reaches the root instance.
  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');

  const flows = [
    { href: '/warehouse/pick', slug: 'logistic.warehouse.pick' },
    { href: '/warehouse/receive', slug: 'logistic.warehouse.receive' },
    { href: '/warehouse/count', slug: 'logistic.warehouse.count' },
  ];
</script>

<div class="warehouse-layout">
  <header class="warehouse-layout__header">
    <a href="/warehouse" class="warehouse-layout__wordmark">
      {t('logistic.warehouse.title')}
    </a>

    <nav class="warehouse-layout__nav" aria-label={t('logistic.warehouse.title')}>
      {#each flows as flow (flow.href)}
        <a
          href={flow.href}
          class="warehouse-layout__nav-link"
          aria-current={page.url.pathname.startsWith(flow.href) ? 'page' : undefined}
        >
          {t(flow.slug)}
        </a>
      {/each}
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
    color: var(--color-text-secondary);
    text-decoration: none;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);
  }

  .warehouse-layout__nav-link[aria-current='page'] {
    color: var(--color-text-primary);
    font-weight: var(--weight-semibold);
    background-color: var(--color-surface-subtle);
  }

  .warehouse-layout__main {
    flex: 1;
    display: flex;
  }
</style>
