<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
    class?: string | undefined;
  };

  let { children, class: extraClass }: Props = $props();
</script>

<tr class={['table-row', extraClass ?? ''].filter(Boolean).join(' ')}>
  {@render children()}
</tr>
