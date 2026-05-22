<script lang="ts">
  import { Dialog, Button } from '@sveltebuilder/coreui';

  let mdOpen = $state(false);
  let smOpen = $state(false);
  let lgOpen = $state(false);
  let xlOpen = $state(false);
  let fullOpen = $state(false);
  let noDescOpen = $state(false);
  let controlledOpen = $state(false);
  let footerOpen = $state(false);
</script>

<svelte:head>
  <title>Dialog — CoreUI Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>Dialog</h1>

  <!-- verify: aria-expanded on trigger, aria-modal="true" on dialog, focus trapped inside -->

  <section class="dev-section">
    <h2>Default (md) — with description</h2>
    <div class="dev-stage">
      <Dialog
        bind:open={mdOpen}
        title="Confirm action"
        description="This action cannot be undone. Are you sure you want to continue?"
      >
        {#snippet trigger()}
          <Button onclick={() => (mdOpen = true)}>Open dialog</Button>
        {/snippet}
        <p>Dialog body content goes here.</p>
      </Dialog>
    </div>
  </section>

  <section class="dev-section">
    <h2>Size — sm</h2>
    <div class="dev-stage">
      <Dialog bind:open={smOpen} title="Small dialog" size="sm" description="A small confirmation dialog.">
        {#snippet trigger()}
          <Button variant="secondary" onclick={() => (smOpen = true)}>Open sm</Button>
        {/snippet}
        <p>Small dialog content.</p>
      </Dialog>
    </div>
  </section>

  <section class="dev-section">
    <h2>Size — lg</h2>
    <div class="dev-stage">
      <Dialog bind:open={lgOpen} title="Large dialog" size="lg" description="More space for complex content.">
        {#snippet trigger()}
          <Button variant="secondary" onclick={() => (lgOpen = true)}>Open lg</Button>
        {/snippet}
        <p>Large dialog body. More room for forms, tables, or rich content.</p>
      </Dialog>
    </div>
  </section>

  <section class="dev-section">
    <h2>Size — xl</h2>
    <div class="dev-stage">
      <Dialog bind:open={xlOpen} title="Extra-large dialog" size="xl" description="Even more space.">
        {#snippet trigger()}
          <Button variant="secondary" onclick={() => (xlOpen = true)}>Open xl</Button>
        {/snippet}
        <p>XL dialog body.</p>
      </Dialog>
    </div>
  </section>

  <section class="dev-section">
    <h2>Size — full</h2>
    <div class="dev-stage">
      <Dialog bind:open={fullOpen} title="Full-screen dialog" size="full" description="Takes the full viewport.">
        {#snippet trigger()}
          <Button variant="secondary" onclick={() => (fullOpen = true)}>Open full</Button>
        {/snippet}
        <p>Full-screen dialog. Close button is in the top-right corner.</p>
      </Dialog>
    </div>
  </section>

  <section class="dev-section">
    <h2>Without description</h2>
    <div class="dev-stage">
      <!--
        No description prop — Dialog renders a visually hidden description
        element to satisfy aria-describedby. The hidden element contains
        the title text so assistive tech still gets context.
        verify: aria-describedby absent on dialog content (points to hidden element internally)
      -->
      <Dialog bind:open={noDescOpen} title="No description prop">
        {#snippet trigger()}
          <Button variant="ghost" onclick={() => (noDescOpen = true)}>Open (no description)</Button>
        {/snippet}
        <p>This dialog has no visible description. A visually-hidden description is rendered internally for ARIA.</p>
      </Dialog>
    </div>
  </section>

  <section class="dev-section">
    <h2>Controlled open state (bind:open)</h2>
    <div class="dev-stage">
      <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
        <Button onclick={() => (controlledOpen = true)}>Open from outside</Button>
        <span style="font-size: 0.875rem;">open: <strong>{controlledOpen}</strong></span>
      </div>
      <Dialog bind:open={controlledOpen} title="Externally controlled" description="Opened by the button above, not a trigger snippet.">
        <p>This dialog was opened via a separate button using bind:open.</p>
      </Dialog>
    </div>
  </section>

  <section class="dev-section">
    <h2>Footer slot populated</h2>
    <div class="dev-stage">
      <Dialog bind:open={footerOpen} title="Delete item" description="This will permanently remove the item." size="sm">
        {#snippet trigger()}
          <Button variant="danger" onclick={() => (footerOpen = true)}>Delete item</Button>
        {/snippet}
        <p>Are you sure? This action cannot be undone.</p>
        {#snippet footer()}
          <Button variant="secondary" onclick={() => (footerOpen = false)}>Cancel</Button>
          <Button variant="danger" onclick={() => (footerOpen = false)}>Delete</Button>
        {/snippet}
      </Dialog>
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
