<script lang="ts">
  import { Button } from '@sveltebuilder/coreui'
  import { localText } from '@sveltebuilder/hermes'
  import type { ActionData } from './$types'

  let { form }: { form: ActionData } = $props()

  const title = $derived(localText('user.sign_in'))
  const subtitle = $derived(localText('user.sign_in.subtitle'))
  const signInWithGoogle = $derived(localText('user.sign_in_with_google'))
</script>

<div class="sign-in-page">
  <div class="sign-in-card">
    <header class="sign-in-card__header">
      <h1 class="sign-in-card__title">{title}</h1>
      <p class="sign-in-card__subtitle">{subtitle}</p>
    </header>

    {#if form?.error}
      <p class="sign-in-card__error" role="alert">{form.error}</p>
    {/if}

    <form method="post">
      <Button type="submit" full>{signInWithGoogle}</Button>
    </form>
  </div>
</div>

<style>
  .sign-in-page {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    min-height: 100dvh;
  }

  .sign-in-card {
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 2rem;
    border: 1px solid var(--color-border-default, currentColor);
    border-radius: 0.75rem;
    background-color: var(--color-surface-default, transparent);
  }

  .sign-in-card__header {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .sign-in-card__title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1.25;
  }

  .sign-in-card__subtitle {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-text-secondary, inherit);
  }

  .sign-in-card__error {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-text-danger, red);
  }
</style>
