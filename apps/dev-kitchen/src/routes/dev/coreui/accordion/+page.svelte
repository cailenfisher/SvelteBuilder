<script lang="ts">
  import { Accordion, AccordionItem } from '@sveltebuilder/coreui';
</script>

<svelte:head>
  <title>Accordion — CoreUI Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>Accordion</h1>

  <!-- verify: aria-expanded on trigger, aria-controls pointing at content panel -->

  <section class="dev-section">
    <h2>type="single" — only one item open at a time</h2>
    <div class="dev-stage">
      <Accordion type="single">
        <AccordionItem value="item-1" title="What is SvelteBuilder?">
          SvelteBuilder is a monorepo that provides a fully accessible design system built with Svelte 5 and Bits UI.
        </AccordionItem>
        <AccordionItem value="item-2" title="How do I use the components?">
          Import any component from <code>@sveltebuilder/coreui</code> and use it directly in your Svelte app.
        </AccordionItem>
        <AccordionItem value="item-3" title="Is it accessible?">
          Yes. All components target WCAG 2.2 AA compliance.
        </AccordionItem>
      </Accordion>
    </div>
  </section>

  <section class="dev-section">
    <h2>type="multiple" — multiple items open simultaneously</h2>
    <div class="dev-stage">
      <Accordion type="multiple">
        <AccordionItem value="multi-1" title="First item">
          This item can be open at the same time as others.
        </AccordionItem>
        <AccordionItem value="multi-2" title="Second item">
          Open me alongside the first item — both stay open.
        </AccordionItem>
        <AccordionItem value="multi-3" title="Third item">
          Any combination of items can be open simultaneously.
        </AccordionItem>
      </Accordion>
    </div>
  </section>

  <section class="dev-section">
    <h2>One item disabled</h2>
    <div class="dev-stage">
      <Accordion type="single">
        <AccordionItem value="d-1" title="Enabled item">
          This item can be opened normally.
        </AccordionItem>
        <AccordionItem value="d-2" title="Disabled item (cannot open)" disabled>
          You should not be able to see this.
        </AccordionItem>
        <AccordionItem value="d-3" title="Another enabled item">
          This item can also be opened normally.
        </AccordionItem>
      </Accordion>
    </div>
  </section>

  <section class="dev-section">
    <h2>Pre-opened item</h2>
    <div class="dev-stage">
      <Accordion type="single" value="pre-open-2">
        <AccordionItem value="pre-open-1" title="Closed initially">
          This item starts closed.
        </AccordionItem>
        <AccordionItem value="pre-open-2" title="Open initially">
          This item is open when the page loads because value="pre-open-2" is set on the Accordion.
        </AccordionItem>
        <AccordionItem value="pre-open-3" title="Also closed initially">
          This item starts closed too.
        </AccordionItem>
      </Accordion>
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
