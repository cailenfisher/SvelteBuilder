<!-- Camp 2: newsletter signup form. Labels/placeholders resolved via hermes (scope = 'content').
     Submits to a SvelteKit form action — no client-side fetch. -->
<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import { Button, Field, Input } from '@sveltebuilder/coreui';
  import type { NewsletterWithCopy } from '../../schema/index.js';

  type Props = {
    newsletter: NewsletterWithCopy;
    /** Form action path, e.g. '?/subscribe'. Default: '?/subscribe' */
    action?: string;
    /** Set by page data after a form action result. */
    formResult?: { success: boolean; error?: string } | null;
    dictionary?: DictionaryInstance;
    class?: string | undefined;
  };

  let {
    newsletter,
    action = '?/subscribe',
    formResult = null,
    dictionary: dictionaryProp,
    class: extraClass,
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();

  const heading = $derived(dictionary.localText('content.newsletter_subscription_form.signup_heading', 'content'));
  const description = $derived(dictionary.localText('content.newsletter_subscription_form.signup_description', 'content'));
  const emailLabel = $derived(dictionary.localText('content.newsletter_subscription_form.email_label', 'content'));
  const emailPlaceholder = $derived(
    dictionary.localText('content.newsletter_subscription_form.email_placeholder', 'content')
  );
  const submitLabel = $derived(dictionary.localText('content.newsletter_subscription_form.submit_label', 'content'));
  const successMessage = $derived(dictionary.localText('content.newsletter_subscription_form.success_message', 'content'));
  const errorMessage = $derived(dictionary.localText('content.newsletter_subscription_form.error_message', 'content'));
</script>

<div class={['newsletter-subscription-form', extraClass ?? ''].filter(Boolean).join(' ')}>
  {#if formResult?.success}
    <p class="newsletter-subscription-form__success" role="status" aria-live="polite">
      {successMessage}
    </p>
  {:else}
    <header class="newsletter-subscription-form__header">
      <h2 class="newsletter-subscription-form__heading">{heading || newsletter.name}</h2>
      {#if description || newsletter.description}
        <p class="newsletter-subscription-form__description">{description || newsletter.description}</p>
      {/if}
    </header>

    <form class="newsletter-subscription-form__form" method="POST" {action}>
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
        <p class="newsletter-subscription-form__error" role="alert" aria-live="assertive">
          {formResult.error || errorMessage}
        </p>
      {/if}

      <Button type="submit" variant="primary">{submitLabel}</Button>
    </form>
  {/if}
</div>
