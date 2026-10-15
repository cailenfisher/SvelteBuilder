<script lang="ts">
  import { FrontCurationBoard } from '@sveltebuilder/content';
  import { FRONT, contentDictionary } from '$lib/fixtures/content';

  const dictionary = contentDictionary();

  let slots = $state(FRONT.slots);
</script>

<FrontCurationBoard
  frontName={FRONT.name}
  {slots}
  onSlotsReorder={(ids) => (slots = ids.flatMap((id) => slots.filter((slot) => slot.id === id)))}
  onSlotRemove={(id) => (slots = slots.filter((slot) => slot.id !== id))}
  {dictionary}
/>
