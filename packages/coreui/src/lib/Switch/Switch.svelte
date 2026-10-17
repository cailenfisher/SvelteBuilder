<script module lang="ts">
  export type SwitchSize = 'sm' | 'md';
</script>

<script lang="ts">
  import { Switch } from 'bits-ui';
  import { useField } from '../Field/use-field.js';

  type Props = {
    checked?: boolean;
    label?: string;
    size?: SwitchSize;
    disabled?: boolean;
    required?: boolean;
    name?: string;
    /** Called when the switch is toggled, with its new state. See Checkbox's `onCheckedChange`. */
    onCheckedChange?: (checked: boolean) => void;
    class?: string | undefined;
  };

  let {
    checked = $bindable(false),
    label,
    size = 'md',
    disabled,
    required,
    name,
    onCheckedChange,
    class: extraClass,
  }: Props = $props();

  const field = useField();

  const resolvedDisabled = $derived(disabled ?? field?.disabled ?? false);
  const resolvedRequired = $derived(required ?? field?.required ?? false);



  const wrapClasses = $derived(
    ['switch', extraClass ?? ''].filter(Boolean).join(' ')
  );

  const rootClasses = $derived(['switch__control', `switch__control--${size}`].join(' '));
</script>

<label class={wrapClasses} data-disabled={resolvedDisabled || undefined}>
  <Switch.Root
    bind:checked
    {onCheckedChange}
    id={field?.id}
    disabled={resolvedDisabled}
    required={resolvedRequired}
    aria-describedby={field?.['aria-describedby']}
    aria-invalid={field?.['aria-invalid']}
    {name}
    class={rootClasses}
  >
    <Switch.Thumb class="switch__thumb" />
  </Switch.Root>

  {#if label}
    <span class="switch__label">{label}</span>
  {/if}
</label>
