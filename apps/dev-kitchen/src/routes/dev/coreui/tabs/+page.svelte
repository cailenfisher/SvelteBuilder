<script lang="ts">
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '@sveltebuilder/coreui';
  import Example from '$lib/Example/Example.svelte';
  import CallbackLog from '$lib/CallbackLog/CallbackLog.svelte';

  let horizontal = $state('details');
  let vertical = $state('lines');

  let controlledValue = $state('details');
  const controlledCalls: string[] = $state([]);
</script>

<Example title="Horizontal">
  <div style:inline-size="100%">
    <Tabs bind:value={horizontal}>
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="lines">Lines</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
        <TabsTrigger value="audit" disabled>Audit (disabled)</TabsTrigger>
      </TabsList>
      <TabsContent value="details">Carrier, service level and addresses.</TabsContent>
      <TabsContent value="lines">Three lines, 14 units.</TabsContent>
      <TabsContent value="history">Created, picked, packed.</TabsContent>
      <TabsContent value="audit">Not available.</TabsContent>
    </Tabs>
  </div>
</Example>

<Example title="Vertical">
  <div style:inline-size="100%">
    <Tabs bind:value={vertical} orientation="vertical">
      <TabsList>
        <TabsTrigger value="lines">Lines</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
      </TabsList>
      <TabsContent value="lines">Arrow keys move between triggers.</TabsContent>
      <TabsContent value="notes">Handle with care.</TabsContent>
    </Tabs>
  </div>
</Example>

<Example title="Callbacks">
  <div style:inline-size="100%">
    <Tabs
      value={controlledValue}
      onValueChange={(next) => {
        controlledCalls.push(next);
        controlledValue = next;
      }}
    >
      <TabsList>
        <TabsTrigger value="details">Controlled details</TabsTrigger>
        <TabsTrigger value="lines">Controlled lines</TabsTrigger>
        <TabsTrigger value="history">Controlled history</TabsTrigger>
      </TabsList>
      <TabsContent value="details">Details panel.</TabsContent>
      <TabsContent value="lines">Lines panel.</TabsContent>
      <TabsContent value="history">History panel.</TabsContent>
    </Tabs>
    <CallbackLog name="onValueChange" calls={controlledCalls} />
  </div>
</Example>
