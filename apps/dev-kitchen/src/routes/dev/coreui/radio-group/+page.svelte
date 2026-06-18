<script lang="ts">
  import { RadioGroup, RadioItem } from '@sveltebuilder/coreui';

  let selectedV = $state('');
</script>

<svelte:head>
  <title>RadioGroup — CoreUI Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>RadioGroup</h1>

  <!-- verify: role="radiogroup" on root, roving tabindex on items -->

  <section class="dev-section">
    <h2>Vertical (default)</h2>
    <div class="dev-stage">
      <RadioGroup name="fruit-v">
        <RadioItem value="apple" label="Apple" />
        <RadioItem value="banana" label="Banana" />
        <RadioItem value="cherry" label="Cherry" />
      </RadioGroup>
    </div>
  </section>

  <section class="dev-section">
    <h2>Horizontal</h2>
    <div class="dev-stage">
      <RadioGroup orientation="horizontal" name="fruit-h">
        <RadioItem value="apple" label="Apple" />
        <RadioItem value="banana" label="Banana" />
        <RadioItem value="cherry" label="Cherry" />
      </RadioGroup>
    </div>
  </section>

  <section class="dev-section">
    <h2>One option disabled</h2>
    <div class="dev-stage">
      <RadioGroup name="fruit-partial">
        <RadioItem value="apple" label="Apple" />
        <RadioItem value="banana" label="Banana (unavailable)" disabled />
        <RadioItem value="cherry" label="Cherry" />
      </RadioGroup>
    </div>
  </section>

  <section class="dev-section">
    <h2>Full group disabled</h2>
    <div class="dev-stage">
      <RadioGroup disabled name="fruit-disabled">
        <RadioItem value="apple" label="Apple" />
        <RadioItem value="banana" label="Banana" />
        <RadioItem value="cherry" label="Cherry" />
      </RadioGroup>
    </div>
  </section>

  <section class="dev-section">
    <h2>Bound value (live)</h2>
    <div class="dev-stage">
      <RadioGroup bind:value={selectedV} name="fruit-bound">
        <RadioItem value="apple" label="Apple" />
        <RadioItem value="banana" label="Banana" />
        <RadioItem value="cherry" label="Cherry" />
      </RadioGroup>
      <p style="margin-top: 0.75rem; font-size: 0.875rem;">Selected: <strong>{selectedV || '(none)'}</strong></p>
    </div>
  </section>
</div>

<style>
  .dev-page { max-width: 40rem; }
  h1 { margin-block-end: 2rem; }
  .dev-section { margin-block-end: 2.5rem; }
  h2 { margin-block-end: 0.75rem; font-size: 0.875rem; font-weight: 600; }
  .dev-stage { padding: 1.5rem; border: 1px solid #ccc; border-radius: 0.375rem; }
</style>
