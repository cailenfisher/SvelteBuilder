<script lang="ts">
  import { enhance } from '$app/forms';
  import { BarcodeInput, Button, Badge } from '@sveltebuilder/coreui';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let activeSku = $state<string | null>(null);

  const activeLines = $derived(
    activeSku ? data.receipt.lines.filter((l) => l.sku === activeSku) : [],
  );

  const allReceived = $derived(
    data.receipt.lines.every((l) => l.receivedQuantity >= l.expectedQuantity),
  );

  const progress = $derived({
    done: data.receipt.lines.filter((l) => l.receivedQuantity > 0).length,
    total: data.receipt.lines.length,
  });

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

<div class="receive-detail">
  <header class="receive-detail__header">
    <div class="receive-detail__header-row">
      <h1 class="receive-detail__title">Receipt #{data.receipt.id}</h1>
      <Badge
        variant={data.receipt.status === 'partial' ? 'warning' : data.receipt.status === 'complete' ? 'success' : 'default'}
        size="sm"
      >
        {data.receipt.status}
      </Badge>
    </div>
    <p class="receive-detail__supplier">{data.receipt.supplier.name}</p>
    <p class="receive-detail__progress">
      {progress.done} of {progress.total} lines received
    </p>
  </header>

  {#if data.receipt.status !== 'complete'}
    <div class="receive-detail__scan-zone" aria-label="Barcode scan area">
      <BarcodeInput
        onScan={handleScan}
        placeholder="Scan item barcode…"
        label="Scan barcode"
      />
    </div>

    {#if activeSku && activeLines.length === 0}
      <p class="receive-detail__scan-miss" role="alert">
        No line found for SKU <strong>{activeSku}</strong>. Try scanning again.
      </p>
    {/if}
  {/if}

  {#if allReceived && data.receipt.status !== 'complete'}
    <p class="receive-detail__complete-notice" role="status">
      All lines received — this receipt is now complete.
    </p>
  {/if}

  <ul class="receive-detail__lines" aria-label="Receipt lines">
    {#each data.receipt.lines as line (line.id)}
      {@const done = line.receivedQuantity >= line.expectedQuantity}
      {@const isActive = activeSku === line.sku}
      {@const hasDiscrepancy = line.receivedQuantity > 0 && line.discrepancy !== 0}
      <li
        class="receive-detail__line"
        class:receive-detail__line--done={done}
        class:receive-detail__line--active={isActive}
        class:receive-detail__line--discrepancy={hasDiscrepancy}
        data-sku={line.sku}
        tabindex="-1"
      >
        <div class="receive-detail__line-detail">
          <span class="receive-detail__line-sku">{line.sku}</span>
          <span class="receive-detail__line-qty">
            {line.receivedQuantity} / {line.expectedQuantity} expected
          </span>
        </div>

        {#if hasDiscrepancy}
          <p class="receive-detail__discrepancy" role="alert">
            Discrepancy: {line.discrepancy > 0 ? '+' : ''}{line.discrepancy}
          </p>
        {/if}

        {#if isActive && !done && data.receipt.status !== 'complete'}
          <form
            class="receive-detail__line-form"
            method="POST"
            action="?/receive"
            use:enhance={() => {
              return ({ update }) => {
                update({ reset: false });
                clearActive();
              };
            }}
          >
            <input type="hidden" name="line_id" value={line.id} />
            <label class="receive-detail__qty-label" for="recv-qty-{line.id}">
              Quantity received
            </label>
            <div class="receive-detail__qty-row">
              <input
                id="recv-qty-{line.id}"
                class="receive-detail__qty-input"
                type="number"
                name="quantity"
                min="0"
                value={line.expectedQuantity}
                required
              />
              <Button type="submit" variant="primary" size="sm">Confirm</Button>
            </div>
          </form>
        {:else if !done && data.receipt.status !== 'complete'}
          <button
            class="receive-detail__line-activate"
            type="button"
            onclick={() => { activeSku = line.sku; }}
            aria-label="Receive {line.sku} manually"
          >
            Receive
          </button>
        {/if}

        {#if done}
          <span class="receive-detail__line-check" aria-label="Received">✓</span>
        {/if}
      </li>
    {/each}
  </ul>
</div>

<style>
  .receive-detail {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    padding: var(--space-4);
    max-width: 640px;
    margin-inline: auto;
    width: 100%;
  }

  .receive-detail__header {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .receive-detail__header-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .receive-detail__title {
    font-size: var(--text-xl);
    font-weight: var(--weight-bold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .receive-detail__supplier {
    font-size: var(--text-base);
    color: var(--color-text-secondary);
    margin: 0;
  }

  .receive-detail__progress {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }

  .receive-detail__scan-zone {
    background-color: var(--color-surface-overlay);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
  }

  .receive-detail__scan-miss {
    font-size: var(--text-sm);
    color: var(--color-danger-text);
    background-color: var(--color-danger-subtle);
    border: 1px solid var(--color-danger-border);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    margin: 0;
  }

  .receive-detail__complete-notice {
    font-size: var(--text-sm);
    color: var(--color-success-text);
    background-color: var(--color-success-subtle);
    border: 1px solid var(--color-success-border);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    margin: 0;
  }

  .receive-detail__lines {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .receive-detail__line {
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

  .receive-detail__line--active {
    border-color: var(--color-border-brand);
    background-color: var(--color-brand-subtle);
  }

  .receive-detail__line--done {
    opacity: 0.6;
  }

  .receive-detail__line--discrepancy {
    border-color: var(--color-warning-border);
  }

  .receive-detail__line-detail {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .receive-detail__line-sku {
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--color-text-primary);
    font-family: var(--font-mono);
  }

  .receive-detail__line-qty {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  .receive-detail__discrepancy {
    font-size: var(--text-xs);
    color: var(--color-warning-text);
    margin: 0;
  }

  .receive-detail__line-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding-top: var(--space-2);
    border-top: 1px solid var(--color-border-default);
  }

  .receive-detail__qty-label {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-text-primary);
  }

  .receive-detail__qty-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .receive-detail__qty-input {
    width: 80px;
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-base);
    font-family: var(--font-mono);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    background-color: var(--color-surface-default);
    color: var(--color-text-primary);
  }

  .receive-detail__qty-input:focus {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }

  .receive-detail__line-activate {
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

  .receive-detail__line-activate:hover {
    background-color: var(--color-brand-subtle);
  }

  .receive-detail__line-check {
    font-size: var(--text-lg);
    color: var(--color-success-text);
    align-self: flex-end;
  }
</style>
