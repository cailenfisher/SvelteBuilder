<!-- Heading for a group of menu items. Inside MenuGroup or MenuRadioGroup it names that group for
     assistive technology (Bits UI's GroupHeading). Outside one it renders as a plain, presentational
     label: GroupHeading throws there, and the throw would take the whole menu down with it. -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { DropdownMenu } from 'bits-ui';
  import { insideMenuGroup } from './menu-group.js';

  type Props = {
    children: Snippet;
    class?: string | undefined;
  };

  let { children, class: extraClass }: Props = $props();

  const grouped = insideMenuGroup();
  const classes = $derived(['menu-label', extraClass ?? ''].filter(Boolean).join(' '));
</script>

{#if grouped}
  <DropdownMenu.GroupHeading class={classes}>
    {@render children()}
  </DropdownMenu.GroupHeading>
{:else}
  <div role="presentation" class={classes}>
    {@render children()}
  </div>
{/if}
