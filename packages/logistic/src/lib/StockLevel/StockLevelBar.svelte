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

  // Low stock is measured on available (on_hand - reserved), matching the
  // lowStock query option and dashboard metric.
  const belowReorder = $derived(reorderPoint !== undefined && onHand - reserved <= reorderPoint);

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
