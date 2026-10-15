<script lang="ts">
  import { Button, Field, Select, SelectItem } from '@sveltebuilder/coreui';
  import Example from '$lib/Example/Example.svelte';
  import CallbackLog from '$lib/CallbackLog/CallbackLog.svelte';

  const sizes = ['sm', 'md', 'lg'] as const;

  let carrier = $state('');
  let license = $state('creative_commons');

  let controlledValue = $state('');
  const controlledCalls: string[] = $state([]);
  let boundValue = $state('');
  const boundCalls: string[] = $state([]);
  let submitted = $state('');
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
      <Select bind:value={license} placeholder="Choose a license">
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
      <Select value="eu" placeholder="Choose a region" disabled>
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

<Example title="Callbacks">
  <form
    onsubmit={(event) => {
      event.preventDefault();
      submitted = String(new FormData(event.currentTarget).get('bound-service') ?? '');
    }}
  >
    <Field id="select-controlled" label="Controlled service">
      <Select
        value={controlledValue}
        onValueChange={(next) => {
          controlledCalls.push(next);
          controlledValue = next;
        }}
        placeholder="Choose a service"
      >
        <SelectItem value="ground" label="Ground" />
        <SelectItem value="express" label="Express" />
        <SelectItem value="freight" label="Freight (unavailable)" disabled />
      </Select>
    </Field>
    <CallbackLog name="Controlled onValueChange" calls={controlledCalls} />
    <Field id="select-bound" label="Bound service">
      <Select bind:value={boundValue} onValueChange={(next) => boundCalls.push(next)} placeholder="Choose a service" name="bound-service">
        <SelectItem value="ground" label="Ground" />
        <SelectItem value="express" label="Express" />
      </Select>
    </Field>
    <CallbackLog name="Bound onValueChange" calls={boundCalls} />
    <p role="status">Bound value: {boundValue || '(none)'}. Submitted: {submitted || '(nothing)'}</p>
    <Button type="submit" variant="secondary">Submit services</Button>
  </form>
</Example>
