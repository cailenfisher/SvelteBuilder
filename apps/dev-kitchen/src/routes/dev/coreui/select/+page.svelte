<script lang="ts">
  import { Select, SelectItem, Field, Divider } from '@sveltebuilder/coreui';

  let boundValue = $state('');
  let fieldValue = $state('');
</script>

<svelte:head>
  <title>Select — CoreUI Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>Select</h1>

  <section class="dev-section">
    <h2>Sizes</h2>
    <div class="dev-stage">
      <Select size="sm" placeholder="Small select">
        <SelectItem value="a" label="Option A" />
        <SelectItem value="b" label="Option B" />
        <SelectItem value="c" label="Option C" />
      </Select>
      <Select size="md" placeholder="Medium select">
        <SelectItem value="a" label="Option A" />
        <SelectItem value="b" label="Option B" />
        <SelectItem value="c" label="Option C" />
      </Select>
      <Select size="lg" placeholder="Large select">
        <SelectItem value="a" label="Option A" />
        <SelectItem value="b" label="Option B" />
        <SelectItem value="c" label="Option C" />
      </Select>
    </div>
  </section>

  <section class="dev-section">
    <h2>Placeholder</h2>
    <div class="dev-stage">
      <Select placeholder="Choose a fruit…">
        <SelectItem value="apple" label="Apple" />
        <SelectItem value="banana" label="Banana" />
      </Select>
    </div>
  </section>

  <section class="dev-section">
    <h2>Pre-selected value</h2>
    <div class="dev-stage">
      <Select value="banana">
        <SelectItem value="apple" label="Apple" />
        <SelectItem value="banana" label="Banana" />
        <SelectItem value="cherry" label="Cherry" />
      </Select>
    </div>
  </section>

  <section class="dev-section">
    <h2>Disabled</h2>
    <div class="dev-stage">
      <Select disabled placeholder="Disabled select">
        <SelectItem value="a" label="Option A" />
      </Select>
    </div>
  </section>

  <section class="dev-section">
    <h2>Error state</h2>
    <div class="dev-stage">
      <Select error="Please select an option." placeholder="Select an option">
        <SelectItem value="a" label="Option A" />
        <SelectItem value="b" label="Option B" />
      </Select>
    </div>
  </section>

  <section class="dev-section">
    <h2>Inside a Field</h2>
    <div class="dev-stage">
      <Field label="Country" id="field-country" required>
        <Select bind:value={fieldValue} placeholder="Select country…">
          <SelectItem value="us" label="United States" />
          <SelectItem value="ca" label="Canada" />
          <SelectItem value="gb" label="United Kingdom" />
        </Select>
      </Field>
    </div>
  </section>

  <section class="dev-section">
    <h2>Bound value (live)</h2>
    <div class="dev-stage">
      <Select bind:value={boundValue} placeholder="Pick one…">
        <SelectItem value="apple" label="Apple" />
        <SelectItem value="banana" label="Banana" />
        <SelectItem value="cherry" label="Cherry" />
      </Select>
      <p style="margin-top: 0.5rem; font-size: 0.875rem;">Selected: <strong>{boundValue || '(none)'}</strong></p>
    </div>
  </section>

  <section class="dev-section">
    <h2>With separator between option groups</h2>
    <div class="dev-stage">
      <Select placeholder="Select a size…">
        <SelectItem value="xs" label="XS" />
        <SelectItem value="sm" label="SM" />
        <SelectItem value="md" label="MD" />
        <Divider />
        <SelectItem value="lg" label="LG" />
        <SelectItem value="xl" label="XL" />
        <SelectItem value="xxl" label="2XL" />
      </Select>
    </div>
  </section>
</div>

<style>
  .dev-page { max-width: 40rem; }
  h1 { margin-block-end: 2rem; }
  .dev-section { margin-block-end: 2.5rem; }
  h2 { margin-block-end: 0.75rem; font-size: 0.875rem; font-weight: 600; }
  .dev-stage { display: flex; flex-direction: column; gap: 0.75rem; padding: 1.5rem; border: 1px solid #ccc; border-radius: 0.375rem; }
</style>
