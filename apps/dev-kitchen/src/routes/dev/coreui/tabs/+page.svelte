<script lang="ts">
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '@sveltebuilder/coreui';
  import Example from '$lib/Example.svelte';

  let horizontal = $state('details');
  let vertical = $state('lines');
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
