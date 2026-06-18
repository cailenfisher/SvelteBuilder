<script lang="ts">
  import { RadioGroup } from 'bits-ui';

  type Props = {
    value: string;
    label: string;
    disabled?: boolean;
    class?: string | undefined;
  };

  let {
    value,
    label,
    disabled = false,
    class: extraClass,
  }: Props = $props();

  const wrapClasses = $derived(
    ['radio-item', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<label class={wrapClasses} data-disabled={disabled || undefined}>
  <RadioGroup.Item {value} {disabled} class="radio-control" />
  <span class="label">{label}</span>
</label>
