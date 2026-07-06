<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    colspan?: number;
    children: Snippet;
    class?: string | undefined;
  };

  let { colspan, children, class: extraClass }: Props = $props();
</script>

<td class={['table-cell', extraClass ?? ''].filter(Boolean).join(' ')} {colspan}>
  {@render children()}
</td>