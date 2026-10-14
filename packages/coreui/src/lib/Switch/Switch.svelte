<script lang="ts">
  import { Switch } from 'bits-ui';
  import { useField } from '../Field/use-field.js';

  type Size = 'sm' | 'md';

  type Props = {
    checked?: boolean;
    label?: string;
    size?: Size;
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

  const describedBy = $derived.by(() => {
    if (!field) return undefined;
    if (field.error) return field.errorId;
    return field.hint ? field.hintId : undefined;
  });

  const wrapClasses = $derived(
    ['switch-wrap', extraClass ?? ''].filter(Boolean).join(' ')
  );

  const rootClasses = $derived(['switch', size].join(' '));
</script>

<label class={wrapClasses} data-disabled={resolvedDisabled || undefined}>
  <Switch.Root
    bind:checked
    {onCheckedChange}
    id={field?.id}
    disabled={resolvedDisabled}
    required={resolvedRequired}
    aria-describedby={describedBy}
    aria-invalid={field?.error ? true : undefined}
    {name}
    class={rootClasses}
  >
    <Switch.Thumb class="switch-thumb" />
  </Switch.Root>

  {#if label}
    <span class="label">{label}</span>
  {/if}
</label>
