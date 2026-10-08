<script lang="ts">
  import { BarcodeInput } from '@sveltebuilder/coreui';
  import Example from '$lib/Example.svelte';

  let scans = $state<string[]>([]);
</script>

<div style:display="grid" style:gap="var(--space-2)" style:max-inline-size="28rem">
  <Example title="Scan or type, then Enter">
    <BarcodeInput label="Location barcode" placeholder="Scan a location" onScan={(value) => (scans = [value, ...scans])} />
    <ol aria-label="Scanned values">
      {#each scans as scan, index (index)}
        <li><code>{scan}</code></li>
      {/each}
    </ol>
  </Example>

  <Example title="Error">
    <BarcodeInput label="Item barcode" error="That item is not on this pick list." onScan={() => {}} />
  </Example>

  <Example title="Disabled">
    <BarcodeInput label="Pallet barcode" disabled onScan={() => {}} />
  </Example>
</div>
