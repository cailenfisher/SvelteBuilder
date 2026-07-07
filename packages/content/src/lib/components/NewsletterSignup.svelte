<!-- Camp 2: newsletter signup form. Labels/placeholders resolved via hermes (scope = 'content').
     Submits to a SvelteKit form action — no client-side fetch. -->
<script lang="ts">
  import { localText } from '@sveltebuilder/hermes';
  import { Button, Field, Input } from '@sveltebuilder/coreui';
  import type { NewsletterWithCopy } from '../schema/index.js';

  type Props = {
    newsletter: NewsletterWithCopy;
    /** Form action path, e.g. '?/subscribe'. Default: '?/subscribe' */
    action?: string;
    /** Set by page data after a form action result. */
    formResult?: { success: boolean; error?: string } | null;
    class?: string | undefined;
  };

  let {
    newsletter,
    action = '?/subscribe',
    formResult = null,
    class: extraClass,
  }: Props = $props();

  const heading     = $derived(localText('newsletter.signup_heading',     'content'));
  const description = $derived(localText('newsletter.signup_description', 'content'));
  const emailLabel  = $derived(localText('newsletter.email_label',        'content'));
  const emailPlaceholder = $derived(localText('newsletter.email_placeholder', 'content'));
  const submitLabel = $derived(localText('newsletter.submit_label',       'content'));
  const successMessage = $derived(localText('newsletter.success_message', 'content'));
  const errorMessage   = $derived(localText('newsletter.error_message',   'content'));
</script>

<div class={['newsletter-signup', extraClass ?? ''].filter(Boolean).join(' ')}>
  {#if formResult?.success}
    <p class="newsletter-signup__success" role="status" aria-live="polite">
      {successMessage}
    </p>
  {:else}
    <header class="newsletter-signup__header">
      <h2 class="newsletter-signup__heading">{heading || newsletter.name}</h2>
      {#if description || newsletter.description}
        <p class="newsletter-signup__description">{description || newsletter.description}</p>
      {/if}
    </header>

    <form class="newsletter-signup__form" method="POST" {action}>
      <input type="hidden" name="newsletter_id" value={newsletter.id} />

      <Field label={emailLabel} id="newsletter-email">
        <Input
          id="newsletter-email"
          type="email"
          name="email_address"
          placeholder={emailPlaceholder}
          required
          autocomplete="email"
        />
      </Field>

      {#if formResult?.error}
        <p class="newsletter-signup__error" role="alert" aria-live="assertive">
          {formResult.error || errorMessage}
        </p>
      {/if}

      <Button type="submit" label={submitLabel} variant="primary" />
    </form>
  {/if}
</div>

<style>
  .newsletter-signup {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-6);
    background: var(--surface-raised);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-color);
  }

  .newsletter-signup__header {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .newsletter-signup__heading {
    margin: 0;
    font-size: var(--text-xl);
    font-weight: var(--weight-semibold);
    color: var(--text);
  }

  .newsletter-signup__description {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--text-soft);
    line-height: var(--leading-relaxed);
  }

  .newsletter-signup__form {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .newsletter-signup__success {
    margin: 0;
    font-size: var(--text-base);
    color: var(--color-success, #16a34a);
    font-weight: var(--weight-medium);
    text-align: center;
    padding: var(--space-4);
  }

  .newsletter-signup__error {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--color-error, #dc2626);
  }
</style>
