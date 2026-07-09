<!-- Camp 1: i18n-agnostic. Displays on-hand / reserved / available breakdown.
     Caller formats the labels (e.g. via localText for the column headings). -->
<script lang="ts">
  type Props = {
    onHand: number;
    reserved: number;
    reorderPoint?: number;
    class?: string | undefined;
  };

  let { onHand, reserved, reorderPoint, class: extraClass }: Props = $props();

  const available = $derived(onHand - reserved);

  const belowReorder = $derived(reorderPoint !== undefined && onHand <= reorderPoint);

  const reservedPct = $derived(onHand > 0 ? Math.min((reserved / onHand) * 100, 100) : 0);

  const classes = $derived(
    ['stock-level-bar', belowReorder ? 'stock-level-bar--low' : '', extraClass ?? '']
      .filter(Boolean)
      .join(' ')
  );
</script>

<div class={classes}>
  <div class="stock-level-bar__figures">
    <span class="stock-level-bar__figure">
      <span class="stock-level-bar__count">{available}</span>
      <span class="stock-level-bar__label">available</span>
    </span>
    <span class="stock-level-bar__figure">
      <span class="stock-level-bar__count">{reserved}</span>
      <span class="stock-level-bar__label">reserved</span>
    </span>
    <span class="stock-level-bar__figure">
      <span class="stock-level-bar__count">{onHand}</span>
      <span class="stock-level-bar__label">on hand</span>
    </span>
  </div>

  <div class="stock-level-bar__track" aria-hidden="true">
    <div
      class="stock-level-bar__reserved-fill"
      style:width="{reservedPct}%"
    ></div>
  </div>

  {#if belowReorder}
    <p class="stock-level-bar__alert" role="status">Below reorder point ({reorderPoint})</p>
  {/if}
</div>

<style>
  .stock-level-bar {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .stock-level-bar__figures {
    display: flex;
    gap: var(--space-4);
  }

  .stock-level-bar__figure {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .stock-level-bar__count {
    font-size: var(--text-lg);
    font-weight: var(--weight-bold);
    color: var(--text);
    line-height: 1;
  }

  .stock-level-bar--low .stock-level-bar__count {
    color: var(--warning-text);
  }

  .stock-level-bar__label {
    font-size: var(--text-xs);
    color: var(--text-soft);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stock-level-bar__track {
    height: 4px;
    background-color: var(--surface-overlay);
    border-radius: 2px;
    overflow: hidden;
    position: relative;
  }

  .stock-level-bar__reserved-fill {
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    background-color: var(--brand-soft);
    border-radius: 2px;
    transition: width var(--duration) var(--ease);
  }

  .stock-level-bar__alert {
    font-size: var(--text-xs);
    color: var(--warning-text);
    margin: 0;
  }
</style>
