<script lang="ts">
  import { Select } from 'bits-ui';

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

  const classes = $derived(
    ['select-item', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<Select.Item {value} {label} {disabled} class={classes}>
  <Select.ItemText>{label}</Select.ItemText>
</Select.Item>