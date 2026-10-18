<!-- Adds a locale: posts to this route's `create` action. -->
<script lang="ts">
  import './locale-create-form.css';
  import { getDictionary } from 'diglossia/svelte';
  import { Button } from '@sveltebuilder/coreui';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';
  import { formErrorText } from '$lib/FormError/form-error';
  import LocaleFieldset from '$lib/Locale/LocaleFieldset.svelte';

  type Props = {
    /** The action's answer to the last submission. */
    result?: ScreenFormResult | null;
  };

  let { result }: Props = $props();

  const dictionary = getDictionary();
  const newLabel = $derived(dictionary.localText('admin.locale.new'));
</script>

<section class="locale-create-form">
  <h2 class="locale-create-form__title">{newLabel}</h2>

  {#if result?.error}
    <p class="locale-create-form__error" role="alert">{formErrorText(result.error, dictionary, dictionary)}</p>
  {/if}
  {#if result?.success}
    <p class="locale-create-form__success" role="status">{dictionary.localText('feedback.saved')}</p>
  {/if}

  <form method="post" action="?/create" class="locale-create-form__form">
    <LocaleFieldset
      codeLabel={dictionary.localText('admin.locale.code')}
      nameLabel={dictionary.localText('admin.locale.name')}
      nativeNameLabel={dictionary.localText('admin.locale.native_name')}
      dirLabel={dictionary.localText('admin.locale.dir')}
      ltrLabel={dictionary.localText('admin.locale.dir.ltr')}
      rtlLabel={dictionary.localText('admin.locale.dir.rtl')}
    />
    <Button type="submit">{dictionary.localText('action.create')}</Button>
  </form>
</section>
