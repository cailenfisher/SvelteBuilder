<script lang="ts">
  import { enhance } from '$app/forms';
  import { BarcodeInput, Button } from '@sveltebuilder/coreui';
  import { StorageLocationPath, PickTaskStatusBadge } from '@sveltebuilder/logistic';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let activeSku = $state<string | null>(null);

  const activeLines = $derived(
    activeSku ? data.task.lines.filter((l) => l.sku === activeSku) : [],
  );

  const allPicked = $derived(
    data.task.lines.every((l) => l.pickedQuantity >= l.requestedQuantity),
  );

  const progress = $derived({
    done: data.task.lines.filter((l) => l.pickedQuantity >= l.requestedQuantity).length,
    total: data.task.lines.length,
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

<div class="pick-task">
  <header class="pick-task__header">
    <div class="pick-task__header-row">
      <h1 class="pick-task__title">Task #{data.task.id}</h1>
      <PickTaskStatusBadge status={data.task.status} />
    </div>
    <p class="pick-task__progress">
      {progress.done} of {progress.total} lines picked
    </p>
  </header>

  <div class="pick-task__scan-zone" aria-label="Barcode scan area">
    <BarcodeInput
      onScan={handleScan}
      placeholder="Scan item barcode…"
      label="Scan barcode"
    />
  </div>

  {#if activeSku && activeLines.length === 0}
    <p class="pick-task__scan-miss" role="alert">
      No line found for SKU <strong>{activeSku}</strong>. Try scanning again.
    </p>
  {/if}

  <ul class="pick-task__lines" aria-label="Pick lines">
    {#each data.task.lines as line (line.id)}
      {@const done = line.pickedQuantity >= line.requestedQuantity}
      {@const isActive = activeSku === line.sku}
      <li
        class="pick-task__line"
        class:pick-task__line--done={done}
        class:pick-task__line--active={isActive}
        data-sku={line.sku}
        tabindex="-1"
      >
        <div class="pick-task__line-location">
          <StorageLocationPath location={line.storageLocation} />
        </div>

        <div class="pick-task__line-detail">
          <span class="pick-task__line-sku">{line.sku}</span>
          <span class="pick-task__line-qty">
            {line.pickedQuantity} / {line.requestedQuantity} picked
          </span>
        </div>

        {#if isActive && !done}
          <form
            class="pick-task__line-form"
            method="POST"
            action="?/pick"
            use:enhance={() => {
              return ({ update }) => {
                update({ reset: false });
                clearActive();
              };
            }}
          >
            <input type="hidden" name="line_id" value={line.id} />
            <label class="pick-task__qty-label" for="qty-{line.id}">Quantity picked</label>
            <div class="pick-task__qty-row">
              <input
                id="qty-{line.id}"
                class="pick-task__qty-input"
                type="number"
                name="quantity"
                min="0"
                max={line.requestedQuantity}
                value={line.requestedQuantity}
                required
              />
              <Button type="submit" variant="primary" size="sm">Confirm</Button>
            </div>
          </form>
        {/if}

        {#if done}
          <span class="pick-task__line-check" aria-label="Complete">✓</span>
        {:else if !isActive}
          <button
            class="pick-task__line-activate"
            type="button"
            onclick={() => { activeSku = line.sku; }}
            aria-label="Pick {line.sku} manually"
          >
            Pick
          </button>
        {/if}
      </li>
    {/each}
  </ul>

  {#if allPicked}
    <form method="POST" action="?/complete" class="pick-task__complete-form">
      <Button type="submit" variant="primary" size="lg">Mark task complete</Button>
    </form>
  {/if}
</div>

<style>
  .pick-task {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    padding: var(--space-4);
    max-width: 640px;
    margin-inline: auto;
    width: 100%;
  }

  .pick-task__header {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .pick-task__header-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .pick-task__title {
    font-size: var(--text-xl);
    font-weight: var(--weight-bold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .pick-task__progress {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }

  .pick-task__scan-zone {
    background-color: var(--color-surface-overlay);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
  }

  .pick-task__scan-miss {
    font-size: var(--text-sm);
    color: var(--color-danger-text);
    background-color: var(--color-danger-subtle);
    border: 1px solid var(--color-danger-border);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    margin: 0;
  }

  .pick-task__lines {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .pick-task__line {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    background-color: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: var(--card-radius);
    transition: border-color var(--duration-fast) var(--ease-out);
    outline: none;
  }

  .pick-task__line--active {
    border-color: var(--color-border-brand);
    background-color: var(--color-brand-subtle);
  }

  .pick-task__line--done {
    opacity: 0.6;
  }

  .pick-task__line-location {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  .pick-task__line-detail {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .pick-task__line-sku {
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--color-text-primary);
    font-family: var(--font-mono);
  }

  .pick-task__line-qty {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  .pick-task__line-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding-top: var(--space-2);
    border-top: 1px solid var(--color-border-default);
  }

  .pick-task__qty-label {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-text-primary);
  }

  .pick-task__qty-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .pick-task__qty-input {
    width: 80px;
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-base);
    font-family: var(--font-mono);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    background-color: var(--color-surface-default);
    color: var(--color-text-primary);
  }

  .pick-task__qty-input:focus {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }

  .pick-task__line-check {
    font-size: var(--text-lg);
    color: var(--color-success-text);
    align-self: flex-end;
  }

  .pick-task__line-activate {
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

  .pick-task__line-activate:hover {
    background-color: var(--color-brand-subtle);
  }

  .pick-task__complete-form {
    padding-top: var(--space-4);
    border-top: 1px solid var(--color-border-default);
    display: flex;
    justify-content: flex-end;
  }
</style>
