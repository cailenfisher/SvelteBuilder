<script lang="ts">
  import { Field } from '@sveltebuilder/coreui';
  import { BarcodeInput } from '@sveltebuilder/logistic';
  import Example from '$lib/Example/Example.svelte';

  let scans = $state<string[]>([]);
</script>

<div style:display="grid" style:gap="var(--space-2)" style:max-inline-size="28rem">
  <Example title="Scan or type, then Enter">
    <Field id="location-barcode" label="Location barcode" hint="Scan the label on the bin">
      <BarcodeInput placeholder="Scan a location" onScan={(value) => (scans = [value, ...scans])} />
    </Field>
    <ol aria-label="Scanned values">
      {#each scans as scan, index (index)}
        <li><code>{scan}</code></li>
      {/each}
    </ol>
  </Example>

  <Example title="Error">
    <Field id="item-barcode" label="Item barcode" error="That item is not on this pick list.">
      <BarcodeInput onScan={() => {}} />
    </Field>
  </Example>

  <Example title="Disabled">
    <Field id="pallet-barcode" label="Pallet barcode" disabled>
      <BarcodeInput onScan={() => {}} />
    </Field>
  </Example>
</div>
