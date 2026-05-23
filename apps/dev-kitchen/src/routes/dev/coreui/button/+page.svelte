<script lang="ts">
  import { Button } from '@sveltebuilder/coreui';
</script>

<svelte:head>
  <title>Button — CoreUI Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>Button</h1>

  <section class="dev-section">
    <h2>Variants</h2>
    <div class="dev-stage dev-stage--row">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="link">Link</Button>
    </div>
  </section>

  <section class="dev-section">
    <h2>Sizes</h2>
    <div class="dev-stage dev-stage--row">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  </section>

  <section class="dev-section">
    <h2>Loading state</h2>
    <div class="dev-stage dev-stage--row">
      <Button variant="primary" loading>Primary</Button>
      <Button variant="secondary" loading>Secondary</Button>
      <Button variant="ghost" loading>Ghost</Button>
      <Button variant="danger" loading>Danger</Button>
      <Button variant="link" loading>Link</Button>
    </div>
  </section>

  <section class="dev-section">
    <h2>Disabled state</h2>
    <div class="dev-stage dev-stage--row">
      <Button variant="primary" disabled>Primary</Button>
      <Button variant="secondary" disabled>Secondary</Button>
      <Button variant="ghost" disabled>Ghost</Button>
      <Button variant="danger" disabled>Danger</Button>
      <Button variant="link" disabled>Link</Button>
    </div>
  </section>

  <section class="dev-section">
    <h2>With leading icon</h2>
    <div class="dev-stage dev-stage--row">
      <Button variant="primary">
        {#snippet leading()}
          <svg viewBox="0 0 16 16" fill="none" width="16" height="16" aria-hidden="true">
            <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
          </svg>
        {/snippet}
        With Icon
      </Button>
      <Button variant="secondary">
        {#snippet leading()}
          <svg viewBox="0 0 16 16" fill="none" width="16" height="16" aria-hidden="true">
            <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
          </svg>
        {/snippet}
        With Icon
      </Button>
    </div>
  </section>

  <section class="dev-section">
    <h2>With trailing icon</h2>
    <div class="dev-stage dev-stage--row">
      <Button variant="primary">
        With Icon
        {#snippet trailing()}
          <svg viewBox="0 0 16 16" fill="none" width="16" height="16" aria-hidden="true">
            <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        {/snippet}
      </Button>
      <Button variant="secondary">
        With Icon
        {#snippet trailing()}
          <svg viewBox="0 0 16 16" fill="none" width="16" height="16" aria-hidden="true">
            <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        {/snippet}
      </Button>
    </div>
  </section>

  <section class="dev-section">
    <h2>Full width</h2>
    <div class="dev-stage">
      <Button variant="primary" full>Full Width Button</Button>
    </div>
  </section>

  <section class="dev-section">
    <h2>As anchor (href prop)</h2>
    <!-- verify: <a href> renders in DOM, not <button> -->
    <div class="dev-stage dev-stage--row">
      <Button href="/dev/coreui" variant="primary">Link to CoreUI</Button>
      <Button href="/dev/coreui" variant="secondary">Secondary Link</Button>
    </div>
    <!-- verify: <button type="button"> for actions, <a href> for links -->
  </section>
</div>

<style>
  .dev-page { max-width: 56rem; }
  h1 { margin-block-end: 2rem; }
  .dev-section { margin-block-end: 2.5rem; }
  h2 { margin-block-end: 0.75rem; font-size: 0.875rem; font-weight: 600; }
  .dev-stage { padding: 1.5rem; border: 1px solid #ccc; border-radius: 0.375rem; }
  .dev-stage--row { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; }
</style>
