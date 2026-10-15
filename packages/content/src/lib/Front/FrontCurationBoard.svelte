<!-- Front curation: reorder a front's article slots by dragging or with the move buttons, and
     remove one. Headlines arrive resolved on each slot's article; the board's own copy (scope
     `content`) comes from the dictionary. Reports the new order through onSlotsReorder for the
     parent to persist through a form action. -->
<script lang="ts">
  import { untrack } from 'svelte';
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import { Badge } from '@sveltebuilder/coreui';
  import type { FrontSlotWithArticle } from '../schema/index.js';

  type Props = {
    frontName: string;
    slots: FrontSlotWithArticle[];
    onSlotsReorder?: (slotIds: number[]) => void;
    onSlotRemove?: (slotId: number) => void;
    dictionary?: DictionaryInstance;
  };

  let { frontName, slots, onSlotsReorder, onSlotRemove, dictionary: dictionaryProp }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();

  const headlineOf = (slot: FrontSlotWithArticle) => slot.article?.headline ?? '—';

  let orderedSlots: FrontSlotWithArticle[] = $state(untrack(() => [...slots]));

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
</script>

<div class="front-curation-board">
  <h2 class="front-curation-board__title">{frontName}</h2>

  {#if orderedSlots.length === 0}
    <p class="front-curation-board__empty">
      {dictionary.localText('content.front_curation_board.empty', 'content')}
    </p>
  {:else}
    <ol
      class="front-curation-board__list"
      aria-label={dictionary.formatText('content.front_curation_board.list', { front: frontName }, 'content')}
    >
      {#each orderedSlots as slot, i (slot.id)}
        <li
          class="front-curation-board__slot"
          draggable="true"
          ondragstart={() => onDragStart(i)}
          ondragover={(e) => onDragOver(e, i)}
          ondrop={onDrop}
        >
          <span class="front-curation-board__position" aria-hidden="true">{i + 1}</span>

          <div class="front-curation-board__info">
            <span class="front-curation-board__headline">
              {headlineOf(slot)}
            </span>
            <Badge variant="default" size="sm">
              {dictionary.localText(`content.front_layout_variant.${slot.layoutVariant}`, 'content')}
            </Badge>
          </div>

          <div class="front-curation-board__controls">
            <button
              type="button"
              class="front-curation-board__move"
              onclick={() => moveUp(i)}
              disabled={i === 0}
              aria-label={dictionary.formatText('content.front_curation_board.move_up', { headline: headlineOf(slot) }, 'content')}
            >
              ↑
            </button>
            <button
              type="button"
              class="front-curation-board__move"
              onclick={() => moveDown(i)}
              disabled={i === orderedSlots.length - 1}
              aria-label={dictionary.formatText('content.front_curation_board.move_down', { headline: headlineOf(slot) }, 'content')}
            >
              ↓
            </button>
            <button
              type="button"
              class="front-curation-board__remove"
              onclick={() => onSlotRemove?.(slot.id)}
              aria-label={dictionary.formatText('content.front_curation_board.remove', { headline: headlineOf(slot) }, 'content')}
            >
              ✕
            </button>
          </div>
        </li>
      {/each}
    </ol>
  {/if}
</div>
