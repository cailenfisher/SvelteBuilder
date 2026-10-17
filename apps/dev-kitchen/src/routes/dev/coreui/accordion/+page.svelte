<script lang="ts">
  import { Accordion, AccordionItem } from '@sveltebuilder/coreui';
  import Example from '$lib/Example/Example.svelte';
  import CallbackLog from '$lib/CallbackLog/CallbackLog.svelte';

  let single = $state('receiving');
  let multiple = $state<string[]>(['picking']);

  let controlledValue = $state('');
  const controlledCalls: string[] = $state([]);
</script>

<div style:display="grid" style:gap="var(--space-2)" style:max-inline-size="36rem">
  <Example title="Single, one open at a time">
    <div style:inline-size="100%">
      <Accordion type="single" bind:value={single}>
        <AccordionItem value="receiving" title="Receiving"
          >Inbound goods are checked against the purchase order.</AccordionItem
        >
        <AccordionItem value="putaway" title="Put-away"
          >Stock moves from the dock to a storage location.</AccordionItem
        >
        <AccordionItem value="archived" title="Archived (disabled)" disabled
          >Not available.</AccordionItem
        >
      </Accordion>
    </div>
  </Example>

  <Example title="Multiple">
    <div style:inline-size="100%">
      <Accordion type="multiple" bind:value={multiple}>
        <AccordionItem value="picking" title="Picking"
          >Collect the lines on a pick list.</AccordionItem
        >
        <AccordionItem value="packing" title="Packing">Box, weigh and label.</AccordionItem>
        <AccordionItem value="dispatch" title="Dispatch">Hand over to the carrier.</AccordionItem>
      </Accordion>
    </div>
    <p role="status">Open: {multiple.join(', ') || '(none)'}</p>
  </Example>
</div>

<Example title="Callbacks">
  <div style:inline-size="100%">
    <Accordion
      type="single"
      value={controlledValue}
      onValueChange={(next) => {
        controlledCalls.push(next);
        controlledValue = next;
      }}
    >
      <AccordionItem value="returns" title="Controlled returns">Graded on arrival.</AccordionItem>
      <AccordionItem value="counts" title="Controlled counts">Counted by location.</AccordionItem>
    </Accordion>
    <CallbackLog name="onValueChange" calls={controlledCalls} />
  </div>
</Example>
