<script lang="ts">
  import { Field, Select, SelectItem } from '@sveltebuilder/coreui';
  import Example from '$lib/Example.svelte';

  const sizes = ['sm', 'md', 'lg'] as const;

  let carrier = $state('');
  let license = $state('creative_commons');
</script>

<div style:display="grid" style:gap="var(--space-2)" style:max-inline-size="28rem">
  <Example title="Placeholder until chosen">
    <Field id="select-carrier" label="Carrier">
      <Select bind:value={carrier} placeholder="Choose a carrier" name="carrier">
        <SelectItem value="ground" label="Ground" />
        <SelectItem value="express" label="Express" />
        <SelectItem value="freight" label="Freight (unavailable)" disabled />
      </Select>
    </Field>
    <p role="status">Value: {carrier || '(none)'}</p>
  </Example>

  <Example title="Preselected value shows its label">
    <Field id="select-license" label="License">
      <Select bind:value={license}>
        <SelectItem value="all_rights_reserved" label="All rights reserved" />
        <SelectItem value="creative_commons" label="Creative Commons" />
      </Select>
    </Field>
  </Example>

  <Example title="Error and disabled">
    <Field id="select-error" label="Warehouse" error="Choose a warehouse.">
      <Select placeholder="Choose…">
        <SelectItem value="wh-1" label="North" />
      </Select>
    </Field>
    <Field id="select-disabled" label="Region" disabled>
      <Select value="eu" disabled>
        <SelectItem value="eu" label="Europe" />
      </Select>
    </Field>
  </Example>

  <Example title="Sizes">
    {#each sizes as size (size)}
      <Field id={`select-size-${size}`} label={`Size ${size}`}>
        <Select {size} placeholder="Choose…">
          <SelectItem value="one" label="One" />
        </Select>
      </Field>
    {/each}
  </Example>
</div>
