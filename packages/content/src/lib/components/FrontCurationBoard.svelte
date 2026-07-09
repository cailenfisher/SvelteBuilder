<!-- Camp 1: front curation drag-order board. Receives pre-resolved copy from server.
     No hermes import — headline strings are passed as props from the server load.
     Emits onSlotsReorder with the new slot order for the parent to persist via form action. -->
<script lang="ts">
  import { Button, Badge } from '@sveltebuilder/coreui';
  import type { FrontSlotWithArticle } from '../schema/index.js';

  type Props = {
    frontName: string;
    slots: FrontSlotWithArticle[];
    onSlotsReorder?: (slotIds: number[]) => void;
    onSlotRemove?: (slotId: number) => void;
    locale: string;
  };

  let { frontName, slots, onSlotsReorder, onSlotRemove, locale: _locale }: Props = $props();

  let orderedSlots: FrontSlotWithArticle[] = $state([...slots]);

  $effect(() => {
    orderedSlots = [...slots];
  });

  let dragIndex: number | null = $state(null);

  function onDragStart(index: number) {
    dragIndex = index;
  }

  function onDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    const updated = [...orderedSlots];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(index, 0, moved);
    orderedSlots = updated;
    dragIndex = index;
  }

  function onDrop() {
    dragIndex = null;
    onSlotsReorder?.(orderedSlots.map((s) => s.id));
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const updated = [...orderedSlots];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    orderedSlots = updated;
    onSlotsReorder?.(orderedSlots.map((s) => s.id));
  }

  function moveDown(index: number) {
    if (index === orderedSlots.length - 1) return;
    const updated = [...orderedSlots];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    orderedSlots = updated;
    onSlotsReorder?.(orderedSlots.map((s) => s.id));
  }

  const VARIANT_LABEL: Record<string, string> = {
    lead:      'Lead',
    secondary: 'Secondary',
    river:     'River',
    brief:     'Brief',
  };
</script>

<div class="front-curation-board" aria-label={`Front curation: ${frontName}`}>
  <h2 class="front-curation-board__title">{frontName}</h2>

  {#if orderedSlots.length === 0}
    <p class="front-curation-board__empty">No articles on this front.</p>
  {:else}
    <ol class="front-curation-board__list" role="list" aria-label="Article slots">
      {#each orderedSlots as slot, i (slot.id)}
        <li
          class="front-curation-board__slot"
          draggable="true"
          ondragstart={() => onDragStart(i)}
          ondragover={(e) => onDragOver(e, i)}
          ondrop={onDrop}
          aria-label={`Slot ${i + 1}: ${slot.article?.headline ?? 'Unknown article'}`}
        >
          <span class="front-curation-board__position" aria-hidden="true">{i + 1}</span>

          <div class="front-curation-board__info">
            <span class="front-curation-board__headline">
              {slot.article?.headline ?? '—'}
            </span>
            <Badge variant="neutral" size="sm">
              {VARIANT_LABEL[slot.layoutVariant] ?? slot.layoutVariant}
            </Badge>
          </div>

          <div class="front-curation-board__controls">
            <button
              class="front-curation-board__move"
              onclick={() => moveUp(i)}
              disabled={i === 0}
              aria-label="Move up"
            >
              ↑
            </button>
            <button
              class="front-curation-board__move"
              onclick={() => moveDown(i)}
              disabled={i === orderedSlots.length - 1}
              aria-label="Move down"
            >
              ↓
            </button>
            <button
              class="front-curation-board__remove"
              onclick={() => onSlotRemove?.(slot.id)}
              aria-label={`Remove ${slot.article?.headline ?? 'article'} from front`}
            >
              ✕
            </button>
          </div>
        </li>
      {/each}
    </ol>
  {/if}
</div>

<style>
  .front-curation-board {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .front-curation-board__title {
    margin: 0;
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--text);
  }

  .front-curation-board__empty {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--text-soft);
    font-style: italic;
    padding: var(--space-6) 0;
    text-align: center;
  }

  .front-curation-board__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .front-curation-board__slot {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: var(--surface);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    cursor: grab;
    transition: background var(--duration) var(--ease), box-shadow var(--duration) var(--ease);
  }

  .front-curation-board__slot:active {
    cursor: grabbing;
    box-shadow: var(--shadow);
    background: var(--surface-raised);
  }

  .front-curation-board__position {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--text-soft);
    width: 1.5rem;
    text-align: center;
    flex-shrink: 0;
  }

  .front-curation-board__info {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-width: 0;
  }

  .front-curation-board__headline {
    font-size: var(--text-sm);
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .front-curation-board__controls {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    flex-shrink: 0;
  }

  .front-curation-board__move,
  .front-curation-board__remove {
    appearance: none;
    background: none;
    border: none;
    padding: var(--space-1) var(--space-2);
    cursor: pointer;
    font-size: var(--text-sm);
    color: var(--text-soft);
    border-radius: var(--radius-sm);
    line-height: 1;
    transition: background var(--duration) var(--ease), color var(--duration) var(--ease);
  }

  .front-curation-board__move:hover,
  .front-curation-board__remove:hover {
    background: var(--surface-raised);
    color: var(--text);
  }

  .front-curation-board__move:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .front-curation-board__remove:hover {
    color: var(--danger);
  }
</style>
