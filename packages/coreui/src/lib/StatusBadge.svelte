<!-- StatusBadge: convenience wrapper around Badge that accepts label as a string prop.
     The caller maps their domain status to a variant before passing it in. -->
<script lang="ts">
  import Badge from './Badge.svelte';

  type Variant = 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info';
  type Size = 'sm' | 'md' | 'lg';

  type Props = {
    label: string;
    variant?: Variant;
    size?: Size;
    class?: string | undefined;
  };

  let { label, variant = 'default', size = 'md', class: extraClass }: Props = $props();
</script>

<Badge {variant} {size} class={extraClass}>{label}</Badge>
