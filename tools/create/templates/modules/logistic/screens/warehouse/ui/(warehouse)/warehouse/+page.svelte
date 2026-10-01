<script lang="ts">
  import { createDictionary } from 'diglossia';
  import type { WarehouseShellView } from '@sveltebuilder/logistic/views';

  // No loader of its own: this screen reads nothing, and its labels come from the shell's
  // layout data, which page data inherits.
  let { data }: { data: WarehouseShellView } = $props();

  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');

  const flows = [
    {
      href: '/warehouse/pick',
      icon: '📦',
      slug: 'logistic.warehouse.pick',
      desc: 'logistic.warehouse.pick.hint',
    },
    {
      href: '/warehouse/receive',
      icon: '🚚',
      slug: 'logistic.warehouse.receive',
      desc: 'logistic.warehouse.receive.hint',
    },
    {
      href: '/warehouse/count',
      icon: '📋',
      slug: 'logistic.warehouse.count',
      desc: 'logistic.warehouse.count.hint',
    },
  ];
</script>

<svelte:head>
  <title>{t('logistic.warehouse.title')}</title>
</svelte:head>

<div class="warehouse-home">
  <h1 class="warehouse-home__title">{t('logistic.warehouse.title')}</h1>

  <nav class="warehouse-home__flows" aria-label={t('logistic.warehouse.title')}>
    {#each flows as flow (flow.href)}
      <a href={flow.href} class="warehouse-home__flow-card">
        <span class="warehouse-home__flow-icon" aria-hidden="true">{flow.icon}</span>
        <span class="warehouse-home__flow-label">{t(flow.slug)}</span>
        <span class="warehouse-home__flow-desc">{t(flow.desc)}</span>
      </a>
    {/each}
  </nav>
</div>

<style>
  .warehouse-home {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
    padding: var(--space-6);
    max-width: 48rem;
    margin-inline: auto;
    width: 100%;
  }

  .warehouse-home__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .warehouse-home__flows {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
    gap: var(--space-4);
  }

  .warehouse-home__flow-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-6);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    background-color: var(--color-surface-default);
    text-decoration: none;
    /* Deliberately large: this is a touch target for someone holding a scanner. */
    min-height: 9rem;
  }

  .warehouse-home__flow-icon {
    font-size: var(--text-2xl);
  }

  .warehouse-home__flow-label {
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--color-text-primary);
  }

  .warehouse-home__flow-desc {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }
</style>
