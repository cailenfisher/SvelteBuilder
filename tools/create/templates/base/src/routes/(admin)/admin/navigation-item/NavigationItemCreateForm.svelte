<!-- Adds a navigation item with the copy link its label reads through: posts to this route's
     `create` action. -->
<script lang="ts">
  import './navigation-item-create-form.css';
  import { getDictionary } from 'diglossia/svelte';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';
  import { formErrorText } from '$lib/FormError/form-error';
  import { Button, Field, Input } from '@sveltebuilder/coreui';
  import LocalTextLinkFieldset from '$lib/LocalTextLink/LocalTextLinkFieldset.svelte';

  type Props = {
    /** The action's answer to the last submission. */
    result?: ScreenFormResult | null;
  };

  let { result }: Props = $props();

  const dictionary = getDictionary();
  const newLabel = $derived(dictionary.localText('admin.navigation_item.new'));
</script>

<section class="navigation-item-create-form">
  <h2 class="navigation-item-create-form__title">{newLabel}</h2>

  {#if result?.error}
    <p class="navigation-item-create-form__error" role="alert">{formErrorText(result.error, dictionary, dictionary)}</p>
  {/if}
  {#if result?.success}
    <p class="navigation-item-create-form__success" role="status">{dictionary.localText('feedback.saved')}</p>
  {/if}

  <form method="post" action="?/create" class="navigation-item-create-form__form">
    <LocalTextLinkFieldset
      slugLabel={dictionary.localText('admin.local_text.slug')}
      scopeLabel={dictionary.localText('admin.local_text.scope')}
    />

    <div class="navigation-item-create-form__fields">
      <Field label={dictionary.localText('admin.navigation_item.href')} id="navigation-item-href" required>
        <Input id="navigation-item-href" name="href" placeholder="/admin/example" required />
      </Field>
      <Field label={dictionary.localText('admin.navigation_item.menu')} id="navigation-item-menu" required>
        <Input id="navigation-item-menu" name="menu" placeholder="admin" required />
      </Field>
      <Field label={dictionary.localText('admin.navigation_item.position')} id="navigation-item-position">
        <Input id="navigation-item-position" name="position" type="number" value="0" />
      </Field>
    </div>

    <Button type="submit">{newLabel}</Button>
  </form>
</section>
