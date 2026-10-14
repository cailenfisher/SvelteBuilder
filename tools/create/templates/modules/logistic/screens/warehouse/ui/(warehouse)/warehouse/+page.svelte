<script lang="ts">
  import './warehouse-home-screen.css';
  import { createDictionary } from 'diglossia';
  import type { WarehouseShellView } from '@sveltebuilder/logistic/views';

  // No loader of its own: this screen reads nothing, and its labels come from the shell's
  // layout data, which page data inherits.
  let { data }: { data: WarehouseShellView } = $props();

  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');

  const flows = [
    {
      href: '/warehouse/pick-task',
      icon: '📦',
      slug: 'logistic.warehouse.pick_task.title',
      hint: 'logistic.warehouse.pick_task.hint',
    },
    {
      href: '/warehouse/inbound-receipt',
      icon: '🚚',
      slug: 'logistic.warehouse.inbound_receipt.title',
      hint: 'logistic.warehouse.inbound_receipt.hint',
    },
    {
      href: '/warehouse/cycle-count',
      icon: '📋',
      slug: 'logistic.warehouse.cycle_count.title',
      hint: 'logistic.warehouse.cycle_count.hint',
    },
  ];
</script>

<svelte:head>
  <title>{t('logistic.warehouse.title')}</title>
</svelte:head>

<div class="warehouse-home-screen">
  <h1 class="warehouse-home-screen__title">{t('logistic.warehouse.title')}</h1>

  <nav class="warehouse-home-screen__flows" aria-label={t('logistic.warehouse.title')}>
    {#each flows as flow (flow.href)}
      <a href={flow.href} class="warehouse-home-screen__flow-card">
        <span class="warehouse-home-screen__flow-icon" aria-hidden="true">{flow.icon}</span>
        <span class="warehouse-home-screen__flow-label">{t(flow.slug)}</span>
        <span class="warehouse-home-screen__flow-hint">{t(flow.hint)}</span>
      </a>
    {/each}
  </nav>
</div>
