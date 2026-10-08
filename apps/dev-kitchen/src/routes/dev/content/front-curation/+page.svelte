<script lang="ts">
  import { FrontCurationBoard } from '@sveltebuilder/content';
  import { FRONT } from '$lib/fixtures/content';

  let slots = $state(FRONT.slots);
</script>

<FrontCurationBoard
  frontName={FRONT.name}
  {slots}
  onSlotsReorder={(ids) => (slots = ids.flatMap((id) => slots.filter((slot) => slot.id === id)))}
  onSlotRemove={(id) => (slots = slots.filter((slot) => slot.id !== id))}
  locale="en"
/>
