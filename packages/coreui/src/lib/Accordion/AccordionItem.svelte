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