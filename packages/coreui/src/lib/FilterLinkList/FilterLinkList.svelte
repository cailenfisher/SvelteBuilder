<!-- A list's server-side filter, as links: each option navigates to the same list with a
     different query, so it is a <nav> of links rather than Tabs. Tab semantics would claim
     panels on the page to switch between, and aria-current="page" is what tells a screen
     reader which filter is on. -->
<script lang="ts">
  import Button from '../Button/Button.svelte';
  import type { FilterLink } from './filter-link.js';

  type Props = {
    /** The navigation landmark's accessible name, such as "Filter by status". */
    label: string;
    links: FilterLink[];
    class?: string | undefined;
  };

  let { label, links, class: extraClass }: Props = $props();

  const classes = $derived(['filter-link-list', extraClass ?? ''].filter(Boolean).join(' '));
</script>

<nav class={classes} aria-label={label}>
  {#each links as link (link.href)}
    <Button
      href={link.href}
      variant={link.current ? 'secondary' : 'ghost'}
      size="sm"
      aria-current={link.current ? 'page' : undefined}
    >
      {link.label}
    </Button>
  {/each}
</nav>
