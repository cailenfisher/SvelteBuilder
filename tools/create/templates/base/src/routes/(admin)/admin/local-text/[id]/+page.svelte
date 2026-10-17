<script lang="ts">
  import './local-text-admin-detail-screen.css';
  import { getDictionary } from 'diglossia/svelte'
  import { Button } from '@sveltebuilder/coreui'
  import LocalTextForm from '$lib/LocalText/LocalTextForm.svelte'
  import type { PageData, ActionData } from './$types'
  import { formErrorText } from '$lib/FormError/form-error';

  let { data, form }: { data: PageData; form: ActionData } = $props()

  const dictionary = getDictionary()

  const editLabel  = $derived(dictionary.localText('admin.local_text.edit'))
  const slugLabel  = $derived(dictionary.localText('admin.local_text.slug'))
  const scopeLabel = $derived(dictionary.localText('admin.local_text.scope'))

  function translationFor(localeId: number): string {
    return data.translations.find((t) => t.locale === localeId)?.content ?? ''
  }
</script>

<div class="local-text-admin-detail-screen">
  <header class="local-text-admin-detail-screen__header">
    <Button href="/admin/local-text" variant="ghost" size="sm">← {dictionary.localText('navigation.back')}</Button>
    <h1 class="local-text-admin-detail-screen__title">{editLabel}</h1>
  </header>

  <dl class="local-text-admin-detail-screen__meta">
    <dt class="local-text-admin-detail-screen__meta-term">{slugLabel}</dt>
    <dd><code class="local-text-admin-detail-screen__meta-code">{data.entry.slug}</code></dd>
    <dt class="local-text-admin-detail-screen__meta-term">{scopeLabel}</dt>
    <dd>{data.entry.scope ?? '—'}</dd>
  </dl>

  {#if form?.error}
    <p class="local-text-admin-detail-screen__error" role="alert">{formErrorText(form.error, dictionary, dictionary)}</p>
  {/if}
  {#if form?.success}
    <p class="local-text-admin-detail-screen__success" role="status">{dictionary.localText('feedback.saved')}</p>
  {/if}

  <div class="local-text-admin-detail-screen__translations">
    {#each data.locales as locale (locale.id)}
      <LocalTextForm
        action="?/update"
        slug={data.entry.slug}
        {locale}
        content={translationFor(locale.id)}
      />
    {/each}
  </div>

  <div class="local-text-admin-detail-screen__danger">
    <form method="post" action="?/delete">
      <Button type="submit" variant="danger" size="sm">
        {dictionary.localText('action.delete')} {editLabel}
      </Button>
    </form>
  </div>
</div>
