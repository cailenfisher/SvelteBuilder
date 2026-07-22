<script lang="ts">
  import { enhance } from '$app/forms';
  import { BarcodeInput, Button } from '@sveltebuilder/coreui';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let activeSku = $state<string | null>(null);

  const activeLines = $derived(
    activeSku ? data.count.lines.filter((l) => l.sku === activeSku) : [],
  );

  const progress = $derived({
    done: data.count.lines.filter((l) => l.countedQuantity !== null).length,
    total: data.count.lines.length,
  });

  const allCounted = $derived(progress.done === progress.total && progress.total > 0);

  function handleScan(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    activeSku = trimmed;
    const el = document.querySelector<HTMLElement>(`[data-sku="${CSS.escape(trimmed)}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el?.focus();
  }

  function clearActive() {
    activeSku = null;
  }
</script>

<div class="count-detail">
  <header class="count-detail__header">
    <h1 class="count-detail__title">Count #{data.count.id}</h1>
    <p class="count-detail__progress">
      {progress.done} of {progress.total} lines counted
    </p>
  </header>

  <div class="count-detail__scan-zone" aria-label="Barcode scan area">
    <BarcodeInput
      onScan={handleScan}
      placeholder="Scan item barcode…"
      label="Scan barcode"
    />
  </div>

  {#if activeSku && activeLines.length === 0}
    <p class="count-detail__scan-miss" role="alert">
      No line found for SKU <strong>{activeSku}</strong>. Try scanning again.
    </p>
  {/if}

  {#if allCounted}
    <p class="count-detail__complete-notice" role="status">
      All lines counted — awaiting approval from an administrator.
    </p>
  {/if}

  <ul class="count-detail__lines" aria-label="Count lines">
    {#each data.count.lines as line (line.id)}
      {@const counted = line.countedQuantity !== null}
      {@const isActive = activeSku === line.sku}
      <li
        class="count-detail__line"
        class:count-detail__line--done={counted}
        class:count-detail__line--active={isActive}
        data-sku={line.sku}
        tabindex="-1"
      >
        <div class="count-detail__line-detail">
          <div class="count-detail__line-place">
            <span class="count-detail__line-location">{line.storageLocation.name}</span>
            <span class="count-detail__line-sku">{line.sku}</span>
          </div>
          <span class="count-detail__line-qty">
            {#if counted}
              counted {line.countedQuantity}
            {:else}
              not counted
            {/if}
          </span>
        </div>

        {#if isActive}
          <form
            class="count-detail__line-form"
            method="POST"
            action="?/record"
            use:enhance={() => {
              return ({ update }) => {
                update({ reset: false });
                clearActive();
              };
            }}
          >
            <input type="hidden" name="line_id" value={line.id} />
            <label class="count-detail__qty-label" for="count-qty-{line.id}">
              Counted quantity
            </label>
            <div class="count-detail__qty-row">
              <input
                id="count-qty-{line.id}"
                class="count-detail__qty-input"
                type="number"
                name="quantity"
                min="0"
                value={line.countedQuantity ?? ''}
                required
              />
              <Button type="submit" variant="primary" size="sm">Confirm</Button>
            </div>
          </form>
        {:else}
          <button
            class="count-detail__line-activate"
            type="button"
            onclick={() => { activeSku = line.sku; }}
            aria-label="Count {line.sku} manually"
          >
            {counted ? 'Recount' : 'Count'}
          </button>
        {/if}

        {#if counted && !isActive}
          <span class="count-detail__line-check" aria-label="Counted">✓</span>
        {/if}
      </li>
    {/each}
  </ul>
</div>

<style>
  .count-detail {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    padding: var(--space-4);
    max-width: 640px;
    margin-inline: auto;
    width: 100%;
  }

  .count-detail__header {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .count-detail__title {
    font-size: var(--text-xl);
    font-weight: var(--weight-bold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .count-detail__progress {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }

  .count-detail__scan-zone {
    background-color: var(--color-surface-overlay);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
  }

  .count-detail__scan-miss {
    font-size: var(--text-sm);
    color: var(--color-danger-text);
    background-color: var(--color-danger-subtle);
    border: 1px solid var(--color-danger-border);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    margin: 0;
  }

  .count-detail__complete-notice {
    font-size: var(--text-sm);
    color: var(--color-success-text);
    background-color: var(--color-success-subtle);
    border: 1px solid var(--color-success-border);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    margin: 0;
  }

  .count-detail__lines {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .count-detail__line {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    background-color: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: var(--card-radius);
    outline: none;
    transition: border-color var(--duration-fast) var(--ease-out);
  }

  .count-detail__line--active {
    border-color: var(--color-border-brand);
    background-color: var(--color-brand-subtle);
  }

  .count-detail__line--done {
    opacity: 0.75;
  }

  .count-detail__line-detail {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .count-detail__line-place {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .count-detail__line-location {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  .count-detail__line-sku {
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--color-text-primary);
    font-family: var(--font-mono);
  }

  .count-detail__line-qty {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  .count-detail__line-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding-top: var(--space-2);
    border-top: 1px solid var(--color-border-default);
  }

  .count-detail__qty-label {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-text-primary);
  }

  .count-detail__qty-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .count-detail__qty-input {
    width: 80px;
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-base);
    font-family: var(--font-mono);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    background-color: var(--color-surface-default);
    color: var(--color-text-primary);
  }

  .count-detail__qty-input:focus {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }

  .count-detail__line-activate {
    align-self: flex-end;
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    color: var(--color-text-brand);
    background: none;
    border: none;
    cursor: pointer;
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-sm);
    text-decoration: underline;
  }

  .count-detail__line-activate:hover {
    background-color: var(--color-brand-subtle);
  }

  .count-detail__line-check {
    font-size: var(--text-lg);
    color: var(--color-success-text);
    align-self: flex-end;
  }
</style>
