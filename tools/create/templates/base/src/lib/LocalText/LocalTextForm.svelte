<!-- Saves one piece of copy's text in one locale. The slug is shown but not editable. Posts to
     whichever action the page names, since each screen that edits copy owns its own. -->
<script lang="ts">
  import './local-text.css';
  import { getDictionary } from 'diglossia/svelte';
  import type { Locale } from 'diglossia';
  import { Button } from '@sveltebuilder/coreui';
  import LocalTextFieldset from './LocalTextFieldset.svelte';

  type Props = {
    /** The form action this posts to, such as `?/update`. */
    action: string;
    slug: string;
    locale: Locale;
    content: string;
  };

  let { action, slug, locale, content }: Props = $props();

  const dictionary = getDictionary();
</script>

<form method="post" {action} class="local-text-form">
  <LocalTextFieldset
    slugLabel={dictionary.localText('admin.local_text.slug')}
    localeLabel={locale.nativeName}
    contentLabel={dictionary.localText('admin.local_text.content')}
    locales={[locale]}
    {slug}
    localeId={locale.id}
    {content}
    slugReadonly={true}
  />
  <Button type="submit" size="sm">{dictionary.localText('action.save')}</Button>
</form>
