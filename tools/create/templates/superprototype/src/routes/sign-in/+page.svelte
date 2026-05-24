<script lang="ts">
  import { Alert, Button, Field, Input } from '@sveltebuilder/coreui'
  import type { ActionData } from './$types'

  let { form }: { form: ActionData } = $props()
</script>

<div class="sign-in-page">
  <div class="sign-in-card">
    <header class="sign-in-card__header">
      <h1 class="sign-in-card__title">Sign in</h1>
      <p class="sign-in-card__subtitle">Enter your credentials to access the admin area.</p>
    </header>

    {#if form?.error}
      <Alert variant="danger">{form.error}</Alert>
    {/if}

    <form method="post" class="sign-in-card__form">
      <Field label="Email" id="email" required>
        <Input
          id="email"
          name="email"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
          required
        />
      </Field>

      <Field label="Password" id="password" required>
        <Input
          id="password"
          name="password"
          type="password"
          autocomplete="current-password"
          placeholder="••••••••"
          required
        />
      </Field>

      <Button type="submit" full>Sign in</Button>
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

  .sign-in-card__form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
</style>
