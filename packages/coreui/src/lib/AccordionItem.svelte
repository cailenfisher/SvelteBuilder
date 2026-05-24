<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Accordion } from 'bits-ui';

  type Props = {
    value: string;
    title: string;
    disabled?: boolean;
    children: Snippet;
    class?: string | undefined;
  };

  let {
    value,
    title,
    disabled = false,
    children,
    class: extraClass,
  }: Props = $props();

  const itemClasses = $derived(
    ['accordion-item', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<Accordion.Item {value} {disabled} class={itemClasses}>
  <Accordion.Header class="accordion-item__header" level={3}>
    <Accordion.Trigger class="accordion-item__trigger">
      <span class="accordion-item__title">{title}</span>
      <span class="accordion-item__chevron" aria-hidden="true">
        <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </Accordion.Trigger>
  </Accordion.Header>

  <Accordion.Content class="accordion-item__content">
    <div class="accordion-item__body">
      {@render children()}
    </div>
  </Accordion.Content>
</Accordion.Item>

<style>
  /* ------------------------------------------------------------------ */
  /* Item                                                                 */
  /* ------------------------------------------------------------------ */
  :global(.accordion-item) {
    border-bottom: 1px solid var(--accordion-border);
  }

  :global(.accordion-item:last-child) {
    border-bottom: none;
  }

  /* ------------------------------------------------------------------ */
  /* Header                                                               */
  /* ------------------------------------------------------------------ */
  :global(.accordion-item__header) {
    margin: 0;
  }

  /* ------------------------------------------------------------------ */
  /* Trigger                                                              */
  /* ------------------------------------------------------------------ */
  :global(.accordion-item__trigger) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: var(--accordion-padding-y) var(--accordion-padding-x);
    background: transparent;
    border: none;
    cursor: pointer;
    font-family: var(--font-sans);
    font-size: var(--accordion-trigger-font-size);
    font-weight: var(--accordion-trigger-font-weight);
    color: var(--color-text-primary);
    text-align: left;
    gap: var(--space-3);
    transition: background-color var(--duration-fast) var(--ease-out);
  }

  :global(.accordion-item__trigger:hover) {
    background-color: var(--color-surface-raised);
  }

  :global(.accordion-item__trigger[data-disabled]) {
    color: var(--color-disabled-text);
    cursor: not-allowed;
  }

  :global(.accordion-item__trigger:focus-visible) {
    outline: var(--focus-ring-width) var(--focus-ring-style) var(--focus-ring-color);
    outline-offset: -2px;
  }

  .accordion-item__title {
    flex: 1;
  }

  /* ------------------------------------------------------------------ */
  /* Chevron rotation                                                     */
  /* ------------------------------------------------------------------ */
  .accordion-item__chevron {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    color: var(--color-text-tertiary);
    transition: transform var(--duration-normal) var(--ease-in-out);
  }

  :global(.accordion-item__trigger[data-state="open"]) .accordion-item__chevron {
    transform: rotate(180deg);
  }

  /* ------------------------------------------------------------------ */
  /* Content                                                              */
  /* ------------------------------------------------------------------ */
  :global(.accordion-item__content) {
    overflow: hidden;
  }

  :global(.accordion-item__content[data-state="closed"]) {
    display: none;
  }

  .accordion-item__body {
    padding: 0 var(--accordion-padding-x) var(--accordion-padding-y);
    font-size: var(--accordion-content-font-size);
    color: var(--color-text-secondary);
    line-height: var(--leading-normal);
  }
</style>
