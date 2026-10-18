<!-- Creates a piece of copy with its text in every locale at once: posts to this route's
     `create` action. -->
<script lang="ts">
  import './local-text-create-form.css';
  import { getDictionary } from 'diglossia/svelte';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';
  import { formErrorText } from '$lib/FormError/form-error';
  import type { Locale } from 'diglossia';
  import { Button, Field, Textarea } from '@sveltebuilder/coreui';
  import LocalTextLinkFieldset from '$lib/LocalTextLink/LocalTextLinkFieldset.svelte';

  type Props = {
    locales: Pick<Locale, 'id' | 'nativeName'>[];
    /** The action's answer to the last submission. */
    result?: ScreenFormResult | null;
  };

  let { locales, result }: Props = $props();

  const dictionary = getDictionary();
  const newLabel = $derived(dictionary.localText('admin.local_text.new'));
</script>

<section class="local-text-create-form">
  <h2 class="local-text-create-form__title">{newLabel}</h2>

  {#if result?.error}
    <p class="local-text-create-form__error" role="alert">{formErrorText(result.error, dictionary, dictionary)}</p>
  {/if}
  {#if result?.success}
    <p class="local-text-create-form__success" role="status">{dictionary.localText('feedback.saved')}</p>
  {/if}

  <form method="post" action="?/create" class="local-text-create-form__form">
    <LocalTextLinkFieldset
      slugLabel={dictionary.localText('admin.local_text.slug')}
      scopeLabel={dictionary.localText('admin.local_text.scope')}
    />

    <div class="local-text-create-form__locales">
      {#each locales as locale (locale.id)}
        <div>
          <input type="hidden" name="locale_id" value={locale.id} />
          <Field label={locale.nativeName} id="content_{locale.id}">
            <Textarea id="content_{locale.id}" name="content" rows={2} />
          </Field>
        </div>
      {/each}
    </div>

    <Button type="submit">{dictionary.localText('action.create')}</Button>
  </form>
</section>
