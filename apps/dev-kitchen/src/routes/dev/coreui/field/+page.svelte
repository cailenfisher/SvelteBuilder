<script lang="ts">
  import { Field, Input, Label, Textarea } from '@sveltebuilder/coreui';
  import Example from '$lib/Example.svelte';

  const sizes = ['sm', 'md', 'lg'] as const;

  let reference = $state('');
  let notes = $state('Fragile; keep upright.');
  const referenceError = $derived(reference.length > 0 && reference.length < 4 ? 'At least 4 characters.' : undefined);
</script>

<div style:display="grid" style:gap="var(--space-2)" style:max-inline-size="28rem">
  <Example title="Field with Input">
    <Field id="field-name" label="Supplier name" hint="As it appears on invoices." required>
      <Input placeholder="Acme Freight" />
    </Field>
  </Example>

  <Example title="Field with a live error">
    <Field id="field-reference" label="Reference" error={referenceError}>
      <Input bind:value={reference} />
    </Field>
  </Example>

  <Example title="Disabled field">
    <Field id="field-disabled" label="Warehouse code" disabled>
      <Input value="WH-01" />
    </Field>
  </Example>

  <Example title="Field with Textarea">
    <Field id="field-notes" label="Handling notes" hint="Shown to the picker.">
      <Textarea bind:value={notes} rows={4} />
    </Field>
  </Example>

  <Example title="Input sizes">
    {#each sizes as size (size)}
      <Input {size} aria-label={`Input, size ${size}`} placeholder={`Size ${size}`} />
    {/each}
  </Example>

  <Example title="Label on its own">
    <Label for="bare-input" required>Quantity</Label>
    <Input id="bare-input" type="number" min="0" />
  </Example>
</div>
