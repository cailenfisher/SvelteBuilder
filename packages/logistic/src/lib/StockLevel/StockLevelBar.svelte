<!-- A stock level's available, reserved and on-hand figures, with a bar showing how much is
     reserved, and a note when available stock is at or below the reorder point. -->
<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';

  type Props = {
    onHand: number;
    reserved: number;
    reorderPoint?: number;
    dictionary?: DictionaryInstance;
    class?: string | undefined;
  };

  let { onHand, reserved, reorderPoint, dictionary: dictionaryProp, class: extraClass }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();

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
      <span class="stock-level-bar__label">{dictionary.localText('logistic.field.available', 'logistic')}</span>
    </span>
    <span class="stock-level-bar__figure">
      <span class="stock-level-bar__count">{reserved}</span>
      <span class="stock-level-bar__label">{dictionary.localText('logistic.field.reserved', 'logistic')}</span>
    </span>
    <span class="stock-level-bar__figure">
      <span class="stock-level-bar__count">{onHand}</span>
      <span class="stock-level-bar__label">{dictionary.localText('logistic.field.on_hand', 'logistic')}</span>
    </span>
  </div>

  <div class="stock-level-bar__track" aria-hidden="true">
    <div
      class="stock-level-bar__reserved-fill"
      style:width="{reservedPct}%"
    ></div>
  </div>

  {#if belowReorder}
    <p class="stock-level-bar__alert" role="status">
      {dictionary.formatText('logistic.stock_level.below_reorder_point', { reorderPoint }, 'logistic')}
    </p>
  {/if}
</div>
