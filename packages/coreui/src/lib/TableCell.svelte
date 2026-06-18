<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
    class?: string | undefined;
  };

  let { children, class: extraClass }: Props = $props();
</script>

<td class={['table-cell', extraClass ?? ''].filter(Boolean).join(' ')}>
  {@render children()}
</td>