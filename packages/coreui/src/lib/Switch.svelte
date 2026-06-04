<script lang="ts">
  import { Switch } from 'bits-ui';

  type Size = 'sm' | 'md';

  type Props = {
    checked?: boolean;
    label?: string;
    size?: Size;
    disabled?: boolean;
    name?: string;
    class?: string | undefined;
  };

  let {
    checked = $bindable(false),
    label,
    size = 'md',
    disabled = false,
    name,
    class: extraClass,
  }: Props = $props();

  const wrapClasses = $derived(
    ['switch-wrap', extraClass ?? ''].filter(Boolean).join(' ')
  );

  const rootClasses = $derived(['switch', size].join(' '));
</script>

<label class={wrapClasses} data-disabled={disabled || undefined}>
  <Switch.Root
    bind:checked
    {disabled}
    {name}
    class={rootClasses}
  >
    <Switch.Thumb class="switch-thumb" />
  </Switch.Root>

  {#if label}
    <span class="label">{label}</span>
  {/if}
</label>