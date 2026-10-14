<script module lang="ts">
  export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
  export type ButtonSize = 'sm' | 'md' | 'lg';
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes, HTMLAnchorAttributes } from 'svelte/elements';

  type BaseProps = {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    /** On a link, renders `aria-disabled` and removes it from the tab order. */
    disabled?: boolean | null;
    full?: boolean;
    children: Snippet;
    leading?: Snippet;
    trailing?: Snippet;
  };

  type ButtonProps = BaseProps & HTMLButtonAttributes & { href?: never };
  type AnchorProps = BaseProps & HTMLAnchorAttributes & { href: string };

  // svelte-ignore custom_element_props_identifier
  let {
    variant = 'primary',
    size = 'md',
    loading = false,
    full = false,
    href,
    children,
    leading,
    trailing,
    disabled,
    class: extraClass,
    ...restProps
  }: ButtonProps | AnchorProps = $props();

  const isDisabled = $derived(disabled || loading);

  const classes = $derived(
    ['button', `button--${variant}`, `button--${size}`, full ? 'button--full' : '', loading ? 'button--loading' : '', extraClass ?? '']
      .filter(Boolean)
      .join(' ')
  );
</script>

{#if href}
  <a
    {href}
    class={classes}
    aria-disabled={isDisabled || undefined}
    tabindex={isDisabled ? -1 : undefined}
    {...restProps as HTMLAnchorAttributes}
  >
    {#if loading}
      <span class="button__spinner" aria-hidden="true"></span>
    {:else if leading}
      <span class="button__leading" aria-hidden="true">{@render leading()}</span>
    {/if}
    <span class="button__text">{@render children()}</span>
    {#if !loading && trailing}
      <span class="button__trailing" aria-hidden="true">{@render trailing()}</span>
    {/if}
  </a>
{:else}
  <button
    type="button"
    class={classes}
    disabled={isDisabled || undefined}
    aria-busy={loading || undefined}
    {...restProps as HTMLButtonAttributes}
  >
    {#if loading}
      <span class="button__spinner" aria-hidden="true"></span>
    {:else if leading}
      <span class="button__leading" aria-hidden="true">{@render leading()}</span>
    {/if}
    <span class="button__text">{@render children()}</span>
    {#if !loading && trailing}
      <span class="button__trailing" aria-hidden="true">{@render trailing()}</span>
    {/if}
  </button>
{/if}