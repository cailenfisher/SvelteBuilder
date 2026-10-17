<script lang="ts">
  import './warehouse-layout.css';
  import type { Snippet } from 'svelte';
  import { page } from '$app/state';
  import { createDictionary } from 'diglossia';
  import type { WarehouseShellView } from '@sveltebuilder/logistic/views';

  let { data, children }: { data: WarehouseShellView; children: Snippet } = $props();

  // The shell's labels are the module's copy, so they come from an instance built here
  // rather than the root dictionary — get_dictionary treats a null scope filter as
  // "scope is null", so scoped copy never reaches the root instance.
  const scoped = $derived(createDictionary(data.copy));
  const localText = (slug: string) => scoped.localText(slug, 'logistic');

  const flows = [
    { href: '/warehouse/pick-task', slug: 'logistic.warehouse.pick_task.title' },
    { href: '/warehouse/inbound-receipt', slug: 'logistic.warehouse.inbound_receipt.title' },
    { href: '/warehouse/cycle-count', slug: 'logistic.warehouse.cycle_count.title' },
  ];
</script>

<div class="warehouse-layout">
  <header class="warehouse-layout__header">
    <a href="/warehouse" class="warehouse-layout__wordmark">
      {localText('logistic.warehouse.title')}
    </a>

    <nav class="warehouse-layout__navigation" aria-label={localText('logistic.warehouse.title')}>
      {#each flows as flow (flow.href)}
        <a
          href={flow.href}
          class="warehouse-layout__navigation-link"
          aria-current={page.url.pathname.startsWith(flow.href) ? 'page' : undefined}
        >
          {localText(flow.slug)}
        </a>
      {/each}
    </nav>
  </header>

  <main class="warehouse-layout__main">
    {@render children()}
  </main>
</div>
